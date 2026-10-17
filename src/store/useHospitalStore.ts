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
  QueueRoutingPlan 
} from '../types';
import { 
  INITIAL_COUNTERS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_PATIENTS, 
  INITIAL_QUEUE_TOKENS, 
  INITIAL_TESTS, 
  INITIAL_CLINICAL_REPORTS 
} from '../data/mockHospitalData';
import { calculateOptimalQueueRoute } from '../engine/queueRouter';
import { hospitalAudio } from '../engine/chimeAudio';

// Global singleton state pattern for React 18 application with useSyncExternalStore
type Listener = () => void;

interface StoreState {
  departments: Department[];
  tests: DiagnosticTest[];
  counters: Counter[];
  patients: Patient[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  doctors: Doctor[];
  activeRole: ActiveRole;
  selectedPatientId: string;
  selectedCounterId: string;
  selectedDoctorId: string;
  soundEnabled: boolean;
  autoSimulateTraffic: boolean;
  latestAnnouncement: {
    tokenNumber: string;
    counterName: string;
    room: string;
    timestamp: string;
  } | null;
  cumulativeTimeSavedMinutes: number;
}

let state: StoreState = {
  departments: INITIAL_DEPARTMENTS,
  tests: INITIAL_TESTS,
  counters: INITIAL_COUNTERS,
  patients: INITIAL_PATIENTS,
  queueTokens: INITIAL_QUEUE_TOKENS,
  clinicalReports: INITIAL_CLINICAL_REPORTS,
  doctors: INITIAL_DOCTORS,
  activeRole: 'patient',
  selectedPatientId: 'pat-rajesh',
  selectedCounterId: 'counter-bld-1',
  selectedDoctorId: 'doc-01',
  soundEnabled: true,
  autoSimulateTraffic: false,
  latestAnnouncement: null,
  cumulativeTimeSavedMinutes: 142
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

function updateState(updater: (prev: StoreState) => StoreState) {
  state = updater(state);
  notify();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
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
      const activeCounters = state.counters.filter(c => c.status === 'active');
      if (activeCounters.length > 0) {
        // Pick random counter with waiting tokens or currently serving
        const candidate = activeCounters[Math.floor(Math.random() * activeCounters.length)];
        callOrAdvanceCounter(candidate.id, true);
      }
    } else {
      // Simulate random walk-in surge
      const depts = state.departments;
      const targetDept = depts[Math.floor(Math.random() * depts.length)];
      if (targetDept) {
        simulateRushTraffic(targetDept.id, 2);
      }
    }
  }, 8000);
}

function simulateRushTraffic(deptId: string, count: number) {
  updateState(s => {
    const dept = s.departments.find(d => d.id === deptId);
    if (!dept) return s;

    const test = s.tests.find(t => t.departmentId === deptId);
    const testId = test?.id || 'test-cbc';
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRushTokens: QueueToken[] = [];
    const currentDeptTokens = s.queueTokens.filter(t => t.departmentId === deptId);

    for (let i = 1; i <= count; i++) {
      const tokenNum = `${dept.code}-${200 + currentDeptTokens.length + i}`;
      newRushTokens.push({
        id: `rush-tok-${Date.now()}-${i}`,
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

function callOrAdvanceCounter(counterId: string, silent: boolean = false) {
  updateState(s => {
    const counter = s.counters.find(c => c.id === counterId);
    if (!counter || counter.status !== 'active') return s;

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

        // Update patient
        if (prevPatient) {
          const newCompleted = Array.from(new Set([...prevPatient.completedTests, prevToken.testId]));
          const allDone = prevPatient.prescribedTests.every(tid => newCompleted.includes(tid));
          updatedPatients = updatedPatients.map(p =>
            p.id === prevPatient.id
              ? {
                  ...p,
                  completedTests: newCompleted,
                  currentTestId: undefined,
                  status: allDone ? ('all_completed' as const) : ('in_transit' as const)
                }
              : p
          );
        }
      }
    }

    // 2. Find waiting tokens for this department
    const waiting = updatedTokens.filter(
      t => t.departmentId === counter.departmentId && t.status === 'waiting'
    );

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
      hospitalAudio.announceToken(nextToken.tokenNumber, counter.name, dept.location.room);
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

export function useHospitalStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  // Actions
  const setActiveRole = useCallback((role: ActiveRole) => {
    updateState(s => ({ ...s, activeRole: role }));
  }, []);

  const setSelectedPatient = useCallback((patientId: string) => {
    updateState(s => ({ ...s, selectedPatientId: patientId }));
  }, []);

  const setSelectedCounter = useCallback((counterId: string) => {
    updateState(s => ({ ...s, selectedCounterId: counterId }));
  }, []);

  const setSelectedDoctor = useCallback((doctorId: string) => {
    updateState(s => ({ ...s, selectedDoctorId: doctorId }));
  }, []);

  const toggleSound = useCallback(() => {
    updateState(s => ({ ...s, soundEnabled: !s.soundEnabled }));
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

  const startTest = useCallback((tokenId: string) => {
    updateState(s => {
      const updatedTokens = s.queueTokens.map(t =>
        t.id === tokenId ? { ...t, status: 'in_progress' as const } : t
      );
      return { ...s, queueTokens: updatedTokens };
    });
  }, []);

  const completeTestAndUploadReport = useCallback((
    tokenId: string,
    reportData: {
      summary: string;
      metrics: { label: string; value: string; unit: string; normalRange: string; flag: 'normal' | 'high' | 'low' | 'critical' }[];
    }
  ) => {
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
        c.id === token.counterId ? { ...c, currentServingTokenId: undefined, currentPatientId: undefined } : c
      );

      // 3. Create new clinical report
      const newReport: ClinicalReport = {
        id: `rep-${Date.now()}`,
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

      // 4. Update patient: append completedTests, check if all tests completed
      const updatedPatients = s.patients.map(p => {
        if (p.id === token.patientId) {
          const newCompleted = Array.from(new Set([...p.completedTests, token.testId]));
          const allDone = p.prescribedTests.every(tid => newCompleted.includes(tid));
          return {
            ...p,
            completedTests: newCompleted,
            currentTestId: undefined,
            status: allDone ? ('all_completed' as const) : ('in_transit' as const)
          };
        }
        return p;
      });

      return {
        ...s,
        queueTokens: updatedTokens,
        counters: updatedCounters,
        clinicalReports: [newReport, ...s.clinicalReports],
        patients: updatedPatients,
        cumulativeTimeSavedMinutes: s.cumulativeTimeSavedMinutes + 18
      };
    });
  }, []);

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
    updateState(s => {
      const patient = s.patients.find(p => p.id === patientId);
      const doctor = s.doctors.find(d => d.id === s.selectedDoctorId);
      if (!patient) return s;

      const newTokens: QueueToken[] = [];
      const updatedActiveTokenIds = { ...patient.activeTokenIds };
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      testIds.forEach(testId => {
        if (!patient.prescribedTests.includes(testId)) {
          const test = s.tests.find(t => t.id === testId);
          if (!test) return;

          const deptTokens = s.queueTokens.filter(t => t.departmentId === test.departmentId);
          const queuePos = deptTokens.filter(t => t.status === 'waiting').length + 1;
          const tokenNum = `${test.code.split('-')[0]}-${100 + deptTokens.length + 1}`;
          const tokenId = `tok-${Date.now()}-${test.id}`;

          const token: QueueToken = {
            id: tokenId,
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

      const updatedPatients = s.patients.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            prescribedDoctorId: doctor?.id || p.prescribedDoctorId,
            prescribedDoctorName: doctor?.name || p.prescribedDoctorName,
            prescribedTests: updatedPrescribed,
            activeTokenIds: updatedActiveTokenIds,
            status: 'checked_in' as const
          };
        }
        return p;
      });

      return {
        ...s,
        patients: updatedPatients,
        queueTokens: [...s.queueTokens, ...newTokens]
      };
    });
  }, []);

  const simulateRush = useCallback((deptId: string, count: number = 8) => {
    simulateRushTraffic(deptId, count);
  }, []);

  const advanceAllCounters = useCallback(() => {
    // Advance each active counter with silent = true to avoid clashing voice synthesis
    const activeCounters = state.counters.filter(c => c.status === 'active');
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

  const resetToDemoBaseline = useCallback(() => {
    if (autoTrafficInterval) {
      clearInterval(autoTrafficInterval);
      autoTrafficInterval = null;
    }
    updateState(() => ({
      departments: INITIAL_DEPARTMENTS,
      tests: INITIAL_TESTS,
      counters: INITIAL_COUNTERS,
      patients: INITIAL_PATIENTS,
      queueTokens: INITIAL_QUEUE_TOKENS,
      clinicalReports: INITIAL_CLINICAL_REPORTS,
      doctors: INITIAL_DOCTORS,
      activeRole: 'patient',
      selectedPatientId: 'pat-rajesh',
      selectedCounterId: 'counter-bld-1',
      selectedDoctorId: 'doc-01',
      soundEnabled: true,
      autoSimulateTraffic: false,
      latestAnnouncement: null,
      cumulativeTimeSavedMinutes: 142
    }));
  }, []);

  // Compute selected patient reactively from snap
  const selectedPatient = useMemo(() => {
    return snap.patients.find(p => p.id === snap.selectedPatientId) || snap.patients[0];
  }, [snap.patients, snap.selectedPatientId]);

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
    return calculateOptimalQueueRoute(
      selectedPatient,
      snap.tests,
      snap.departments,
      snap.queueTokens,
      snap.counters
    );
  }, [selectedPatient, snap.tests, snap.departments, snap.queueTokens, snap.counters]);

  return {
    // Reactive Snapshots
    departments: snap.departments,
    tests: snap.tests,
    counters: snap.counters,
    patients: snap.patients,
    queueTokens: snap.queueTokens,
    clinicalReports: snap.clinicalReports,
    doctors: snap.doctors,
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
    setActiveRole,
    setSelectedPatient,
    setSelectedCounter,
    setSelectedDoctor,
    toggleSound,
    toggleAutoTraffic,
    callNextToken,
    startTest,
    completeTestAndUploadReport,
    signOffReport,
    prescribeTests,
    simulateRush,
    advanceAllCounters,
    toggleCounterStatus,
    resetToDemoBaseline
  };
}
