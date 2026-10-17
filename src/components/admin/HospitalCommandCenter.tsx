import React from 'react';
import { 
  AlertTriangle, 
  Zap, 
  FastForward, 
  Activity, 
  MapPin, 
  Server
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Badge } from '../common/Badge';
import { calculateDepartmentCurrentWait } from '../../engine/queueRouter';
import { HospitalFloorMap } from '../common/HospitalFloorMap';

export const HospitalCommandCenter: React.FC = () => {
  const {
    departments,
    counters,
    queueTokens,
    simulateRush,
    advanceAllCounters,
    toggleCounterStatus,
    cumulativeTimeSavedMinutes
  } = useHospitalStore();

  // Compute live queue depth and congestion for each department
  const deptStats = departments.map(dept => {
    const { waitMinutes, waitingCount, activeCountersCount, avgService } = 
      calculateDepartmentCurrentWait(dept.id, queueTokens, counters);

    let congestion: 'low' | 'moderate' | 'high' | 'bottleneck' = 'low';
    if (waitingCount >= 8 || waitMinutes >= 25) {
      congestion = 'bottleneck';
    } else if (waitingCount >= 4 || waitMinutes >= 15) {
      congestion = 'high';
    } else if (waitingCount >= 2) {
      congestion = 'moderate';
    }

    return {
      dept,
      waitingCount,
      activeCountersCount,
      waitMinutes,
      avgService,
      congestion
    };
  });

  const bottleneckDepts = deptStats.filter(s => s.congestion === 'bottleneck');
  const totalWaiting = deptStats.reduce((acc, s) => acc + s.waitingCount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Command Center Title & Top KPI Strip */}
      <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-slate-900">
              Hospital Multi-Queue Command Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              LIVE RADAR
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Diagnostic floor operations, dynamic congestion avoidance & failover management
          </p>
        </div>

        {/* Global KPI Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Waiting</span>
            <strong className="text-slate-900 font-bold font-mono text-base">{totalWaiting} Patients</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs">
            <span className="text-teal-700 block text-[10px] font-semibold uppercase">Net Wait Time Saved</span>
            <strong className="text-teal-900 font-bold font-mono text-base">{cumulativeTimeSavedMinutes} Mins</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <span className="text-rose-700 block text-[10px] font-semibold uppercase">Active Bottlenecks</span>
            <strong className="text-rose-900 font-bold font-mono text-base">{bottleneckDepts.length} Labs</strong>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTLENECK RADAR & AI ADVISORY ALERT                      */}
      {/* ========================================================= */}
      {bottleneckDepts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white rounded-card p-5 border border-rose-700/60 shadow-paper-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-rose-200">
                    Critical Congestion Surge Detected at {bottleneckDepts.map(b => b.dept.name).join(', ')}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/40 font-bold">
                    RE-ROUTING ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Q-Care dynamic engine is actively diverting multi-test patients away from {bottleneckDepts[0].dept.code} towards under-utilized counters (ECG & Digital X-Ray). This prevents corridor bottlenecks and balances hospital floor load.
                </p>
              </div>
            </div>

            <button
              onClick={advanceAllCounters}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-paper-sm shrink-0 transition-all"
            >
              <FastForward className="w-4 h-4" />
              <span>Advance All Counters Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Floor Map Blueprint */}
      <HospitalFloorMap />

      {/* ========================================================= */}
      {/* LIVE DEPARTMENT QUEUE RADAR GRID                          */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>Diagnostic Floors & Department Queue Radar</span>
          </h3>
          <span className="text-xs text-slate-500">Live Heatmap Indicators</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deptStats.map(stat => {
            const isBottleneck = stat.congestion === 'bottleneck';
            const isHigh = stat.congestion === 'high';
            const isLow = stat.congestion === 'low';

            return (
              <div
                key={stat.dept.id}
                className={`bg-white rounded-card p-5 border transition-all ${
                  isBottleneck
                    ? 'border-rose-400 shadow-paper-lg ring-2 ring-rose-400/20'
                    : isHigh
                    ? 'border-amber-300 shadow-paper'
                    : 'border-slate-200 shadow-paper-xs'
                }`}
              >
                {/* Department Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {stat.dept.code}
                    </span>
                    <h4 className="font-display font-bold text-base text-slate-900 leading-tight">
                      {stat.dept.name}
                    </h4>
                  </div>

                  <Badge
                    variant={
                      isBottleneck
                        ? 'rose'
                        : isHigh
                        ? 'amber'
                        : isLow
                        ? 'emerald'
                        : 'slate'
                    }
                  >
                    {stat.congestion.toUpperCase()}
                  </Badge>
                </div>

                {/* Location */}
                <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{stat.dept.location.wing}, {stat.dept.location.floor} ({stat.dept.location.room})</span>
                </div>

                {/* Real-time metrics grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">WAITING</span>
                    <strong className={`font-mono text-base font-extrabold ${isBottleneck ? 'text-rose-700' : 'text-slate-900'}`}>
                      {stat.waitingCount}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">COUNTERS</span>
                    <strong className="font-mono text-base font-extrabold text-slate-900">
                      {stat.activeCountersCount} Active
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">EST. WAIT</span>
                    <strong className={`font-mono text-base font-extrabold ${isBottleneck ? 'text-rose-700' : 'text-teal-700'}`}>
                      ~{stat.waitMinutes}m
                    </strong>
                  </div>
                </div>

                {/* Simulation Spike Button for this Counter */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Avg Service: {stat.avgService} min
                  </span>

                  <button
                    onClick={() => simulateRush(stat.dept.id, 5)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-all"
                    title={`Simulate 5 incoming patients to ${stat.dept.name}`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>+5 Surge</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIMULATION BENCH & COUNTER FAILOVER CONTROLS              */}
      {/* ========================================================= */}
      <div className="bg-white rounded-card p-6 border border-slate-200 shadow-paper space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-600" />
            <h3 className="font-display font-bold text-base text-slate-900">
              Diagnostic Counter Failover & Capacity Management
            </h3>
          </div>
          <span className="text-xs text-slate-500">Toggle counters on/off to test dynamic load rebalancing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {counters.map(c => {
            const d = departments.find(dept => dept.id === c.departmentId);
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-xs text-slate-900">{c.name}</h5>
                  <p className="text-[11px] text-slate-500">{d?.code} • {c.technicianName.split(' ')[0]}</p>
                </div>

                <button
                  onClick={() => toggleCounterStatus(c.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    c.status === 'active'
                      ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-800'
                      : 'bg-rose-100 hover:bg-emerald-100 text-rose-800 hover:text-emerald-800'
                  }`}
                >
                  {c.status.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
