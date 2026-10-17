import { describe, it, expect } from 'vitest';
import { 
  calculateTransitMinutes, 
  calculateDepartmentCurrentWait, 
  calculateOptimalQueueRoute 
} from './queueRouter';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_TESTS, 
  INITIAL_COUNTERS, 
  INITIAL_QUEUE_TOKENS, 
  INITIAL_PATIENTS 
} from '../data/mockHospitalData';
import { Patient, DiagnosticTest, Counter } from '../types';

describe('Queue Routing Engine (Q-Care)', () => {
  it('calculates correct transit time between hospital wings and floors', () => {
    const deptPath = INITIAL_DEPARTMENTS.find(d => d.id === 'dept-pathology')!;
    const deptCardio = INITIAL_DEPARTMENTS.find(d => d.id === 'dept-cardio')!;

    // Same dept
    expect(calculateTransitMinutes(deptPath, deptPath)).toBe(0.5);

    // East Wing Ground Floor to Central Tower 1st Floor
    const transit = calculateTransitMinutes(deptPath, deptCardio);
    expect(transit).toBeGreaterThan(1.0);
    expect(transit).toBeLessThanOrEqual(6.0);
  });

  it('calculates dynamic current wait accounting for parallel active counters', () => {
    // Pathology has 2 counters and several waiting tokens in seed data
    const pathWait = calculateDepartmentCurrentWait(
      'dept-pathology', 
      INITIAL_QUEUE_TOKENS, 
      INITIAL_COUNTERS
    );

    expect(pathWait.activeCountersCount).toBe(2);
    expect(pathWait.waitingCount).toBeGreaterThan(5);
    expect(pathWait.waitMinutes).toBeGreaterThan(10);
    expect(pathWait.isClosed).toBe(false);

    // Empty department with 0 tokens
    const eyeTokens = INITIAL_QUEUE_TOKENS.filter(t => t.departmentId === 'dept-ophthalmology' && t.status === 'waiting');
    const eyeWait = calculateDepartmentCurrentWait(
      'dept-ophthalmology', 
      eyeTokens, 
      INITIAL_COUNTERS
    );
    expect(eyeWait.waitingCount).toBe(0);
    expect(eyeWait.waitMinutes).toBe(0);
  });

  it('handles closed department with zero active counters and heavily penalizes wait time', () => {
    // Set all pathology counters to closed
    const closedCounters: Counter[] = INITIAL_COUNTERS.map(c =>
      c.departmentId === 'dept-pathology' ? { ...c, status: 'closed' as const } : c
    );

    const pathWait = calculateDepartmentCurrentWait(
      'dept-pathology',
      INITIAL_QUEUE_TOKENS,
      closedCounters
    );

    expect(pathWait.activeCountersCount).toBe(0);
    expect(pathWait.isClosed).toBe(true);
    expect(pathWait.waitMinutes).toBeGreaterThanOrEqual(90); // Closed penalty
  });

  it('demonstrates significant wait time reduction for congested blood lab vs empty ECG', () => {
    const rajesh = INITIAL_PATIENTS.find(p => p.id === 'pat-rajesh')!;

    const plan = calculateOptimalQueueRoute(
      rajesh,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(4);
    // Smart route should place low-wait test (like ECG or X-Ray) before the congested Blood test
    const firstStep = plan.smartRouteSteps[0];
    expect(['test-ecg', 'test-xray-chest']).toContain(firstStep.testId);

    // Smart total time should be strictly less than naive total time
    expect(plan.smartTotalTimeMinutes).toBeLessThan(plan.naiveTotalTimeMinutes);
    expect(plan.timeSavedMinutes).toBeGreaterThan(0);
    expect(plan.percentageSaved).toBeGreaterThan(0);
  });

  it('handles edge case: patient with 0 prescribed tests', () => {
    const emptyPatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-empty',
      prescribedTests: [],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      emptyPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps).toEqual([]);
    expect(plan.smartTotalTimeMinutes).toBe(0);
    expect(plan.naiveTotalTimeMinutes).toBe(0);
    expect(plan.timeSavedMinutes).toBe(0);
  });

  it('handles edge case: patient who already completed all tests (preserves completed timeline)', () => {
    const completedPatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-completed',
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: ['test-cbc', 'test-ecg']
    };

    const plan = calculateOptimalQueueRoute(
      completedPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(2);
    expect(plan.smartRouteSteps.every(s => s.status === 'completed')).toBe(true);
    expect(plan.smartTotalTimeMinutes).toBe(0);
  });

  it('correctly satisfies prerequisites when the required test is in patient.completedTests', () => {
    // Test PPBS requires FBS
    const customTests: DiagnosticTest[] = [
      ...INITIAL_TESTS,
      {
        id: 'test-ppbs',
        code: 'BIO-202',
        name: 'Post-Prandial Blood Sugar',
        departmentId: 'dept-biochem',
        averageDurationMinutes: 8,
        preparationNotes: '2 hrs after meal',
        standardPrice: 350,
        prerequisites: ['test-fbs']
      }
    ];

    const patientWithPrereqDone: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-prereq-done',
      prescribedTests: ['test-fbs', 'test-ppbs', 'test-ecg'],
      completedTests: ['test-fbs'] // FBS is already done!
    };

    const plan = calculateOptimalQueueRoute(
      patientWithPrereqDone,
      customTests,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Total steps = 1 completed (FBS) + 2 pending (PPBS + ECG) = 3 steps
    expect(plan.smartRouteSteps.length).toBe(3);
    const completedStep = plan.smartRouteSteps.find(s => s.testId === 'test-fbs');
    expect(completedStep?.status).toBe('completed');

    // Pending steps should include test-ppbs without error
    const ppbsStep = plan.smartRouteSteps.find(s => s.testId === 'test-ppbs');
    expect(ppbsStep).toBeDefined();
    expect(ppbsStep?.stepNumber).toBeGreaterThan(1);
  });

  it('scales efficiently with 9+ tests using beam search without timeout or freezing', () => {
    const nineTests: DiagnosticTest[] = [
      ...INITIAL_TESTS,
      { id: 't-7', code: 'T7', name: 'Test 7', departmentId: 'dept-pathology', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '' },
      { id: 't-8', code: 'T8', name: 'Test 8', departmentId: 'dept-cardio', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '' },
      { id: 't-9', code: 'T9', name: 'Test 9', departmentId: 'dept-radiology', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '' },
    ];

    const largePatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-large',
      prescribedTests: nineTests.map(t => t.id),
      completedTests: []
    };

    const startTime = performance.now();
    const plan = calculateOptimalQueueRoute(
      largePatient,
      nineTests,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );
    const elapsedMs = performance.now() - startTime;

    expect(plan.smartRouteSteps.length).toBe(nineTests.length);
    expect(elapsedMs).toBeLessThan(150); // Must finish within 150ms (O(K * N^2) beam search, prevents O(N!) freeze)
  });

  it('handles circular prerequisites gracefully without infinite loops', () => {
    const circularTests: DiagnosticTest[] = [
      { id: 't-circ-1', code: 'C1', name: 'Circ 1', departmentId: 'dept-pathology', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '', prerequisites: ['t-circ-2'] },
      { id: 't-circ-2', code: 'C2', name: 'Circ 2', departmentId: 'dept-cardio', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '', prerequisites: ['t-circ-1'] },
    ];

    const circPatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-circ',
      prescribedTests: ['t-circ-1', 't-circ-2'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      circPatient,
      circularTests,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Fallback should cleanly preserve both tests without infinite recursion
    expect(plan.smartRouteSteps.length).toBe(2);
  });

  it('dynamically adapts when sudden congestion spikes at a counter', () => {
    const rajesh = INITIAL_PATIENTS.find(p => p.id === 'pat-rajesh')!;

    // Baseline calculation: lowest wait is either ECG or X-ray
    const basePlan = calculateOptimalQueueRoute(
      rajesh,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );
    expect(['test-ecg', 'test-xray-chest']).toContain(basePlan.smartRouteSteps[0].testId);

    // Simulate 20 rush patients at Radiology (dept-radiology)
    const rushTokens = [...INITIAL_QUEUE_TOKENS];
    for (let i = 1; i <= 20; i++) {
      rushTokens.push({
        id: `rush-xray-${i}`,
        tokenNumber: `RAD-99${i}`,
        patientId: `pat-rush-${i}`,
        testId: 'test-xray-chest',
        departmentId: 'dept-radiology',
        priority: 'standard',
        status: 'waiting',
        issuedAt: '09:00 AM',
        queuePosition: i,
        estimatedWaitMinutes: i * 8
      });
    }

    // Now X-Ray is congested with 20 patients!
    const adaptedPlan = calculateOptimalQueueRoute(
      rajesh,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      rushTokens,
      INITIAL_COUNTERS
    );

    // Algorithm must divert away from congested X-Ray as step 1!
    expect(adaptedPlan.smartRouteSteps[0].testId).not.toBe('test-xray-chest');
  });
});
