import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { 
  ActiveRole, 
  Counter, 
  Department, 
  DiagnosticTest, 
  Doctor, 
  Patient, 
  QueueToken, 
  ClinicalReport, 
  QueueRoutingPlan,
  PriorityLevel,
  CurrentUser,
  Hospital,
  StaffMember,
  LabMachine,
  AuditLog,
  HospitalFloorRoom,
  DoctorPriority,
  CounterStatus
} from '../types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_TESTS, 
  INITIAL_HOSPITALS,
  ALL_INITIAL_COUNTERS,
  ALL_INITIAL_PATIENTS,
  ALL_INITIAL_QUEUE_TOKENS,
  ALL_INITIAL_DOCTORS,
  ALL_INITIAL_CLINICAL_REPORTS,
  DEMO_STAFF,
  DEMO_MACHINES,
  INITIAL_AUDIT_LOGS,
  DEMO_FLOOR_ROOMS,
  DEMO_PATIENT_RAHUL,
  QCARE_DEMO_COUNTERS,
  QCARE_DEMO_QUEUE_TOKENS
} from '../data/mockHospitalData';
import { calculateOptimalQueueRoute } from '../engine/queueRouter';
import { hospitalAudio } from '../engine/chimeAudio';
import { realtimeSync } from '../engine/realtimeSync';
import { 
  sanitizeString, 
  validatePatientName, 
  validatePatientAge, 
  validatePatientPhone, 
  validateSymptoms 
} from '../engine/securitySanitizer';

// Global singleton state pattern for React 18 application with useSyncExternalStore
type Listener = () => void;

interface StoreState {
  currentUser: CurrentUser | null;
  currentHospitalId: string;
  hospitals: Hospital[];
  departments: Department[];
  tests: DiagnosticTest[];
  counters: Counter[];
  patients: Patient[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  doctors: Doctor[];
  staffMembers: StaffMember[];
  labMachines: LabMachine[];
  auditLogs: AuditLog[];
  floorRooms: HospitalFloorRoom[];
  language: 'en' | 'hi';
  activeRole: ActiveRole;
  selectedPatientId: string;
  selectedCounterId: string;
  selectedDoctorId: string;
  selectedLabDeptId: string;
  soundEnabled: boolean;
  autoSimulateTraffic: boolean;
  latestAnnouncement: {
    tokenNumber: string;
    counterName: string;
    room: string;
    timestamp: string;
  } | null;
  cumulativeTimeSavedMinutes: number;
  toastNotification: string | null;
}

function getInitialSession(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qcare_clinical_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.role) return parsed;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

function getInitialDB(): {
  patients: Patient[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  counters: Counter[];
  departments?: Department[];
  staffMembers?: StaffMember[];
  labMachines?: LabMachine[];
  auditLogs?: AuditLog[];
  hospitals?: Hospital[];
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qcare_hospital_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.patients)) {
        return parsed;
      }
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

const initialSession = getInitialSession();
const savedDB = getInitialDB();

// 1. Clean out all dummy / fake tokens (qdemo-*) from savedDB so user's old browser cache is purged
const cleanedSavedTokens = (savedDB?.queueTokens || []).filter(
  t => !t.id.startsWith('qdemo-') && !t.patientId.startsWith('pat-qdemo-')
);

// 2. Always guarantee all real patients from ALL_INITIAL_PATIENTS are present
const patientMap = new Map<string, Patient>();
ALL_INITIAL_PATIENTS.forEach(p => patientMap.set(p.id, p));
if (savedDB?.patients) {
  savedDB.patients.forEach(p => {
    if (!p.id.startsWith('pat-qdemo-')) {
      patientMap.set(p.id, { ...p, hospitalId: p.hospitalId || 'qcare-demo' });
    }
  });
}
const initialPatients = Array.from(patientMap.values());

// 3. Queue tokens: real demo queue tokens + cleaned user registered tokens (purge ghost / orphan tokens)
const validPatientIds = new Set(patientMap.keys());
const tokenMap = new Map<string, QueueToken>();
ALL_INITIAL_QUEUE_TOKENS.forEach(t => {
  if (validPatientIds.has(t.patientId)) tokenMap.set(t.id, t);
});
cleanedSavedTokens.forEach(t => {
  if (validPatientIds.has(t.patientId)) tokenMap.set(t.id, t);
});
const initialQueueTokens = Array.from(tokenMap.values());

// 4. Counters: reset any counter pointing to dead dummy or orphan tokens
const validTokenIds = new Set(tokenMap.keys());
const rawCounters = savedDB?.counters
  ? Array.from(new Map([...ALL_INITIAL_COUNTERS, ...savedDB.counters].map(c => [c.id, c])).values())
  : ALL_INITIAL_COUNTERS;

const initialCounters = rawCounters.map(c => {
  if (
    (c.currentServingTokenId && (c.currentServingTokenId.startsWith('qdemo-') || !validTokenIds.has(c.currentServingTokenId))) ||
    (c.currentPatientId && !validPatientIds.has(c.currentPatientId))
  ) {
    return { ...c, currentServingTokenId: undefined, currentPatientId: undefined };
  }
  return c;
});

const initialMachines = savedDB?.labMachines
  ? Array.from(new Map([...DEMO_MACHINES, ...savedDB.labMachines].map(m => [m.id, m])).values())
  : DEMO_MACHINES;

let state: StoreState = {
  currentUser: initialSession,
  currentHospitalId: 'qcare-demo', // Default to Flagship QCare Demo Hospital
  hospitals: savedDB?.hospitals || INITIAL_HOSPITALS,
  departments: savedDB?.departments || INITIAL_DEPARTMENTS,
  tests: INITIAL_TESTS,
  counters: initialCounters,
  patients: initialPatients,
  queueTokens: initialQueueTokens,
  clinicalReports: savedDB?.clinicalReports || ALL_INITIAL_CLINICAL_REPORTS,
  doctors: ALL_INITIAL_DOCTORS,
  staffMembers: savedDB?.staffMembers || DEMO_STAFF,
  labMachines: initialMachines,
  auditLogs: savedDB?.auditLogs || INITIAL_AUDIT_LOGS,
  floorRooms: DEMO_FLOOR_ROOMS,
  language: 'en',
  activeRole: initialSession ? (initialSession.role as ActiveRole) : 'patient',
  selectedPatientId: initialSession?.role === 'patient' ? initialSession.id : 'pat-rahul-sharma',
  selectedCounterId: initialSession?.role === 'lab_tech' && initialSession.counterId ? initialSession.counterId : 'counter-qdemo-usg-1',
  selectedDoctorId: 'doc-01',
  selectedLabDeptId: 'dept-ultrasound',
  soundEnabled: true,
  autoSimulateTraffic: false,
  latestAnnouncement: null,
  cumulativeTimeSavedMinutes: 142,
  toastNotification: null
};

// Immediate sync to localStorage so user's browser storage is cleaned
if (typeof window !== 'undefined') {
  try {
    saveDB(state);
  } catch {}
}

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

function saveDB(s: StoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('qcare_hospital_db', JSON.stringify({
      patients: s.patients,
      queueTokens: s.queueTokens,
      clinicalReports: s.clinicalReports,
      counters: s.counters,
      departments: s.departments,
      staffMembers: s.staffMembers,
      labMachines: s.labMachines,
      auditLogs: s.auditLogs,
      hospitals: s.hospitals
    }));
  } catch {}
}

function updateState(updater: (prev: StoreState) => StoreState) {
  state = updater(state);
  saveDB(state);
  notify();
  // Multi-window / multi-tab live sync via BroadcastChannel
  realtimeSync.broadcast('STORE_SYNC', {
    hospitalId: state.currentHospitalId,
    patientId: state.selectedPatientId
  });
}

// Reactive cross-tab sync listener
if (typeof window !== 'undefined') {
  realtimeSync.subscribe((_msg) => {
    try {
      const db = getInitialDB();
      if (db) {
        state = {
          ...state,
          patients: db.patients || state.patients,
          queueTokens: db.queueTokens || state.queueTokens,
          clinicalReports: db.clinicalReports || state.clinicalReports,
          counters: db.counters || state.counters,
          departments: db.departments || state.departments,
          staffMembers: db.staffMembers || state.staffMembers,
          labMachines: db.labMachines || state.labMachines,
          auditLogs: db.auditLogs || state.auditLogs,
          hospitals: db.hospitals || state.hospitals
        };
        notify();
      }
    } catch {}
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getHospitalStoreSnapshot(): StoreState {
  return state;
}

export function resetHospitalStoreForTesting() {
  updateState(s => ({
    ...s,
    currentHospitalId: 'hosp-metro',
    patients: JSON.parse(JSON.stringify(ALL_INITIAL_PATIENTS)),
    queueTokens: JSON.parse(JSON.stringify(ALL_INITIAL_QUEUE_TOKENS)),
    clinicalReports: JSON.parse(JSON.stringify(ALL_INITIAL_CLINICAL_REPORTS)),
    counters: JSON.parse(JSON.stringify(ALL_INITIAL_COUNTERS)),
    doctors: JSON.parse(JSON.stringify(ALL_INITIAL_DOCTORS))
  }));
}

export function setHospitalAction(hospitalId: string) {
  setHospitalInternal(hospitalId);
}

function setHospitalInternal(hospitalId: string) {
  updateState(s => {
    const targetHosp = s.hospitals.find(h => h.id === hospitalId);
    if (!targetHosp) return s;

    const hospDocs = s.doctors.filter(d => (d.hospitalId || 'hosp-metro') === hospitalId);
    const hospCounters = s.counters.filter(c => (c.hospitalId || 'hosp-metro') === hospitalId);
    const hospPatients = s.patients.filter(p => (p.hospitalId || 'hosp-metro') === hospitalId);

    const nextDocId = hospDocs[0]?.id || s.selectedDoctorId;
    const nextCounterId = hospCounters[0]?.id || s.selectedCounterId;
    const nextPatientId = hospPatients[0]?.id || s.selectedPatientId;

    let updatedUser = s.currentUser;
    if (updatedUser) {
      if (updatedUser.role === 'doctor') {
        const doc = hospDocs.find(d => d.id === updatedUser!.id) || hospDocs[0];
        if (doc) {
          updatedUser = {
            id: doc.id,
            role: 'doctor',
            name: doc.name,
            identifier: doc.roomNo,
            subtitle: doc.specialization,
            hospitalId: targetHosp.id,
            hospitalName: targetHosp.name
          };
        }
      } else if (updatedUser.role === 'lab_tech') {
        const counter = hospCounters.find(c => c.id === updatedUser!.counterId) || hospCounters[0];
        if (counter) {
          updatedUser = {
            id: counter.id,
            role: 'lab_tech',
            name: counter.technicianName,
            identifier: counter.code,
            counterId: counter.id,
            hospitalId: targetHosp.id,
            hospitalName: targetHosp.name
          };
        }
      } else if (updatedUser.role === 'patient') {
        const pat = hospPatients.find(p => p.id === updatedUser!.id) || hospPatients[0];
        if (pat) {
          updatedUser = {
            id: pat.id,
            role: 'patient',
            name: pat.name,
            identifier: pat.uhid,
            subtitle: `${pat.age} Yrs / ${pat.gender}`,
            hospitalId: targetHosp.id,
            hospitalName: targetHosp.name
          };
        }
      }
      if (typeof window !== 'undefined' && updatedUser) {
        try {
          localStorage.setItem('qcare_clinical_session', JSON.stringify(updatedUser));
        } catch {}
      }
    }

    return {
      ...s,
      currentHospitalId: hospitalId,
      selectedDoctorId: nextDocId,
      selectedCounterId: nextCounterId,
      selectedPatientId: nextPatientId,
      currentUser: updatedUser
    };
  });
}

function getSnapshot(): StoreState {
  return state;
}

// Background simulation ticker for autoSimulateTraffic
let autoTrafficInterval: ReturnType<typeof setInterval> | null = null;

function setAutoTrafficTimer(enabled: boolean) {
  if (autoTrafficInterval) {
    clearInterval(autoTrafficInterval);
    autoTrafficInterval = null;
  }
  if (!enabled) return;

  autoTrafficInterval = setInterval(() => {
    // 60% chance advance an active counter, 40% chance add a walk-in token
    if (Math.random() > 0.4) {
      const activeCounters = state.counters.filter(
        c => c.status === 'active' && (c.hospitalId || 'hosp-metro') === state.currentHospitalId
      );
      if (activeCounters.length > 0) {
        // Pick random counter with waiting tokens or currently serving
        const candidate = activeCounters[Math.floor(Math.random() * activeCounters.length)];
        callOrAdvanceCounter(candidate.id, true);
      }
    } else {
      // Simulate random walk-in surge for active hospital
      const depts = state.departments;
      const targetDept = depts[Math.floor(Math.random() * depts.length)];
      if (targetDept) {
        simulateRushTraffic(targetDept.id, 2, state.currentHospitalId);
      }
    }
  }, 8000);
}

function simulateRushTraffic(deptId: string, count: number, hospitalId?: string) {
  updateState(s => {
    const targetHospId = hospitalId || s.currentHospitalId;
    const dept = s.departments.find(d => d.id === deptId);
    if (!dept) return s;

    const test = s.tests.find(t => t.departmentId === deptId);
    const testId = test?.id || 'test-cbc';
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRushTokens: QueueToken[] = [];
    const currentDeptTokens = s.queueTokens.filter(
      t => t.departmentId === deptId && (t.hospitalId || 'hosp-metro') === targetHospId
    );

    for (let i = 1; i <= count; i++) {
      const tokenNum = `${dept.code}-${200 + currentDeptTokens.length + i}`;
      newRushTokens.push({
        id: `rush-tok-${Date.now()}-${i}`,
        hospitalId: targetHospId,
        tokenNumber: tokenNum,
        patientId: `rush-pat-${Date.now()}-${i}`,
        testId,
        departmentId: deptId,
        priority: 'standard',
        status: 'waiting',
        issuedAt: nowStr,
        queuePosition: currentDeptTokens.length + i,
        estimatedWaitMinutes: (currentDeptTokens.length + i) * 6
      });
    }

    return {
      ...s,
      queueTokens: [...s.queueTokens, ...newRushTokens]
    };
  });
}

export function callOrAdvanceCounterAction(counterId: string, silent: boolean = false) {
  callOrAdvanceCounter(counterId, silent);
}

function callOrAdvanceCounter(counterId: string, silent: boolean = false) {
  updateState(s => {
    const counter = s.counters.find(c => c.id === counterId);
    if (!counter || counter.status !== 'active') return s;

    const counterHospId = counter.hospitalId || s.currentHospitalId || 'qcare-demo';
    const dept = s.departments.find(d => d.id === counter.departmentId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedTokens = [...s.queueTokens];
    let updatedPatients = [...s.patients];
    let updatedReports = [...s.clinicalReports];
    let timeSavedInc = 0;

    // 1. If counter is already serving a token, complete that token first!
    if (counter.currentServingTokenId) {
      const prevToken = updatedTokens.find(t => t.id === counter.currentServingTokenId);
      if (prevToken && (prevToken.status === 'called' || prevToken.status === 'in_progress')) {
        updatedTokens = updatedTokens.map(t =>
          t.id === prevToken.id ? { ...t, status: 'completed' as const, completedAt: nowStr } : t
        );

        const prevPatient = updatedPatients.find(p => p.id === prevToken.patientId);
        const prevTest = s.tests.find(t => t.id === prevToken.testId);

        // Generate completion report
        const newReport: ClinicalReport = {
          id: `rep-${Date.now()}-${prevToken.id}`,
          hospitalId: prevToken.hospitalId || prevPatient?.hospitalId || counterHospId,
          testId: prevToken.testId,
          testName: prevTest?.name || 'Diagnostic Test',
          patientId: prevToken.patientId,
          patientUhid: prevPatient?.uhid || 'QC-WALKIN',
          patientName: prevPatient?.name || 'Hospital Patient',
          technicianName: counter.technicianName,
          counterId: counter.id,
          timestamp: `${nowStr} Today`,
          status: 'uploaded',
          summary: 'Investigation executed adhering to standard clinical guidelines. Metrics recorded in reference range.',
          metrics: [
            { label: 'Clinical Result Marker', value: 'Normal', unit: 'Index', normalRange: 'Normal', flag: 'normal' }
          ]
        };
        updatedReports = [newReport, ...updatedReports];
        timeSavedInc = 15;

          // Update patient and OPD consultation token
          if (prevPatient) {
            const newCompleted = Array.from(new Set([...prevPatient.completedTests, prevToken.testId]));
            const allDone = prevPatient.prescribedTests.length > 0 && prevPatient.prescribedTests.every(tid => newCompleted.includes(tid));

            let nextSmartRoute = prevPatient.assignedSmartRoute;
            if (!allDone) {
              const tempPatient: Patient = {
                ...prevPatient,
                completedTests: newCompleted
              };
              const nextPlan = calculateOptimalQueueRoute(
                tempPatient,
                s.tests,
                s.departments,
                updatedTokens.filter(t => (t.hospitalId || 'hosp-metro') === counterHospId),
                s.counters.filter(c => (c.hospitalId || 'hosp-metro') === counterHospId)
              );
              nextSmartRoute = nextPlan.smartRouteSteps.map(step => step.testId);
            }

            // Update OPD token status if all tests done
            if (allDone) {
              updatedTokens = updatedTokens.map(t =>
                t.patientId === prevPatient.id && t.testId === 'opd-consultation'
                  ? { ...t, status: 'reports_ready' as const }
                  : t
              );
            }

            updatedPatients = updatedPatients.map(p =>
              p.id === prevPatient.id
                ? {
                    ...p,
                    completedTests: newCompleted,
                    assignedSmartRoute: nextSmartRoute,
                    currentTestId: undefined,
                    status: allDone ? ('all_completed' as const) : ('in_transit' as const),
                    doctorReviewStatus: allDone ? ('reports_ready' as const) : ('awaiting_lab_reports' as const)
                  }
                : p
            );
          }
      }
    }

    // 2. Find waiting tokens for this department and this hospital
    const waiting = updatedTokens.filter(t => {
      if (t.departmentId !== counter.departmentId) return false;
      if (t.status !== 'waiting') return false;
      const tokHosp = t.hospitalId || 'qcare-demo';
      return tokHosp === counterHospId || counterHospId === 'qcare-demo';
    });

    if (waiting.length === 0) {
      // Counter is now idle
      const updatedCounters = s.counters.map(c =>
        c.id === counterId
          ? { ...c, currentServingTokenId: undefined, currentPatientId: undefined }
          : c
      );
      return {
        ...s,
        counters: updatedCounters,
        queueTokens: updatedTokens,
        patients: updatedPatients,
        clinicalReports: updatedReports,
        cumulativeTimeSavedMinutes: s.cumulativeTimeSavedMinutes + timeSavedInc
      };
    }

    // Sort by priority then issue order
    const priorityWeights: Record<string, number> = { emergency: 3, senior: 2, standard: 1 };
    const sorted = [...waiting].sort((a, b) => {
      const weightDiff = (priorityWeights[b.priority] || 1) - (priorityWeights[a.priority] || 1);
      if (weightDiff !== 0) return weightDiff;
      return a.queuePosition - b.queuePosition;
    });

    const nextToken = sorted[0];

    // Play audio announcement only if not silenced
    if (s.soundEnabled && dept && !silent) {
      const pat = s.patients.find(p => p.id === nextToken.patientId);
      const patName = pat?.name || nextToken.patientName || 'Patient';
      hospitalAudio.announceToken(nextToken.tokenNumber, counter.name, dept.location.room, patName);
    }

    updatedTokens = updatedTokens.map(t => {
      if (t.id === nextToken.id) {
        return {
          ...t,
          counterId,
          status: 'called' as const,
          calledAt: nowStr,
          queuePosition: 0
        };
      }
      return t;
    });

    const updatedCounters = s.counters.map(c => {
      if (c.id === counterId) {
        return {
          ...c,
          currentServingTokenId: nextToken.id,
          currentPatientId: nextToken.patientId,
          servedCountToday: c.servedCountToday + 1
        };
      }
      return c;
    });

    updatedPatients = updatedPatients.map(p => {
      if (p.id === nextToken.patientId) {
        return {
          ...p,
          status: 'in_test' as const,
          currentTestId: nextToken.testId
        };
      }
      return p;
    });

    return {
      ...s,
      queueTokens: updatedTokens,
      counters: updatedCounters,
      patients: updatedPatients,
      clinicalReports: updatedReports,
      selectedPatientId: nextToken.patientId,
      cumulativeTimeSavedMinutes: s.cumulativeTimeSavedMinutes + timeSavedInc,
      latestAnnouncement: {
        tokenNumber: nextToken.tokenNumber,
        counterName: counter.name,
        room: dept?.location.room || 'Room',
        timestamp: nowStr
      }
    };
  });
}

function callSpecificTokenInternal(paramA: string, paramB: string) {
  updateState(s => {
    let counter = s.counters.find(c => c.id === paramA);
    let targetToken = s.queueTokens.find(t => t.id === paramB);

    if (!counter || !targetToken) {
      const counterAlt = s.counters.find(c => c.id === paramB);
      const tokenAlt = s.queueTokens.find(t => t.id === paramA);
      if (counterAlt && tokenAlt) {
        counter = counterAlt;
        targetToken = tokenAlt;
      }
    }

    if (!counter || counter.status !== 'active' || !targetToken) return s;
    const counterId = counter.id;

    const counterHospId = counter.hospitalId || s.currentHospitalId || 'qcare-demo';
    const dept = s.departments.find(d => d.id === counter.departmentId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedTokens = [...s.queueTokens];
    let updatedPatients = [...s.patients];
    let updatedReports = [...s.clinicalReports];
    let timeSavedInc = 0;

    // 1. If counter is already serving a token, complete that token first
    if (counter.currentServingTokenId) {
      const prevToken = updatedTokens.find(t => t.id === counter.currentServingTokenId);
      if (prevToken && (prevToken.status === 'called' || prevToken.status === 'in_progress')) {
        updatedTokens = updatedTokens.map(t =>
          t.id === prevToken.id ? { ...t, status: 'completed' as const, completedAt: nowStr } : t
        );

        const prevPatient = updatedPatients.find(p => p.id === prevToken.patientId);
        const prevTest = s.tests.find(t => t.id === prevToken.testId);

        const newReport: ClinicalReport = {
          id: `rep-${Date.now()}-${prevToken.id}`,
          hospitalId: prevToken.hospitalId || prevPatient?.hospitalId || counterHospId,
          testId: prevToken.testId,
          testName: prevTest?.name || 'Diagnostic Test',
          patientId: prevToken.patientId,
          patientUhid: prevPatient?.uhid || 'QC-WALKIN',
          patientName: prevPatient?.name || 'Hospital Patient',
          technicianName: counter.technicianName,
          counterId: counter.id,
          timestamp: `${nowStr} Today`,
          status: 'uploaded',
          summary: 'Investigation executed adhering to standard clinical guidelines. Metrics recorded in reference range.',
          metrics: [
            { label: 'Clinical Result Marker', value: 'Normal', unit: 'Index', normalRange: 'Normal', flag: 'normal' }
          ]
        };
        updatedReports = [newReport, ...updatedReports];
        timeSavedInc = 15;

        if (prevPatient) {
          const newCompleted = Array.from(new Set([...prevPatient.completedTests, prevToken.testId]));
          const allDone = prevPatient.prescribedTests.length > 0 && prevPatient.prescribedTests.every(tid => newCompleted.includes(tid));

          if (allDone) {
            updatedTokens = updatedTokens.map(t =>
              t.patientId === prevPatient.id && t.testId === 'opd-consultation'
                ? { ...t, status: 'reports_ready' as const }
                : t
            );
          }

          updatedPatients = updatedPatients.map(p =>
            p.id === prevPatient.id
              ? {
                  ...p,
                  completedTests: newCompleted,
                  currentTestId: undefined,
                  status: allDone ? ('all_completed' as const) : ('in_transit' as const),
                  doctorReviewStatus: allDone ? ('reports_ready' as const) : ('awaiting_lab_reports' as const)
                }
              : p
          );
        }
      }
    }

    // 2. Play audio announcement if sound enabled
    if (s.soundEnabled && dept) {
      const pat = s.patients.find(p => p.id === targetToken.patientId);
      const patName = pat?.name || targetToken.patientName || 'Patient';
      hospitalAudio.announceToken(targetToken.tokenNumber, counter.name, dept.location.room, patName);
    }

    // 3. Mark targetToken as called
    updatedTokens = updatedTokens.map(t => {
      if (t.id === targetToken.id) {
        return {
          ...t,
          counterId,
          status: 'called' as const,
          calledAt: nowStr,
          queuePosition: 0
        };
      }
      return t;
    });

    // 4. Update counter
    const updatedCounters = s.counters.map(c => {
      if (c.id === counterId) {
        return {
          ...c,
          currentServingTokenId: targetToken.id,
          currentPatientId: targetToken.patientId,
          servedCountToday: c.servedCountToday + 1
        };
      }
      return c;
    });

    // 5. Update patient
    updatedPatients = updatedPatients.map(p => {
      if (p.id === targetToken.patientId) {
        return {
          ...p,
          status: 'in_test' as const,
          currentTestId: targetToken.testId
        };
      }
      return p;
    });

    return {
      ...s,
      queueTokens: updatedTokens,
      counters: updatedCounters,
      patients: updatedPatients,
      clinicalReports: updatedReports,
      selectedPatientId: targetToken.patientId,
      cumulativeTimeSavedMinutes: s.cumulativeTimeSavedMinutes + timeSavedInc,
      latestAnnouncement: {
        tokenNumber: targetToken.tokenNumber,
        counterName: counter.name,
        room: dept?.location.room || 'Room',
        timestamp: nowStr
      }
    };
  });
}

export function registerPatientAction(data: {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  currentIllness: string;
  doctorId: string;
  priority?: PriorityLevel;
  autoLogin?: boolean;
  prescribedTests?: string[];
}): Patient & { opdTokenNumber: string; queuePosition: number; estimatedWaitMinutes: number } {
  // Input Sanitization & Security Boundary Validation (XSS protection, age 0-130, 10-digit phone)
  const nameVal = validatePatientName(data.name);
  const cleanName = nameVal.isValid ? nameVal.value : sanitizeString(data.name) || 'Registered Patient';
  const ageVal = validatePatientAge(data.age);
  const cleanAge = ageVal.isValid ? ageVal.value : Math.min(130, Math.max(0, Number(data.age) || 30));
  const phoneVal = validatePatientPhone(data.contact);
  const cleanContact = phoneVal.isValid ? phoneVal.value : (data.contact ? sanitizeString(data.contact) : '+91 98000 00000');
  const illnessVal = validateSymptoms(data.currentIllness || 'Routine Consultation');
  const cleanIllness = illnessVal.isValid ? illnessVal.value : sanitizeString(data.currentIllness) || 'Routine Consultation';

  const hospDocs = state.doctors.filter(d => (d.hospitalId || 'hosp-metro') === state.currentHospitalId);
  const doctor = (data.doctorId ? state.doctors.find(d => d.id === data.doctorId) : null) || hospDocs[0] || state.doctors[0];
  const hospId = (doctor && doctor.id === data.doctorId && doctor.hospitalId) ? doctor.hospitalId : (hospDocs[0]?.hospitalId || state.currentHospitalId);
  const hosp = state.hospitals.find(h => h.id === hospId) || state.hospitals[0];

  const generatedUhid = `QC-${2026}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newId = `pat-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const calculatedPriority: PriorityLevel = data.priority || (cleanAge >= 60 ? 'senior' : 'standard');
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Generate unique sequential OPD token scoped to hospital
  const prefix = hosp.tier === 'single_doctor_clinic' ? 'CLN' : (hosp.tier === 'diagnostic_center' ? 'DIA' : 'OPD');
  const existingOpdNums = state.queueTokens
    .filter(t => (t.hospitalId || 'hosp-metro') === hosp.id)
    .map(t => {
      const regex = new RegExp(`^${prefix}-(\\d+)$`);
      const m = t.tokenNumber.match(regex);
      return m ? parseInt(m[1], 10) : 0;
    });
  const maxOpd = Math.max(100, ...existingOpdNums);
  const generatedOpdToken = `${prefix}-${maxOpd + 1}`;
  const opdTokenId = `tok-opd-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Smart triage & queue placement in doctor's OPD queue
  const priorityWeights: Record<PriorityLevel, number> = { emergency: 3, senior: 2, standard: 1 };
  const myWeight = priorityWeights[calculatedPriority];
  const docActiveOpdTokens = state.queueTokens.filter(
    t => t.doctorId === doctor.id && (t.hospitalId || 'hosp-metro') === hosp.id && t.testId === 'opd-consultation' && t.status !== 'completed'
  );
  const higherOrEqualCount = docActiveOpdTokens.filter(
    t => (priorityWeights[t.priority] || 1) >= myWeight
  ).length;

  // Emergency jumps to immediate triage (position 1); Seniors prioritized; Standard FIFO
  const queuePosition = calculatedPriority === 'emergency' ? 1 : higherOrEqualCount + 1;
  const estimatedWaitMinutes = calculatedPriority === 'emergency' ? 2 : queuePosition * 8;

  // Re-index other active OPD tokens for this doctor that are displaced so queue positions remain sequential without collisions:
  const updatedExistingTokens = state.queueTokens.map(t => {
    if (t.doctorId === doctor.id && (t.hospitalId || 'hosp-metro') === hosp.id && t.testId === 'opd-consultation' && t.status !== 'completed') {
      if (t.queuePosition >= queuePosition) {
        const nextPos = t.queuePosition + 1;
        return {
          ...t,
          queuePosition: nextPos,
          estimatedWaitMinutes: t.priority === 'emergency' ? 2 : nextPos * 8
        };
      }
    }
    return t;
  });

  const opdToken: QueueToken = {
    id: opdTokenId,
    hospitalId: hosp.id,
    tokenNumber: generatedOpdToken,
    patientId: newId,
    patientName: cleanName,
    patientUhid: generatedUhid,
    patientAge: cleanAge,
    patientGender: data.gender,
    testId: 'opd-consultation',
    testName: 'OPD Doctor Consultation',
    departmentId: 'dept-opd',
    doctorId: doctor.id,
    doctorName: doctor.name,
    priority: calculatedPriority,
    status: 'waiting',
    issuedAt: nowStr,
    queuePosition,
    estimatedWaitMinutes
  };

  const labTokens: QueueToken[] = [];
  const testIds = data.prescribedTests || [];
  const activeTokenIds: Record<string, string> = {
    'opd-consultation': opdTokenId
  };

  testIds.forEach(testId => {
    const test = state.tests.find(t => t.id === testId);
    if (test) {
      const tokenId = `tok-${Date.now()}-${testId}`;
      activeTokenIds[testId] = tokenId;
      const deptWaiting = state.queueTokens.filter(t => t.departmentId === test.departmentId && t.status === 'waiting');
      labTokens.push({
        id: tokenId,
        hospitalId: hosp.id,
        tokenNumber: `${test.code.split('-')[0] || 'TST'}-${Math.floor(100 + Math.random() * 899)}`,
        patientId: newId,
        patientName: cleanName,
        patientUhid: generatedUhid,
        patientAge: cleanAge,
        patientGender: data.gender,
        testId: test.id,
        testName: test.name,
        departmentId: test.departmentId,
        priority: calculatedPriority,
        status: 'waiting',
        issuedAt: nowStr,
        queuePosition: deptWaiting.length + 1,
        estimatedWaitMinutes: (deptWaiting.length + 1) * (test.averageDurationMinutes || 8)
      });
    }
  });

  const newPatient: Patient = {
    id: newId,
    hospitalId: hosp.id,
    hospitalName: hosp.name,
    uhid: generatedUhid,
    name: cleanName,
    age: cleanAge,
    gender: data.gender,
    contact: cleanContact,
    priority: calculatedPriority,
    prescribedDoctorId: doctor.id,
    prescribedDoctorName: doctor.name,
    prescribedDoctorRoom: doctor.roomNo,
    currentIllness: cleanIllness,
    symptoms: cleanIllness,
    prescribedTests: testIds,
    completedTests: [],
    currentTestId: undefined,
    activeTokenIds,
    status: 'checked_in',
    assignedSmartRoute: testIds,
    assignedNaiveRoute: testIds,
    registrationTime: nowStr,
    opdTokenNumber: generatedOpdToken,
    doctorReviewStatus: testIds.length > 0 ? 'awaiting_lab_reports' : 'awaiting_prescription'
  };

  const user: CurrentUser = {
    id: newPatient.id,
    role: 'patient',
    name: newPatient.name,
    identifier: newPatient.uhid,
    subtitle: `${newPatient.age} Yrs / ${newPatient.gender} • Consulting: ${doctor.name}`,
    hospitalId: hosp.id,
    hospitalName: hosp.name
  };

  // If caller is already clinical staff, or autoLogin is false, do not override current session
  const isClinicalStaff = state.currentUser?.role === 'doctor' || state.currentUser?.role === 'lab_tech';
  const shouldSetSession = data.autoLogin !== false && !isClinicalStaff;

  if (typeof window !== 'undefined' && shouldSetSession) {
    try {
      localStorage.setItem('qcare_clinical_session', JSON.stringify(user));
    } catch {}
  }

  updateState(s => ({
    ...s,
    patients: [newPatient, ...s.patients],
    queueTokens: [...updatedExistingTokens, opdToken, ...labTokens],
    currentUser: shouldSetSession ? user : s.currentUser,
    activeRole: shouldSetSession ? 'patient' : s.activeRole,
    selectedPatientId: newPatient.id
  }));

  return Object.assign(newPatient, {
    patientId: newId,
    opdTokenNumber: generatedOpdToken,
    queuePosition,
    estimatedWaitMinutes
  });
}

export function completeTestAndUploadReportAction(
  tokenId: string,
  reportData: {
    summary: string;
    metrics: { label: string; value: string; unit: string; normalRange: string; flag: 'normal' | 'high' | 'low' | 'critical' }[];
  }
) {
  updateState(s => {
    const token = s.queueTokens.find(t => t.id === tokenId);
    if (!token) return s;

    const patient = s.patients.find(p => p.id === token.patientId);
    const test = s.tests.find(t => t.id === token.testId);
    const counter = s.counters.find(c => c.id === token.counterId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update token to completed
    const updatedTokens = s.queueTokens.map(t =>
      t.id === tokenId ? { ...t, status: 'completed' as const, completedAt: nowStr } : t
    );

    // 2. Clear counter
    const updatedCounters = s.counters.map(c =>
      (c.id === token.counterId || c.currentServingTokenId === token.id)
        ? { ...c, currentServingTokenId: undefined, currentPatientId: undefined }
        : c
    );

    // 3. Create new clinical report
    const newReport: ClinicalReport = {
      id: `rep-${Date.now()}`,
      hospitalId: token.hospitalId || patient?.hospitalId || s.currentHospitalId,
      testId: token.testId,
      testName: test?.name || 'Diagnostic Test',
      patientId: token.patientId,
      patientUhid: patient?.uhid || 'QC-UNKNOWN',
      patientName: patient?.name || 'Patient',
      technicianName: counter?.technicianName || 'Staff Technician',
      counterId: token.counterId || 'Counter',
      timestamp: `${nowStr} Today`,
      status: 'uploaded',
      summary: reportData.summary,
      metrics: reportData.metrics
    };

    // 4. Update patient & OPD consultation token
    let finalTokens = updatedTokens;
    if (patient) {
      const newCompleted = Array.from(new Set([...patient.completedTests, token.testId]));
      const allDone = patient.prescribedTests.length > 0 && patient.prescribedTests.every(tid => newCompleted.includes(tid));

      if (allDone) {
        finalTokens = finalTokens.map(t =>
          t.patientId === patient.id && t.testId === 'opd-consultation'
            ? { ...t, status: 'reports_ready' as const }
            : t
        );
        if (s.soundEnabled) {
          hospitalAudio.playChime();
        }
      }
    }

    const updatedPatients = s.patients.map(p => {
      if (p.id === token.patientId) {
        const newCompleted = Array.from(new Set([...p.completedTests, token.testId]));
        const allDone = p.prescribedTests.length > 0 && p.prescribedTests.every(tid => newCompleted.includes(tid));

        let nextSmartRoute = p.assignedSmartRoute;
        if (!allDone) {
          const tempPatient: Patient = {
            ...p,
            completedTests: newCompleted
          };
          const nextPlan = calculateOptimalQueueRoute(
            tempPatient,
            s.tests,
            s.departments,
            finalTokens,
            updatedCounters
          );
          nextSmartRoute = nextPlan.smartRouteSteps.map(step => step.testId);
        }

        return {
          ...p,
          completedTests: newCompleted,
          assignedSmartRoute: nextSmartRoute,
          currentTestId: undefined,
          status: allDone ? ('all_completed' as const) : ('in_transit' as const),
          doctorReviewStatus: allDone ? ('reports_ready' as const) : ('awaiting_lab_reports' as const)
        };
      }
      return p;
    });

    return {
      ...s,
      queueTokens: finalTokens,
      counters: updatedCounters,
      clinicalReports: [newReport, ...s.clinicalReports],
      patients: updatedPatients,
      cumulativeTimeSavedMinutes: s.cumulativeTimeSavedMinutes + 18
    };
  });
}

export function prescribeTestsAction(patientId: string, testIds: string[], doctorId?: string) {
  updateState(s => {
    const patient = s.patients.find(p => p.id === patientId);
    if (!patient) return s;
    const doctor = (doctorId ? s.doctors.find(d => d.id === doctorId) : null) || s.doctors.find(d => d.id === s.selectedDoctorId) || s.doctors.find(d => d.id === patient.prescribedDoctorId) || s.doctors[0];

    const patHospId = patient.hospitalId || doctor.hospitalId || s.currentHospitalId;
    const newTokens: QueueToken[] = [];
    const updatedActiveTokenIds = { ...patient.activeTokenIds };
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    testIds.forEach(testId => {
      if (!patient.prescribedTests.includes(testId)) {
        const test = s.tests.find(t => t.id === testId);
        if (!test) return;

        const deptTokens = s.queueTokens.filter(
          t => t.departmentId === test.departmentId && (t.hospitalId || 'hosp-metro') === patHospId
        );
        const queuePos = deptTokens.filter(t => t.status === 'waiting').length + 1;
        const tokenNum = `${test.code.split('-')[0]}-${100 + deptTokens.length + 1}`;
        const tokenId = `tok-${Date.now()}-${test.id}`;

        const token: QueueToken = {
          id: tokenId,
          hospitalId: patHospId,
          tokenNumber: tokenNum,
          patientId,
          testId,
          departmentId: test.departmentId,
          priority: patient.priority,
          status: 'waiting',
          issuedAt: nowStr,
          queuePosition: queuePos,
          estimatedWaitMinutes: queuePos * 6
        };

        newTokens.push(token);
        updatedActiveTokenIds[testId] = tokenId;
      }
    });

    const updatedPrescribed = Array.from(new Set([...patient.prescribedTests, ...testIds]));

    // Determine or assign OPD Consultation Token at the end of the doctor's queue
    const assignedDoctor = doctor || s.doctors.find(d => d.id === patient.prescribedDoctorId) || s.doctors[0];
    let opdTokenNumber = patient.opdTokenNumber;
    if (!opdTokenNumber) {
      const existingOpdNums = s.queueTokens
        .filter(t => (t.hospitalId || 'hosp-metro') === patHospId)
        .map(t => {
          const m = t.tokenNumber.match(/^[A-Z]+-(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        });
      const maxOpd = Math.max(100, ...existingOpdNums);
      const prefix = patHospId === 'hosp-clinic' ? 'CLN' : (patHospId === 'hosp-east' ? 'DIA' : 'OPD');
      opdTokenNumber = `${prefix}-${maxOpd + 1}`;
    }

    // Check existing OPD consultation token
    const existingOpdToken = s.queueTokens.find(
      t => t.patientId === patientId && (t.testId === 'opd-consultation' || t.id === patient.activeTokenIds['opd-consultation'])
    );

    const opdTokenId = existingOpdToken?.id || patient.activeTokenIds['opd-consultation'] || `tok-opd-${Date.now()}-${patientId}`;
    updatedActiveTokenIds['opd-consultation'] = opdTokenId;

    const docActiveOpdCount = s.queueTokens.filter(
      t => t.doctorId === assignedDoctor.id && 
           (t.hospitalId || 'hosp-metro') === patHospId &&
           t.testId === 'opd-consultation' && 
           t.status !== 'completed' && 
           t.patientId !== patientId
    ).length;

    const opdToken: QueueToken = {
      id: opdTokenId,
      hospitalId: patHospId,
      tokenNumber: opdTokenNumber,
      patientId,
      testId: 'opd-consultation',
      departmentId: 'dept-opd',
      doctorId: assignedDoctor.id,
      doctorName: assignedDoctor.name,
      priority: patient.priority,
      status: 'awaiting_lab_reports',
      issuedAt: existingOpdToken?.issuedAt || nowStr,
      queuePosition: docActiveOpdCount + 1,
      estimatedWaitMinutes: (docActiveOpdCount + 1) * 8
    };

    // Calculate initial optimal queue route based on current live department wait lengths!
    const tempPatient: Patient = {
      ...patient,
      hospitalId: patHospId,
      prescribedTests: updatedPrescribed
    };
    const initialPlan = calculateOptimalQueueRoute(
      tempPatient,
      s.tests,
      s.departments,
      [...s.queueTokens, ...newTokens].filter(t => (t.hospitalId || 'hosp-metro') === patHospId),
      s.counters.filter(c => (c.hospitalId || 'hosp-metro') === patHospId)
    );
    const lockedRoute = initialPlan.smartRouteSteps.map(step => step.testId);

    const updatedPatients = s.patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          prescribedDoctorId: assignedDoctor.id,
          prescribedDoctorName: assignedDoctor.name,
          prescribedDoctorRoom: assignedDoctor.roomNo,
          prescribedTests: updatedPrescribed,
          activeTokenIds: updatedActiveTokenIds,
          assignedSmartRoute: lockedRoute,
          status: 'checked_in' as const,
          opdTokenNumber,
          doctorReviewStatus: 'awaiting_lab_reports' as const
        };
      }
      return p;
    });

    // Move OPD token to the end of doctor's active queue with awaiting_lab_reports
    // Remove old OPD token from its earlier slot, re-index other active doctor tokens, and append opdToken
    let rank = 1;
    const reindexedTokens = s.queueTokens
      .filter(t => t.id !== opdTokenId)
      .map(t => {
        if (t.doctorId === assignedDoctor.id && (t.hospitalId || 'hosp-metro') === patHospId && t.testId === 'opd-consultation' && t.status !== 'completed') {
          const updated = {
            ...t,
            queuePosition: rank,
            estimatedWaitMinutes: t.priority === 'emergency' ? 2 : rank * 8
          };
          rank++;
          return updated;
        }
        return t;
      });

    const finalOpdToken: QueueToken = {
      ...opdToken,
      queuePosition: rank,
      estimatedWaitMinutes: rank * 8
    };

    const finalQueueTokens = [...reindexedTokens, ...newTokens, finalOpdToken];

    return {
      ...s,
      patients: updatedPatients,
      queueTokens: finalQueueTokens
    };
  });
}

export function completeConsultationAction(patientId: string, _consultationNotes?: string) {
  updateState(s => {
    const patient = s.patients.find(p => p.id === patientId);
    if (!patient) return s;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedTokens = s.queueTokens.map(t => {
      if (t.patientId === patientId && (t.testId === 'opd-consultation' || t.id === patient.activeTokenIds['opd-consultation'])) {
        return {
          ...t,
          status: 'completed' as const,
          completedAt: nowStr,
          queuePosition: 0
        };
      }
      return t;
    });

    const docId = patient.prescribedDoctorId;
    let docRank = 1;
    const finalTokens = updatedTokens.map(t => {
      if (t.doctorId === docId && t.testId === 'opd-consultation' && t.status !== 'completed') {
        const updated = {
          ...t,
          queuePosition: docRank,
          estimatedWaitMinutes: t.priority === 'emergency' ? 2 : docRank * 8
        };
        docRank++;
        return updated;
      }
      return t;
    });

    const updatedPatients = s.patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'discharged' as const,
          doctorReviewStatus: 'completed' as const
        };
      }
      return p;
    });

    if (s.soundEnabled) {
      hospitalAudio.playChime();
    }

    return {
      ...s,
      patients: updatedPatients,
      queueTokens: finalTokens
    };
  });
}

export function markTestCompletedByPatientAction(patientId: string, testId: string, _sourceNotes: string = 'Patient already has this report'): void {
  updateState(s => {
    const patient = s.patients.find(p => p.id === patientId);
    if (!patient) return s;

    const test = s.tests.find(t => t.id === testId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Mark any waiting or in_progress tokens for this test as completed
    const updatedTokens = s.queueTokens.map(t => {
      if (t.patientId === patientId && t.testId === testId) {
        return { 
          ...t, 
          status: 'completed' as const,
          completedAt: nowStr,
          queuePosition: 0
        };
      }
      return t;
    });

    // 2. Add test to patient completedTests
    const newCompleted = Array.from(new Set([...patient.completedTests, testId]));
    const allDone = patient.prescribedTests.length > 0 && patient.prescribedTests.every(tid => newCompleted.includes(tid));

    // 3. If all tests done, advance OPD consultation token to reports_ready
    let finalTokens = updatedTokens;
    if (allDone) {
      finalTokens = finalTokens.map(t =>
        t.patientId === patient.id && t.testId === 'opd-consultation'
          ? { ...t, status: 'reports_ready' as const }
          : t
      );
      if (s.soundEnabled) {
        hospitalAudio.playChime();
      }
    }

    // 4. Create self-reported clinical report entry
    const selfReport: ClinicalReport = {
      id: `rep-prior-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      hospitalId: patient.hospitalId || s.currentHospitalId,
      testId: testId,
      testName: test?.name || 'Diagnostic Investigation',
      patientId: patient.id,
      patientUhid: patient.uhid || 'QC-UNKNOWN',
      patientName: patient.name,
      technicianName: 'Prior Verified Report (Patient Upload/Present)',
      counterId: 'OPD-Prior',
      timestamp: `${nowStr} Today`,
      status: 'uploaded',
      summary: `Patient presented existing recent valid ${test?.name || 'investigation'} report. Verified for OPD review.`,
      metrics: [
        { label: 'Report Status', value: 'Prior External Report Verified', unit: '', normalRange: 'Standard', flag: 'normal' },
        { label: 'Submission Mode', value: 'Patient Self-Submitted', unit: '', normalRange: 'Patient', flag: 'normal' }
      ]
    };

    // 5. Update patient object and recalculate remaining smart route
    const updatedPatients = s.patients.map(p => {
      if (p.id === patientId) {
        let nextSmartRoute = p.assignedSmartRoute;
        if (!allDone) {
          const tempPatient: Patient = {
            ...p,
            completedTests: newCompleted
          };
          const nextPlan = calculateOptimalQueueRoute(
            tempPatient,
            s.tests,
            s.departments,
            finalTokens,
            s.counters
          );
          nextSmartRoute = nextPlan.smartRouteSteps.map(step => step.testId);
        }

        return {
          ...p,
          completedTests: newCompleted,
          assignedSmartRoute: nextSmartRoute,
          currentTestId: undefined,
          status: allDone ? ('all_completed' as const) : ('in_transit' as const),
          doctorReviewStatus: allDone ? ('reports_ready' as const) : ('awaiting_lab_reports' as const)
        };
      }
      return p;
    });

    return {
      ...s,
      patients: updatedPatients,
      queueTokens: finalTokens,
      clinicalReports: [selfReport, ...s.clinicalReports],
      toastNotification: `✓ ${test?.name || 'Test'} marked completed (Prior report registered). Dynamic route updated!`
    };
  });
}

export function loginAsStaffAction(hospitalCode: string, staffIdOrEmail: string, password: string): { success: boolean; error?: string } {
  const code = hospitalCode.trim().toLowerCase();
  const hosp = state.hospitals.find(h => 
    (h.code && h.code.toLowerCase() === code) || 
    h.id.toLowerCase() === code ||
    h.name.toLowerCase().includes(code)
  );

  if (!hosp) {
    return { success: false, error: `Hospital Code "${hospitalCode}" not recognized in the centralized network.` };
  }

  const query = staffIdOrEmail.trim().toLowerCase();
  const staff = state.staffMembers.find(s => 
    (s.hospitalId || 'qcare-demo') === hosp.id && 
    (s.staffId.toLowerCase() === query || s.email.toLowerCase() === query)
  );

  if (!staff) {
    return { success: false, error: `Staff ID or Email "${staffIdOrEmail}" was not found in ${hosp.name}.` };
  }

  if (staff.status === 'inactive') {
    return { success: false, error: `This staff account is currently inactive. Contact Hospital Admin.` };
  }

  // Password verification: accepts configured password or standard demo defaults
  const validPassword = staff.password || (staff.role === 'super_admin' || staff.role === 'hospital_admin' ? 'admin123' : 'staff123');
  if (password !== validPassword && password !== 'admin123' && password !== 'staff123') {
    return { success: false, error: `Invalid password for ${staff.name}.` };
  }

  const currentUser: CurrentUser = {
    id: staff.id,
    role: staff.role,
    name: staff.name,
    identifier: staff.staffId,
    subtitle: staff.assignedLabName || `${staff.role.replace('_', ' ').toUpperCase()}`,
    hospitalId: hosp.id,
    hospitalName: hosp.name,
    staffId: staff.staffId,
    assignedLabId: staff.assignedLabId,
    departmentId: staff.assignedLabId
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('qcare_clinical_session', JSON.stringify(currentUser));
    } catch {}
  }

  updateState(s => {
    const nextCounter = s.counters.find(c => c.departmentId === staff.assignedLabId && (c.hospitalId || 'hosp-metro') === hosp.id);
    return {
      ...s,
      currentUser,
      currentHospitalId: hosp.id,
      activeRole: staff.role as ActiveRole,
      selectedCounterId: nextCounter?.id || s.selectedCounterId,
      selectedLabDeptId: staff.assignedLabId || s.selectedLabDeptId,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          hospitalId: hosp.id,
          staffId: staff.staffId,
          staffName: staff.name,
          staffRole: staff.role,
          action: 'STAFF_LOGIN',
          details: `Authenticated into ${staff.role.replace('_', ' ')} workstation`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...s.auditLogs
      ]
    };
  });

  return { success: true };
}

export function loginAsPatientWithTokenAction(tokenOrId: string): { success: boolean; error?: string; patient?: Patient } {
  const raw = tokenOrId.trim();
  const tokenExtracted = raw.includes('/patient/session/')
    ? raw.split('/patient/session/')[1].split('?')[0].trim()
    : raw;
  const query = tokenExtracted.toLowerCase();
  const cleanDigits = raw.replace(/\D/g, '');

  const patient = state.patients.find(p => 
    (p.secureQrToken && p.secureQrToken.toLowerCase() === query) ||
    p.uhid.toLowerCase() === query ||
    (cleanDigits.length >= 8 && p.contact.replace(/\D/g, '').includes(cleanDigits)) ||
    p.id.toLowerCase() === query ||
    state.queueTokens.some(t => t.patientId === p.id && t.tokenNumber.toLowerCase() === query)
  );

  if (!patient) {
    return { success: false, error: 'No active patient session found with this QR Token, UHID, or Mobile.' };
  }

  const user: CurrentUser = {
    id: patient.id,
    role: 'patient',
    name: patient.name,
    identifier: patient.uhid,
    subtitle: `${patient.age} Yrs / ${patient.gender} • Consulting: ${patient.prescribedDoctorName}`,
    hospitalId: patient.hospitalId || 'qcare-demo',
    hospitalName: patient.hospitalName || 'QCare Demo Hospital'
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('qcare_clinical_session', JSON.stringify(user));
    } catch {}
  }

  updateState(s => ({
    ...s,
    currentUser: user,
    activeRole: 'patient',
    currentHospitalId: patient.hospitalId || 'qcare-demo',
    selectedPatientId: patient.id
  }));

  return { success: true, patient };
}

export function loadDemoScenarioRahulAction() {
  updateState(s => {
    const freshRahul = JSON.parse(JSON.stringify(DEMO_PATIENT_RAHUL));
    const cleanCounters = [
      ...QCARE_DEMO_COUNTERS,
      ...s.counters.filter(c => c.hospitalId !== 'qcare-demo')
    ];
    const cleanTokens = [
      ...QCARE_DEMO_QUEUE_TOKENS,
      ...s.queueTokens.filter(t => t.hospitalId !== 'qcare-demo')
    ];
    const cleanPatients = [
      freshRahul,
      ...s.patients.filter(p => p.id !== freshRahul.id)
    ];

    return {
      ...s,
      currentHospitalId: 'qcare-demo',
      selectedPatientId: 'pat-rahul-sharma',
      counters: cleanCounters,
      queueTokens: cleanTokens,
      patients: cleanPatients,
      selectedCounterId: 'counter-qdemo-usg-1',
      selectedLabDeptId: 'dept-ultrasound',
      toastNotification: 'Rahul Sharma demo scenario loaded! Ultrasound is intelligently recommended first.'
    };
  });
  return DEMO_PATIENT_RAHUL;
}

export function checkInPatientAtLabAction(patientIdOrToken: string, departmentId: string) {
  updateState(s => {
    const raw = patientIdOrToken.trim();
    const tokenExtracted = raw.includes('/patient/session/')
      ? raw.split('/patient/session/')[1].split('?')[0].trim()
      : raw;
    const query = tokenExtracted.toLowerCase();
    const cleanDigits = raw.replace(/\D/g, '');

    const pat = s.patients.find(p => 
      p.id.toLowerCase() === query || 
      p.uhid.toLowerCase() === query || 
      (p.secureQrToken && p.secureQrToken.toLowerCase() === query) ||
      (cleanDigits.length >= 8 && p.contact.replace(/\D/g, '').includes(cleanDigits)) ||
      s.queueTokens.some(t => t.patientId === p.id && t.tokenNumber.toLowerCase() === query)
    );
    if (!pat) return s;

    const dept = s.departments.find(d => d.id === departmentId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedTokens = s.queueTokens.map(t => {
      if (t.patientId === pat.id && t.departmentId === departmentId) {
        return {
          ...t,
          status: 'waiting' as const,
          calledAt: undefined
        };
      }
      return t;
    });

    const updatedPatients = s.patients.map(p => {
      if (p.id === pat.id) {
        return {
          ...p,
          status: 'in_transit' as const
        };
      }
      return p;
    });

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      hospitalId: pat.hospitalId || s.currentHospitalId,
      staffId: s.currentUser?.identifier || 'STAFF-LAB',
      staffName: s.currentUser?.name || 'Lab Staff',
      staffRole: 'lab_staff',
      action: 'PATIENT_CHECKED_IN',
      patientId: pat.id,
      patientName: pat.name,
      details: `Checked in at ${dept?.name || 'Lab'} queue`,
      timestamp: nowStr
    };

    return {
      ...s,
      queueTokens: updatedTokens,
      patients: updatedPatients,
      auditLogs: [newLog, ...s.auditLogs],
      toastNotification: `${pat.name} checked in at ${dept?.name || 'Lab'}!`
    };
  });
}

export function updateLabAvailabilityAction(departmentId: string, status: 'available' | 'busy' | 'unavailable') {
  updateState(s => {
    const dept = s.departments.find(d => d.id === departmentId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedDepts = s.departments.map(d =>
      d.id === departmentId ? { ...d, availabilityStatus: status } : d
    );

    const updatedCounters = s.counters.map(c => {
      if (c.departmentId === departmentId) {
        return {
          ...c,
          status: (status === 'unavailable' ? 'closed' : 'active') as CounterStatus
        };
      }
      return c;
    });

    // Dynamic re-routing: recalculate active patients' routes diverted away from unavailable lab
    const updatedPatients = s.patients.map(p => {
      const patHospId = p.hospitalId || 'hosp-metro';
      if (patHospId !== s.currentHospitalId) return p;
      if (p.status === 'discharged' || p.status === 'all_completed') return p;
      if (!p.prescribedTests || p.prescribedTests.length === 0) return p;

      const newPlan = calculateOptimalQueueRoute(
        p,
        s.tests,
        updatedDepts,
        s.queueTokens,
        updatedCounters
      );
      const nextPendingStep = newPlan.smartRouteSteps.find(st => st.status === 'up_next' || st.status === 'queued');
      return {
        ...p,
        assignedSmartRoute: newPlan.smartRouteSteps.map(st => st.testId),
        currentTestId: nextPendingStep?.testId || p.currentTestId
      };
    });

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      hospitalId: s.currentHospitalId,
      staffId: s.currentUser?.identifier || 'ADMIN',
      staffName: s.currentUser?.name || 'Hospital Admin',
      staffRole: 'hospital_admin',
      action: 'LAB_AVAILABILITY_CHANGED',
      details: `${dept?.name || 'Lab'} availability updated to: ${status.toUpperCase()}`,
      timestamp: nowStr
    };

    realtimeSync.broadcast('LAB_AVAILABILITY_CHANGED', {
      hospitalId: s.currentHospitalId,
      departmentId,
      message: `${dept?.name || 'Lab'} availability updated to ${status}`
    });

    return {
      ...s,
      departments: updatedDepts,
      counters: updatedCounters,
      patients: updatedPatients,
      auditLogs: [newLog, ...s.auditLogs],
      toastNotification: `${dept?.name || 'Lab'} status updated to ${status}!`
    };
  });
}

export function updateMachineCountsAction(departmentId: string, totalCount: number, activeCount: number) {
  updateState(s => {
    const dept = s.departments.find(d => d.id === departmentId);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedMachines = s.labMachines.map(m => {
      if (m.departmentId === departmentId && (m.hospitalId || 'qcare-demo') === s.currentHospitalId) {
        return {
          ...m,
          totalCount,
          activeCount,
          status: (activeCount === 0 ? 'breakdown' : activeCount < totalCount ? 'degraded' : 'operational') as 'breakdown' | 'degraded' | 'operational'
        };
      }
      return m;
    });

    const updatedDepts = s.departments.map(d => {
      if (d.id === departmentId) {
        return {
          ...d,
          totalMachines: totalCount,
          activeMachines: activeCount,
          availabilityStatus: (activeCount === 0 ? 'unavailable' : d.availabilityStatus) as any
        };
      }
      return d;
    });

    const updatedCounters = s.counters.map(c => {
      if (c.departmentId === departmentId) {
        return {
          ...c,
          status: (activeCount === 0 ? 'closed' : 'active') as CounterStatus
        };
      }
      return c;
    });

    // Dynamic re-routing: recalculate active patients' routes diverted away from broken machine lab
    const updatedPatients = s.patients.map(p => {
      const patHospId = p.hospitalId || 'hosp-metro';
      if (patHospId !== s.currentHospitalId) return p;
      if (p.status === 'discharged' || p.status === 'all_completed') return p;
      if (!p.prescribedTests || p.prescribedTests.length === 0) return p;

      const newPlan = calculateOptimalQueueRoute(
        p,
        s.tests,
        updatedDepts,
        s.queueTokens,
        updatedCounters
      );
      const nextPendingStep = newPlan.smartRouteSteps.find(st => st.status === 'up_next' || st.status === 'queued');
      return {
        ...p,
        assignedSmartRoute: newPlan.smartRouteSteps.map(st => st.testId),
        currentTestId: nextPendingStep?.testId || p.currentTestId
      };
    });

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      hospitalId: s.currentHospitalId,
      staffId: s.currentUser?.identifier || 'ADMIN',
      staffName: s.currentUser?.name || 'Hospital Admin',
      staffRole: 'hospital_admin',
      action: 'MACHINE_AVAILABILITY_CHANGED',
      details: `${dept?.name || 'Lab'} machines updated: ${activeCount} active / ${totalCount} total.`,
      timestamp: nowStr
    };

    realtimeSync.broadcast('MACHINE_COUNT_CHANGED', {
      hospitalId: s.currentHospitalId,
      departmentId,
      message: `${dept?.name || 'Lab'} machines updated: ${activeCount}/${totalCount} active`
    });

    return {
      ...s,
      labMachines: updatedMachines,
      departments: updatedDepts,
      counters: updatedCounters,
      patients: updatedPatients,
      auditLogs: [newLog, ...s.auditLogs],
      toastNotification: `${dept?.name} machines updated: ${activeCount}/${totalCount} active`
    };
  });
}

export function createHospitalAction(data: Partial<Hospital>): Hospital {
  const codeNum = state.hospitals.length + 1;
  const newHospital: Hospital = {
    id: `hosp-${Date.now()}`,
    name: data.name || 'New Hospital Partner',
    code: data.code || `QCARE-HOSP-00${codeNum}`,
    shortName: data.shortName || data.name?.split(' ')[0] || 'Hospital',
    tier: data.tier || 'multi_specialty',
    tagline: data.tagline || 'Leading multi-specialty clinical facility',
    address: data.address || 'Medical Enclave, Central City',
    city: data.city || 'Central City',
    state: data.state || 'National Capital',
    contactNumber: data.contactNumber || '+91 11 2000 3000',
    email: data.email || 'info@hospital.com',
    numberOfFloors: data.numberOfFloors || 3,
    status: data.status || 'active',
    plan: data.plan || 'enterprise',
    workingHours: data.workingHours || '08:00 AM - 08:00 PM',
    doctorCount: 2,
    counterCount: 4,
    badge: data.badge || 'Partner Hospital',
    accentColor: 'blue'
  };

  updateState(s => ({
    ...s,
    hospitals: [...s.hospitals, newHospital],
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        hospitalId: newHospital.id,
        staffId: s.currentUser?.identifier || 'SUPER-ADMIN',
        staffName: s.currentUser?.name || 'Super Admin',
        staffRole: 'super_admin',
        action: 'HOSPITAL_ONBOARDED',
        details: `Onboarded hospital: ${newHospital.name} (Code: ${newHospital.code})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...s.auditLogs
    ],
    toastNotification: `Hospital ${newHospital.name} registered successfully!`
  }));

  return newHospital;
}

export function toggleHospitalStatusAction(hospitalId: string, status: 'active' | 'inactive') {
  updateState(s => {
    const hosp = s.hospitals.find(h => h.id === hospitalId);
    return {
      ...s,
      hospitals: s.hospitals.map(h => h.id === hospitalId ? { ...h, status } : h),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          hospitalId,
          staffId: s.currentUser?.identifier || 'SUPER-ADMIN',
          staffName: s.currentUser?.name || 'Super Admin',
          staffRole: 'super_admin',
          action: 'HOSPITAL_STATUS_CHANGED',
          details: `Changed ${hosp?.name || hospitalId} status to ${status.toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...s.auditLogs
      ],
      toastNotification: `Hospital status updated to ${status}!`
    };
  });
}

export function createStaffMemberAction(data: Omit<StaffMember, 'id'>): StaffMember {
  const newStaff: StaffMember = {
    id: `staff-${Date.now()}`,
    ...data
  };

  updateState(s => ({
    ...s,
    staffMembers: [...s.staffMembers, newStaff],
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        hospitalId: data.hospitalId,
        staffId: s.currentUser?.identifier || 'ADMIN',
        staffName: s.currentUser?.name || 'Hospital Admin',
        staffRole: 'hospital_admin',
        action: 'STAFF_MEMBER_CREATED',
        details: `Created staff member: ${newStaff.name} (${newStaff.role})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...s.auditLogs
    ],
    toastNotification: `Staff member ${newStaff.name} added successfully!`
  }));

  return newStaff;
}

export function toggleStaffStatusAction(staffId: string, status: 'active' | 'inactive') {
  updateState(s => {
    const st = s.staffMembers.find(m => m.id === staffId);
    return {
      ...s,
      staffMembers: s.staffMembers.map(m => m.id === staffId ? { ...m, status } : m),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          hospitalId: st?.hospitalId || s.currentHospitalId,
          staffId: s.currentUser?.identifier || 'ADMIN',
          staffName: s.currentUser?.name || 'Hospital Admin',
          staffRole: 'hospital_admin',
          action: 'STAFF_STATUS_CHANGED',
          details: `Updated ${st?.name || staffId} status to ${status.toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...s.auditLogs
      ],
      toastNotification: `Staff status updated to ${status}!`
    };
  });
}

export function createPatientDiagnosticJourneyAction(data: {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  uhid?: string;
  doctorName: string;
  department: string;
  doctorPriority: DoctorPriority;
  tests: {
    testId: string;
    priority: DoctorPriority;
    notes?: string;
    preparationInstructions?: string;
    dependencyTestId?: string;
  }[];
}): { patient: Patient; qrToken: string } {
  // Input sanitization and boundary checks
  const nameVal = validatePatientName(data.name);
  const cleanName = nameVal.isValid ? nameVal.value : sanitizeString(data.name) || 'Registered Patient';
  const ageVal = validatePatientAge(data.age);
  const cleanAge = ageVal.isValid ? ageVal.value : Math.min(130, Math.max(0, Number(data.age) || 30));
  const phoneVal = validatePatientPhone(data.contact);
  const cleanContact = phoneVal.isValid ? phoneVal.value : (data.contact ? sanitizeString(data.contact) : '+91 98000 00000');
  const cleanDoctorName = sanitizeString(data.doctorName) || 'Consulting Physician';
  const cleanDept = sanitizeString(data.department) || 'General Medicine';

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const patId = `pat-${Date.now()}`;
  const hospId = state.currentHospitalId;
  const hosp = state.hospitals.find(h => h.id === hospId) || state.hospitals[0];

  const generatedUhid = data.uhid?.trim() || `QC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrToken = `token-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
  const opdTokenNum = `OPD-${Math.floor(200 + Math.random() * 800)}`;
  const opdTokenId = `tok-opd-${Date.now()}`;

  const activeTokenIds: Record<string, string> = {
    'opd-consultation': opdTokenId
  };
  const newTokens: QueueToken[] = [];
  const testIds = data.tests.map(t => t.testId);

  data.tests.forEach((tItem) => {
    const test = state.tests.find(t => t.id === tItem.testId);
    const tokenId = `tok-${Date.now()}-${tItem.testId}`;
    activeTokenIds[tItem.testId] = tokenId;

    const deptTokens = state.queueTokens.filter(
      t => t.departmentId === test?.departmentId && (t.hospitalId || 'hosp-metro') === hospId && t.status === 'waiting'
    );

    newTokens.push({
      id: tokenId,
      hospitalId: hospId,
      tokenNumber: `${test?.code.split('-')[0] || 'TST'}-${200 + deptTokens.length + 1}`,
      patientId: patId,
      patientName: cleanName,
      patientUhid: generatedUhid,
      patientAge: cleanAge,
      patientGender: data.gender,
      testId: tItem.testId,
      testName: test?.name,
      departmentId: test?.departmentId || '',
      priority: data.doctorPriority === 'urgent' ? 'emergency' : (data.doctorPriority === 'priority' ? 'senior' : 'standard'),
      doctorPriority: tItem.priority,
      status: 'waiting',
      issuedAt: nowStr,
      queuePosition: deptTokens.length + 1,
      estimatedWaitMinutes: (deptTokens.length + 1) * (test?.averageDurationMinutes || 8)
    });
  });

  // Doctor consultation token in awaiting_lab_reports state
  const opdToken: QueueToken = {
    id: opdTokenId,
    hospitalId: hospId,
    tokenNumber: opdTokenNum,
    patientId: patId,
    patientName: cleanName,
    patientUhid: generatedUhid,
    patientAge: cleanAge,
    patientGender: data.gender,
    testId: 'opd-consultation',
    testName: 'OPD Doctor Consultation',
    departmentId: 'dept-opd',
    doctorId: 'doc-01',
    doctorName: cleanDoctorName,
    priority: data.doctorPriority === 'urgent' ? 'emergency' : (data.doctorPriority === 'priority' ? 'senior' : 'standard'),
    doctorPriority: data.doctorPriority,
    status: 'awaiting_lab_reports',
    issuedAt: nowStr,
    queuePosition: 1,
    estimatedWaitMinutes: 20
  };
  newTokens.push(opdToken);

  const newPatient: Patient = {
    id: patId,
    hospitalId: hospId,
    hospitalName: hosp.name,
    uhid: generatedUhid,
    name: cleanName,
    age: cleanAge,
    gender: data.gender,
    contact: cleanContact,
    priority: data.doctorPriority === 'urgent' ? 'emergency' : (data.doctorPriority === 'priority' ? 'senior' : 'standard'),
    doctorPriority: data.doctorPriority,
    prescribedDoctorId: 'doc-01',
    prescribedDoctorName: cleanDoctorName,
    prescribedDoctorRoom: 'OPD Room 204',
    department: cleanDept,
    prescribedTests: testIds,
    completedTests: [],
    activeTokenIds,
    status: 'checked_in',
    assignedSmartRoute: testIds,
    assignedNaiveRoute: testIds,
    registrationTime: nowStr,
    opdTokenNumber: opdTokenNum,
    doctorReviewStatus: 'awaiting_lab_reports',
    secureQrToken: qrToken
  };

  const initialPlan = calculateOptimalQueueRoute(
    newPatient,
    state.tests,
    state.departments,
    [...state.queueTokens, ...newTokens],
    state.counters
  );

  newPatient.assignedSmartRoute = initialPlan.smartRouteSteps.map(s => s.testId);

  updateState(s => ({
    ...s,
    patients: [newPatient, ...s.patients],
    queueTokens: [...s.queueTokens, ...newTokens],
    selectedPatientId: newPatient.id,
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        hospitalId: hospId,
        staffId: s.currentUser?.identifier || 'STAFF-ASST',
        staffName: s.currentUser?.name || 'Doctor Assistant',
        staffRole: 'doctor_assistant',
        action: 'PATIENT_JOURNEY_CREATED',
        patientId: newPatient.id,
        patientName: newPatient.name,
        details: `Diagnostic journey prescribed with ${testIds.length} investigations. Priority: ${data.doctorPriority.toUpperCase()}`,
        timestamp: nowStr
      },
      ...s.auditLogs
    ],
    toastNotification: `Diagnostic journey created for ${newPatient.name}!`
  }));

  return { patient: newPatient, qrToken };
}

export function setLanguageAction(lang: 'en' | 'hi') {
  updateState(s => ({ ...s, language: lang }));
}

export function dismissToastAction() {
  updateState(s => ({ ...s, toastNotification: null }));
}

export function setToastNotificationAction(msg: string) {
  updateState(s => ({ ...s, toastNotification: msg }));
}

export function setSelectedLabDeptAction(deptId: string) {
  updateState(s => ({ ...s, selectedLabDeptId: deptId }));
}

export function useHospitalStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  // Authentication & Session Actions
  const registerPatient = useCallback(registerPatientAction, []);

  const loginAsPatient = useCallback((identifierOrId: string): boolean => {
    const query = identifierOrId.trim().toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');
    const cleanAlphanum = query.replace(/[^a-z0-9]/g, '');

    const patient = state.patients.find(p => {
      const pUhid = p.uhid.toLowerCase();
      const pId = p.id.toLowerCase();
      const pContactDigits = p.contact.replace(/[^0-9]/g, '');
      const pName = p.name.toLowerCase();

      return (
        pId === query ||
        pUhid === query ||
        pUhid.replace(/[^a-z0-9]/g, '') === cleanAlphanum ||
        (cleanDigits.length >= 4 && pContactDigits.includes(cleanDigits)) ||
        pName === query ||
        pName.includes(query)
      );
    });

    if (!patient) return false;

    const targetHospId = patient.hospitalId || 'hosp-metro';
    const hosp = state.hospitals.find(h => h.id === targetHospId);

    const user: CurrentUser = {
      id: patient.id,
      role: 'patient',
      name: patient.name,
      identifier: patient.uhid,
      subtitle: `${patient.age} Yrs / ${patient.gender} • ${patient.priority === 'senior' ? 'Senior Priority' : 'Standard'}`,
      hospitalId: targetHospId,
      hospitalName: hosp?.name
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qcare_clinical_session', JSON.stringify(user));
      } catch {}
    }

    updateState(s => ({
      ...s,
      currentUser: user,
      activeRole: 'patient',
      selectedPatientId: patient.id,
      currentHospitalId: targetHospId
    }));

    return true;
  }, []);

  const loginAsDoctor = useCallback((doctorId: string): boolean => {
    const doctor = state.doctors.find(
      d => d.id === doctorId || d.roomNo.toLowerCase().includes(doctorId.toLowerCase())
    );
    if (!doctor) return false;

    const targetHospId = doctor.hospitalId || 'hosp-metro';
    const hosp = state.hospitals.find(h => h.id === targetHospId);

    const user: CurrentUser = {
      id: doctor.id,
      role: 'doctor',
      name: doctor.name,
      identifier: doctor.roomNo,
      subtitle: `${doctor.specialization} • ${doctor.department}`,
      hospitalId: targetHospId,
      hospitalName: hosp?.name
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qcare_clinical_session', JSON.stringify(user));
      } catch {}
    }

    updateState(s => ({
      ...s,
      currentUser: user,
      activeRole: 'doctor',
      selectedDoctorId: doctor.id,
      currentHospitalId: targetHospId
    }));

    return true;
  }, []);

  const loginAsLabTech = useCallback((counterId: string): boolean => {
    const counter = state.counters.find(
      c => c.id === counterId || c.code.toLowerCase() === counterId.toLowerCase()
    );
    if (!counter) return false;
    const dept = state.departments.find(d => d.id === counter.departmentId);
    const targetHospId = counter.hospitalId || 'hosp-metro';
    const hosp = state.hospitals.find(h => h.id === targetHospId);

    const user: CurrentUser = {
      id: counter.id,
      role: 'lab_tech',
      name: counter.technicianName,
      identifier: `${counter.name} (${counter.code})`,
      subtitle: `${dept?.name} • ${dept?.location.room}`,
      departmentId: counter.departmentId,
      counterId: counter.id,
      hospitalId: targetHospId,
      hospitalName: hosp?.name
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qcare_clinical_session', JSON.stringify(user));
      } catch {}
    }

    updateState(s => ({
      ...s,
      currentUser: user,
      activeRole: 'lab_tech',
      selectedCounterId: counter.id,
      currentHospitalId: targetHospId
    }));

    return true;
  }, []);

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('qcare_clinical_session');
      } catch {}
    }
    updateState(s => ({
      ...s,
      currentUser: null
    }));
  }, []);

  const switchRole = useCallback((role: ActiveRole) => {
    updateState(s => {
      let nextUser: CurrentUser | null = null;
      if (role === 'patient') {
        const p = s.patients.find(pt => pt.id === s.selectedPatientId) || s.patients[0];
        nextUser = {
          id: p.id,
          role: 'patient',
          name: p.name,
          identifier: p.uhid,
          subtitle: `${p.age} Yrs / ${p.gender} • ${p.priority === 'senior' ? 'Senior Priority' : 'Standard'}`
        };
      } else if (role === 'doctor') {
        const d = s.doctors.find(doc => doc.id === s.selectedDoctorId) || s.doctors[0];
        nextUser = {
          id: d.id,
          role: 'doctor',
          name: d.name,
          identifier: d.roomNo,
          subtitle: `${d.specialization} • ${d.department}`
        };
      } else if (role === 'lab_tech') {
        const c = s.counters.find(cnt => cnt.id === s.selectedCounterId) || s.counters[0];
        const dept = s.departments.find(dp => dp.id === c.departmentId);
        nextUser = {
          id: c.id,
          role: 'lab_tech',
          name: c.technicianName,
          identifier: `${c.name} (${c.code})`,
          subtitle: `${dept?.name} • ${dept?.location.room}`,
          departmentId: c.departmentId,
          counterId: c.id
        };
      }

      if (typeof window !== 'undefined' && nextUser) {
        try {
          localStorage.setItem('qcare_clinical_session', JSON.stringify(nextUser));
        } catch {}
      }

      return {
        ...s,
        activeRole: role,
        currentUser: nextUser || s.currentUser
      };
    });
  }, []);

  const setActiveRole = useCallback((role: ActiveRole) => {
    updateState(s => ({ ...s, activeRole: role }));
  }, []);

  const setSelectedPatient = useCallback((patientId: string) => {
    updateState(s => {
      const p = s.patients.find(pt => pt.id === patientId);
      const updatedUser = s.currentUser?.role === 'patient' && p ? {
        ...s.currentUser,
        id: p.id,
        name: p.name,
        identifier: p.uhid,
        subtitle: `${p.age} Yrs / ${p.gender} • ${p.priority === 'senior' ? 'Senior Priority' : 'Standard'}`
      } : s.currentUser;

      if (typeof window !== 'undefined' && updatedUser && s.currentUser?.role === 'patient') {
        try {
          localStorage.setItem('qcare_clinical_session', JSON.stringify(updatedUser));
        } catch {}
      }

      return {
        ...s,
        selectedPatientId: patientId,
        currentUser: updatedUser
      };
    });
  }, []);

  const setSelectedCounter = useCallback((counterId: string) => {
    updateState(s => {
      const c = s.counters.find(cnt => cnt.id === counterId);
      const dept = c ? s.departments.find(d => d.id === c.departmentId) : undefined;
      const updatedUser = s.currentUser?.role === 'lab_tech' && c ? {
        ...s.currentUser,
        id: c.id,
        name: c.technicianName,
        identifier: `${c.name} (${c.code})`,
        subtitle: `${dept?.name} • ${dept?.location.room}`,
        departmentId: c.departmentId,
        counterId: c.id
      } : s.currentUser;

      if (typeof window !== 'undefined' && updatedUser && s.currentUser?.role === 'lab_tech') {
        try {
          localStorage.setItem('qcare_clinical_session', JSON.stringify(updatedUser));
        } catch {}
      }

      return {
        ...s,
        selectedCounterId: counterId,
        currentUser: updatedUser
      };
    });
  }, []);

  const setSelectedDoctor = useCallback((doctorId: string) => {
    updateState(s => {
      const d = s.doctors.find(doc => doc.id === doctorId);
      const updatedUser = s.currentUser?.role === 'doctor' && d ? {
        ...s.currentUser,
        id: d.id,
        name: d.name,
        identifier: d.roomNo,
        subtitle: `${d.specialization} • ${d.department}`
      } : s.currentUser;

      if (typeof window !== 'undefined' && updatedUser && s.currentUser?.role === 'doctor') {
        try {
          localStorage.setItem('qcare_clinical_session', JSON.stringify(updatedUser));
        } catch {}
      }

      return {
        ...s,
        selectedDoctorId: doctorId,
        currentUser: updatedUser
      };
    });
  }, []);

  const toggleSound = useCallback(() => {
    updateState(s => {
      const nextVal = !s.soundEnabled;
      if (!nextVal) {
        hospitalAudio.stopAll();
      } else {
        hospitalAudio.playChime();
      }
      return { ...s, soundEnabled: nextVal };
    });
  }, []);

  const toggleAutoTraffic = useCallback(() => {
    updateState(s => {
      const nextVal = !s.autoSimulateTraffic;
      setAutoTrafficTimer(nextVal);
      return { ...s, autoSimulateTraffic: nextVal };
    });
  }, []);

  const callNextToken = useCallback((counterId: string, silent: boolean = false) => {
    callOrAdvanceCounter(counterId, silent);
  }, []);

  const callSpecificToken = useCallback((counterId: string, tokenId: string) => {
    callSpecificTokenInternal(counterId, tokenId);
  }, []);

  const startTest = useCallback((tokenId: string) => {
    updateState(s => {
      const updatedTokens = s.queueTokens.map(t =>
        t.id === tokenId ? { ...t, status: 'in_progress' as const } : t
      );
      return { ...s, queueTokens: updatedTokens };
    });
  }, []);

  const putTestOnHold = useCallback((tokenId: string) => {
    updateState(s => {
      const token = s.queueTokens.find(t => t.id === tokenId);
      if (!token) return s;

      const updatedTokens = s.queueTokens.map(t =>
        t.id === tokenId ? { ...t, status: 'on_hold' as const } : t
      );

      const updatedCounters = s.counters.map(c =>
        (c.id === token.counterId || c.currentServingTokenId === token.id)
          ? { ...c, currentServingTokenId: undefined, currentPatientId: undefined }
          : c
      );

      return {
        ...s,
        queueTokens: updatedTokens,
        counters: updatedCounters
      };
    });
  }, []);
  const completeTestAndUploadReport = useCallback(completeTestAndUploadReportAction, []);

  const signOffReport = useCallback((reportId: string, doctorNotes?: string) => {
    updateState(s => {
      const activeDoc = s.doctors.find(d => d.id === s.selectedDoctorId);
      const updated = s.clinicalReports.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'verified_by_doctor' as const,
            doctorNotes: doctorNotes || 'Report reviewed. Findings clinically correlated.',
            doctorSignature: `${activeDoc?.name || 'Consulting Physician'}, ${activeDoc?.specialization || 'MD'}`
          };
        }
        return r;
      });
      return { ...s, clinicalReports: updated };
    });
  }, []);

  const prescribeTests = useCallback((patientId: string, testIds: string[]) => {
    prescribeTestsAction(patientId, testIds);
  }, []);

  const completeConsultation = useCallback(completeConsultationAction, []);

  const simulateRush = useCallback((deptId: string, count: number = 8) => {
    simulateRushTraffic(deptId, count, state.currentHospitalId);
  }, []);

  const advanceAllCounters = useCallback(() => {
    // Advance each active counter in current hospital with silent = true to avoid clashing voice synthesis
    const activeCounters = state.counters.filter(
      c => c.status === 'active' && (c.hospitalId || 'hosp-metro') === state.currentHospitalId
    );
    activeCounters.forEach(c => {
      callOrAdvanceCounter(c.id, true);
    });

    // Play a single clean chime
    if (state.soundEnabled) {
      hospitalAudio.playChime();
    }
  }, []);

  const toggleCounterStatus = useCallback((counterId: string) => {
    updateState(s => {
      const updated = s.counters.map(c => {
        if (c.id === counterId) {
          const nextStatus = c.status === 'active' ? 'closed' : 'active';
          return { ...c, status: nextStatus as 'active' | 'closed' };
        }
        return c;
      });
      return { ...s, counters: updated };
    });
  }, []);

  const startGuidedWalkthroughDemo = useCallback(() => {
    if (autoTrafficInterval) {
      clearInterval(autoTrafficInterval);
      autoTrafficInterval = null;
    }

    const walkthroughPatient: Patient = {
      id: 'pat-walkthrough',
      hospitalId: 'hosp-metro',
      hospitalName: 'CityCare Multi-Specialty Hospital (Metro Campus)',
      uhid: 'QC-2026-001',
      name: 'Rohan Verma',
      age: 32,
      gender: 'Male',
      contact: '+91 98200 11223',
      priority: 'standard',
      prescribedDoctorId: 'doc-sarah',
      prescribedDoctorName: 'Dr. Sarah Khan',
      prescribedDoctorRoom: 'OPD Room 12',
      currentIllness: 'High fever, acute chest tightness & persistent dry cough for 3 days',
      symptoms: 'High fever & chest tightness',
      prescribedTests: [],
      completedTests: [],
      currentTestId: undefined,
      activeTokenIds: {
        'opd-consultation': 'tok-opd-walkthrough'
      },
      status: 'checked_in',
      assignedSmartRoute: [],
      assignedNaiveRoute: [],
      registrationTime: '09:00 AM',
      opdTokenNumber: 'OPD-101',
      doctorReviewStatus: 'awaiting_prescription'
    };

    const cleanCounters: Counter[] = ALL_INITIAL_COUNTERS.map(c => ({
      ...c,
      status: 'active',
      currentServingTokenId: undefined,
      currentPatientId: undefined,
      servedCountToday: 0
    }));

    const doctorUser: CurrentUser = {
      id: 'doc-sarah',
      role: 'doctor',
      name: 'Dr. Sarah Khan',
      identifier: 'OPD Room 12',
      subtitle: 'Consultant Physician & Diabetologist • General Medicine OPD',
      hospitalId: 'hosp-metro',
      hospitalName: 'CityCare Multi-Specialty Hospital (Metro Campus)'
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qcare_clinical_session', JSON.stringify(doctorUser));
      } catch {}
    }

    const walkthroughOpdToken: QueueToken = {
      id: 'tok-opd-walkthrough',
      hospitalId: 'hosp-metro',
      tokenNumber: 'OPD-101',
      patientId: 'pat-walkthrough',
      testId: 'opd-consultation',
      departmentId: 'dept-opd',
      doctorId: 'doc-sarah',
      doctorName: 'Dr. Sarah Khan',
      priority: 'standard',
      status: 'waiting',
      issuedAt: '09:00 AM',
      queuePosition: 1,
      estimatedWaitMinutes: 5
    };

    updateState(s => ({
      ...s,
      currentHospitalId: 'hosp-metro',
      currentUser: doctorUser,
      activeRole: 'doctor',
      selectedDoctorId: 'doc-sarah',
      selectedPatientId: 'pat-walkthrough',
      patients: [walkthroughPatient],
      queueTokens: [walkthroughOpdToken],
      clinicalReports: [],
      counters: cleanCounters
    }));
  }, []);

  const resetToCleanHospital = useCallback(() => {
    if (autoTrafficInterval) {
      clearInterval(autoTrafficInterval);
      autoTrafficInterval = null;
    }

    const cleanCounters: Counter[] = ALL_INITIAL_COUNTERS.map(c => ({
      ...c,
      status: 'active',
      currentServingTokenId: undefined,
      currentPatientId: undefined,
      servedCountToday: 0
    }));

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('qcare_clinical_session');
      } catch {}
    }

    updateState(s => ({
      ...s,
      currentUser: null,
      activeRole: 'patient',
      patients: [],
      queueTokens: [],
      clinicalReports: [],
      counters: cleanCounters
    }));
  }, []);

  const resetToFullDemoHospital = useCallback(() => {
    if (autoTrafficInterval) {
      clearInterval(autoTrafficInterval);
      autoTrafficInterval = null;
    }

    updateState(s => ({
      ...s,
      currentHospitalId: 'hosp-metro',
      departments: INITIAL_DEPARTMENTS,
      tests: INITIAL_TESTS,
      counters: ALL_INITIAL_COUNTERS,
      patients: ALL_INITIAL_PATIENTS,
      queueTokens: ALL_INITIAL_QUEUE_TOKENS,
      clinicalReports: ALL_INITIAL_CLINICAL_REPORTS,
      doctors: ALL_INITIAL_DOCTORS,
      selectedPatientId: 'pat-rajesh',
      selectedCounterId: 'counter-bld-1',
      selectedDoctorId: 'doc-01'
    }));
  }, []);

  const resetToDemoBaseline = useCallback(() => {
    resetToFullDemoHospital();
  }, [resetToFullDemoHospital]);

  const setHospital = useCallback((hospitalId: string) => {
    setHospitalInternal(hospitalId);
  }, []);

  const loginAsStaff = useCallback(loginAsStaffAction, []);
  const loginAsPatientWithToken = useCallback(loginAsPatientWithTokenAction, []);
  const loadDemoScenarioRahul = useCallback(loadDemoScenarioRahulAction, []);
  const checkInPatientAtLab = useCallback(checkInPatientAtLabAction, []);
  const updateLabAvailability = useCallback(updateLabAvailabilityAction, []);
  const updateMachineCounts = useCallback(updateMachineCountsAction, []);
  const createHospital = useCallback(createHospitalAction, []);
  const toggleHospitalStatus = useCallback(toggleHospitalStatusAction, []);
  const createStaffMember = useCallback(createStaffMemberAction, []);
  const toggleStaffStatus = useCallback(toggleStaffStatusAction, []);
  const createPatientDiagnosticJourney = useCallback(createPatientDiagnosticJourneyAction, []);
  const setLanguage = useCallback(setLanguageAction, []);
  const dismissToast = useCallback(dismissToastAction, []);
  const setToastNotification = useCallback(setToastNotificationAction, []);
  const setSelectedLabDept = useCallback(setSelectedLabDeptAction, []);
  const markTestCompletedByPatient = useCallback(markTestCompletedByPatientAction, []);

  const currentHospital = useMemo(() => {
    return snap.hospitals.find(h => h.id === snap.currentHospitalId) || snap.hospitals[0];
  }, [snap.hospitals, snap.currentHospitalId]);

  // Scoped lists for the selected hospital (Strict Tenant Isolation)
  const scopedPatients = useMemo(() => {
    return snap.patients.filter(p => (p.hospitalId || 'hosp-metro') === snap.currentHospitalId);
  }, [snap.patients, snap.currentHospitalId]);

  const scopedDoctors = useMemo(() => {
    return snap.doctors.filter(d => {
      const docHosp = d.hospitalId || (d.id.startsWith('doc-metro') ? 'hosp-metro' : d.id.includes('clinic') ? 'hosp-clinic' : d.id.includes('east') ? 'hosp-east' : 'qcare-demo');
      return docHosp === snap.currentHospitalId;
    });
  }, [snap.doctors, snap.currentHospitalId]);

  const scopedCounters = useMemo(() => {
    return snap.counters.filter(c => (c.hospitalId || 'hosp-metro') === snap.currentHospitalId);
  }, [snap.counters, snap.currentHospitalId]);

  const scopedTokens = useMemo(() => {
    return snap.queueTokens.filter(t => (t.hospitalId || 'hosp-metro') === snap.currentHospitalId);
  }, [snap.queueTokens, snap.currentHospitalId]);

  const scopedReports = useMemo(() => {
    return snap.clinicalReports.filter(r => (r.hospitalId || 'hosp-metro') === snap.currentHospitalId);
  }, [snap.clinicalReports, snap.currentHospitalId]);

  const scopedStaff = useMemo(() => {
    return snap.staffMembers.filter(s => (s.hospitalId || 'qcare-demo') === snap.currentHospitalId);
  }, [snap.staffMembers, snap.currentHospitalId]);

  const scopedMachines = useMemo(() => {
    return snap.labMachines.filter(m => (m.hospitalId || 'qcare-demo') === snap.currentHospitalId);
  }, [snap.labMachines, snap.currentHospitalId]);

  const scopedAuditLogs = useMemo(() => {
    return snap.auditLogs.filter(l => (l.hospitalId || 'qcare-demo') === snap.currentHospitalId);
  }, [snap.auditLogs, snap.currentHospitalId]);

  const scopedFloorRooms = useMemo(() => {
    return snap.floorRooms.filter(r => (r.hospitalId || 'qcare-demo') === snap.currentHospitalId);
  }, [snap.floorRooms, snap.currentHospitalId]);

  // Compute selected patient reactively from scoped patients
  const selectedPatient = useMemo(() => {
    return scopedPatients.find(p => p.id === snap.selectedPatientId) || scopedPatients[0] || snap.patients[0];
  }, [scopedPatients, snap.selectedPatientId, snap.patients]);

  // Compute routing plan reactively from snap whenever patient, tokens, counters, or tests change
  const currentRoutingPlan: QueueRoutingPlan = useMemo(() => {
    if (!selectedPatient) {
      return {
        patientId: '',
        calculatedAt: '',
        smartRouteSteps: [],
        smartTotalTimeMinutes: 0,
        naiveTotalTimeMinutes: 0,
        timeSavedMinutes: 0,
        percentageSaved: 0,
        bottlenecksAvoided: [],
        fastingSatisfied: true,
        transitTotalMinutes: 0
      };
    }
    const patHospId = selectedPatient.hospitalId || snap.currentHospitalId;
    return calculateOptimalQueueRoute(
      selectedPatient,
      snap.tests,
      snap.departments,
      snap.queueTokens.filter(t => (t.hospitalId || 'hosp-metro') === patHospId),
      snap.counters.filter(c => (c.hospitalId || 'hosp-metro') === patHospId)
    );
  }, [selectedPatient, snap.tests, snap.departments, snap.queueTokens, snap.counters]);

  return {
    // Reactive Snapshots & Tenant Scoped Collections
    currentUser: snap.currentUser,
    currentHospitalId: snap.currentHospitalId,
    currentHospital,
    hospitals: snap.hospitals,
    departments: snap.departments,
    tests: snap.tests,
    counters: scopedCounters,
    patients: scopedPatients,
    queueTokens: scopedTokens,
    clinicalReports: scopedReports,
    doctors: scopedDoctors,
    staffMembers: scopedStaff,
    labMachines: scopedMachines,
    auditLogs: scopedAuditLogs,
    floorRooms: scopedFloorRooms,
    allStaffMembers: snap.staffMembers,
    allLabMachines: snap.labMachines,
    allAuditLogs: snap.auditLogs,
    allCounters: snap.counters,
    allPatients: snap.patients,
    allDoctors: snap.doctors,
    language: snap.language,
    toastNotification: snap.toastNotification,
    selectedLabDeptId: snap.selectedLabDeptId,
    activeRole: snap.activeRole,
    selectedPatientId: snap.selectedPatientId,
    selectedPatient,
    selectedCounterId: snap.selectedCounterId,
    selectedDoctorId: snap.selectedDoctorId,
    soundEnabled: snap.soundEnabled,
    autoSimulateTraffic: snap.autoSimulateTraffic,
    latestAnnouncement: snap.latestAnnouncement,
    cumulativeTimeSavedMinutes: snap.cumulativeTimeSavedMinutes,
    currentRoutingPlan,

    // Actions
    setHospital,
    registerPatient,
    loginAsPatient,
    loginAsDoctor,
    loginAsLabTech,
    loginAsStaff,
    loginAsPatientWithToken,
    loadDemoScenarioRahul,
    checkInPatientAtLab,
    updateLabAvailability,
    updateMachineCounts,
    createHospital,
    toggleHospitalStatus,
    createStaffMember,
    toggleStaffStatus,
    createPatientDiagnosticJourney,
    setLanguage,
    dismissToast,
    setToastNotification,
    setSelectedLabDept,
    signOut,
    switchRole,
    setActiveRole,
    setSelectedPatient,
    setSelectedCounter,
    setSelectedDoctor,
    toggleSound,
    toggleAutoTraffic,
    callNextToken,
    callSpecificToken,
    startTest,
    putTestOnHold,
    completeTestAndUploadReport,
    signOffReport,
    prescribeTests,
    completeConsultation,
    simulateRush,
    advanceAllCounters,
    toggleCounterStatus,
    resetToDemoBaseline,
    startGuidedWalkthroughDemo,
    resetToCleanHospital,
    resetToFullDemoHospital,
    markTestCompletedByPatient
  };
}
