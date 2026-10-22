import React, { useState, useEffect, useMemo } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { evaluateMetricFlag } from '../../engine/sanitizer';
import {
  Bell,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Users,
  Search,
  X,
  FileText,
  ChevronDown,
  LogOut,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Droplet,
  FlaskConical,
  Activity,
  ScanLine,
  Waves,
  Eye,
  Volume2,
  Brain,
  Wind,
  Bone
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Lab Portal Styling & Animations (Matched to Doctor Portal Standards)       */
/* -------------------------------------------------------------------------- */
const LP_CSS = `
.lp-root {
  --lp-teal: #0f766e;
  --lp-teal-light: #14b8a6;
  --lp-blue: #1f6bff;
  --lp-line: rgba(15, 40, 80, 0.08);
  font-family: 'Figtree', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  isolation: isolate;
}

/* Ambient Subtle Depth */
.lp-aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.lp-aurora i {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.35;
  will-change: transform;
}
.lp-aurora i:nth-child(1) {
  width: 42vw;
  height: 42vw;
  left: -8vw;
  top: -10vw;
  background: radial-gradient(circle, #99f6e4, transparent 66%);
}
.lp-aurora i:nth-child(2) {
  width: 36vw;
  height: 36vw;
  right: -8vw;
  top: 10vh;
  background: radial-gradient(circle, #bfdbfe, transparent 66%);
}

/* Glass Panels */
.lp-root .glass-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
              0 14px 28px -18px rgba(15, 23, 42, 0.08),
              0 2px 6px rgba(15, 23, 42, 0.03);
}

.lp-root .lp-topbar {
  padding: 0.45rem 0.85rem;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.86));
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  backdrop-filter: blur(18px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px var(--lp-line), 0 16px 36px -22px rgba(15, 118, 110, 0.2);
}

/* Animations */
.lp-rise {
  animation: lpRise 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}
@keyframes lpRise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.lp-live {
  animation: lpLive 2.4s ease-out infinite;
}
@keyframes lpLive {
  0% { box-shadow: 0 0 0 2px #fff, 0 0 0 2px rgba(16, 185, 129, 0.55); }
  70%, 100% { box-shadow: 0 0 0 2px #fff, 0 0 0 8px rgba(16, 185, 129, 0); }
}

/* Queue Row Transition */
.lp-row {
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}
.lp-row:hover {
  background-color: rgba(248, 250, 252, 0.9);
}

/* Form Inputs */
.lp-field {
  height: 2.5rem;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(15, 40, 80, 0.12);
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.lp-field:focus {
  background: #ffffff;
  border-color: var(--lp-teal);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
  outline: none;
}
`;

export const LabPortal: React.FC = () => {
  const {
    currentHospital,
    departments,
    tests,
    counters,
    queueTokens,
    patients,
    clinicalReports,
    activeBayDepartmentId,
    setActiveBayDepartmentId,
    callPatient,
    putOnHold,
    recallFromHold,
    completeTestAndUploadReport,
    skipToken,
    signOut,
    selectAndLoginPatient
  } = useHospitalStore();

  const currentDept = departments.find(d => d.id === activeBayDepartmentId) || departments[0];
  const currentCounter = counters.find(c => c.departmentId === currentDept.id);

  // Filter tokens for this diagnostic department
  const deptTokens = queueTokens.filter(t => t.departmentId === currentDept.id);
  const waitingTokens = deptTokens.filter(t => t.status === 'waiting' || t.status === 'called');
  const onHoldTokens = deptTokens.filter(t => t.status === 'on_hold');
  const completedTokens = deptTokens.filter(t => t.status === 'completed');

  // Queue View Tab & Search Filter
  const [queueFilter, setQueueFilter] = useState<'all' | 'waiting' | 'on_hold' | 'completed'>('waiting');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');

  // Selected Token / Active Patient in Workstation
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  // By default, select the first active called token or first waiting token
  const activeServingToken = useMemo(() => {
    if (selectedTokenId) {
      const found = deptTokens.find(t => t.id === selectedTokenId);
      if (found) return found;
    }
    const called = waitingTokens.find(t => t.status === 'called');
    if (called) return called;
    return waitingTokens[0] || deptTokens[0];
  }, [selectedTokenId, deptTokens, waitingTokens]);

  const activePatient = patients.find(p => p.id === activeServingToken?.patientId);
  const activeTest = tests.find(t => t.id === activeServingToken?.testId);
  const existingReport = clinicalReports.find(
    r => r.patientId === activeServingToken?.patientId && r.testId === activeServingToken?.testId
  );

  // Local state for dynamic metric entry
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [techRemarks, setTechRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate default values when active test changes
  useEffect(() => {
    if (activeTest?.metricTemplates) {
      const initialMap: Record<string, string> = {};
      activeTest.metricTemplates.forEach(tmpl => {
        initialMap[tmpl.label] = tmpl.defaultValue || '';
      });
      setMetricValues(initialMap);
    } else {
      setMetricValues({});
    }
    setTechRemarks('');
  }, [activeServingToken?.id, activeTest?.id]);

  const handleMetricChange = (label: string, val: string) => {
    setMetricValues(prev => ({ ...prev, [label]: val }));
  };

  const handleCall = (tokId?: string) => {
    const id = tokId || activeServingToken?.id;
    if (id) {
      callPatient(id);
      setSelectedTokenId(id);
    }
  };

  const handleHold = () => {
    if (activeServingToken) {
      putOnHold(activeServingToken.id);
    }
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServingToken) return;
    setIsSubmitting(true);
    setTimeout(() => {
      completeTestAndUploadReport(activeServingToken.id, metricValues, techRemarks);
      setIsSubmitting(false);
      setSelectedTokenId(null);
    }, 200);
  };

  // Filtered Queue List
  const filteredQueueTokens = useMemo(() => {
    return deptTokens.filter(t => {
      if (queueFilter === 'waiting' && t.status !== 'waiting' && t.status !== 'called') return false;
      if (queueFilter === 'on_hold' && t.status !== 'on_hold') return false;
      if (queueFilter === 'completed' && t.status !== 'completed') return false;

      if (queueSearchQuery.trim()) {
        const q = queueSearchQuery.toLowerCase().trim();
        const matchName = (t.patientName || '').toLowerCase().includes(q);
        const matchToken = (t.tokenNumber || '').toLowerCase().includes(q);
        const matchUhid = (t.patientUhid || '').toLowerCase().includes(q);
        return matchName || matchToken || matchUhid;
      }
      return true;
    });
  }, [deptTokens, queueFilter, queueSearchQuery]);

  // Department icon helper
  const renderDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplet': return <Droplet className="w-4 h-4 text-red-600" />;
      case 'FlaskConical': return <FlaskConical className="w-4 h-4 text-amber-600" />;
      case 'Activity': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'ScanLine': return <ScanLine className="w-4 h-4 text-purple-600" />;
      case 'Waves': return <Waves className="w-4 h-4 text-teal-600" />;
      case 'Eye': return <Eye className="w-4 h-4 text-sky-600" />;
      case 'Volume2': return <Volume2 className="w-4 h-4 text-amber-600" />;
      case 'Brain': return <Brain className="w-4 h-4 text-violet-600" />;
      case 'Wind': return <Wind className="w-4 h-4 text-emerald-600" />;
      case 'Bone': return <Bone className="w-4 h-4 text-rose-600" />;
      default: return <FlaskConical className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="lp-root text-slate-900 pb-8 space-y-3.5">
      <style>{LP_CSS}</style>
      <div className="lp-aurora" aria-hidden="true"><i /><i /></div>

      {/* ======================================================================== */}
      {/* 1. TOP CLINICAL WORKSTATION BAR (Matched to Doctor Portal Standards)     */}
      {/* ======================================================================== */}
      <section className="lp-topbar lp-rise flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Staff Identity */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0 border border-teal-200">
            {renderDeptIcon(currentDept.iconName)}
            <span className="lp-live absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {currentCounter?.technicianName || 'Attending Lab Technician'}
              </h1>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-semibold">
                {currentDept.name} ({currentDept.location.room})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Counter {currentCounter?.code || 'BAY-1'} · {currentDept.location.floor} · {currentHospital.shortName}
            </p>
          </div>
        </div>

        {/* Right: Diagnostic Station Switcher & Logout */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">Station:</span>
            <div className="relative">
              <select
                value={currentDept.id}
                onChange={e => {
                  setActiveBayDepartmentId(e.target.value);
                  setSelectedTokenId(null);
                }}
                className="h-8.5 pl-3 pr-8 rounded-xl bg-white/95 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-teal-700 cursor-pointer appearance-none"
              >
                {departments.map(dept => {
                  const count = queueTokens.filter(
                    t => t.departmentId === dept.id && (t.status === 'waiting' || t.status === 'called')
                  ).length;
                  return (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.location.room}) {count > 0 ? `· ${count} in queue` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="h-8.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Sign out to login gate"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 2. SPLIT WORKSPACE: 4 COLS (QUEUE ROSTER) + 8 COLS (PATIENT WORKBENCH)   */}
      {/* ======================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ---------------------------------------------------------------------- */}
        {/* LEFT COLUMN: BAY PATIENT QUEUE ROSTER (4 COLS)                         */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lp-rise lg:col-span-4 glass-panel rounded-3xl flex flex-col overflow-hidden">
          
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Bay Queue Roster
                </span>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60">
                  {currentDept.location.room}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {filteredQueueTokens.length} of {deptTokens.length}
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={queueSearchQuery}
                onChange={e => setQueueSearchQuery(e.target.value)}
                placeholder="Search name, UHID, token..."
                className="w-full h-8 pl-8 pr-7 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 bg-white"
              />
              {queueSearchQuery && (
                <button
                  type="button"
                  onClick={() => setQueueSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Segmented Status Filter (Doctor Portal Style) */}
            <div className="bg-slate-100/90 p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-200/60">
              {[
                { id: 'waiting', label: 'Waiting', count: waitingTokens.length },
                { id: 'on_hold', label: 'On-Hold', count: onHoldTokens.length },
                { id: 'completed', label: 'Done', count: completedTokens.length },
                { id: 'all', label: 'All', count: deptTokens.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id as typeof queueFilter)}
                  className={`flex-1 py-1 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    queueFilter === tab.id
                      ? 'bg-white text-teal-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono ${queueFilter === tab.id ? 'text-teal-800 font-bold' : 'text-slate-400'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Patients Queue List (Scrollable Container, Never Breaks or Stretches Awkwardly) */}
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredQueueTokens.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Users className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-900">No patients in this view</p>
                <p className="text-[11px] text-slate-500">
                  {queueSearchQuery ? 'No match found for your query.' : 'Prescriptions from doctor chambers will appear here.'}
                </p>
              </div>
            ) : (
              filteredQueueTokens.map((tok, idx) => {
                const isSelected = activeServingToken?.id === tok.id;
                const isCalled = tok.status === 'called';
                const isCompleted = tok.status === 'completed';

                return (
                  <button
                    key={tok.id}
                    type="button"
                    onClick={() => setSelectedTokenId(tok.id)}
                    className={`lp-row w-full text-left p-3 flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-l-3 border-l-teal-700'
                        : 'hover:bg-slate-50/80 border-l-3 border-l-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {tok.patientName}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60 shrink-0">
                          {tok.tokenNumber}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        UHID: {tok.patientUhid} · {tok.patientAge}Y · {tok.testName}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        {tok.status === 'waiting' && (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Waiting in line
                          </span>
                        )}
                        {tok.status === 'called' && (
                          <span className="text-teal-800 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                            Called to Counter
                          </span>
                        )}
                        {tok.status === 'on_hold' && (
                          <span className="text-amber-800 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            On-Hold (No Show)
                          </span>
                        )}
                        {tok.status === 'completed' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: ACTIVE PATIENT WORKSTATION & FINDINGS (8 COLS)            */}
        {/* ---------------------------------------------------------------------- */}
        <div className="lp-rise lg:col-span-8 space-y-4">
          
          {!activeServingToken ? (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Patient Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a patient from the bay queue roster on the left to start calling, record laboratory parameters, or review completed reports.
              </p>
            </div>
          ) : (
            <>
              {/* Patient Identity & Action Bar */}
              <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {activeServingToken.patientName}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        {activeServingToken.patientAge}Y · {activeServingToken.patientGender}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                        {activeServingToken.tokenNumber}
                      </span>
                      {activeServingToken.status === 'called' && (
                        <span className="text-[10px] font-bold text-white bg-teal-700 px-2 py-0.5 rounded-full animate-pulse">
                          CALLED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                      <span>UHID: <strong className="text-slate-800">{activeServingToken.patientUhid}</strong></span>
                      <span>·</span>
                      <span>Investigation: <strong className="text-slate-800">{activeServingToken.testName}</strong></span>
                      <span>·</span>
                      <span>Room: {currentDept.location.room}</span>
                    </div>
                  </div>

                  {/* Top Patient Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCall()}
                      className="h-8 px-3 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{activeServingToken.status === 'called' ? 'Re-Announce' : 'Call Patient'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHold}
                      className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Hold</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => skipToken(activeServingToken.id)}
                      className="h-8 px-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      title="Skip / Next"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preparation or Clinical Context Note */}
                {activeTest?.preparationNotes && (
                  <div className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="font-semibold text-amber-950">Preparation Protocol:</span> {activeTest.preparationNotes}
                  </div>
                )}
              </div>

              {/* In-Place Parameter Findings Entry Form (Zero Empty Void, Fills Workspace Beautifully) */}
              {activeServingToken.status !== 'completed' ? (
                <form onSubmit={handleCompleteSubmit} className="glass-panel rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-800" />
                        <span>Laboratory Parameter Findings Entry</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Calibrated observation entry for {activeTest?.name || 'Diagnostic Investigation'} ({activeTest?.technicalName})
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      Standard Reference Unit
                    </span>
                  </div>

                  {/* 2-Column Responsive Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTest?.metricTemplates?.map(tmpl => {
                      const currentVal = metricValues[tmpl.label] || '';
                      const flag = evaluateMetricFlag(currentVal, tmpl.normalRange);

                      return (
                        <div
                          key={tmpl.label}
                          className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-800 text-[11px]">
                              {tmpl.label}
                            </label>
                            <span className="text-[10px] font-mono text-slate-400">
                              Ref: {tmpl.normalRange} {tmpl.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              value={currentVal}
                              onChange={e => handleMetricChange(tmpl.label, e.target.value)}
                              placeholder={`Enter ${tmpl.label}`}
                              className="lp-field flex-1 px-3 text-xs font-mono text-slate-900 bg-slate-50/50"
                            />
                            {tmpl.unit && (
                              <span className="text-xs text-slate-600 font-mono w-14 text-right shrink-0">
                                {tmpl.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Technician Observations */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      Technician Remarks / Observations
                    </label>
                    <textarea
                      rows={2}
                      value={techRemarks}
                      onChange={e => setTechRemarks(e.target.value)}
                      placeholder="Enter procedural remarks, specimen quality, or urgent notes..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 shadow-2xs"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:scale-[1.005]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Submitting Findings...'
                        : 'Submit Results & Send to Doctor / Patient Portal'}
                    </span>
                  </button>
                </form>
              ) : (
                /* Already Completed Report Card */
                <div className="glass-panel rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Investigation Completed & Verified</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Report ID: {existingReport?.id || 'VERIFIED'}
                    </span>
                  </div>

                  {existingReport && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {existingReport.metrics.map(m => (
                          <div key={m.label} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{m.label}</span>
                            <span className="font-mono font-bold text-slate-900">{m.value} {m.unit}</span>
                          </div>
                        ))}
                      </div>

                      {existingReport.technicianNotes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                          <strong>Remarks:</strong> {existingReport.technicianNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
