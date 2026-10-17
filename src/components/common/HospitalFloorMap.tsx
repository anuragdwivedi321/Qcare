import React, { useState } from 'react';
import { 
  Compass, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Badge } from './Badge';
import { calculateDepartmentCurrentWait } from '../../engine/queueRouter';

export const HospitalFloorMap: React.FC = () => {
  const { 
    departments, 
    counters, 
    queueTokens, 
    currentRoutingPlan 
  } = useHospitalStore();

  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [activeDeptHover, setActiveDeptHover] = useState<string | null>(null);

  // Compute department wait and crowd status
  const deptStatsMap = React.useMemo(() => {
    const map = new Map<string, { waitMinutes: number; waitingCount: number; isClosed: boolean }>();
    departments.forEach(d => {
      const { waitMinutes, waitingCount, isClosed } = calculateDepartmentCurrentWait(d.id, queueTokens, counters);
      map.set(d.id, { waitMinutes, waitingCount, isClosed });
    });
    return map;
  }, [departments, queueTokens, counters]);

  // Route steps sequence
  const routeSteps = currentRoutingPlan.smartRouteSteps;
  const currentStep = routeSteps.find(s => s.status === 'up_next');

  // Filter departments by floor if selected
  const filteredDepts = selectedFloor === 'all' 
    ? departments 
    : departments.filter(d => d.location.floor.toLowerCase().includes(selectedFloor.toLowerCase()));

  // Extract ordered coordinates for the polyline route path
  const routeWaypoints = React.useMemo(() => {
    const points: { x: number; y: number; deptId: string; stepNumber: number; status: string }[] = [];
    routeSteps.forEach(step => {
      const dept = departments.find(d => d.id === step.departmentId);
      if (dept) {
        points.push({
          x: dept.location.coordX,
          y: dept.location.coordY,
          deptId: dept.id,
          stepNumber: step.stepNumber,
          status: step.status
        });
      }
    });
    return points;
  }, [routeSteps, departments]);

  const floors = [
    { id: 'all', label: 'All Floors' },
    { id: 'ground', label: 'Ground Floor' },
    { id: '1st', label: '1st Floor' },
    { id: '2nd', label: '2nd Floor' },
    { id: 'basement', label: 'Basement 1' }
  ];

  return (
    <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper space-y-4">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-paper-xs">
            <Compass className="w-5 h-5 text-teal-600 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <span>Diagnostic Floor Navigation Radar</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                SWARTH-SAARTHI ARCHITECTURE
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Live hospital blueprint with real-time waypoint routing & bottleneck indicators
            </p>
          </div>
        </div>

        {/* Floor selector tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {floors.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFloor(f.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedFloor === f.id
                  ? 'bg-white text-teal-800 shadow-paper-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Architectural Blueprint Canvas */}
      <div className="relative w-full aspect-[16/9] min-h-[340px] max-h-[460px] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 rounded-2xl border border-teal-900/60 overflow-hidden shadow-inner">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#14b8a6 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Architectural Wing Zone Labels */}
        <div className="absolute top-3 left-4 text-[10px] font-mono tracking-widest uppercase font-bold text-teal-400/40 pointer-events-none">
          [ ZONE A: EAST WING — PATHOLOGY & METABOLIC ]
        </div>
        <div className="absolute top-3 right-4 text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400/40 pointer-events-none">
          [ ZONE B: WEST WING — IMAGING & USG ]
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest uppercase font-bold text-emerald-400/40 pointer-events-none">
          [ CENTRAL TOWER & LIFTS — CARDIAC SUITE ]
        </div>

        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Wing Division Boundary Guides */}
          <line x1="48" y1="5" x2="48" y2="95" stroke="#334155" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#334155" strokeWidth="0.3" strokeDasharray="1.5 1.5" />

          {/* Waypoint Polyline connecting steps */}
          {routeWaypoints.length > 1 && (
            <polyline
              points={routeWaypoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="animate-pulse"
            />
          )}

          {/* Department Location Markers */}
          {filteredDepts.map(dept => {
            const stats = deptStatsMap.get(dept.id);
            const isTarget = currentStep?.departmentId === dept.id;
            const stepInfo = routeSteps.find(s => s.departmentId === dept.id);
            const isHovered = activeDeptHover === dept.id;

            const waitMins = stats?.waitMinutes ?? 0;
            const waitingCount = stats?.waitingCount ?? 0;

            const isBottleneck = waitingCount >= 8 || waitMins >= 25;
            const isHigh = waitingCount >= 4 || waitMins >= 15;
            const isClosed = stats?.isClosed;

            const markerColor = isClosed
              ? '#64748b'
              : isBottleneck
              ? '#f43f5e'
              : isHigh
              ? '#f59e0b'
              : '#10b981';

            return (
              <g 
                key={dept.id} 
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setActiveDeptHover(dept.id)}
                onMouseLeave={() => setActiveDeptHover(null)}
              >
                {/* Active Target Radar Pulse Ring */}
                {isTarget && (
                  <circle
                    cx={dept.location.coordX}
                    cy={dept.location.coordY}
                    r="4.5"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="0.4"
                    opacity="0.8"
                    className="animate-ping origin-center"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={dept.location.coordX}
                  cy={dept.location.coordY}
                  r={isHovered ? 3.5 : 2.5}
                  fill={markerColor}
                  fillOpacity="0.25"
                  stroke={markerColor}
                  strokeWidth="0.4"
                />

                {/* Center Core Dot */}
                <circle
                  cx={dept.location.coordX}
                  cy={dept.location.coordY}
                  r="1.2"
                  fill={markerColor}
                />

                {/* Step number badge if in route */}
                {stepInfo && (
                  <text
                    x={dept.location.coordX}
                    y={dept.location.coordY - 3.8}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="2.4"
                    fontFamily="monospace"
                    fontWeight="bold"
                    filter="url(#glow)"
                  >
                    #{stepInfo.stepNumber}
                  </text>
                )}

                {/* Department code label */}
                <text
                  x={dept.location.coordX}
                  y={dept.location.coordY + 3.8}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="2"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {dept.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Department Detail Tooltip Overlay */}
        {activeDeptHover && (() => {
          const dept = departments.find(d => d.id === activeDeptHover);
          const stats = deptStatsMap.get(activeDeptHover);
          if (!dept) return null;

          return (
            <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-teal-500/40 text-white shadow-paper-lg max-w-xs animate-fadeIn text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-teal-300">{dept.name} ({dept.code})</span>
                <Badge variant={stats?.isClosed ? 'slate' : stats && stats.waitMinutes > 20 ? 'rose' : 'emerald'} size="sm">
                  {stats?.isClosed ? 'CLOSED' : `~${stats?.waitMinutes}m Wait`}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                {dept.location.wing}, {dept.location.floor} — {dept.location.room}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                <span>Waiting: {stats?.waitingCount}</span>
                <span>•</span>
                <span>{dept.description}</span>
              </div>
            </div>
          );
        })()}

        {/* Legend strip */}
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-700/60 text-[10px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Free</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Moderate</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Bottleneck</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Up Next</span>
          </span>
        </div>
      </div>

      {/* Navigation Waypoints summary strip */}
      {currentStep && (
        <div className="p-3 bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 rounded-xl border border-teal-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-slate-700 font-medium">
              Current Immediate Target: <strong className="text-teal-900">{currentStep.testName}</strong> in <strong>{currentStep.departmentName}</strong>
            </span>
          </div>
          <span className="text-[11px] text-teal-800 font-mono font-semibold">
            Room: {currentStep.location.room} • Est. Wait: ~{currentStep.estimatedWaitMinutes}m
          </span>
        </div>
      )}
    </div>
  );
};
