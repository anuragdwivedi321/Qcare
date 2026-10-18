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
  INITIAL_PATIENTS,
  ALL_INITIAL_COUNTERS
} from '../data/mockHospitalData';
import { Patient, DiagnosticTest, Counter } from '../types';
import { 
  registerPatientAction, 
  prescribeTestsAction, 
  completeTestAndUploadReportAction, 
  completeConsultationAction, 
  getHospitalStoreSnapshot, 
  resetHospitalStoreForTesting,
  setHospitalAction,
  callOrAdvanceCounterAction
} from '../store/useHospitalStore';

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

  it('correctly numbers steps sequentially when earlier tests are already completed', () => {
    const balbir = INITIAL_PATIENTS.find(p => p.id === 'pat-balbir')!;
    // Balbir has completed test-fbs, and pending test-ecg, test-cbc
    const plan = calculateOptimalQueueRoute(
      balbir,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(3);
    expect(plan.smartRouteSteps[0].stepNumber).toBe(1);
    expect(plan.smartRouteSteps[0].status).toBe('completed');
    expect(plan.smartRouteSteps[1].stepNumber).toBe(2);
    expect(plan.smartRouteSteps[1].status).toBe('up_next');
    expect(plan.smartRouteSteps[2].stepNumber).toBe(3);
    expect(plan.smartRouteSteps[2].status).toBe('queued');
  });

  it('prioritizes fasting tests (like Fasting Blood Sugar) early in the schedule', () => {
    const fastingPatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-fasting',
      prescribedTests: ['test-cbc', 'test-fbs', 'test-ecg'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      fastingPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Fasting blood sugar must be scheduled early (position 1 or 2 before non-fasting if queue is reasonable)
    const fbsIndex = plan.smartRouteSteps.findIndex(s => s.testId === 'test-fbs');
    expect(fbsIndex).toBeLessThanOrEqual(1);
    expect(plan.fastingSatisfied).toBe(true);
  });

  it('populates recommendedCounterId on all route steps', () => {
    const aarav = INITIAL_PATIENTS.find(p => p.id === 'pat-aarav')!;
    const plan = calculateOptimalQueueRoute(
      aarav,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBeGreaterThan(0);
    // Every step must have a defined recommendedCounterId pointing to a real counter
    plan.smartRouteSteps.forEach(step => {
      expect(step.recommendedCounterId).toBeDefined();
      const counter = INITIAL_COUNTERS.find(c => c.id === step.recommendedCounterId);
      expect(counter).toBeDefined();
      expect(counter?.departmentId).toBe(step.departmentId);
    });
  });

  it('routes Meera Joshi (Fasting Blood Sugar + ECG) with fasting test prioritized', () => {
    const meera = INITIAL_PATIENTS.find(p => p.id === 'pat-meera')!;
    expect(meera.name).toBe('Meera Joshi');
    expect(meera.prescribedTests).toContain('test-fbs');
    expect(meera.prescribedTests).toContain('test-ecg');

    const plan = calculateOptimalQueueRoute(
      meera,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(2);
    // Fasting test must be step 1
    expect(plan.smartRouteSteps[0].testId).toBe('test-fbs');
    expect(plan.smartRouteSteps[0].status).toBe('up_next');
    expect(plan.smartRouteSteps[0].recommendedCounterId).toBe('counter-bio-1');
  });

  it('handles Comprehensive Lipid Profile (test-lipid) as a fasting test', () => {
    const lipidTest = INITIAL_TESTS.find(t => t.id === 'test-lipid')!;
    expect(lipidTest).toBeDefined();
    expect(lipidTest.requiresFasting).toBe(true);
    expect(lipidTest.departmentId).toBe('dept-biochem');

    const patientWithLipid: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-lipid-test',
      prescribedTests: ['test-cbc', 'test-lipid', 'test-ecg'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      patientWithLipid,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    const lipidIndex = plan.smartRouteSteps.findIndex(s => s.testId === 'test-lipid');
    expect(lipidIndex).toBeLessThanOrEqual(1);
    expect(plan.fastingSatisfied).toBe(true);
  });

  it('supports patient registration data model with prominent currentIllness and symptoms', () => {
    const newWalkInPatient: Patient = {
      id: 'pat-test-walkin',
      uhid: 'QC-2026-1099',
      name: 'Rohan Mehra',
      age: 46,
      gender: 'Male',
      contact: '+91 98765 43210',
      priority: 'standard',
      prescribedDoctorId: 'doc-swaminathan',
      prescribedDoctorName: 'Dr. Arvind Swaminathan',
      currentIllness: 'Acute onset substernal chest tightness and shortness of breath for 2 days',
      symptoms: 'Acute substernal chest tightness and shortness of breath',
      prescribedTests: ['test-ecg', 'test-cbc'],
      completedTests: [],
      activeTokenIds: {},
      status: 'checked_in',
      assignedSmartRoute: ['test-ecg', 'test-cbc'],
      registrationTime: '10:00 AM'
    };

    expect(newWalkInPatient.currentIllness).toBeDefined();
    expect(newWalkInPatient.currentIllness).toContain('chest tightness');
    expect(newWalkInPatient.symptoms).toBeDefined();

    const plan = calculateOptimalQueueRoute(
      newWalkInPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(2);
    expect(['test-ecg', 'test-cbc']).toContain(plan.smartRouteSteps[0].testId);
  });

  it('dynamically adapts remaining route when first test is marked completed', () => {
    // Stage 1: Patient starts with 3 tests
    const patientStage1: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-stage-test',
      prescribedTests: ['test-ecg', 'test-cbc', 'test-xray-chest'],
      completedTests: []
    };

    const plan1 = calculateOptimalQueueRoute(
      patientStage1,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Initial step 1 is lowest wait (either X-ray or ECG)
    const initialFirst = plan1.smartRouteSteps[0].testId;
    expect(['test-xray-chest', 'test-ecg']).toContain(initialFirst);

    // Stage 2: Lab marks that first test completed!
    const patientStage2: Patient = {
      ...patientStage1,
      completedTests: [initialFirst]
    };

    const plan2 = calculateOptimalQueueRoute(
      patientStage2,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Completed step is step 1 with status 'completed'
    expect(plan2.smartRouteSteps[0].testId).toBe(initialFirst);
    expect(plan2.smartRouteSteps[0].status).toBe('completed');

    // Remaining tests are dynamically optimized for step 2
    expect(plan2.smartRouteSteps[1].status).toBe('up_next');
    expect(plan2.smartRouteSteps[1].testId).not.toBe(initialFirst);
  });

  it('ensures all baseline demo patients have distinct UHIDs, names, and prescribedDoctorRoom', () => {
    const uhids = INITIAL_PATIENTS.map(p => p.uhid);
    const names = INITIAL_PATIENTS.map(p => p.name);

    // All UHIDs must be unique
    expect(new Set(uhids).size).toBe(uhids.length);

    // All patient names must be unique (no duplicate Sharmas)
    expect(new Set(names).size).toBe(names.length);

    // All patients must have a prescribedDoctorRoom and symptoms description
    INITIAL_PATIENTS.forEach(patient => {
      expect(patient.prescribedDoctorRoom).toBeDefined();
      expect(patient.prescribedDoctorRoom!.length).toBeGreaterThan(0);
      expect(patient.currentIllness || patient.symptoms).toBeDefined();
    });
  });

  it('guarantees remaining route order optimizes between remaining test queues upon completion of first test', () => {
    // Suppose patient has: ECG, Blood (CBC), X-Ray
    // Initially ECG is completed
    const patientWithCompletedEcg: Patient = {
      id: 'pat-dynamic-test',
      uhid: 'QC-2026-9999',
      name: 'Test Walkin',
      age: 45,
      gender: 'Male',
      contact: '+91 99999 88888',
      priority: 'standard',
      prescribedDoctorId: 'doc-01',
      prescribedDoctorName: 'Dr. Arvind Swaminathan',
      prescribedDoctorRoom: 'OPD-204',
      currentIllness: 'Chest flutter',
      prescribedTests: ['test-ecg', 'test-cbc', 'test-xray-chest'],
      completedTests: ['test-ecg'],
      activeTokenIds: {},
      status: 'in_transit',
      assignedSmartRoute: ['test-ecg', 'test-xray-chest', 'test-cbc'],
      registrationTime: '10:00 AM'
    };

    const plan = calculateOptimalQueueRoute(
      patientWithCompletedEcg,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    // Step 1 is ECG (completed)
    expect(plan.smartRouteSteps[0].testId).toBe('test-ecg');
    expect(plan.smartRouteSteps[0].status).toBe('completed');

    // Step 2 must be X-Ray because Radiology queue has only 0-1 waiting vs Pathology has 14 waiting!
    expect(plan.smartRouteSteps[1].testId).toBe('test-xray-chest');
    expect(plan.smartRouteSteps[1].status).toBe('up_next');

    // Step 3 is Blood CBC
    expect(plan.smartRouteSteps[2].testId).toBe('test-cbc');
  });
});

describe('Doctor Review Queue & Smart Triage Injection Engine', () => {
  it('assigns OPD consultation token with awaiting_lab_reports status when doctor prescribes tests', () => {
    resetHospitalStoreForTesting();

    const registered = registerPatientAction({
      name: 'Priya Sharma',
      age: 34,
      gender: 'Female',
      contact: '+91 98111 22233',
      currentIllness: 'Persistent dry cough and mild dyspnea',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    expect(registered.opdTokenNumber).toBeDefined();
    expect(registered.doctorReviewStatus).toBe('awaiting_prescription');

    // Doctor prescribes 2 tests: CBC and Chest X-Ray
    prescribeTestsAction(registered.id, ['test-cbc', 'test-xray-chest'], 'doc-sarah');

    const snap = getHospitalStoreSnapshot();
    const updatedPatient = snap.patients.find(p => p.id === registered.id)!;

    expect(updatedPatient).toBeDefined();
    expect(updatedPatient.prescribedTests).toEqual(['test-cbc', 'test-xray-chest']);
    expect(updatedPatient.doctorReviewStatus).toBe('awaiting_lab_reports');

    // OPD Consultation token exists in doctor's queue with awaiting_lab_reports
    const opdToken = snap.queueTokens.find(
      t => t.patientId === registered.id && t.testId === 'opd-consultation'
    )!;
    expect(opdToken).toBeDefined();
    expect(opdToken.tokenNumber).toBe(registered.opdTokenNumber);
    expect(opdToken.status).toBe('awaiting_lab_reports');
    expect(opdToken.doctorId).toBe('doc-sarah');
    expect(opdToken.departmentId).toBe('dept-opd');

    // Lab queue tokens are created
    const labTokens = snap.queueTokens.filter(
      t => t.patientId === registered.id && t.testId !== 'opd-consultation'
    );
    expect(labTokens.length).toBe(2);
    expect(labTokens.map(t => t.testId)).toContain('test-cbc');
    expect(labTokens.map(t => t.testId)).toContain('test-xray-chest');
  });

  it('automatically transitions OPD token and patient to reports_ready once all lab tests are completed', () => {
    resetHospitalStoreForTesting();

    const registered = registerPatientAction({
      name: 'Mohit Chawla',
      age: 42,
      gender: 'Male',
      contact: '+91 97222 33344',
      currentIllness: 'Chest pain during exertion',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    // Prescribe 2 tests
    prescribeTestsAction(registered.id, ['test-cbc', 'test-ecg'], 'doc-sarah');

    let snap = getHospitalStoreSnapshot();
    const cbcToken = snap.queueTokens.find(t => t.patientId === registered.id && t.testId === 'test-cbc')!;
    const ecgToken = snap.queueTokens.find(t => t.patientId === registered.id && t.testId === 'test-ecg')!;

    // Complete 1st test (CBC)
    completeTestAndUploadReportAction(cbcToken.id, {
      summary: 'CBC investigation completed. Normal hemogram.',
      metrics: [{ label: 'WBC', value: '7.2', unit: '10^3/uL', normalRange: '4.0 - 11.0', flag: 'normal' }]
    });

    snap = getHospitalStoreSnapshot();
    let pat = snap.patients.find(p => p.id === registered.id)!;
    let opdTok = snap.queueTokens.find(t => t.patientId === registered.id && t.testId === 'opd-consultation')!;

    // 1 of 2 done: still awaiting lab reports
    expect(pat.completedTests).toEqual(['test-cbc']);
    expect(pat.doctorReviewStatus).toBe('awaiting_lab_reports');
    expect(opdTok.status).toBe('awaiting_lab_reports');

    // Complete 2nd test (ECG) -> all tests now done!
    completeTestAndUploadReportAction(ecgToken.id, {
      summary: 'ECG normal sinus rhythm. No ST segment abnormalities.',
      metrics: [{ label: 'Heart Rate', value: '74', unit: 'bpm', normalRange: '60 - 100', flag: 'normal' }]
    });

    snap = getHospitalStoreSnapshot();
    pat = snap.patients.find(p => p.id === registered.id)!;
    opdTok = snap.queueTokens.find(t => t.patientId === registered.id && t.testId === 'opd-consultation')!;

    // All done: transitioned to reports_ready
    expect(pat.completedTests.length).toBe(2);
    expect(pat.status).toBe('all_completed');
    expect(pat.doctorReviewStatus).toBe('reports_ready');
    expect(opdTok.status).toBe('reports_ready');
  });

  it('slots Emergency walk-in patients directly into position 1 / immediate triage', () => {
    resetHospitalStoreForTesting();

    const emergencyPatient = registerPatientAction({
      name: 'Sunil Aggarwal',
      age: 55,
      gender: 'Male',
      contact: '+91 99999 00001',
      currentIllness: 'Acute severe chest pressure and cold sweats',
      doctorId: 'doc-sarah',
      priority: 'emergency'
    });

    expect(emergencyPatient.priority).toBe('emergency');
    expect(emergencyPatient.queuePosition).toBe(1);
    expect(emergencyPatient.estimatedWaitMinutes).toBe(2);

    const snap = getHospitalStoreSnapshot();
    const opdToken = snap.queueTokens.find(
      t => t.patientId === emergencyPatient.id && t.testId === 'opd-consultation'
    )!;
    expect(opdToken).toBeDefined();
    expect(opdToken.priority).toBe('emergency');
    expect(opdToken.queuePosition).toBe(1);
    expect(opdToken.estimatedWaitMinutes).toBe(2);
  });

  it('auto-assigns Senior Citizen priority when patient age is 60 or above', () => {
    resetHospitalStoreForTesting();

    const seniorPatient = registerPatientAction({
      name: 'Sushila Devi',
      age: 65,
      gender: 'Female',
      contact: '+91 99999 00002',
      currentIllness: 'Hypertension checkup and chronic backache',
      doctorId: 'doc-sarah'
    });

    expect(seniorPatient.priority).toBe('senior');
    expect(seniorPatient.age).toBe(65);

    const snap = getHospitalStoreSnapshot();
    const opdToken = snap.queueTokens.find(
      t => t.patientId === seniorPatient.id && t.testId === 'opd-consultation'
    )!;
    expect(opdToken.priority).toBe('senior');
  });

  it('discharges patient and marks consultation token completed upon completeConsultation', () => {
    resetHospitalStoreForTesting();

    const patient = registerPatientAction({
      name: 'Gaurav Khanna',
      age: 38,
      gender: 'Male',
      contact: '+91 99999 00003',
      currentIllness: 'Mild sore throat',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    completeConsultationAction(patient.id, 'Prescribed throat lozenges and hydration. Advised rest.');

    const snap = getHospitalStoreSnapshot();
    const updatedPatient = snap.patients.find(p => p.id === patient.id)!;
    const opdToken = snap.queueTokens.find(
      t => t.patientId === patient.id && t.testId === 'opd-consultation'
    )!;

    expect(updatedPatient.status).toBe('discharged');
    expect(updatedPatient.doctorReviewStatus).toBe('completed');
    expect(opdToken.status).toBe('completed');
    expect(opdToken.completedAt).toBeDefined();
  });

  it('correctly shifts existing doctor active OPD tokens when an emergency patient jumps to position 1', () => {
    resetHospitalStoreForTesting();

    // Register a standard patient first
    const p1 = registerPatientAction({
      name: 'Ravi Kumar',
      age: 32,
      gender: 'Male',
      contact: '+91 98888 11111',
      currentIllness: 'Mild headache',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    let snap = getHospitalStoreSnapshot();
    const tok1Before = snap.queueTokens.find(t => t.patientId === p1.id && t.testId === 'opd-consultation')!;
    const pos1Before = tok1Before.queuePosition;

    // Register an emergency patient
    const pEmerg = registerPatientAction({
      name: 'Anil Kapoor',
      age: 49,
      gender: 'Male',
      contact: '+91 98888 22222',
      currentIllness: 'Acute severe angina and hypotension',
      doctorId: 'doc-sarah',
      priority: 'emergency'
    });

    snap = getHospitalStoreSnapshot();
    const tokEmerg = snap.queueTokens.find(t => t.patientId === pEmerg.id && t.testId === 'opd-consultation')!;
    const tok1After = snap.queueTokens.find(t => t.patientId === p1.id && t.testId === 'opd-consultation')!;

    // Emergency token takes position 1
    expect(tokEmerg.queuePosition).toBe(1);
    expect(tokEmerg.priority).toBe('emergency');
    expect(tokEmerg.estimatedWaitMinutes).toBe(2);

    // Prior token shifted down
    expect(tok1After.queuePosition).toBe(pos1Before + 1);
  });

  it('places OPD token at the end of doctor consultation queue and moves waiting patients up when tests are prescribed', () => {
    resetHospitalStoreForTesting();

    // Register Patient A & B for Doctor Sarah
    const pA = registerPatientAction({
      name: 'Patient A',
      age: 30,
      gender: 'Male',
      contact: '+91 98888 33331',
      currentIllness: 'Abdominal pain',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    const pB = registerPatientAction({
      name: 'Patient B',
      age: 31,
      gender: 'Female',
      contact: '+91 98888 33332',
      currentIllness: 'Routine checkup',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    // Doctor prescribes tests for Patient A
    prescribeTestsAction(pA.id, ['test-cbc'], 'doc-sarah');

    const snap = getHospitalStoreSnapshot();
    const tokA = snap.queueTokens.find(t => t.patientId === pA.id && t.testId === 'opd-consultation')!;
    const tokB = snap.queueTokens.find(t => t.patientId === pB.id && t.testId === 'opd-consultation')!;

    // Patient A should be awaiting_lab_reports at the end of the queue
    expect(tokA.status).toBe('awaiting_lab_reports');
    // Patient A's position is after Patient B
    expect(tokA.queuePosition).toBeGreaterThan(tokB.queuePosition);

    // Patient B has moved up in the doctor's active queue
    expect(tokB.status).toBe('waiting');
  });

  it('guards against empty prescribedTests array evaluating allDone to true', () => {
    resetHospitalStoreForTesting();

    // Register patient with 0 tests
    const p = registerPatientAction({
      name: 'Fresh Patient',
      age: 25,
      gender: 'Male',
      contact: '+91 98888 44444',
      currentIllness: 'No tests ordered',
      doctorId: 'doc-sarah',
      priority: 'standard'
    });

    const snap = getHospitalStoreSnapshot();
    const pat = snap.patients.find(pt => pt.id === p.id)!;
    expect(pat.prescribedTests.length).toBe(0);
    expect(pat.completedTests.length).toBe(0);
    expect(pat.doctorReviewStatus).toBe('awaiting_prescription');
    expect(pat.status).toBe('checked_in');
  });

  it('enforces multi-hospital tenant scoping in queueRouter and isolates clinic counters from metro counters', () => {
    const clinicPatient: Patient = {
      id: 'pat-test-clinic',
      hospitalId: 'hosp-clinic',
      hospitalName: "Dr. Sarah's Family Practice (Single-Doctor Clinic)",
      uhid: 'QC-TEST-CLN',
      name: 'Test Clinic Patient',
      age: 40,
      gender: 'Male',
      contact: '+91 99999 00000',
      priority: 'standard',
      prescribedDoctorId: 'doc-clinic-sarah',
      prescribedDoctorName: 'Dr. Sarah Khan',
      prescribedDoctorRoom: 'OPD Consulting Room',
      currentIllness: 'Fever check',
      symptoms: 'Fever',
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: [],
      activeTokenIds: {},
      status: 'checked_in',
      assignedSmartRoute: ['test-cbc', 'test-ecg'],
      assignedNaiveRoute: ['test-cbc', 'test-ecg'],
      registrationTime: '10:00 AM',
      opdTokenNumber: 'CLN-105',
      doctorReviewStatus: 'awaiting_lab_reports'
    };

    // Mixed counters: Metro counters and Clinic counters
    const mixedCounters = ALL_INITIAL_COUNTERS;

    // Mixed tokens: 14 blood tokens in Metro, 0 in clinic
    const mixedTokens = [
      ...INITIAL_QUEUE_TOKENS, // Metro tokens
      {
        id: 'tok-test-cln-ecg',
        hospitalId: 'hosp-clinic',
        tokenNumber: 'CLN-ECG-01',
        patientId: 'pat-other-clinic',
        testId: 'test-ecg',
        departmentId: 'dept-cardio',
        counterId: 'counter-clinic-ecg',
        priority: 'standard' as const,
        status: 'waiting' as const,
        issuedAt: '10:00 AM',
        queuePosition: 1,
        estimatedWaitMinutes: 5
      }
    ];

    const plan = calculateOptimalQueueRoute(
      clinicPatient,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      mixedTokens,
      mixedCounters
    );

    // Should only recommend clinic counters (counter-clinic-bld and counter-clinic-ecg), NEVER Metro counters!
    const recommendedCounters = plan.smartRouteSteps.map(s => s.recommendedCounterId);
    expect(recommendedCounters).toContain('counter-clinic-bld');
    expect(recommendedCounters).toContain('counter-clinic-ecg');
    expect(recommendedCounters).not.toContain('counter-bld-1');
    expect(recommendedCounters).not.toContain('counter-bld-2');
  });

  it('isolates single-doctor clinic tokens and sets CLN prefix during registration and prescription', () => {
    resetHospitalStoreForTesting();

    // Ensure store has ALL_INITIAL_DOCTORS so clinic doctor is available
    setHospitalAction('hosp-clinic');

    const snapBefore = getHospitalStoreSnapshot();
    const clinicDoc = snapBefore.doctors.find(d => d.id === 'doc-clinic-sarah') || {
      id: 'doc-clinic-sarah',
      hospitalId: 'hosp-clinic',
      name: 'Dr. Sarah Khan',
      specialization: 'Consultant Family Physician',
      department: 'General Family Practice',
      roomNo: 'OPD Consulting Room',
      activePatientCount: 1
    };

    const reg = registerPatientAction({
      name: 'Sunil Rao',
      age: 42,
      gender: 'Male',
      contact: '+91 98111 22334',
      currentIllness: 'Seasonal cough & fatigue',
      doctorId: clinicDoc.id,
      priority: 'standard'
    });

    expect(reg.hospitalId).toBe('hosp-clinic');
    expect(reg.opdTokenNumber.startsWith('CLN-')).toBe(true);

    // Prescribe CBC in clinic
    prescribeTestsAction(reg.id, ['test-cbc'], clinicDoc.id);

    const snapAfter = getHospitalStoreSnapshot();
    const cbcToken = snapAfter.queueTokens.find(t => t.patientId === reg.id && t.testId === 'test-cbc')!;

    expect(cbcToken).toBeDefined();
    expect(cbcToken.hospitalId).toBe('hosp-clinic');
    // Queue position should be based on clinic queue, not metro's 14 waiting tokens!
    expect(cbcToken.queuePosition).toBeLessThanOrEqual(2);
  });

  it('tags completed reports with hospitalId and preserves tenant scoping', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('hosp-clinic');

    const reg = registerPatientAction({
      name: 'Priya Verma',
      age: 35,
      gender: 'Female',
      contact: '+91 98222 33445',
      currentIllness: 'Hypertension follow-up',
      doctorId: 'doc-clinic-sarah',
      priority: 'standard'
    });

    prescribeTestsAction(reg.id, ['test-ecg'], 'doc-clinic-sarah');

    const snap = getHospitalStoreSnapshot();
    const ecgToken = snap.queueTokens.find(t => t.patientId === reg.id && t.testId === 'test-ecg')!;

    completeTestAndUploadReportAction(ecgToken.id, {
      summary: 'Normal sinus rhythm recorded at attached clinic desk.',
      metrics: [
        { label: 'Heart Rate', value: '70', unit: 'bpm', normalRange: '60 - 100 bpm', flag: 'normal' }
      ]
    });

    const finalSnap = getHospitalStoreSnapshot();
    const createdReport = finalSnap.clinicalReports.find(r => r.patientId === reg.id && r.testId === 'test-ecg')!;

    expect(createdReport).toBeDefined();
    expect(createdReport.hospitalId).toBe('hosp-clinic');
    expect(createdReport.status).toBe('uploaded');

    // Patient status in single doctor clinic updates to all_completed and reports_ready!
    const pat = finalSnap.patients.find(p => p.id === reg.id)!;
    expect(pat.completedTests).toContain('test-ecg');
    expect(pat.doctorReviewStatus).toBe('reports_ready');
  });

  it('ensures single-doctor clinic counter only calls clinic tokens and ignores 14 metro pathology tokens', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('hosp-clinic');

    const snap = getHospitalStoreSnapshot();
    // Clinic blood counter should be counter-clinic-bld
    const clinicCounter = snap.counters.find(c => c.id === 'counter-clinic-bld')!;
    expect(clinicCounter).toBeDefined();

    // Verify there are 14 metro pathology tokens in the database
    const metroPathTokens = snap.queueTokens.filter(
      t => t.departmentId === 'dept-pathology' && (t.hospitalId || 'hosp-metro') === 'hosp-metro' && t.status === 'waiting'
    );
    expect(metroPathTokens.length).toBeGreaterThan(5);

    // Verify clinic has Rohan's token waiting
    const clinicRohanToken = snap.queueTokens.find(
      t => t.departmentId === 'dept-pathology' && t.hospitalId === 'hosp-clinic' && t.status === 'waiting'
    )!;
    expect(clinicRohanToken).toBeDefined();
    expect(clinicRohanToken.id).toBe('tok-cln-cbc-1');

    // Call next token at clinic blood desk
    callOrAdvanceCounterAction('counter-clinic-bld', true);

    const afterSnap = getHospitalStoreSnapshot();
    const updatedClinicCounter = afterSnap.counters.find(c => c.id === 'counter-clinic-bld')!;
    const calledToken = afterSnap.queueTokens.find(t => t.id === updatedClinicCounter.currentServingTokenId)!;

    // The counter MUST have called Rohan's clinic token (tok-cln-cbc-1), NEVER a metro token!
    expect(calledToken.id).toBe('tok-cln-cbc-1');
    expect(calledToken.hospitalId).toBe('hosp-clinic');
    expect(calledToken.status).toBe('called');

    // None of the metro tokens should be touched or called by this clinic counter!
    const metroCalledByClinic = afterSnap.queueTokens.filter(
      t => (t.hospitalId || 'hosp-metro') === 'hosp-metro' && t.counterId === 'counter-clinic-bld'
    );
    expect(metroCalledByClinic.length).toBe(0);
  });
});
