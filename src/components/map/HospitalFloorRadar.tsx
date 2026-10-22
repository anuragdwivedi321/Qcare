import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  Navigation, 
  AlertCircle,
  Check,
  Compass,
  CornerDownRight
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { RouteStep } from '../../types';

interface HospitalFloorRadarProps {
  onClose?: () => void;
}

type FloorKey = 'Ground Floor' | '1st Floor' | '2nd Floor' | 'Basement 1';

export const HospitalFloorRadar: React.FC<HospitalFloorRadarProps> = ({ onClose }) => {
  const { 
    departments, 
    counters, 
    queueTokens, 
    selectedPatient, 
    currentRoutingPlan,
    tests,
    markTestCompletedByPatient
  } = useHospitalStore();

  // Find the patient's current upcoming diagnostic test
  const upNextStep = useMemo(() => {
    return currentRoutingPlan.smartRouteSteps.find(
      (s: RouteStep) => !selectedPatient?.completedTests.includes(s.testId)
    );
  }, [currentRoutingPlan.smartRouteSteps, selectedPatient?.completedTests]);

  // Default active floor to the floor of the upcoming test, or Ground Floor
  const initialFloor: FloorKey = (upNextStep?.location.floor as FloorKey) || 'Ground Floor';
  const [activeFloor, setActiveFloor] = useState<FloorKey>(initialFloor);

  // Selected department for inspection deck (defaults to upcoming test dept)
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    return upNextStep?.departmentId || 'dept-ultrasound';
  });

  // Calculate live statistics for all departments with realistic wait times (NO 99m fallback!)
  const deptStats = useMemo(() => {
    return departments.map(dept => {
      const deptCounters = counters.filter(c => c.departmentId === dept.id);
      const activeCounters = deptCounters.filter(c => c.status === 'active');
      const waitingTokens = queueTokens.filter(t => t.departmentId === dept.id && (t.status === 'waiting' || t.status === 'in_progress'));
      
      const effectiveCountersCount = Math.max(1, activeCounters.length);
      const avgDuration = activeCounters.length > 0 && activeCounters[0].averageServiceMinutes
        ? activeCounters[0].averageServiceMinutes
        : 6.0;

      // Realistic wait time: 0 if no queue, else (waitingCount * avgDuration) / counters
      const waitMins = waitingTokens.length === 0
        ? 0
        : Math.max(4, Math.round((waitingTokens.length * avgDuration) / effectiveCountersCount));

      return {
        dept,
        deptCounters,
        activeCounters,
        waitingTokens,
        waitMins
      };
    });
  }, [departments, counters, queueTokens]);

  // Selected department details
  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const selectedStats = deptStats.find(s => s.dept.id === selectedDept?.id);

  // Check if patient has prescribed test in selected room
  const matchingPatientStep = currentRoutingPlan.smartRouteSteps.find(
    (s: RouteStep) => s.departmentId === selectedDept?.id
  );
  const isStepDone = matchingPatientStep 
    ? selectedPatient?.completedTests.includes(matchingPatientStep.testId) 
    : false;

  const matchingTest = tests.find(t => t.departmentId === selectedDept?.id);

  // Helper to format floor button count
  const getFloorRoomCount = (floor: FloorKey) => {
    return departments.filter(d => d.location.floor === floor).length;
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 relative overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Hospital Indoor Wayfinding & Blueprint</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Architectural floor plan with live walking paths and real-time room queues.
            </p>
          </div>
        </div>

        {/* Floor Level Selector Tabs (Realistic Floor Navigation) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs overflow-x-auto max-w-full">
          {(['Ground Floor', '1st Floor', '2nd Floor', 'Basement 1'] as const).map(f => {
            const count = getFloorRoomCount(f);
            const isTargetFloor = upNextStep?.location.floor === f;

            return (
              <button
                key={f}
                onClick={() => {
                  setActiveFloor(f);
                  const firstDeptOnFloor = departments.find(d => d.location.floor === f);
                  if (firstDeptOnFloor) setSelectedDeptId(firstDeptOnFloor.id);
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold flex items-center gap-1.5 ${
                  activeFloor === f
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{f}</span>
                {isTargetFloor && (
                  <span className={`w-2 h-2 rounded-full ${activeFloor === f ? 'bg-amber-300 animate-ping' : 'bg-blue-500'}`} />
                )}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeFloor === f ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count} labs
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Architectural Floor Plan Canvas (viewBox="0 0 920 480") */}
      <div className="relative w-full bg-slate-900 rounded-2xl border border-slate-800 p-2 sm:p-4 select-none overflow-hidden shadow-lg">
        <svg 
          viewBox="0 0 920 480" 
          className="w-full h-auto max-h-[460px] drop-shadow-md"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Blueprint Grid Pattern */}
          <defs>
            <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
            </pattern>
            {/* Animated Walking Dots */}
            <linearGradient id="walkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* Background Outer Floor Foundation */}
          <rect x="10" y="10" width="900" height="460" rx="24" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="10" y="10" width="900" height="460" rx="24" fill="url(#blueprintGrid)" />

          {/* Central Main Walking Hallway / Corridor */}
          <rect x="360" y="30" width="200" height="420" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="460" y="55" fill="#64748b" fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="2">
            CENTRAL CORRIDOR
          </text>

          {/* Central Elevator Bank */}
          <g transform="translate(390, 80)">
            <rect width="140" height="85" rx="14" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <text x="70" y="35" fill="#94a3b8" fontSize="18" textAnchor="middle">🛗</text>
            <text x="70" y="55" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
              Central Elevators
            </text>
            <text x="70" y="70" fill="#64748b" fontSize="9" textAnchor="middle">
              Connects to B1, G, 1F, 2F
            </text>
          </g>

          {/* Restrooms & Water Point */}
          <g transform="translate(390, 185)">
            <rect width="140" height="60" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <text x="70" y="28" fill="#94a3b8" fontSize="14" textAnchor="middle">🚻 💧</text>
            <text x="70" y="46" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
              Restrooms & Drinking Water
            </text>
          </g>

          {/* ============================================================== */}
          {/* FLOOR SPECIFIC ARCHITECTURAL ROOM LAYOUTS                     */}
          {/* ============================================================== */}

          {/* 1. GROUND FLOOR */}
          {activeFloor === 'Ground Floor' && (
            <>
              {/* Main Reception & Check-in Desk (Start Point) */}
              <g transform="translate(380, 275)">
                <rect width="160" height="120" rx="16" fill="#172554" stroke="#2563eb" strokeWidth="2" />
                <text x="80" y="38" fill="#60a5fa" fontSize="20" textAnchor="middle">🏥</text>
                <text x="80" y="65" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  Main Reception Desk
                </text>
                <text x="80" y="82" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
                  OPD Registration & Triage
                </text>
                {/* You are here marker */}
                <rect x="25" y="92" width="110" height="18" rx="9" fill="#2563eb" />
                <text x="80" y="105" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                  📍 YOU ARE HERE
                </text>
              </g>

              {/* Room G-102: Blood Collection / Phlebotomy (East Wing Top) */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-pathology');
                const stats = deptStats.find(s => s.dept.id === 'dept-pathology');
                const isSelected = selectedDeptId === 'dept-pathology';
                const isTarget = upNextStep?.departmentId === 'dept-pathology';
                const isDone = selectedPatient?.completedTests.includes('test-cbc');

                return (
                  <g 
                    transform="translate(40, 60)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-pathology')}
                  >
                    <rect 
                      width="300" 
                      height="170" 
                      rx="18" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    {/* Doorway to Corridor */}
                    <rect x="290" y="65" width="15" height="40" fill="#1e293b" />

                    {/* Room Header Pill */}
                    <rect x="20" y="20" width="120" height="22" rx="11" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" />
                    <text x="80" y="35" fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ROOM G-102 • EAST
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 20)">
                        <rect width="80" height="22" rx="11" fill="#065f46" stroke="#10b981" />
                        <text x="40" y="35" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(180, 20)">
                        <rect width="100" height="22" rx="11" fill="#78350f" stroke="#f59e0b" />
                        <text x="50" y="35" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    {/* Room Title */}
                    <text x="20" y="75" fill="#ffffff" fontSize="14" fontWeight="bold">
                      {dept?.name || 'Blood Sample Collection'}
                    </text>
                    <text x="20" y="95" fill="#94a3b8" fontSize="11">
                      Phlebotomy Bay • CBC, Serum & Lipid
                    </text>

                    {/* Live Queue Pill */}
                    <rect x="20" y="115" width="260" height="34" rx="12" fill="#1e293b" />
                    <text x="35" y="136" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="260" y="136" fill="#38bdf8" fontSize="11" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 5} mins
                    </text>
                  </g>
                );
              })()}

              {/* Room G-106: Biochemistry & Metabolic Wing (East Wing Bottom) */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-biochem');
                const stats = deptStats.find(s => s.dept.id === 'dept-biochem');
                const isSelected = selectedDeptId === 'dept-biochem';
                const isTarget = upNextStep?.departmentId === 'dept-biochem';
                const isDone = selectedPatient?.completedTests.includes('test-fbs');

                return (
                  <g 
                    transform="translate(40, 255)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-biochem')}
                  >
                    <rect 
                      width="300" 
                      height="170" 
                      rx="18" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    {/* Doorway */}
                    <rect x="290" y="65" width="15" height="40" fill="#1e293b" />

                    <rect x="20" y="20" width="120" height="22" rx="11" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" />
                    <text x="80" y="35" fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ROOM G-106 • EAST
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 20)">
                        <rect width="80" height="22" rx="11" fill="#065f46" stroke="#10b981" />
                        <text x="40" y="35" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(180, 20)">
                        <rect width="100" height="22" rx="11" fill="#78350f" stroke="#f59e0b" />
                        <text x="50" y="35" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    <text x="20" y="75" fill="#ffffff" fontSize="14" fontWeight="bold">
                      {dept?.name || 'Biochemistry & Metabolic'}
                    </text>
                    <text x="20" y="95" fill="#94a3b8" fontSize="11">
                      Fasting Glucose, HbA1c & Profiles
                    </text>

                    <rect x="20" y="115" width="260" height="34" rx="12" fill="#1e293b" />
                    <text x="35" y="136" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="260" y="136" fill="#38bdf8" fontSize="11" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 6} mins
                    </text>
                  </g>
                );
              })()}

              {/* Room G-215: Ultrasonography & Doppler Suite (West Wing Top) */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-ultrasound');
                const stats = deptStats.find(s => s.dept.id === 'dept-ultrasound');
                const isSelected = selectedDeptId === 'dept-ultrasound';
                const isTarget = upNextStep?.departmentId === 'dept-ultrasound';
                const isDone = selectedPatient?.completedTests.includes('test-usg-abdomen');

                return (
                  <g 
                    transform="translate(580, 60)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-ultrasound')}
                  >
                    <rect 
                      width="300" 
                      height="170" 
                      rx="18" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    {/* Doorway */}
                    <rect x="-5" y="65" width="15" height="40" fill="#1e293b" />

                    <rect x="20" y="20" width="120" height="22" rx="11" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
                    <text x="80" y="35" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ROOM G-215 • WEST
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 20)">
                        <rect width="80" height="22" rx="11" fill="#065f46" stroke="#10b981" />
                        <text x="40" y="35" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(180, 20)">
                        <rect width="100" height="22" rx="11" fill="#78350f" stroke="#f59e0b" />
                        <text x="50" y="35" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    <text x="20" y="75" fill="#ffffff" fontSize="14" fontWeight="bold">
                      {dept?.name || 'Ultrasonography Suite'}
                    </text>
                    <text x="20" y="95" fill="#94a3b8" fontSize="11">
                      Whole Abdomen & Pelvic USG
                    </text>

                    <rect x="20" y="115" width="260" height="34" rx="12" fill="#1e293b" />
                    <text x="35" y="136" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="260" y="136" fill="#38bdf8" fontSize="11" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 12} mins
                    </text>
                  </g>
                );
              })()}

              {/* Patient Waiting Lounge (West Wing Bottom) */}
              <g transform="translate(580, 255)">
                <rect width="300" height="170" rx="18" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <rect x="-5" y="65" width="15" height="40" fill="#1e293b" />
                <rect x="20" y="20" width="130" height="22" rx="11" fill="#334155" />
                <text x="85" y="35" fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle">
                  CENTRAL LOUNGE
                </text>
                <text x="20" y="75" fill="#ffffff" fontSize="14" fontWeight="bold">
                  Diagnostic Waiting Area
                </text>
                <text x="20" y="95" fill="#94a3b8" fontSize="11">
                  Chime Audio & Digital Screen Displays
                </text>
                <rect x="20" y="115" width="260" height="34" rx="12" fill="#1e293b" />
                <text x="35" y="136" fill="#94a3b8" fontSize="11">
                  Seating capacity: 40 seats • Air conditioned
                </text>
              </g>

              {/* Animated Walking Path from Reception to Target Room */}
              {upNextStep?.departmentId === 'dept-ultrasound' && (
                <path 
                  d="M 460 300 L 460 145 L 575 145" 
                  fill="none" 
                  stroke="url(#walkGrad)" 
                  strokeWidth="4" 
                  strokeDasharray="8 6" 
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              )}
              {upNextStep?.departmentId === 'dept-pathology' && (
                <path 
                  d="M 460 300 L 460 145 L 345 145" 
                  fill="none" 
                  stroke="url(#walkGrad)" 
                  strokeWidth="4" 
                  strokeDasharray="8 6" 
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              )}
              {upNextStep?.departmentId === 'dept-biochem' && (
                <path 
                  d="M 460 320 L 460 340 L 345 340" 
                  fill="none" 
                  stroke="url(#walkGrad)" 
                  strokeWidth="4" 
                  strokeDasharray="8 6" 
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              )}
            </>
          )}

          {/* 2. 1ST FLOOR */}
          {activeFloor === '1st Floor' && (
            <>
              {/* Room 104-A: Cardiology Diagnostic Suite (ECG) */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-cardio');
                const stats = deptStats.find(s => s.dept.id === 'dept-cardio');
                const isSelected = selectedDeptId === 'dept-cardio';
                const isTarget = upNextStep?.departmentId === 'dept-cardio';
                const isDone = selectedPatient?.completedTests.includes('test-ecg');

                return (
                  <g 
                    transform="translate(40, 100)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-cardio')}
                  >
                    <rect 
                      width="310" 
                      height="260" 
                      rx="20" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    <rect x="300" y="110" width="15" height="40" fill="#1e293b" />

                    <rect x="25" y="25" width="140" height="24" rx="12" fill="#2563eb" fillOpacity="0.2" stroke="#2563eb" />
                    <text x="95" y="41" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">
                      ROOM 104-A • 1ST FLOOR
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 25)">
                        <rect width="85" height="24" rx="12" fill="#065f46" stroke="#10b981" />
                        <text x="42" y="41" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(185, 25)">
                        <rect width="105" height="24" rx="12" fill="#78350f" stroke="#f59e0b" />
                        <text x="52" y="41" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                      {dept?.name || 'Cardiology Diagnostic Suite'}
                    </text>
                    <text x="25" y="110" fill="#94a3b8" fontSize="12">
                      12-Lead Digital ECG & Rhythm Analysis
                    </text>

                    <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                    <text x="40" y="175" fill="#cbd5e1" fontSize="12" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="265" y="175" fill="#38bdf8" fontSize="13" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 8} mins
                    </text>
                  </g>
                );
              })()}

              {/* 1st Floor Central Nurse Hub */}
              <g transform="translate(390, 275)">
                <rect width="140" height="120" rx="16" fill="#1e293b" stroke="#334155" />
                <text x="70" y="40" fill="#94a3b8" fontSize="18" textAnchor="middle">👩‍⚕️</text>
                <text x="70" y="65" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  1st Floor Nurse Hub
                </text>
                <text x="70" y="85" fill="#64748b" fontSize="9" textAnchor="middle">
                  Vitals & Token Screen
                </text>
              </g>

              {/* Room OPD-108: Internal Medicine Consultation */}
              <g transform="translate(570, 100)">
                <rect width="310" height="260" rx="20" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <rect x="-5" y="110" width="15" height="40" fill="#1e293b" />
                <rect x="25" y="25" width="140" height="24" rx="12" fill="#334155" />
                <text x="95" y="41" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle">
                  OPD-108 • EAST WING
                </text>
                <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                  Internal Medicine OPD
                </text>
                <text x="25" y="110" fill="#94a3b8" fontSize="12">
                  Dr. Priya Shenoy (Head of Medicine)
                </text>
                <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                <text x="40" y="175" fill="#94a3b8" fontSize="12">
                  Consultation Chamber • In Session
                </text>
              </g>

              {/* Animated Path from Elevators to ECG */}
              {upNextStep?.departmentId === 'dept-cardio' && (
                <path 
                  d="M 460 165 L 460 230 L 350 230" 
                  fill="none" 
                  stroke="url(#walkGrad)" 
                  strokeWidth="4" 
                  strokeDasharray="8 6" 
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              )}
            </>
          )}

          {/* 3. 2ND FLOOR */}
          {activeFloor === '2nd Floor' && (
            <>
              {/* Room 208: Ophthalmic Diagnostics & Retina Scan */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-ophthalmology');
                const stats = deptStats.find(s => s.dept.id === 'dept-ophthalmology');
                const isSelected = selectedDeptId === 'dept-ophthalmology';
                const isTarget = upNextStep?.departmentId === 'dept-ophthalmology';
                const isDone = selectedPatient?.completedTests.includes('test-oct-retina');

                return (
                  <g 
                    transform="translate(40, 100)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-ophthalmology')}
                  >
                    <rect 
                      width="310" 
                      height="260" 
                      rx="20" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    <rect x="300" y="110" width="15" height="40" fill="#1e293b" />

                    <rect x="25" y="25" width="140" height="24" rx="12" fill="#4f46e5" fillOpacity="0.2" stroke="#4f46e5" />
                    <text x="95" y="41" fill="#c7d2fe" fontSize="11" fontWeight="bold" textAnchor="middle">
                      ROOM 208 • 2ND FLOOR
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 25)">
                        <rect width="85" height="24" rx="12" fill="#065f46" stroke="#10b981" />
                        <text x="42" y="41" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(185, 25)">
                        <rect width="105" height="24" rx="12" fill="#78350f" stroke="#f59e0b" />
                        <text x="52" y="41" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                      {dept?.name || 'Ophthalmic Diagnostics'}
                    </text>
                    <text x="25" y="110" fill="#94a3b8" fontSize="12">
                      Digital Fundus & OCT Retinal Scans
                    </text>

                    <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                    <text x="40" y="175" fill="#cbd5e1" fontSize="12" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="265" y="175" fill="#38bdf8" fontSize="13" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 10} mins
                    </text>
                  </g>
                );
              })()}

              {/* Room OPD-204: Doctor Chamber */}
              <g transform="translate(570, 100)">
                <rect width="310" height="260" rx="20" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <rect x="-5" y="110" width="15" height="40" fill="#1e293b" />
                <rect x="25" y="25" width="140" height="24" rx="12" fill="#334155" />
                <text x="95" y="41" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle">
                  OPD-204 • CENTRAL
                </text>
                <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                  Cardiology OPD Doctor Chamber
                </text>
                <text x="25" y="110" fill="#94a3b8" fontSize="12">
                  Dr. Arvind Swaminathan (Consultant)
                </text>
                <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                <text x="40" y="175" fill="#94a3b8" fontSize="12">
                  Final Consultation & Report Sign-Off
                </text>
              </g>
            </>
          )}

          {/* 4. BASEMENT 1 */}
          {activeFloor === 'Basement 1' && (
            <>
              {/* Room B1-08: Radiology & Digital X-Ray Vault */}
              {(() => {
                const dept = departments.find(d => d.id === 'dept-radiology');
                const stats = deptStats.find(s => s.dept.id === 'dept-radiology');
                const isSelected = selectedDeptId === 'dept-radiology';
                const isTarget = upNextStep?.departmentId === 'dept-radiology';
                const isDone = selectedPatient?.completedTests.includes('test-xray-chest');

                return (
                  <g 
                    transform="translate(40, 100)" 
                    className="cursor-pointer"
                    onClick={() => setSelectedDeptId('dept-radiology')}
                  >
                    <rect 
                      width="310" 
                      height="260" 
                      rx="20" 
                      fill={isSelected ? '#1e3a8a' : '#0f172a'} 
                      stroke={isSelected ? '#3b82f6' : isTarget ? '#f59e0b' : isDone ? '#10b981' : '#334155'} 
                      strokeWidth={isSelected || isTarget ? '3' : '1.5'} 
                    />
                    <rect x="300" y="110" width="15" height="40" fill="#1e293b" />

                    <rect x="25" y="25" width="160" height="24" rx="12" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" />
                    <text x="105" y="41" fill="#ddd6fe" fontSize="10" fontWeight="bold" textAnchor="middle">
                      VAULT B1-08 • LEAD SHIELDED
                    </text>

                    {isDone ? (
                      <g transform="translate(200, 25)">
                        <rect width="85" height="24" rx="12" fill="#065f46" stroke="#10b981" />
                        <text x="42" y="41" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">
                          ✓ DONE
                        </text>
                      </g>
                    ) : isTarget ? (
                      <g transform="translate(185, 25)">
                        <rect width="105" height="24" rx="12" fill="#78350f" stroke="#f59e0b" />
                        <text x="52" y="41" fill="#fde68a" fontSize="10" fontWeight="black" textAnchor="middle">
                          ⚡ NEXT STOP
                        </text>
                      </g>
                    ) : null}

                    <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                      {dept?.name || 'Digital X-Ray Vault'}
                    </text>
                    <text x="25" y="110" fill="#94a3b8" fontSize="12">
                      Low-Dose Chest PA & Skeletal Radiography
                    </text>

                    <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                    <text x="40" y="175" fill="#cbd5e1" fontSize="12" fontWeight="bold">
                      Queue: {stats?.waitingTokens.length || 0} waiting
                    </text>
                    <text x="265" y="175" fill="#38bdf8" fontSize="13" fontWeight="black" textAnchor="end">
                      ~{stats?.waitMins || 7} mins
                    </text>
                  </g>
                );
              })()}

              {/* CT Scan & Fluoroscopy Suite */}
              <g transform="translate(570, 100)">
                <rect width="310" height="260" rx="20" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <rect x="-5" y="110" width="15" height="40" fill="#1e293b" />
                <rect x="25" y="25" width="160" height="24" rx="12" fill="#334155" />
                <text x="105" y="41" fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle">
                  VAULT B1-12 • RADIOLOGY
                </text>
                <text x="25" y="85" fill="#ffffff" fontSize="16" fontWeight="bold">
                  CT Scan & Imaging Suite
                </text>
                <text x="25" y="110" fill="#94a3b8" fontSize="12">
                  High-Speed 128-Slice Spiral Scanner
                </text>
                <rect x="25" y="150" width="260" height="40" rx="14" fill="#1e293b" />
                <text x="40" y="175" fill="#94a3b8" fontSize="12">
                  Scheduled inpatient procedures
                </text>
              </g>

              {/* Path from Elevator to X-Ray */}
              {upNextStep?.departmentId === 'dept-radiology' && (
                <path 
                  d="M 460 165 L 460 230 L 350 230" 
                  fill="none" 
                  stroke="url(#walkGrad)" 
                  strokeWidth="4" 
                  strokeDasharray="8 6" 
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              )}
            </>
          )}
        </svg>
      </div>

      {/* Dedicated Room Inspection & Turn-by-Turn Wayfinding Deck (Pinned below SVG) */}
      {selectedDept && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {selectedDept.location.room}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedDept.location.floor} • {selectedDept.location.wing}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedDept.name}
                </h3>
              </div>
            </div>

            {/* Live Queue & Realistic Wait Time */}
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Waiting Ahead</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedStats?.waitingTokens.length || 0} Patients</span>
                </span>
              </div>
              <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Estimated Wait</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{selectedStats?.waitMins || 6} Mins</span>
                </span>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Wayfinding & Preparation Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Step-by-Step Directions */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Turn-by-Turn Walking Directions:</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium flex items-start gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {activeFloor === 'Ground Floor' 
                    ? `From Main Reception, head straight past the central corridor towards ${selectedDept.location.wing}. Enter ${selectedDept.location.room}.`
                    : `Take Central Elevators to ${selectedDept.location.floor}. Exit toward ${selectedDept.location.wing} hallway to ${selectedDept.location.room}.`}
                </span>
              </p>
            </div>

            {/* Preparation Rules */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Preparation Instructions:</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                {matchingTest?.preparationNotes || 
                  'Please wait outside until your token chimes over the speaker. Keep your digital boarding pass ready.'}
              </p>
            </div>
          </div>

          {/* Patient Self-Action: Mark Completed if report already held */}
          {matchingPatientStep && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
              <div className="text-xs text-slate-600">
                {isStepDone ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>This test is already completed and verified!</span>
                  </span>
                ) : (
                  <span>Already completed this test earlier or hold an external report?</span>
                )}
              </div>

              {!isStepDone && selectedPatient && (
                <button
                  type="button"
                  onClick={() => {
                    markTestCompletedByPatient(
                      selectedPatient.id, 
                      matchingPatientStep.testId,
                      'Patient marked done from Hospital Map'
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>I Have This Report • Mark Done</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend & Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Selected Room</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Current Next Stop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed Test</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
};
