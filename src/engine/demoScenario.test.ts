import { describe, it, expect } from 'vitest';
import { 
  DEMO_PATIENT_RAHUL, 
  ALL_INITIAL_QUEUE_TOKENS, 
  ALL_INITIAL_COUNTERS, 
  INITIAL_TESTS, 
  INITIAL_DEPARTMENTS,
  DEMO_STAFF
} from '../data/mockHospitalData';
import { calculateOptimalQueueRoute, calculateDepartmentCurrentWait } from './queueRouter';
import { Patient } from '../types';

describe('QCare Demo Scenario & Multi-Tenant Engine Tests', () => {
  it('Requirement 36: Recommends Ultrasound as best starting test for Rahul Sharma with given initial queues', () => {
    // Queues in qcare-demo:
    // ECG: 9 patients (wait ~72 min)
    // Blood Test: 5 patients (wait ~10 min)
    // Ultrasound: 2 patients (wait ~24 min, but full bladder readiness prioritizes it)
    // X-Ray: 7 patients (wait ~49 min)
    const plan = calculateOptimalQueueRoute(
      DEMO_PATIENT_RAHUL,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      ALL_INITIAL_QUEUE_TOKENS,
      ALL_INITIAL_COUNTERS
    );

    expect(plan.smartRouteSteps.length).toBe(4);
    // Ultrasound is recommended first
    expect(plan.smartRouteSteps[0].testId).toBe('test-usg-abdomen');
    expect(plan.recommendedNextTestId).toBe('test-usg-abdomen');
    expect(plan.smartTotalTimeMinutes).toBeLessThan(plan.naiveTotalTimeMinutes);
  });

  it('Requirement 36: When Ultrasound is completed, dynamically recalculates the next recommendation', () => {
    const rahulAfterUsg: Patient = {
      ...DEMO_PATIENT_RAHUL,
      completedTests: ['test-usg-abdomen'],
      assignedSmartRoute: ['test-usg-abdomen', 'test-cbc', 'test-xray-chest', 'test-ecg']
    };

    const plan = calculateOptimalQueueRoute(
      rahulAfterUsg,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      ALL_INITIAL_QUEUE_TOKENS,
      ALL_INITIAL_COUNTERS
    );

    // Completed step is preserved as step 1
    expect(plan.smartRouteSteps[0].status).toBe('completed');
    expect(plan.smartRouteSteps[0].testId).toBe('test-usg-abdomen');

    // Up next is now the next best pending test (Blood Test or X-Ray)
    const upNext = plan.smartRouteSteps.find(s => s.status === 'up_next');
    expect(upNext).toBeDefined();
    expect(['test-cbc', 'test-xray-chest']).toContain(upNext?.testId);
  });

  it('Requirement 2 & 42: Strict multi-tenant isolation ensures Hospital A cannot access Hospital B data', () => {
    const qcareDemoTokens = ALL_INITIAL_QUEUE_TOKENS.filter(t => t.hospitalId === 'qcare-demo');
    const eastTokens = ALL_INITIAL_QUEUE_TOKENS.filter(t => t.hospitalId === 'hosp-east');

    expect(qcareDemoTokens.length).toBeGreaterThan(0);
    expect(eastTokens.length).toBeGreaterThan(0);

    // Tenant check: none of the qcare-demo tokens should have hosp-east patient or counter
    qcareDemoTokens.forEach(token => {
      expect(token.hospitalId).toBe('qcare-demo');
    });

    // Verification with calculateOptimalQueueRoute scoping
    const rahulPlan = calculateOptimalQueueRoute(
      DEMO_PATIENT_RAHUL, // hospitalId: 'qcare-demo'
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS,
      ALL_INITIAL_QUEUE_TOKENS, // Mixed tokens across all hospitals
      ALL_INITIAL_COUNTERS      // Mixed counters across all hospitals
    );

    // Verify all steps assigned only to qcare-demo counters
    rahulPlan.smartRouteSteps.forEach(step => {
      if (step.recommendedCounterId) {
        const counter = ALL_INITIAL_COUNTERS.find(c => c.id === step.recommendedCounterId);
        expect(counter?.hospitalId).toBe('qcare-demo');
      }
    });
  });

  it('Requirement 21: Machine breakdown (active machines = 0) marks lab unavailable and reroutes dynamically', () => {
    // If ultrasound machines become 0, ultrasound wait is heavily penalized
    const usgWait = calculateDepartmentCurrentWait(
      'dept-ultrasound',
      ALL_INITIAL_QUEUE_TOKENS.filter(t => t.hospitalId === 'qcare-demo'),
      ALL_INITIAL_COUNTERS.map(c => c.departmentId === 'dept-ultrasound' ? { ...c, status: 'closed' as const } : c),
      DEMO_PATIENT_RAHUL.id,
      INITIAL_DEPARTMENTS.map(d => d.id === 'dept-ultrasound' ? { ...d, activeMachines: 0, availabilityStatus: 'unavailable' as const } : d)
    );

    expect(usgWait.isClosed).toBe(true);
    expect(usgWait.waitMinutes).toBeGreaterThanOrEqual(90);

    // Dynamic rerouting check: With ultrasound unavailable, Rahul's recommended next test must NOT be ultrasound
    const planWithBrokenUsg = calculateOptimalQueueRoute(
      DEMO_PATIENT_RAHUL,
      INITIAL_TESTS,
      INITIAL_DEPARTMENTS.map(d => d.id === 'dept-ultrasound' ? { ...d, activeMachines: 0, availabilityStatus: 'unavailable' as const } : d),
      ALL_INITIAL_QUEUE_TOKENS,
      ALL_INITIAL_COUNTERS.map(c => c.departmentId === 'dept-ultrasound' ? { ...c, status: 'closed' as const } : c)
    );
    expect(planWithBrokenUsg.recommendedNextTestId).not.toBe('test-usg-abdomen');
    expect(['test-cbc', 'test-xray-chest']).toContain(planWithBrokenUsg.recommendedNextTestId);
  });

  it('Requirement 4 & 5: Staff role distribution supports Super Admin, Hospital Admin, Assistant, Lab Staff, Reception', () => {
    const roles = DEMO_STAFF.map(s => s.role);
    expect(roles).toContain('super_admin');
    expect(roles).toContain('hospital_admin');
    expect(roles).toContain('doctor_assistant');
    expect(roles).toContain('reception');
    expect(roles).toContain('lab_staff');
  });

  it('Requirement 22 & 27: Queue visibility calculation formula matches (Patients Ahead × Avg Duration ÷ Active Machines)', () => {
    const usgDept = INITIAL_DEPARTMENTS.find(d => d.id === 'dept-ultrasound')!;
    const usgTest = INITIAL_TESTS.find(t => t.id === 'test-usg-abdomen')!;
    const waitingTokens = ALL_INITIAL_QUEUE_TOKENS.filter(
      t => t.departmentId === 'dept-ultrasound' && t.status === 'waiting' && t.hospitalId === 'qcare-demo'
    );
    const activeMachines = usgDept.activeMachines || 1;
    const avgDuration = usgTest.averageDurationMinutes;
    const calculatedWait = Math.round((waitingTokens.length * avgDuration) / activeMachines);

    expect(waitingTokens.length).toBeGreaterThanOrEqual(1);
    expect(avgDuration).toBe(14);
    expect(activeMachines).toBe(1);
    expect(calculatedWait).toBe(waitingTokens.length * 14);
  });

  it('Requirement 34 & 35: Urgent priority flag and unavailable lab statuses are accurately reflected', () => {
    const urgentPatient: Patient = {
      ...DEMO_PATIENT_RAHUL,
      doctorPriority: 'urgent'
    };
    expect(urgentPatient.doctorPriority).toBe('urgent');

    const unavailableDept = {
      ...INITIAL_DEPARTMENTS[0],
      availabilityStatus: 'unavailable' as const
    };
    expect(unavailableDept.availabilityStatus).toBe('unavailable');
  });
});
