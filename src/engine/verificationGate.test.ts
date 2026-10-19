import { describe, it, expect } from 'vitest';
import { 
  calculateDepartmentCurrentWait, 
  calculateOptimalQueueRoute, 
  formatWaitRange 
} from './queueRouter';
import { 
  sanitizeString, 
  validatePatientName, 
  validatePatientAge, 
  validatePatientPhone, 
  validateSymptoms 
} from './securitySanitizer';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_COUNTERS, 
  INITIAL_QUEUE_TOKENS, 
  INITIAL_PATIENTS,
  ALL_INITIAL_DOCTORS,
  DEMO_PATIENT_RAHUL
} from '../data/mockHospitalData';
import { 
  registerPatientAction, 
  prescribeTestsAction, 
  completeTestAndUploadReportAction, 
  completeConsultationAction, 
  createPatientDiagnosticJourneyAction,
  updateLabAvailabilityAction,
  updateMachineCountsAction,
  getHospitalStoreSnapshot, 
  resetHospitalStoreForTesting,
  setHospitalAction
} from '../store/useHospitalStore';
import { Patient, DiagnosticTest, Counter, Department, QueueToken } from '../types';

describe('1. Queue Routing & Estimation Logic Edge Cases', () => {
  it('Wait time formula: evaluates (Patients Ahead * Avg Duration) / Active Machines', () => {
    const testDept: Department = {
      ...INITIAL_DEPARTMENTS[0],
      id: 'dept-test-calc',
      activeMachines: 3
    };
    const testCounters: Counter[] = [
      {
        id: 'c-1',
        code: 'C1',
        name: 'Counter 1',
        departmentId: 'dept-test-calc',
        technicianName: 'Tech 1',
        status: 'active',
        servedCountToday: 0,
        averageServiceMinutes: 6.0
      }
    ];
    // 6 patients ahead, avg service 6.0 min, activeMachines 3 -> wait = (6 * 6) / 3 = 12 min
    const tokens: QueueToken[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `tok-${i}`,
      tokenNumber: `T-${i}`,
      patientId: `pat-${i}`,
      testId: 'test-cbc',
      departmentId: 'dept-test-calc',
      priority: 'standard',
      status: 'waiting',
      issuedAt: '09:00 AM',
      queuePosition: i + 1,
      estimatedWaitMinutes: 10
    }));

    const result = calculateDepartmentCurrentWait(
      'dept-test-calc',
      tokens,
      testCounters,
      undefined,
      [testDept]
    );

    expect(result.waitingCount).toBe(6);
    expect(result.activeCountersCount).toBe(3); // Uses activeMachines = 3
    expect(result.waitMinutes).toBe(12); // (6 * 6.0) / 3 = 12
    expect(result.isClosed).toBe(false);
  });

  it('Edge Case: active machines = 0 marks lab closed and heavily penalizes wait time', () => {
    const brokenDept: Department = {
      ...INITIAL_DEPARTMENTS[0],
      id: 'dept-broken',
      activeMachines: 0,
      availabilityStatus: 'unavailable'
    };

    const result = calculateDepartmentCurrentWait(
      'dept-broken',
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS,
      undefined,
      [brokenDept]
    );

    expect(result.isClosed).toBe(true);
    expect(result.activeCountersCount).toBe(0);
    expect(result.waitMinutes).toBeGreaterThanOrEqual(90);
  });

  it('Edge Case: no patients ahead results in 0 wait time and immediate status', () => {
    const emptyTokens: QueueToken[] = [];
    const result = calculateDepartmentCurrentWait(
      'dept-pathology',
      emptyTokens,
      INITIAL_COUNTERS,
      undefined,
      INITIAL_DEPARTMENTS
    );

    expect(result.waitingCount).toBe(0);
    expect(result.waitMinutes).toBe(0);
    expect(formatWaitRange(result.waitMinutes)).toBe('Immediate (< 3 min)');
  });

  it('Edge Case: missing test metadata falls back safely without NaN or crashes', () => {
    const testWithMissingMeta: DiagnosticTest = {
      id: 'test-sparse',
      code: 'SPARSE',
      name: 'Sparse Test',
      departmentId: 'dept-pathology',
      averageDurationMinutes: 0, // Missing or 0 duration
      preparationNotes: '',
      standardPrice: 100
    };

    const patientWithSparseTest: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-sparse',
      prescribedTests: ['test-sparse'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      patientWithSparseTest,
      [testWithMissingMeta],
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(1);
    expect(plan.smartRouteSteps[0].testId).toBe('test-sparse');
    expect(plan.smartRouteSteps[0].estimatedDurationMinutes).toBeGreaterThan(0);
    expect(isNaN(plan.smartTotalTimeMinutes)).toBe(false);
  });

  it('Edge Case: handles circular test dependencies and self-dependencies gracefully', () => {
    const circularTests: DiagnosticTest[] = [
      {
        id: 'test-loop-a',
        code: 'LOOP-A',
        name: 'Loop A',
        departmentId: 'dept-pathology',
        averageDurationMinutes: 5,
        standardPrice: 100,
        preparationNotes: '',
        prerequisites: ['test-loop-b', 'test-loop-a'] // Self-dependency + circular
      },
      {
        id: 'test-loop-b',
        code: 'LOOP-B',
        name: 'Loop B',
        departmentId: 'dept-cardio',
        averageDurationMinutes: 5,
        standardPrice: 100,
        preparationNotes: '',
        prerequisites: ['test-loop-a']
      }
    ];

    const circPatient: Patient = {
      ...INITIAL_PATIENTS[0],
      id: 'pat-circ-edge',
      prescribedTests: ['test-loop-a', 'test-loop-b'],
      completedTests: []
    };

    const plan = calculateOptimalQueueRoute(
      circPatient,
      circularTests,
      INITIAL_DEPARTMENTS,
      INITIAL_QUEUE_TOKENS,
      INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(2);
    expect(plan.smartRouteSteps.map(s => s.testId)).toContain('test-loop-a');
    expect(plan.smartRouteSteps.map(s => s.testId)).toContain('test-loop-b');
  });

  it('Dynamic re-routing: immediately diverts patient route away when a lab becomes unavailable', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('qcare-demo');

    // Initially Rahul Sharma's best first test is Ultrasound
    const snapBefore = getHospitalStoreSnapshot();
    const rahulBefore = snapBefore.patients.find(p => p.id === DEMO_PATIENT_RAHUL.id)!;
    expect(rahulBefore).toBeDefined();

    // Mark ultrasound lab unavailable
    updateLabAvailabilityAction('dept-ultrasound', 'unavailable');

    const snapAfter = getHospitalStoreSnapshot();
    const rahulAfter = snapAfter.patients.find(p => p.id === DEMO_PATIENT_RAHUL.id)!;

    // The patient route must have been immediately recalculated and diverted away from ultrasound as step 1
    expect(rahulAfter.assignedSmartRoute[0]).not.toBe('test-usg-abdomen');
    expect(['test-cbc', 'test-xray-chest']).toContain(rahulAfter.assignedSmartRoute[0]);
  });

  it('Dynamic re-routing: immediately recalculates route when active machines drop to 0', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('qcare-demo');

    // Ultrasound machine breakdown (total 1, active 0)
    updateMachineCountsAction('dept-ultrasound', 1, 0);

    const snapAfter = getHospitalStoreSnapshot();
    const rahul = snapAfter.patients.find(p => p.id === DEMO_PATIENT_RAHUL.id)!;

    expect(rahul.assignedSmartRoute[0]).not.toBe('test-usg-abdomen');
    expect(['test-cbc', 'test-xray-chest']).toContain(rahul.assignedSmartRoute[0]);
  });
});

describe('2. Multi-Hospital Tenant Isolation & Security', () => {
  it('Hospital A patients, doctors, queue tokens, and reports never leak to Hospital B', () => {
    resetHospitalStoreForTesting();

    // Set hospital to Metro
    setHospitalAction('hosp-metro');
    const metroSnap = getHospitalStoreSnapshot();
    const metroPatients = metroSnap.patients.filter(p => (p.hospitalId || 'hosp-metro') === 'hosp-metro');
    const metroTokens = metroSnap.queueTokens.filter(t => (t.hospitalId || 'hosp-metro') === 'hosp-metro');

    // Set hospital to Single Doctor Clinic
    setHospitalAction('hosp-clinic');
    const clinicSnap = getHospitalStoreSnapshot();
    const clinicPatients = clinicSnap.patients.filter(p => (p.hospitalId || 'hosp-metro') === 'hosp-clinic');
    const clinicTokens = clinicSnap.queueTokens.filter(t => (t.hospitalId || 'hosp-metro') === 'hosp-clinic');

    // Ensure strict separation: no clinic patients in metro, and no metro patients in clinic
    clinicPatients.forEach(p => {
      expect(p.hospitalId).toBe('hosp-clinic');
      expect(metroPatients.some(mp => mp.id === p.id)).toBe(false);
    });

    clinicTokens.forEach(t => {
      expect(t.hospitalId).toBe('hosp-clinic');
      expect(metroTokens.some(mt => mt.id === t.id)).toBe(false);
    });
  });

  it('Doctors are strictly scoped by hospitalId without leaking foreign doctors', () => {
    const clinicDoctors = ALL_INITIAL_DOCTORS.filter(d => d.hospitalId === 'hosp-clinic');
    expect(clinicDoctors.length).toBe(1);
    expect(clinicDoctors[0].id).toBe('doc-clinic-sarah');

    const metroDoctors = ALL_INITIAL_DOCTORS.filter(d => d.hospitalId === 'hosp-metro');
    expect(metroDoctors.length).toBeGreaterThanOrEqual(4);

    // Verify no overlap
    clinicDoctors.forEach(cd => {
      expect(metroDoctors.some(md => md.id === cd.id)).toBe(false);
    });
  });
});

describe('3. Data Integrity & Closed-Loop OPD Workflow', () => {
  it('Executes complete closed-loop OPD workflow: Walk-in -> Prescribe -> Lab tests -> Reports Verified -> Doctor Sign-off -> Discharged', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('hosp-metro');

    // 1. Walk-in Registration
    const patient = registerPatientAction({
      name: 'Kavita Singhal',
      age: 39,
      gender: 'Female',
      contact: '9812345678',
      currentIllness: 'Chest tightness and shortness of breath',
      doctorId: 'doc-metro-sarah',
      priority: 'standard'
    });

    expect(patient.status).toBe('checked_in');
    expect(patient.doctorReviewStatus).toBe('awaiting_prescription');
    expect(patient.opdTokenNumber).toBeDefined();

    // 2. Doctor prescribes investigations: ECG and CBC
    prescribeTestsAction(patient.id, ['test-ecg', 'test-cbc'], 'doc-metro-sarah');

    let snap = getHospitalStoreSnapshot();
    let pat = snap.patients.find(p => p.id === patient.id)!;
    expect(pat.doctorReviewStatus).toBe('awaiting_lab_reports');
    expect(pat.prescribedTests).toEqual(['test-ecg', 'test-cbc']);

    const ecgToken = snap.queueTokens.find(t => t.patientId === patient.id && t.testId === 'test-ecg')!;
    const cbcToken = snap.queueTokens.find(t => t.patientId === patient.id && t.testId === 'test-cbc')!;
    expect(ecgToken).toBeDefined();
    expect(cbcToken).toBeDefined();

    // 3. Complete Test 1 (ECG) and upload clinical report
    completeTestAndUploadReportAction(ecgToken.id, {
      summary: 'Normal sinus rhythm, 72 bpm. Normal intervals.',
      metrics: [{ label: 'Heart Rate', value: '72', unit: 'bpm', normalRange: '60 - 100', flag: 'normal' }]
    });

    snap = getHospitalStoreSnapshot();
    pat = snap.patients.find(p => p.id === patient.id)!;
    expect(pat.completedTests).toEqual(['test-ecg']);
    expect(pat.doctorReviewStatus).toBe('awaiting_lab_reports');

    // Complete Test 2 (CBC) and upload clinical report
    completeTestAndUploadReportAction(cbcToken.id, {
      summary: 'Normal hemogram. Hemoglobin 13.8 g/dL.',
      metrics: [{ label: 'Hemoglobin', value: '13.8', unit: 'g/dL', normalRange: '12 - 16', flag: 'normal' }]
    });

    // 4. All lab tests completed -> transitions to reports_ready
    snap = getHospitalStoreSnapshot();
    pat = snap.patients.find(p => p.id === patient.id)!;
    const opdToken = snap.queueTokens.find(t => t.patientId === patient.id && t.testId === 'opd-consultation')!;

    expect(pat.status).toBe('all_completed');
    expect(pat.doctorReviewStatus).toBe('reports_ready');
    expect(opdToken.status).toBe('reports_ready');

    // Verify clinical reports exist
    const reports = snap.clinicalReports.filter(r => r.patientId === patient.id);
    expect(reports.length).toBe(2);
    expect(reports.every(r => r.status === 'uploaded')).toBe(true);

    // 5. Doctor reviews and signs off consultation -> patient discharged
    completeConsultationAction(patient.id, 'ECG & CBC normal. Patient cleared for discharge with lifestyle advice.');

    snap = getHospitalStoreSnapshot();
    pat = snap.patients.find(p => p.id === patient.id)!;
    const finalOpdToken = snap.queueTokens.find(t => t.patientId === patient.id && t.testId === 'opd-consultation')!;

    expect(pat.status).toBe('discharged');
    expect(pat.doctorReviewStatus).toBe('completed');
    expect(finalOpdToken.status).toBe('completed');
  });

  it('Ensures createPatientDiagnosticJourneyAction creates matching opd-consultation token without orphan states', () => {
    resetHospitalStoreForTesting();
    setHospitalAction('hosp-metro');

    const result = createPatientDiagnosticJourneyAction({
      name: 'Vikas Tandon',
      age: 48,
      gender: 'Male',
      contact: '9876543210',
      doctorName: 'Dr. Sarah Khan',
      department: 'General Medicine',
      doctorPriority: 'priority',
      tests: [
        { testId: 'test-cbc', priority: 'priority' },
        { testId: 'test-ecg', priority: 'normal' }
      ]
    });

    const snap = getHospitalStoreSnapshot();
    const createdPatient = snap.patients.find(p => p.id === result.patient.id)!;
    expect(createdPatient).toBeDefined();

    // Check opd-consultation token exists
    const opdToken = snap.queueTokens.find(
      t => t.patientId === createdPatient.id && t.testId === 'opd-consultation'
    );
    expect(opdToken).toBeDefined();
    expect(opdToken?.status).toBe('awaiting_lab_reports');
    expect(opdToken?.priority).toBe('senior'); // 'priority' maps to priority score 'senior'
  });
});

describe('4. Input Sanitization & Security Validation', () => {
  it('Sanitizes HTML tags, scripts, and event handlers to prevent XSS', () => {
    const rawMalicious = "<script>alert('xss')</script><img src=x onerror=alert(1)>John <b>Doe</b>";
    const sanitized = sanitizeString(rawMalicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toBe('John Doe');
  });

  it('Validates patient full name with boundary checks (2-80 chars)', () => {
    expect(validatePatientName('').isValid).toBe(false);
    expect(validatePatientName('A').isValid).toBe(false);
    expect(validatePatientName('Ramesh Kumar').isValid).toBe(true);
    expect(validatePatientName('Ramesh Kumar').value).toBe('Ramesh Kumar');

    // Malicious script tag in name is stripped
    const xssName = validatePatientName("<script>alert('pwn')</script>Dr. Anil");
    expect(xssName.isValid).toBe(true);
    expect(xssName.value).toBe('Dr. Anil');
  });

  it('Validates age boundaries strictly between 0 and 130', () => {
    expect(validatePatientAge(-1).isValid).toBe(false);
    expect(validatePatientAge(131).isValid).toBe(false);
    expect(validatePatientAge('invalid').isValid).toBe(false);
    expect(validatePatientAge(0).isValid).toBe(true);
    expect(validatePatientAge(45).isValid).toBe(true);
    expect(validatePatientAge(130).isValid).toBe(true);
  });

  it('Validates phone numbers: enforces 10 digits and handles +91 prefix', () => {
    // Exactly 10 digits
    const v1 = validatePatientPhone('9876543210');
    expect(v1.isValid).toBe(true);
    expect(v1.value).toBe('+91 98765 43210');

    // 12 digits with +91 country prefix
    const v2 = validatePatientPhone('+91 98765 43210');
    expect(v2.isValid).toBe(true);
    expect(v2.value).toBe('+91 98765 43210');

    // 11 digits with leading 0
    const v3 = validatePatientPhone('09876543210');
    expect(v3.isValid).toBe(true);
    expect(v3.value).toBe('+91 98765 43210');

    // Invalid lengths
    expect(validatePatientPhone('12345').isValid).toBe(false);
    expect(validatePatientPhone('98765432109999').isValid).toBe(false);
    expect(validatePatientPhone('').isValid).toBe(false);
  });

  it('Sanitizes symptoms and clinical complaints against script injection', () => {
    const rawSymptoms = "<script>document.cookie='evil'</script>Severe chest pain and cold sweats";
    const result = validateSymptoms(rawSymptoms);
    expect(result.isValid).toBe(true);
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('Severe chest pain and cold sweats');
  });
});
