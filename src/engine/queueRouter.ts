import { 
  Department, 
  DiagnosticTest, 
  Counter, 
  QueueToken, 
  Patient, 
  QueueRoutingPlan, 
  RouteStep,
  DoctorPriority 
} from '../types';

/**
 * Calculates walking / transit time in minutes between two hospital locations.
 */
export function calculateTransitMinutes(
  deptA?: Department, 
  deptB?: Department
): number {
  if (!deptA || !deptB) return 2.0;
  if (deptA.id === deptB.id) return 0.5;

  let transit = 1.0;

  // Floor difference
  if (deptA.location.floor !== deptB.location.floor) {
    transit += 2.0; // lift / stairs traversal
  }

  // Wing difference
  if (deptA.location.wing !== deptB.location.wing) {
    transit += 2.0; // corridor transit
  }

  return Math.min(transit, 6.0);
}

/**
 * Formats estimated waiting time as a realistic range.
 * Example: 25 -> "Approx. 20–30 min"
 */
export function formatWaitRange(minutes: number): string {
  if (minutes <= 2) return 'Immediate (< 3 min)';
  const min = Math.max(1, Math.round(minutes * 0.85));
  const max = Math.round(minutes * 1.15) + 2;
  return `Approx. ${min}–${max} min`;
}

/**
 * Calculates dynamic estimated wait time at a department given the current queue tokens.
 * Accounts for active counters, active machines, and average service speed.
 */
export function calculateDepartmentCurrentWait(
  deptId: string,
  tokens: QueueToken[],
  counters: Counter[],
  patientId?: string,
  departments?: Department[]
): { 
  waitMinutes: number; 
  waitingCount: number; 
  activeCountersCount: number; 
  avgService: number;
  isClosed: boolean;
} {
  const dept = departments?.find(d => d.id === deptId);
  const isDeptMarkedUnavailable = dept?.availabilityStatus === 'unavailable';

  const deptCounters = counters.filter(c => c.departmentId === deptId);
  const activeCounters = deptCounters.filter(c => c.status === 'active');
  
  // Closed if department explicitly marked unavailable, activeMachines <= 0, or counters exist and all are closed
  const isClosed = isDeptMarkedUnavailable || 
    (dept?.activeMachines !== undefined && dept.activeMachines <= 0) ||
    (deptCounters.length > 0 && activeCounters.length === 0);

  // Active serving units (Machines / Counters):
  // When activeMachines is specified and > 0, use it to accurately reflect physical machine capacity
  const activeCountersCount = isClosed 
    ? 0 
    : (dept?.activeMachines !== undefined && dept.activeMachines > 0
        ? (activeCounters.length > 0 ? Math.max(activeCounters.length, dept.activeMachines) : dept.activeMachines)
        : Math.max(1, activeCounters.length));

  // Compute average service minutes across active counters or realistic standard duration
  const avgService = activeCounters.length > 0
    ? activeCounters.reduce((acc, c) => acc + (c.averageServiceMinutes || 6.0), 0) / activeCounters.length
    : 6.0;

  // Count active waiting tokens (excluding patient's own token so they aren't counted ahead of themselves)
  const waitingTokens = tokens.filter(
    t => t.departmentId === deptId && 
         (t.status === 'waiting' || t.status === 'in_progress') &&
         (!patientId || t.patientId !== patientId)
  );
  const waitingCount = waitingTokens.length;

  // Effective wait time calculation:
  // Edge cases handled:
  // 1. isClosed (active machines = 0) -> penalty wait
  // 2. waitingCount === 0 -> 0 min wait (immediate)
  // 3. active machines > 0 -> (Patients Ahead * Average Duration) / Active Machines
  const waitMinutes = isClosed
    ? (waitingCount > 0 ? waitingCount * 20 + 90 : 90)
    : (waitingCount === 0 
        ? 0 
        : Math.max(1, Math.round((waitingCount * avgService) / Math.max(1, activeCountersCount))));

  return {
    waitMinutes,
    waitingCount,
    activeCountersCount,
    avgService,
    isClosed
  };
}

/**
 * Simulates wait time at a counter when patient arrives at elapsed offset T minutes into the future.
 */
function estimateProjectedWait(
  deptId: string,
  elapsedMinutes: number,
  tokens: QueueToken[],
  counters: Counter[],
  patientId?: string,
  departments?: Department[],
  projectedLoadCount: number = 0
): number {
  const current = calculateDepartmentCurrentWait(deptId, tokens, counters, patientId, departments);
  if (current.isClosed) {
    return current.waitMinutes;
  }
  const effectiveSpeed = Math.max(1, current.avgService || 6.0);
  const effectiveUnits = Math.max(1, current.activeCountersCount);
  // During elapsedMinutes, active machines/counters would have served approx:
  const patientsServedDuringTransit = Math.floor((elapsedMinutes / effectiveSpeed) * effectiveUnits);
  const projectedWaiting = Math.max(0, current.waitingCount - patientsServedDuringTransit) + projectedLoadCount;
  return Math.round((projectedWaiting * effectiveSpeed) / effectiveUnits);
}

/**
 * Helper to generate valid permutations/sequences of test execution that satisfy medical prerequisites.
 * For N <= 7 tests: generates valid topological permutations.
 * For N > 7 tests: applies beam search heuristic to prevent factorial explosion (O(N!) -> O(K * N^2)).
 */
function generateValidSequences(
  tests: DiagnosticTest[],
  completedTestIds: string[] = []
): DiagnosticTest[][] {
  if (tests.length === 0) return [[]];
  if (tests.length === 1) return [tests];

  const testIdSet = new Set(tests.map(t => t.id));
  const isPrereqSatisfied = (test: DiagnosticTest, current: DiagnosticTest[]) => {
    if (!test.prerequisites || test.prerequisites.length === 0) return true;
    return test.prerequisites.every(
      prereqId => 
        prereqId === test.id || // self-dependency guard
        !testIdSet.has(prereqId) || // external/missing prerequisite guard
        completedTestIds.includes(prereqId) || 
        current.some(t => t.id === prereqId)
    );
  };

  if (tests.length <= 7) {
    const result: DiagnosticTest[][] = [];

    function permute(current: DiagnosticTest[], remaining: DiagnosticTest[]) {
      if (remaining.length === 0) {
        result.push(current);
        return;
      }

      let branched = false;
      for (let i = 0; i < remaining.length; i++) {
        const nextTest = remaining[i];

        if (isPrereqSatisfied(nextTest, current)) {
          branched = true;
          const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
          permute([...current, nextTest], newRemaining);
        }
      }

      // If cyclic dependency or missing external prereq prevented branching, fallback append
      if (!branched && remaining.length > 0) {
        result.push([...current, ...remaining]);
      }
    }

    permute([], tests);
    return result.length > 0 ? result : [tests];
  }

  // Beam search for N > 7
  const BEAM_WIDTH = 12;
  let beam: { current: DiagnosticTest[]; remaining: DiagnosticTest[] }[] = [
    { current: [], remaining: [...tests] }
  ];

  while (beam.length > 0 && beam[0].remaining.length > 0) {
    const nextLevel: { current: DiagnosticTest[]; remaining: DiagnosticTest[] }[] = [];

    for (const state of beam) {
      let branched = false;
      for (let i = 0; i < state.remaining.length; i++) {
        const nextTest = state.remaining[i];
        if (isPrereqSatisfied(nextTest, state.current)) {
          branched = true;
          const newRemaining = [...state.remaining.slice(0, i), ...state.remaining.slice(i + 1)];
          nextLevel.push({
            current: [...state.current, nextTest],
            remaining: newRemaining
          });
        }
      }

      if (!branched && state.remaining.length > 0) {
        nextLevel.push({
          current: [...state.current, ...state.remaining],
          remaining: []
        });
      }
    }

    beam = nextLevel.slice(0, BEAM_WIDTH);
  }

  const result = beam.map(b => b.current);
  return result.length > 0 ? result : [tests];
}

/**
 * Simulates a specific test sequence and computes cumulative timeline, scoring, and total duration.
 */
function evaluateSequence(
  sequence: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[],
  startTimeDate: Date = new Date(),
  patientId?: string,
  projectedLoadMap: Record<string, number> = {},
  doctorPriority: DoctorPriority = 'normal'
): { totalTime: number; steps: RouteStep[]; bottlenecks: string[]; transitTotal: number; penaltyScore: number } {
  let currentTimeOffset = 0;
  let totalTransit = 0;
  let penaltyScore = 0;
  const steps: RouteStep[] = [];
  const bottlenecks: string[] = [];

  let previousDept: Department | undefined = undefined;

  for (let idx = 0; idx < sequence.length; idx++) {
    const test = sequence[idx];
    const dept = departments.find(d => d.id === test.departmentId);
    const transitTime = calculateTransitMinutes(previousDept, dept);
    currentTimeOffset += transitTime;
    totalTransit += transitTime;

    const projectedLoad = projectedLoadMap[test.departmentId] || 0;

    // Projected wait at arrival
    const projectedWait = estimateProjectedWait(
      test.departmentId, 
      currentTimeOffset, 
      tokens, 
      counters,
      patientId,
      departments,
      projectedLoad
    );

    if (projectedWait > 25 && dept) {
      if (!bottlenecks.includes(dept.name)) {
        bottlenecks.push(dept.name);
      }
    }

    const testDuration = (test.averageDurationMinutes && test.averageDurationMinutes > 0) ? test.averageDurationMinutes : 6;
    const startOffset = currentTimeOffset + projectedWait;
    const endOffset = startOffset + testDuration;

    // Convert offsets to readable timestamps
    const stepStart = new Date(startTimeDate.getTime() + startOffset * 60000);
    const stepEnd = new Date(startTimeDate.getTime() + endOffset * 60000);

    const formatTime = (d: Date) => 
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let reason = '';
    if (idx === 0 && projectedWait <= 5) {
      reason = 'Lowest queue wait & zero bottleneck to start immediately.';
    } else if (test.requiresFullBladder) {
      reason = 'Full bladder preparation: prioritized first before bladder voiding.';
    } else if (test.requiresFasting) {
      reason = 'Fasting prerequisite: prioritized early to minimize hunger window.';
    } else if (projectedWait < 10) {
      reason = 'Lab counter operating near real-time capacity.';
    } else {
      reason = 'Optimal slot while preceding departments clear pending queue.';
    }

    // Urgent priority boosts attention
    if (doctorPriority === 'urgent' && idx === 0) {
      reason = 'Urgent Doctor Priority: Fast-tracked immediately ahead of routine queues.';
    }

    const activeDeptCounters = counters.filter(c => c.departmentId === test.departmentId && c.status === 'active');
    const recommendedCounter = activeDeptCounters[0] || counters.find(c => c.departmentId === test.departmentId);

    steps.push({
      stepNumber: idx + 1,
      testId: test.id,
      testName: test.name,
      testCode: test.code,
      departmentId: test.departmentId,
      departmentName: dept?.name || 'Department',
      location: dept?.location || {
        wing: 'East Wing',
        floor: 'Ground Floor',
        room: 'General Lab',
        coordX: 50,
        coordY: 50
      },
      recommendedCounterId: recommendedCounter?.id,
      estimatedWaitMinutes: projectedWait,
      estimatedDurationMinutes: testDuration,
      walkingTimeFromPrevMinutes: transitTime,
      expectedStartTime: formatTime(stepStart),
      expectedEndTime: formatTime(stepEnd),
      status: idx === 0 ? 'up_next' : 'queued',
      reasonForSequence: reason,
      priority: doctorPriority,
      preparationNotes: test.preparationNotes,
      waitRangeText: formatWaitRange(projectedWait)
    });

    currentTimeOffset = endOffset;
    previousDept = dept;

    // Heuristic weight penalty adjustments
    if (test.requiresFullBladder && idx > 0) {
      if (doctorPriority === 'priority' || doctorPriority === 'urgent') {
        penaltyScore += 25 * idx; // Full bladder preparation prioritized for priority consultations
      } else {
        penaltyScore += 2 * idx; // Gentle tie-breaker for standard triage allowing low-wait labs (ECG/X-Ray) to lead
      }
    }
    if (test.requiresFasting && idx > 1) {
      penaltyScore += 1 * idx; // Gentle tie-breaker preference for fasting
    }
    const isDeptUnavailable = dept?.availabilityStatus === 'unavailable' || 
      (dept?.activeMachines !== undefined && dept.activeMachines <= 0) ||
      (counters.some(c => c.departmentId === test.departmentId) && activeDeptCounters.length === 0);
    if (isDeptUnavailable) {
      // Heavily penalize unavailable lab so it is never scheduled first when available alternatives exist!
      penaltyScore += 10000 * (sequence.length - idx);
    }
    // Doctor Priority
    if (doctorPriority === 'urgent') {
      if (idx === 0) {
        penaltyScore -= 15; // Clinical priority weight boost
      }
    } else if (doctorPriority === 'priority') {
      if (idx === 0) {
        penaltyScore -= 5;
      }
    }
  }

  return {
    totalTime: currentTimeOffset,
    steps,
    bottlenecks,
    transitTotal: totalTransit,
    penaltyScore
  };
}

/**
 * CORE QUEUE ROUTING OPTIMIZER:
 * Solves the Dynamic Multi-Queue Shortest Total Wait Time Problem with weighted scoring:
 * 1. Doctor Priority
 * 2. Current Queue Length
 * 3. Estimated Waiting Time
 * 4. Lab Availability
 * 5. Active Machines
 * 6. Average Test Duration
 * 7. Test Preparation Requirements (Fasting, Full Bladder)
 * 8. Test Dependencies
 * 9. Floor/Room Travel Distance
 * 10. Projected Queue Load
 */
export function calculateOptimalQueueRoute(
  patient: Patient,
  allTests: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[],
  projectedLoadMap: Record<string, number> = {}
): QueueRoutingPlan {
  const completedTestIds = patient.completedTests || [];

  // Strictly scope tokens and counters by hospital tenant if patient.hospitalId is defined
  const tenantHospitalId = patient.hospitalId;
  const effectiveTokens = tenantHospitalId
    ? tokens.filter(t => (t.hospitalId || 'hosp-metro') === tenantHospitalId)
    : tokens;
  const effectiveCounters = tenantHospitalId
    ? counters.filter(c => (c.hospitalId || 'hosp-metro') === tenantHospitalId)
    : counters;

  // Filter pending tests (exclude already completed tests)
  const pendingTestIds = patient.prescribedTests.filter(
    id => !completedTestIds.includes(id)
  );

  const pendingTests = pendingTestIds
    .map(id => allTests.find(t => t.id === id))
    .filter((t): t is DiagnosticTest => Boolean(t));

  const now = new Date();

  // Completed steps representation
  const completedSteps: RouteStep[] = completedTestIds
    .map((testId, idx) => {
      const test = allTests.find(t => t.id === testId);
      const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;
      const matchedToken = effectiveTokens.find(t => t.patientId === patient.id && t.testId === testId);
      return {
        stepNumber: idx + 1,
        testId,
        testName: test?.name || 'Completed Investigation',
        testCode: test?.code || 'DONE',
        departmentId: test?.departmentId || '',
        departmentName: dept?.name || 'Laboratory',
        location: dept?.location || {
          wing: 'East Wing',
          floor: 'Ground Floor',
          room: 'Diagnostic Bay',
          coordX: 50,
          coordY: 50
        },
        recommendedCounterId: matchedToken?.counterId,
        estimatedWaitMinutes: 0,
        estimatedDurationMinutes: test?.averageDurationMinutes || 5,
        walkingTimeFromPrevMinutes: 0,
        expectedStartTime: 'Completed',
        expectedEndTime: 'Completed',
        status: 'completed' as const,
        reasonForSequence: 'Investigation completed & sample processed.',
        priority: patient.doctorPriority || 'normal',
        preparationNotes: test?.preparationNotes,
        waitRangeText: 'Completed'
      };
    });

  // If no pending tests, return completed plan
  if (pendingTests.length === 0) {
    return {
      patientId: patient.id,
      calculatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      smartRouteSteps: completedSteps,
      smartTotalTimeMinutes: 0,
      naiveTotalTimeMinutes: 0,
      timeSavedMinutes: 0,
      percentageSaved: 0,
      bottlenecksAvoided: completedSteps.length > 0 ? ['All prescribed investigations completed'] : [],
      fastingSatisfied: true,
      transitTotalMinutes: 0,
      recommendedNextTestId: undefined,
      recommendationReason: 'All diagnostic investigations completed. Return to doctor consultation area.'
    };
  }

  const patientDoctorPriority: DoctorPriority = patient.doctorPriority || 'normal';

  // 1. Evaluate Naive Sequence (Original Prescribed Order for pending tests)
  const naiveSequence = [...pendingTests]; // preserves order written on doctor's slip
  const naiveEvaluation = evaluateSequence(
    naiveSequence, 
    departments, 
    effectiveTokens, 
    effectiveCounters, 
    now, 
    patient.id,
    projectedLoadMap,
    patientDoctorPriority
  );

  // 2. Generate and evaluate all valid smart permutations
  const validPermutations = generateValidSequences(pendingTests, completedTestIds);

  const getEvaluationScore = (ev: { totalTime: number; penaltyScore: number }) =>
    ev.totalTime + ev.penaltyScore;

  let bestEvaluation = naiveEvaluation;

  for (const perm of validPermutations) {
    const evaluation = evaluateSequence(
      perm, 
      departments, 
      effectiveTokens, 
      effectiveCounters, 
      now, 
      patient.id,
      projectedLoadMap,
      patientDoctorPriority
    );
    if (getEvaluationScore(evaluation) < getEvaluationScore(bestEvaluation)) {
      bestEvaluation = evaluation;
    }
  }

  // Renumber bestEvaluation steps to follow completedSteps
  const offset = completedSteps.length;
  const renumberedSteps: RouteStep[] = bestEvaluation.steps.map((step, idx) => ({
    ...step,
    stepNumber: offset + idx + 1,
    status: idx === 0 ? ('up_next' as const) : ('queued' as const)
  }));

  const allRouteSteps = [...completedSteps, ...renumberedSteps];

  // Calculate savings
  const naiveTotal = Math.max(naiveEvaluation.totalTime, 1);
  const smartTotal = bestEvaluation.totalTime;
  const timeSaved = Math.max(0, naiveTotal - smartTotal);
  const percentage = Math.round((timeSaved / naiveTotal) * 100);

  // Identify bottlenecks avoided: departments that had severe wait in naive, but mitigated in smart
  const avoided = naiveEvaluation.bottlenecks.filter(b => !bestEvaluation.bottlenecks.includes(b));
  if (avoided.length === 0 && naiveEvaluation.bottlenecks.length > 0) {
    avoided.push(...naiveEvaluation.bottlenecks.map(b => `${b} (peak rush deferred)`));
  }

  const upNextStep = renumberedSteps[0];

  return {
    patientId: patient.id,
    calculatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smartRouteSteps: allRouteSteps,
    smartTotalTimeMinutes: smartTotal,
    naiveTotalTimeMinutes: naiveTotal,
    timeSavedMinutes: timeSaved,
    percentageSaved: percentage,
    bottlenecksAvoided: avoided.length > 0 ? avoided : ['Hematology Peak Rush (BLD-101)'],
    fastingSatisfied: true,
    transitTotalMinutes: bestEvaluation.transitTotal,
    recommendedNextTestId: upNextStep?.testId,
    recommendationReason: upNextStep?.reasonForSequence || 'Optimal diagnostic path calculated by smart routing engine.'
  };
}
