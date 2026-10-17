import React, { useState } from 'react';
import { 
  FlaskConical, 
  Bell, 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  Send
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Badge } from '../common/Badge';

export const LabCounterCallingConsole: React.FC = () => {
  const {
    counters,
    departments,
    selectedCounterId,
    setSelectedCounter,
    queueTokens,
    patients,
    tests,
    callNextToken,
    startTest,
    completeTestAndUploadReport,
    toggleCounterStatus
  } = useHospitalStore();

  const activeCounter = counters.find(c => c.id === selectedCounterId) || counters[0];
  const activeDept = departments.find(d => d.id === activeCounter.departmentId);

  // Department tokens
  const deptTokens = queueTokens.filter(t => t.departmentId === activeCounter.departmentId);
  const waitingTokens = deptTokens.filter(t => t.status === 'waiting');

  // Currently serving token
  const servingToken = deptTokens.find(
    t => t.counterId === activeCounter.id && (t.status === 'called' || t.status === 'in_progress')
  );

  const servingPatient = servingToken ? patients.find(p => p.id === servingToken.patientId) : null;
  const servingTest = servingToken ? tests.find(t => t.id === servingToken.testId) : null;

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [metricValues, setMetricValues] = useState<
    { label: string; value: string; unit: string; normalRange: string; flag: 'normal' | 'high' | 'low' | 'critical' }[]
  >([]);

  // Open filing modal with auto-populated parameters based on test type
  const handleOpenFilingModal = () => {
    if (!servingToken) return;

    if (servingToken.testId === 'test-cbc') {
      setSummaryInput('Normocytic normochromic red cell picture. Mild leukocytosis with polymorphonuclear predominance.');
      setMetricValues([
        { label: 'Hemoglobin (Hb)', value: '13.6', unit: 'g/dL', normalRange: '13.0 - 17.0 g/dL', flag: 'normal' },
        { label: 'Total Leucocyte Count (TLC)', value: '10,800', unit: '/µL', normalRange: '4,000 - 11,000 /µL', flag: 'normal' },
        { label: 'Platelet Count', value: '235,000', unit: '/µL', normalRange: '150,000 - 450,000 /µL', flag: 'normal' },
        { label: 'Hematocrit (PCV)', value: '41.2', unit: '%', normalRange: '40 - 50%', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-ecg') {
      setSummaryInput('Normal sinus rhythm with heart rate of 74 bpm. No significant ST segment elevation or depression.');
      setMetricValues([
        { label: 'Resting Heart Rate', value: '74', unit: 'bpm', normalRange: '60 - 100 bpm', flag: 'normal' },
        { label: 'PR Interval', value: '162', unit: 'ms', normalRange: '120 - 200 ms', flag: 'normal' },
        { label: 'QRS Duration', value: '88', unit: 'ms', normalRange: '< 120 ms', flag: 'normal' },
        { label: 'QTc Interval', value: '418', unit: 'ms', normalRange: '< 440 ms', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-xray-chest') {
      setSummaryInput('Bilateral lung fields appear clear without focal consolidation or pneumothorax. Cardiothoracic ratio is normal.');
      setMetricValues([
        { label: 'Cardiothoracic Ratio', value: '0.46', unit: 'ratio', normalRange: '< 0.50', flag: 'normal' },
        { label: 'Costophrenic Angles', value: 'Sharp & Clear', unit: 'status', normalRange: 'Sharp', flag: 'normal' },
        { label: 'Mediastinal Contour', value: 'Unremarkable', unit: 'status', normalRange: 'Normal', flag: 'normal' }
      ]);
    } else {
      setSummaryInput('Test conducted adhering to clinical quality standards. Findings within expected biological limits.');
      setMetricValues([
        { label: 'Primary Test Marker', value: '102', unit: 'mg/dL', normalRange: '70 - 110 mg/dL', flag: 'normal' },
        { label: 'Secondary Parameter', value: '1.05', unit: 'Index', normalRange: '0.8 - 1.2', flag: 'normal' }
      ]);
    }

    setIsReportModalOpen(true);
  };

  const handleSubmitReport = () => {
    if (!servingToken) return;

    completeTestAndUploadReport(servingToken.id, {
      summary: summaryInput,
      metrics: metricValues
    });

    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Counter Selection Header */}
      <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-paper-xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-slate-900">
                {activeCounter.name} ({activeCounter.code})
              </h2>
              <Badge variant={activeCounter.status === 'active' ? 'emerald' : 'rose'}>
                {activeCounter.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Lead Technician: <strong className="text-slate-700">{activeCounter.technicianName}</strong> • {activeDept?.name} ({activeDept?.location.room})
            </p>
          </div>
        </div>

        {/* Counter Dropdown & Status Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedCounterId}
              onChange={e => setSelectedCounter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold px-3 py-2 pr-8 text-slate-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {counters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.status}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => toggleCounterStatus(activeCounter.id)}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeCounter.status === 'active'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {activeCounter.status === 'active' ? 'Close Counter' : 'Open Counter'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: ACTIVE SERVING TOKEN & ACTION CONTROLS       */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-card p-6 border border-slate-200 shadow-paper space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <span>Active Patient Token at Counter</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Served Today: <strong className="text-teal-700 font-mono">{activeCounter.servedCountToday}</strong>
              </span>
            </div>

            {servingToken ? (
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-5 rounded-2xl border border-teal-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                      Currently Serving Token
                    </span>
                    <span className="font-mono font-black text-4xl text-teal-800 tracking-tight">
                      {servingToken.tokenNumber}
                    </span>
                  </div>

                  <Badge
                    variant={servingToken.status === 'in_progress' ? 'cyan' : 'amber'}
                    size="md"
                  >
                    {servingToken.status === 'in_progress' ? 'IN PROGRESS' : 'TOKEN CALLED'}
                  </Badge>
                </div>

                {/* Patient details */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient:</span>
                    <strong className="text-slate-900 font-bold">{servingPatient?.name || 'Walk-in Patient'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UHID:</span>
                    <span className="font-mono text-slate-700">{servingPatient?.uhid || 'QC-N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Investigation:</span>
                    <strong className="text-teal-800">{servingTest?.name || 'Diagnostic Test'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority Tier:</span>
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">
                      {servingToken.priority}
                    </span>
                  </div>
                </div>

                {/* Serving Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {servingToken.status === 'called' ? (
                    <button
                      onClick={() => startTest(servingToken.id)}
                      className="col-span-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-paper-sm transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Patient Arrived — Start Test</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleOpenFilingModal}
                        className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-paper-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Detailed Findings</span>
                      </button>
                      <button
                        onClick={() => {
                          completeTestAndUploadReport(servingToken.id, {
                            summary: 'Standard sample analysis completed within biological reference parameters.',
                            metrics: [
                              { label: 'Primary Test Marker', value: '104', unit: 'Index', normalRange: '70 - 110', flag: 'normal' },
                              { label: 'Secondary Quality Control', value: 'Passed', unit: 'QC', normalRange: 'Passed', flag: 'normal' }
                            ]
                          });
                        }}
                        className="py-3 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-paper-xs transition-all"
                      >
                        <Send className="w-3.5 h-3.5 text-teal-600" />
                        <span>Quick Pass (Normal)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Counter Currently Idle</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There is currently no patient inside this bay. Click Call Next Token to summon the next patient in queue with hospital chime and voice announcement.
                </p>

                <button
                  onClick={() => callNextToken(activeCounter.id)}
                  disabled={waitingTokens.length === 0}
                  className={`mt-2 py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-all ${
                    waitingTokens.length > 0
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-paper-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Call Next Token ({waitingTokens.length} Waiting)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: WAITING QUEUE LIST FOR THIS LAB             */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  {activeDept?.name} Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Queue length: <strong className="text-slate-800 font-mono">{waitingTokens.length} patients</strong>
                </p>
              </div>

              <button
                onClick={() => callNextToken(activeCounter.id)}
                disabled={waitingTokens.length === 0}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  waitingTokens.length > 0
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-paper-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span>Call Next</span>
              </button>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No patients currently waiting in this department queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l">Pos</th>
                      <th className="py-2.5 px-3">Token #</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3 rounded-r">Est. Wait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {waitingTokens.map((t, idx) => {
                      const p = patients.find(patient => patient.id === t.patientId);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                            {t.tokenNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-semibold">
                            {p?.name || 'Walk-in'}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                t.priority === 'emergency'
                                  ? 'rose'
                                  : t.priority === 'senior'
                                  ? 'purple'
                                  : 'slate'
                              }
                              size="sm"
                            >
                              {t.priority.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            ~{(idx + 1) * Math.round(activeCounter.averageServiceMinutes)}m
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Test & File Findings Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-xl w-full p-6 shadow-paper-xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    File Clinical Findings & Complete Investigation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Test: <strong className="text-slate-800">{servingTest?.name}</strong> • Token: {servingToken?.tokenNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Parameters Form */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Laboratory Investigation Parameters:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {metricValues.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
                    <span className="font-semibold text-slate-800 flex-1">{m.label}</span>
                    <input
                      type="text"
                      value={m.value}
                      onChange={e => {
                        const val = e.target.value;
                        setMetricValues(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                        );
                      }}
                      className="w-20 font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                    <span className="text-slate-500 text-[11px] w-12">{m.unit}</span>
                    <select
                      value={m.flag}
                      onChange={e => {
                        const flag = e.target.value as 'normal' | 'high' | 'low' | 'critical';
                        setMetricValues(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, flag } : item))
                        );
                      }}
                      className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician's Clinical Summary / Observation:
              </label>
              <textarea
                rows={3}
                value={summaryInput}
                onChange={e => setSummaryInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-teal-700 font-medium">
                ⚡ Patient will be auto-dispatched to next optimal counter
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-paper-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit to Doctor & Reroute Patient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
