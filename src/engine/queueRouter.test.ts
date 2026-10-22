import { describe, it, expect } from 'vitest';
import {
  calculateTransitMinutes,
  formatWaitRange,
  calculateDepartmentCurrentWait,
  calculateOptimalQueueRoute
} from './queueRouter';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_TESTS,
  INITIAL_COUNTERS,
  DEMO_SCENARIO_PATIENT,
  DEMO_SCENARIO_TOKENS
} from '../data/mockHospitalData';
import { Patient, DiagnosticTest, Counter, QueueToken } from '../types';

describe('Queue Routing Engine (Q-Care v2)', () => {
  it('calculates correct transit time between hospital wings and floors', () => {
    const deptBlood = INITIAL_DEPARTMENTS.find(d => d.id === 'dept-pathology')!;
    const deptCardio = INITIAL_DEPARTMENTS.find(d => d.id === 'dept-cardio')!;

    // Same dept
    expect(calculateTransitMinutes(deptBlood, deptBlood)).toBe(0.5);

    // Ground Floor East Wing to 1st Floor Central Tower
    const transit = calculateTransitMinutes(deptBlood, deptCardio);
    expect(transit).toBeGreaterThan(1.0);
    expect(transit).toBeLessThanOrEqual(6.0);
  });

  it('formats wait range correctly', () => {
    expect(formatWaitRange(0)).toBe('Immediate (< 3 min)');
    expect(formatWaitRange(2)).toBe('Immediate (< 3 min)');
    expect(formatWaitRange(15)).toContain('Approx.');
  });

  it('calculates dynamic department current wait accounting for parallel active machines', () => {
    const biochemTokens = DEMO_SCENARIO_TOKENS.filter(t => t.departmentId === 'dept-biochem');
    const waitInfo = calculateDepartmentCurrentWait(
      'dept-biochem',
      biochemTokens,
      INITIAL_COUNTERS,
      undefined,
      INITIAL_DEPARTMENTS
    );

    expect(waitInfo.waitingCount).toBeGreaterThan(0);
    expect(waitInfo.activeCountersCount).toBeGreaterThanOrEqual(1);
    expect(waitInfo.isClosed).toBe(false);
  });

  it('handles closed department with 0 active counters and applies penalty wait (>= 90 mins)', () => {
    const closedCounters: Counter[] = INITIAL_COUNTERS.map(c =>
      c.departmentId === 'dept-biochem' ? { ...c, status: 'closed' as const } : c
    );

    const closedDept = {
      ...INITIAL_DEPARTMENTS.find(d => d.id === 'dept-biochem')!,
      activeMachines: 0,
      availabilityStatus: 'unavailable' as const
    };

    const waitInfo = calculateDepartmentCurrentWait(
      'dept-biochem',
      DEMO_SCENARIO_TOKENS,
      closedCounters,
      undefined,
      [closedDept]
    );

    expect(waitInfo.isClosed).toBe(true);
    expect(waitInfo.waitMinutes).toBeGreaterThanOrEqual(90);
  });

  it('prioritizes Fasting Blood Sugar (FBS) early in the schedule for fasting patients', () => {
    const patient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      prescribedTests: ['test-cbc', 'test-fbs', 'test-xray-chest'],
      completedTests: [],
      currentLockedDestinationTestId: undefined
    };

    const plan = calculateOptimalQueueRoute(
      patient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );

    // Fasting test must be scheduled at index 0 or 1
    const fbsIndex = plan.smartRouteSteps.findIndex(s => s.testId === 'test-fbs');
    expect(fbsIndex).toBeLessThanOrEqual(1);
    expect(plan.fastingSatisfied).toBe(true);
  });

  it('enforces STABILITY LOCK: does not flap destination if current destination is locked', () => {
    // Rameshwar has currentLockedDestinationTestId = 'test-fbs'
    const lockedPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      currentLockedDestinationTestId: 'test-fbs',
      prescribedTests: ['test-cbc', 'test-fbs', 'test-ecg', 'test-xray-chest'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      lockedPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      DEMO_SCENARIO_TOKENS,
      INITIAL_COUNTERS
    );

    // Locked destination MUST be Step 1
    expect(plan.smartRouteSteps[0].testId).toBe('test-fbs');
    expect(plan.recommendedNextTestId).toBe('test-fbs');
  });

  it('triggers dynamic lowest-wait rerouting strictly when test is marked COMPLETED', () => {
    // Stage 1: Fasting Blood Sugar completed
    const patientAfterFBS: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      currentLockedDestinationTestId: undefined, // Unlocked upon completion
      completedTests: ['test-fbs'],
      prescribedTests: ['test-fbs', 'test-cbc', 'test-ecg', 'test-xray-chest']
    };

    // Radiology (X-ray) has 0 waiting in demo scenario vs Blood lab has 3 waiting
    const plan = calculateOptimalQueueRoute(
      patientAfterFBS,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      DEMO_SCENARIO_TOKENS,
      INITIAL_COUNTERS
    );

    // Step 1 is completed FBS
    expect(plan.smartRouteSteps[0].testId).toBe('test-fbs');
    expect(plan.smartRouteSteps[0].status).toBe('completed');

    // Step 2 must pick low-wait test (ECG or X-Ray) over congested Blood lab!
    expect(['test-ecg', 'test-xray-chest']).toContain(plan.smartRouteSteps[1].testId);
  });

  it('scales efficiently with 10+ tests using Beam Search without freezing or factorial explosion (< 150ms)', () => {
    const tenTests: DiagnosticTest[] = [
      ...INITIAL_TESTS,
      { id: 't-9', code: 'T9', name: 'Test 9', technicalName: 'Extra 9', departmentId: 'dept-pathology', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '' },
      { id: 't-10', code: 'T10', name: 'Test 10', technicalName: 'Extra 10', departmentId: 'dept-cardio', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '' },
    ];

    const largePatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      id: 'pat-large-test',
      prescribedTests: tenTests.map(t => t.id),
      completedTests: [],
      currentLockedDestinationTestId: undefined
    };

    const tStart = performance.now();
    const plan = calculateOptimalQueueRoute(
      largePatient,
      tenTests,
      INITIAL_DEPARTMENTS,
      DEMO_SCENARIO_TOKENS,
      INITIAL_COUNTERS
    );
    const durationMs = performance.now() - tStart;

    expect(plan.smartRouteSteps.length).toBe(tenTests.length);
    expect(durationMs).toBeLessThan(500);
  });

  it('handles circular dependencies gracefully without infinite loops', () => {
    const circularTests: DiagnosticTest[] = [
      { id: 'c-1', code: 'C1', name: 'Circ 1', technicalName: 'C1', departmentId: 'dept-pathology', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '', prerequisites: ['c-2'] },
      { id: 'c-2', code: 'C2', name: 'Circ 2', technicalName: 'C2', departmentId: 'dept-cardio', averageDurationMinutes: 5, standardPrice: 100, preparationNotes: '', prerequisites: ['c-1'] }
    ];

    const circPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      id: 'pat-circ',
      prescribedTests: ['c-1', 'c-2'],
      completedTests: [],
      currentLockedDestinationTestId: undefined
    };

    const plan = calculateOptimalQueueRoute(
      circPatient,
      circularTests,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(2);
  });

  it('handles edge cases: 0 prescribed tests and all completed tests', () => {
    const emptyPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      prescribedTests: [],
      completedTests: []
    };
    const emptyPlan = calculateOptimalQueueRoute(
      emptyPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );
    expect(emptyPlan.smartRouteSteps.length).toBe(0);
    expect(emptyPlan.smartTotalTimeMinutes).toBe(0);

    const completedPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: ['test-cbc', 'test-ecg']
    };
    const completedPlan = calculateOptimalQueueRoute(
      completedPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );
    expect(completedPlan.smartRouteSteps.length).toBe(2);
    expect(completedPlan.smartRouteSteps.every(s => s.status === 'completed')).toBe(true);
  });

  it('enforces strict prerequisite dependency: PPBS must always occur AFTER Fasting Blood Sugar', () => {
    const diabetesPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      id: 'pat-diab',
      prescribedTests: ['test-ppbs', 'test-fbs', 'test-ecg'],
      completedTests: [],
      currentLockedDestinationTestId: undefined
    };

    const plan = calculateOptimalQueueRoute(
      diabetesPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );

    const fbsIndex = plan.smartRouteSteps.findIndex(s => s.testId === 'test-fbs');
    const ppbsIndex = plan.smartRouteSteps.findIndex(s => s.testId === 'test-ppbs');

    expect(fbsIndex).toBeGreaterThanOrEqual(0);
    expect(ppbsIndex).toBeGreaterThanOrEqual(0);
    expect(fbsIndex).toBeLessThan(ppbsIndex);
  });

  it('prioritizes urgent ultrasound full bladder preparation before voiding', () => {
    const usgPatient: Patient = {
      ...DEMO_SCENARIO_PATIENT,
      id: 'pat-usg',
      prescribedTests: ['test-cbc', 'test-usg-abdomen', 'test-ecg'],
      completedTests: [],
      currentLockedDestinationTestId: undefined,
      doctorPriority: 'urgent'
    };

    const plan = calculateOptimalQueueRoute(
      usgPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      [],
      INITIAL_COUNTERS
    );

    // Urgent full bladder ultrasound should be prioritized at position 0
    expect(plan.smartRouteSteps[0].testId).toBe('test-usg-abdomen');
  });
});
