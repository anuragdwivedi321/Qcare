import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  Compass, 
  FileText, 
  QrCode, 
  ShieldCheck, 
  Footprints, 
  Info,
  ChevronDown,
  Map as MapIcon
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Badge } from '../common/Badge';
import { HospitalFloorMap } from '../common/HospitalFloorMap';

export const PatientRouteView: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatient,
    selectedPatient,
    currentRoutingPlan,
    clinicalReports,
    queueTokens
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<'route' | 'map' | 'reports'>('route');

  // Completed reports for selected patient
  const patientReports = clinicalReports.filter(r => r.patientId === selectedPatient?.id);

  if (!selectedPatient) {
    return <div className="p-8 text-center text-slate-500">No patient selected.</div>;
  }

  // Find active / up-next token
  const currentToken = queueTokens.find(
    t => t.patientId === selectedPatient.id && (t.status === 'called' || t.status === 'in_progress')
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Patient Switcher & Header Bar */}
      <div className="bg-white rounded-card p-4 sm:p-5 border border-slate-200 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold font-display text-lg shadow-paper-xs">
            {selectedPatient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-slate-900">
                {selectedPatient.name}
              </h2>
              <Badge
                variant={
                  selectedPatient.priority === 'senior'
                    ? 'purple'
                    : selectedPatient.priority === 'emergency'
                    ? 'rose'
                    : 'slate'
                }
              >
                {selectedPatient.priority.toUpperCase()} PRIORITY
              </Badge>
              {selectedPatient.status === 'all_completed' && (
                <Badge variant="emerald">ALL TESTS COMPLETED</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="font-mono font-medium text-slate-700">UHID: {selectedPatient.uhid}</span>
              <span>•</span>
              <span>{selectedPatient.age} Yrs / {selectedPatient.gender}</span>
              <span>•</span>
              <span>Prescribed by: <strong className="text-slate-700">{selectedPatient.prescribedDoctorName}</strong></span>
            </p>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Switch Patient:
          </label>
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatient(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold px-3 py-2 pr-8 text-slate-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uhid}) {p.priority === 'senior' ? '★ Senior' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs: Route vs Map vs Reports */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'route'
              ? 'bg-teal-600 text-white shadow-paper-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Optimal Test Sequence ({currentRoutingPlan.smartRouteSteps.length} Steps)</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'map'
              ? 'bg-teal-600 text-white shadow-paper-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Floor Radar & Waypoints</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-teal-600 text-white shadow-paper-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Diagnostic Reports</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-mono">
            {patientReports.length}
          </span>
        </button>
      </div>

      {activeTab === 'route' ? (
        <>
          {/* ========================================================= */}
          {/* BREAKTHROUGH SAVINGS HERO CARD: NAIVE VS SMART ROUTE      */}
          {/* ========================================================= */}
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-6 text-white shadow-paper-lg border border-teal-800/60">
            {/* Background glowing gradient accents */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-teal-800/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                    <Sparkles className="w-4 h-4 text-teal-300" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-base text-white tracking-tight">
                      Q-Care Dynamic Bottleneck-Bypass Route
                    </h3>
                    <p className="text-xs text-teal-200/80">
                      Real-time queue depth & multi-counter load balancing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-teal-300/90 font-mono">
                    Last recalculated: {currentRoutingPlan.calculatedAt || 'Just now'}
                  </span>
                </div>
              </div>

              {/* Side-by-side comparative metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {/* 1. Naive Sequence */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-rose-500/30">
                  <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
                    <span>Traditional Naive Slip Order</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Unoptimized
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-mono font-extrabold text-3xl text-rose-200">
                      {currentRoutingPlan.naiveTotalTimeMinutes}
                    </span>
                    <span className="text-xs text-rose-300/80 font-medium">min total wait</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Blindly queues at crowded initial counters (e.g. 14 people waiting at blood lab while other test rooms sit idle).
                  </p>
                </div>

                {/* 2. Q-Care Smart Route */}
                <div className="bg-teal-900/60 rounded-xl p-4 border border-teal-500/50 shadow-glow-brand">
                  <div className="flex items-center justify-between text-xs text-teal-300 font-semibold mb-1">
                    <span>Q-Care Synchronized Route</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200 border border-teal-400/40 font-bold">
                      Optimal Sequence
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-mono font-extrabold text-3xl text-emerald-300">
                      {currentRoutingPlan.smartTotalTimeMinutes}
                    </span>
                    <span className="text-xs text-emerald-200/80 font-medium">min total wait</span>
                  </div>
                  <p className="text-[11px] text-teal-200/80 mt-2 leading-relaxed">
                    Directs patient to zero-wait diagnostic bays first, letting high-volume labs clear backlog before arrival.
                  </p>
                </div>

                {/* 3. Savings Highlight */}
                <div className="bg-gradient-to-br from-emerald-950/80 to-teal-900/80 rounded-xl p-4 border border-emerald-500/60 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-emerald-300 font-semibold block mb-1">
                      Hospital Time Saved
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono font-extrabold text-3xl text-emerald-300">
                        +{currentRoutingPlan.timeSavedMinutes}
                      </span>
                      <span className="text-xs text-emerald-200 font-bold">
                        mins saved ({currentRoutingPlan.percentageSaved}% faster)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-emerald-800/60 flex flex-wrap gap-1.5">
                    {currentRoutingPlan.bottlenecksAvoided.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STEP-BY-STEP INTERACTIVE ROUTE TRACKER                    */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-teal-600" />
                <span>Your Dynamic Navigation Steps</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Transit Matrix: ~{currentRoutingPlan.transitTotalMinutes} mins walking between departments
              </span>
            </div>

            {currentRoutingPlan.smartRouteSteps.length === 0 ? (
              <div className="bg-white rounded-card p-8 border border-slate-200 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800">All Prescribed Tests Completed!</h4>
                <p className="text-xs text-slate-500">
                  All diagnostic samples have been collected and processed. You may proceed to your consulting doctor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {currentRoutingPlan.smartRouteSteps.map((step, idx) => {
                  const isCompleted = selectedPatient.completedTests.includes(step.testId);
                  const isUpNext = !isCompleted && idx === 0;

                  return (
                    <div
                      key={step.testId}
                      className={`relative rounded-card transition-all p-5 border ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-80'
                          : isUpNext
                          ? 'bg-white border-teal-500 shadow-paper-lg ring-2 ring-teal-500/20'
                          : 'bg-white border-slate-200 shadow-paper'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Step Sequence Number & Test Info */}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-paper-xs ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isUpNext
                                ? 'bg-teal-600 text-white font-mono'
                                : 'bg-slate-100 text-slate-600 border border-slate-300 font-mono'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : `0${step.stepNumber}`}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-display font-bold text-base text-slate-900">
                                {step.testName}
                              </h4>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                {step.testCode}
                              </span>

                              {isCompleted && (
                                <Badge variant="emerald">COMPLETED</Badge>
                              )}
                              {isUpNext && (
                                <Badge variant="cyan">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping"></span>
                                  PROCEED HERE NOW
                                </Badge>
                              )}
                            </div>

                            {/* Location & Directions */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                              <div className="flex items-center gap-1 font-medium text-slate-800">
                                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                <span>{step.departmentName}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-slate-600">
                                <span className="font-semibold">{step.location.wing}</span>
                                <span>, {step.location.floor}</span>
                                <span>— {step.location.room}</span>
                              </div>
                            </div>

                            {/* Why this sequence */}
                            <p className="text-xs text-teal-700 font-medium bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1.5 mt-2.5 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{step.reasonForSequence}</span>
                            </p>
                          </div>
                        </div>

                        {/* Timing and Live Queue Position Box */}
                        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 text-right shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] text-slate-500 font-medium block">
                              Projected Wait Time
                            </span>
                            <div className="flex items-center md:justify-end gap-1 font-mono font-bold text-base text-slate-900">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>~{step.estimatedWaitMinutes} mins</span>
                            </div>
                          </div>

                          <div className="mt-2 text-left md:text-right">
                            <span className="text-[10px] text-slate-400">
                              Slot: {step.expectedStartTime} - {step.expectedEndTime}
                            </span>
                            <div className="text-[11px] font-medium text-slate-500">
                              Duration: ~{step.estimatedDurationMinutes} mins
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* DIGITAL TOKEN PASS CARD                                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-card p-6 border border-slate-200 shadow-paper">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h4 className="font-display font-bold text-base text-slate-900">
                  Digital Diagnostic Token Pass
                </h4>
              </div>
              <span className="text-xs text-slate-500">Auto-synced with Hospital Floor Displays</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
                  Active Priority Token
                </span>
                <span className="font-mono font-black text-3xl text-teal-700 tracking-tight block mt-1">
                  {currentToken?.tokenNumber || 'BLD-108'}
                </span>
                <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Live in Queue
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Position:</span>
                  <strong className="text-slate-800 font-mono">
                    {currentToken ? `${currentToken.queuePosition} Ahead` : 'Immediate Next'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Hospital Notification:</span>
                  <strong className="text-emerald-700">Chime & Screen Alert</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fast-Track Eligibility:</span>
                  <strong className="text-slate-800">
                    {selectedPatient.priority === 'senior' ? 'Senior Priority Active' : 'Standard Queue'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-teal-800">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Q-Care Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-teal-700">
                  Your token automatically migrates to the next counter once each test finishes. No physical slip re-stamping required.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'map' ? (
        <div className="space-y-4">
          <HospitalFloorMap />
        </div>
      ) : (
        /* ========================================================= */
        /* DIAGNOSTIC CLINICAL REPORTS VIEW                          */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Diagnostic Test Results & Synchronized Reports</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Directly synced from Laboratory Counters
            </span>
          </div>

          {patientReports.length === 0 ? (
            <div className="bg-white rounded-card p-12 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Completed Reports Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                As soon as the laboratory technician finishes your test at the counter and uploads findings, your digital report with metric parameters will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white rounded-card p-5 border border-slate-200 shadow-paper space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-base text-slate-900">
                          {report.testName}
                        </h4>
                        <Badge
                          variant={
                            report.status === 'verified_by_doctor'
                              ? 'emerald'
                              : 'cyan'
                          }
                        >
                          {report.status === 'verified_by_doctor' ? 'DOCTOR VERIFIED' : 'LAB UPLOADED'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Filing Technician: <span className="font-medium text-slate-700">{report.technicianName}</span> • {report.timestamp}
                      </p>
                    </div>

                    {report.doctorSignature && (
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[10px]">Verified By</span>
                        <span className="font-bold text-slate-800">{report.doctorSignature}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <strong className="text-slate-900 font-semibold block mb-1">Clinical Impression:</strong>
                    <p>{report.summary}</p>
                  </div>

                  {/* Metrics Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 rounded-l">Investigation Parameter</th>
                          <th className="py-2 px-3">Result Value</th>
                          <th className="py-2 px-3">Biological Reference Range</th>
                          <th className="py-2 px-3 rounded-r">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {report.metrics.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-800 font-semibold">{m.label}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {m.value} <span className="text-slate-500 font-normal">{m.unit}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{m.normalRange}</td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={
                                  m.flag === 'critical' || m.flag === 'high'
                                    ? 'rose'
                                    : m.flag === 'low'
                                    ? 'amber'
                                    : 'emerald'
                                }
                                size="sm"
                              >
                                {m.flag.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {report.doctorNotes && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                      <strong className="font-semibold block mb-0.5">Doctor's Follow-up Instructions:</strong>
                      <p>{report.doctorNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
