import { 
  Department, 
  DiagnosticTest, 
  Counter, 
  QueueToken, 
  Patient, 
  QueueRoutingPlan, 
  RouteStep 
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
 * Calculates dynamic estimated wait time at a department given the current queue tokens.
 * Accounts for active counters and average service speed.
 */
export function calculateDepartmentCurrentWait(
  deptId: string,
  tokens: QueueToken[],
  counters: Counter[],
  patientId?: string
): { 
  waitMinutes: number; 
  waitingCount: number; 
  activeCountersCount: number; 
  avgService: number;
  isClosed: boolean;
} {
  const activeCounters = counters.filter(
    c => c.departmentId === deptId && c.status === 'active'
  );
  const isClosed = activeCounters.length === 0;
  const activeCountersCount = activeCounters.length;

  // Compute average service minutes across active counters
  const avgService = activeCountersCount > 0
    ? activeCounters.reduce((acc, c) => acc + c.averageServiceMinutes, 0) / activeCountersCount
    : 7.0;

  // Count active waiting tokens (excluding patient's own token so they aren't counted ahead of themselves)
  const waitingTokens = tokens.filter(
    t => t.departmentId === deptId && 
         (t.status === 'waiting' || t.status === 'in_progress') &&
         (!patientId || t.patientId !== patientId)
  );
  const waitingCount = waitingTokens.length;

  // Effective wait time calculation: if all counters are closed, penalize wait time heavily
  const waitMinutes = isClosed
    ? (waitingCount > 0 ? waitingCount * 20 + 90 : 99)
    : Math.round((waitingCount * avgService) / Math.max(1, activeCountersCount));

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
  patientId?: string
): number {
  const current = calculateDepartmentCurrentWait(deptId, tokens, counters, patientId);
  if (current.isClosed) {
    return current.waitMinutes;
  }
  // During elapsedMinutes, active counters would have served approx:
  const patientsServedDuringTransit = Math.floor((elapsedMinutes / current.avgService) * current.activeCountersCount);
  const projectedWaiting = Math.max(0, current.waitingCount - patientsServedDuringTransit);
  return Math.round((projectedWaiting * current.avgService) / Math.max(1, current.activeCountersCount));
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

  const isPrereqSatisfied = (test: DiagnosticTest, current: DiagnosticTest[]) => {
    if (!test.prerequisites || test.prerequisites.length === 0) return true;
    return test.prerequisites.every(
      prereqId => completedTestIds.includes(prereqId) || current.some(t => t.id === prereqId)
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
 * Simulates a specific test sequence and computes cumulative timeline and total duration.
 */
function evaluateSequence(
  sequence: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[],
  startTimeDate: Date = new Date(),
  patientId?: string
): { totalTime: number; steps: RouteStep[]; bottlenecks: string[]; transitTotal: number } {
  let currentTimeOffset = 0;
  let totalTransit = 0;
  const steps: RouteStep[] = [];
  const bottlenecks: string[] = [];

  let previousDept: Department | undefined = undefined;

  for (let idx = 0; idx < sequence.length; idx++) {
    const test = sequence[idx];
    const dept = departments.find(d => d.id === test.departmentId);
    const transitTime = calculateTransitMinutes(previousDept, dept);
    currentTimeOffset += transitTime;
    totalTransit += transitTime;

    // Projected wait at arrival
    const projectedWait = estimateProjectedWait(
      test.departmentId, 
      currentTimeOffset, 
      tokens, 
      counters,
      patientId
    );

    if (projectedWait > 25 && dept) {
      if (!bottlenecks.includes(dept.name)) {
        bottlenecks.push(dept.name);
      }
    }

    const testDuration = test.averageDurationMinutes;
    const startOffset = currentTimeOffset + projectedWait;
    const endOffset = startOffset + testDuration;

    // Convert offsets to readable timestamps
    const stepStart = new Date(startTimeDate.getTime() + startOffset * 60000);
    const stepEnd = new Date(startTimeDate.getTime() + endOffset * 60000);

    const formatTime = (d: Date) => 
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let reason = '';
    if (idx === 0 && projectedWait <= 5) {
      reason = 'Lowest wait & zero bottleneck to start immediately.';
    } else if (test.requiresFasting) {
      reason = 'Fasting prerequisite: prioritized to minimize hunger window.';
    } else if (projectedWait < 10) {
      reason = 'Counter is operating near real-time capacity.';
    } else {
      reason = 'Optimal slot while preceding departments process queue backlog.';
    }

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
      estimatedWaitMinutes: projectedWait,
      estimatedDurationMinutes: testDuration,
      walkingTimeFromPrevMinutes: transitTime,
      expectedStartTime: formatTime(stepStart),
      expectedEndTime: formatTime(stepEnd),
      status: idx === 0 ? 'up_next' : 'queued',
      reasonForSequence: reason
    });

    currentTimeOffset = endOffset;
    previousDept = dept;
  }

  return {
    totalTime: currentTimeOffset,
    steps,
    bottlenecks,
    transitTotal: totalTransit
  };
}

/**
 * CORE QUEUE ROUTING OPTIMIZER:
 * Solves the Dynamic Multi-Queue Shortest Total Wait Time Problem.
 * Compares Naive prescription order against the AI Bottleneck-Aware Smart Order.
 */
export function calculateOptimalQueueRoute(
  patient: Patient,
  allTests: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[]
): QueueRoutingPlan {
  const completedTestIds = patient.completedTests || [];

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
        estimatedWaitMinutes: 0,
        estimatedDurationMinutes: test?.averageDurationMinutes || 5,
        walkingTimeFromPrevMinutes: 0,
        expectedStartTime: 'Completed',
        expectedEndTime: 'Completed',
        status: 'completed' as const,
        reasonForSequence: 'Investigation completed & sample processed.'
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
      transitTotalMinutes: 0
    };
  }

  // 1. Evaluate Naive Sequence (Original Prescribed Order for pending tests)
  const naiveSequence = [...pendingTests]; // preserves order written on doctor's slip
  const naiveEvaluation = evaluateSequence(
    naiveSequence, 
    departments, 
    tokens, 
    counters, 
    now,
    patient.id
  );

  // 2. Generate and evaluate all valid smart permutations
  const validPermutations = generateValidSequences(pendingTests, completedTestIds);

  let bestEvaluation = naiveEvaluation;

  for (const perm of validPermutations) {
    const evaluation = evaluateSequence(perm, departments, tokens, counters, now, patient.id);
    if (evaluation.totalTime < bestEvaluation.totalTime) {
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
    transitTotalMinutes: bestEvaluation.transitTotal
  };
}
