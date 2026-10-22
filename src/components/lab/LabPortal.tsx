import React, { useState, useEffect } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
import {
  Bell,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Users,
  Clock,
  FileText,
  ChevronDown,
  LogOut,
  X,
  Search,
  Check,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Lab Portal Professional Styles (Clean Clinical Hub, Zero Tacky Pills)     */
/* -------------------------------------------------------------------------- */
const LP_CSS = `
.lp-root {
  --lp-teal: #0f766e;
  --lp-teal-hover: #115e59;
  --lp-line: rgba(15, 23, 42, 0.08);
  font-family: 'Figtree', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  isolation: isolate;
}

/* Glass Panels with Clean Depth */
.lp-root .glass-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
              0 14px 28px -18px rgba(15, 23, 42, 0.07),
              0 2px 6px rgba(15, 23, 42, 0.03);
  border-radius: 16px;
}

/* Topbar Header Strip */
.lp-root .lp-topbar {
  padding: 0.65rem 1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.07);
}

/* Entrance Animations */
.lp-rise {
  animation: lpRise 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}
@keyframes lpRise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Smooth Card Hover Transition */
.lp-card-transition {
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.lp-card-transition:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -8px rgba(15, 23, 42, 0.08);
}

/* Form Input Glows */
.lp-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.lp-input:focus {
  background-color: #ffffff;
  border-color: var(--lp-teal);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
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
    activeBayDepartmentId,
    setActiveBayDepartmentId,
    callPatient,
    putOnHold,
    recallFromHold,
    completeTestAndUploadReport,
    skipToken,
    signOut
  } = useHospitalStore();

  const currentDept = departments.find(d => d.id === activeBayDepartmentId) || departments[0];
  const currentCounter = counters.find(c => c.departmentId === currentDept.id);

  // Filter tokens for this diagnostic department
  const deptTokens = queueTokens.filter(t => t.departmentId === currentDept.id);
  const waitingTokens = deptTokens.filter(
    t => t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress'
  );
  const onHoldTokens = deptTokens.filter(t => t.status === 'on_hold');
  const completedTokens = deptTokens.filter(t => t.status === 'completed');

  // Currently serving token (first called token or explicitly selected token, or first waiting)
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const calledToken = waitingTokens.find(t => t.status === 'called');
  const currentToken = waitingTokens.find(t => t.id === selectedTokenId) || calledToken || waitingTokens[0];
  const activeTest = tests.find(t => t.id === currentToken?.testId);

  // Queue View Tab & Search Filter
  const [queueTab, setQueueTab] = useState<'waiting' | 'on_hold' | 'completed'>('waiting');
  const [queueSearch, setQueueSearch] = useState('');

  // Report Entry Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
  }, [currentToken?.id, activeTest?.id]);

  const handleMetricChange = (label: string, val: string) => {
    setMetricValues(prev => ({ ...prev, [label]: val }));
  };

  const handleCall = (tokenId?: string) => {
    const targetId = tokenId || currentToken?.id;
    if (targetId) {
      callPatient(targetId);
      setSelectedTokenId(targetId);
    }
  };

  const handleHold = () => {
    if (currentToken) {
      putOnHold(currentToken.id);
    }
  };

  const handleOpenReportModal = (tokId?: string) => {
    if (tokId) {
      setSelectedTokenId(tokId);
    }
    setIsReportModalOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentToken) return;
    setIsSubmitting(true);
    setTimeout(() => {
      completeTestAndUploadReport(currentToken.id, metricValues, techRemarks);
      setIsSubmitting(false);
      setIsReportModalOpen(false);
      setSelectedTokenId(null);
    }, 200);
  };

  // Filter queue list by search
  const visibleTokens = (
    queueTab === 'waiting'
      ? waitingTokens
      : queueTab === 'on_hold'
      ? onHoldTokens
      : completedTokens
  ).filter(t => {
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return (
      (t.patientName || '').toLowerCase().includes(q) ||
      (t.tokenNumber || '').toLowerCase().includes(q) ||
      (t.patientUhid || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="lp-root space-y-4 text-slate-900 pb-12">
      <style>{LP_CSS}</style>

      {/* -------------------------------------------------------------------------- */}
      {/* 1. TOP CLINICAL BAR: Station Selector & Staff Identity                     */}
      {/* -------------------------------------------------------------------------- */}
      <div className="lp-topbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Station Select Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Diagnostic Station:</span>
            <div className="relative">
              <select
                value={currentDept.id}
                onChange={e => {
                  setActiveBayDepartmentId(e.target.value);
                  setSelectedTokenId(null);
                  setIsReportModalOpen(false);
                }}
                className="h-9 pl-3 pr-8 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:border-teal-700 cursor-pointer appearance-none"
              >
                {departments.map(dept => {
                  const count = queueTokens.filter(
                    t => t.departmentId === dept.id && (t.status === 'waiting' || t.status === 'called')
                  ).length;
                  return (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.location.room}) {count > 0 ? `— ${count} waiting` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <span className="text-xs text-slate-400 hidden md:inline">·</span>
          <span className="text-xs text-slate-500 hidden md:inline font-mono">
            {currentDept.location.floor} · {currentDept.location.building || currentHospital.shortName}
          </span>
        </div>

        {/* Right: Staff Identity & Logout */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block">
              {currentCounter?.technicianName || 'Attending Lab Technician'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Counter {currentCounter?.code || 'BAY-1'} · Room {currentDept.location.room}
            </span>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Sign out to login gate"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* 2. MAIN LAYOUT: LEFT (CALLING COUNTER) + RIGHT (SCROLLABLE PATIENTS QUEUE)  */}
      {/* -------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ======================================================================== */}
        {/* LEFT COLUMN: ACTIVE SERVING CONSOLE & QUICK ACTIONS (5 cols)             */}
        {/* ======================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 space-y-4 lp-rise">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                ACTIVE PATIENT AT COUNTER
              </span>
              <span className="text-xs font-mono text-slate-500">
                {currentDept.location.room}
              </span>
            </div>

            {currentToken ? (
              <div className="space-y-4">
                {/* Active Token Card */}
                <div
                  className={`p-5 rounded-xl border text-center transition-all ${
                    currentToken.status === 'called'
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-200'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Token Number</span>
                    <span className="font-mono uppercase font-bold text-teal-800">
                      {currentToken.status === 'called' ? 'CALLED' : currentToken.status}
                    </span>
                  </div>

                  <div className="font-mono font-black text-4xl text-slate-900 tracking-tight py-1">
                    {currentToken.tokenNumber}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-0.5">
                    {currentToken.patientName}
                  </h3>

                  <div className="text-xs text-slate-600 font-mono mt-1">
                    UHID: {currentToken.patientUhid} · {currentToken.patientAge} Y / {currentToken.patientGender}
                  </div>

                  <div className="mt-2.5 inline-block text-xs font-semibold text-teal-900 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
                    Investigation: {currentToken.testName}
                  </div>

                  {activeTest?.preparationNotes && (
                    <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3 text-left">
                      <strong>Preparation:</strong> {activeTest.preparationNotes}
                    </div>
                  )}
                </div>

                {/* Primary Report Entry Button (Requested Flow: Open Report Page to Submit) */}
                <button
                  type="button"
                  onClick={() => handleOpenReportModal()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Enter Lab Findings & Submit Report</span>
                </button>

                {/* Patient Summon & Control Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCall()}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                    title="Play chime and announce patient"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Call Chime</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHold}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                    title="Put on hold"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Hold</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => currentToken && skipToken(currentToken.id)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                    title="Skip token"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <h4 className="text-xs font-bold text-slate-700">No Active Patient at Counter</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click on any waiting patient in the list on the right to call or enter their findings.
                </p>
                {waitingTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCall(waitingTokens[0].id)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Call First Patient in Line ({waitingTokens[0].tokenNumber})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Counter Info */}
          <div className="glass-panel p-4 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>Station: {currentDept.name}</span>
            <span>Served Today: {completedTokens.length}</span>
          </div>

        </div>

        {/* ======================================================================== */}
        {/* RIGHT COLUMN: DEDICATED SCROLLABLE PATIENT QUEUE HUB (7 cols)            */}
        {/* ======================================================================== */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4 lp-rise">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Patients in Line — {currentDept.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Room {currentDept.location.room} · All active queues for this diagnostic bay
              </p>
            </div>

            {/* Queue Sub-Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setQueueTab('waiting')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  queueTab === 'waiting'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Waiting ({waitingTokens.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab('on_hold')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  queueTab === 'on_hold'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                On-Hold ({onHoldTokens.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  queueTab === 'completed'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Done ({completedTokens.length})
              </button>
            </div>
          </div>

          {/* Queue Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search patients by name, token number, or UHID..."
              className="lp-input w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50/50 shadow-2xs"
            />
          </div>

          {/* DEDICATED SCROLLABLE QUEUE CONTAINER (Won't break even with 50+ patients) */}
          <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {visibleTokens.length > 0 ? (
              visibleTokens.map((tok, idx) => {
                const isCurrent = tok.id === currentToken?.id;
                return (
                  <div
                    key={tok.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 lp-card-transition ${
                      isCurrent
                        ? 'bg-teal-50/80 border-teal-300 shadow-2xs ring-1 ring-teal-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* Patient & Token Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-slate-400 font-bold text-xs pt-0.5 w-5 shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {tok.tokenNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {tok.patientName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          UHID: {tok.patientUhid} · {tok.patientAge}Y · {tok.testName}
                        </p>
                      </div>
                    </div>

                    {/* Actions Depending on Status */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {queueTab === 'waiting' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCall(tok.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(tok.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Enter Report</span>
                          </button>
                        </>
                      )}

                      {queueTab === 'on_hold' && (
                        <button
                          type="button"
                          onClick={() => recallFromHold(tok.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Recall</span>
                        </button>
                      )}

                      {queueTab === 'completed' && (
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-1.5">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No Patients Found</p>
                <p className="text-xs text-slate-500">
                  {queueSearch ? 'No patients matching your search query.' : 'No patients currently in this queue section.'}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* 3. DEDICATED REPORT ENTRY MODAL (Requested: Opens to fill & submit findings) */}
      {/* -------------------------------------------------------------------------- */}
      {isReportModalOpen && currentToken && activeTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Clinical Lab Report Entry — {currentToken.patientName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Token: {currentToken.tokenNumber} · UHID: {currentToken.patientUhid} · {currentToken.testName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {activeTest.metricTemplates?.map(tmpl => {
                  const currentVal = metricValues[tmpl.label] || '';

                  return (
                    <div
                      key={tmpl.label}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-900">
                          {tmpl.label}
                        </label>
                        <span className="text-[11px] font-mono text-slate-500">
                          Reference Range: {tmpl.normalRange} {tmpl.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={currentVal}
                          onChange={e => handleMetricChange(tmpl.label, e.target.value)}
                          placeholder={`Enter ${tmpl.label}`}
                          className="lp-input flex-1 h-10 px-3.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-slate-50/50"
                        />
                        {tmpl.unit && (
                          <span className="text-xs text-slate-600 font-mono w-16 text-right shrink-0">
                            {tmpl.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Technician Remarks */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-800">
                    Technician Remarks / Observations
                  </label>
                  <textarea
                    rows={3}
                    value={techRemarks}
                    onChange={e => setTechRemarks(e.target.value)}
                    placeholder="Enter procedural remarks, specimen observations, or relevant clinical findings..."
                    className="lp-input w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Submitting Report...'
                      : 'Submit Report & Route Patient'}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
