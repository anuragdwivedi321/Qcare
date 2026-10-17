import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  FileCheck2, 
  Send, 
  Activity,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Badge } from '../common/Badge';

export const DoctorSyncDesk: React.FC = () => {
  const {
    doctors,
    selectedDoctorId,
    setSelectedDoctor,
    patients,
    tests,
    clinicalReports,
    prescribeTests,
    signOffReport
  } = useHospitalStore();

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Prescription Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [prescriptionSuccess, setPrescriptionSuccess] = useState<string | null>(null);

  // Review Report Modal State
  const [reviewingReportId, setReviewingReportId] = useState<string | null>(null);
  const [doctorNoteInput, setDoctorNoteInput] = useState<string>('');

  const targetPatient = patients.find(p => p.id === selectedPatientId);

  const handleToggleTest = (testId: string) => {
    setSelectedTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleIssuePrescription = () => {
    if (!selectedPatientId || selectedTestIds.length === 0) return;
    prescribeTests(selectedPatientId, selectedTestIds);
    setPrescriptionSuccess(`Prescription issued successfully for ${targetPatient?.name}! Smart routing tokens generated.`);
    setSelectedTestIds([]);
    setTimeout(() => setPrescriptionSuccess(null), 5000);
  };

  const handleOpenReview = (reportId: string) => {
    setReviewingReportId(reportId);
    setDoctorNoteInput('Report reviewed and clinically correlated. Advised lifestyle modifications and scheduled 2-week follow-up.');
  };

  const handleConfirmSignOff = () => {
    if (reviewingReportId) {
      signOffReport(reviewingReportId, doctorNoteInput);
      setReviewingReportId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Doctor Selector Header */}
      <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-paper-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-slate-900">
                {activeDoctor.name}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {activeDoctor.roomNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {activeDoctor.specialization} • {activeDoctor.department}
            </p>
          </div>
        </div>

        {/* Doctor Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-medium">Change Consulting Physician:</label>
          <select
            value={selectedDoctorId}
            onChange={e => setSelectedDoctor(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold px-3 py-2 text-slate-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: PRESCRIPTION & ROUTE GENERATION DESK         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Issue Digital Test Prescription
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                Auto-Token Sync
              </span>
            </div>

            {/* Select Patient */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Patient:
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.uhid}) - {p.completedTests.length}/{p.prescribedTests.length} tests completed
                  </option>
                ))}
              </select>

              {targetPatient && (
                <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Currently Prescribed: </span>
                  {targetPatient.prescribedTests.length === 0
                    ? 'None'
                    : targetPatient.prescribedTests
                        .map(tid => tests.find(t => t.id === tid)?.code)
                        .filter(Boolean)
                        .join(', ')}
                </div>
              )}
            </div>

            {/* Diagnostic Test Checklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Tests to Prescribe:
              </label>
              <div className="space-y-2">
                {tests.map(test => {
                  const isAlreadyPrescribed = targetPatient?.prescribedTests.includes(test.id);
                  const isChecked = selectedTestIds.includes(test.id);

                  return (
                    <div
                      key={test.id}
                      onClick={() => !isAlreadyPrescribed && handleToggleTest(test.id)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isAlreadyPrescribed
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isChecked
                          ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-paper-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={isAlreadyPrescribed}
                          checked={isChecked || isAlreadyPrescribed}
                          onChange={() => !isAlreadyPrescribed && handleToggleTest(test.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5 flex-wrap">
                            <span>{test.name}</span>
                            {test.requiresFasting && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Fasting
                              </span>
                            )}
                            {test.prerequisites && test.prerequisites.length > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                                Prereq: {test.prerequisites.map(pid => tests.find(t => t.id === pid)?.code || pid).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {test.code} • Duration: ~{test.averageDurationMinutes} min
                          </div>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-slate-800 shrink-0">
                        ₹{test.standardPrice}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Success notification */}
            {prescriptionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{prescriptionSuccess}</span>
              </div>
            )}

            {/* Prescribe Button */}
            <button
              onClick={handleIssuePrescription}
              disabled={selectedTestIds.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedTestIds.length > 0
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-paper-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Issue Prescription & Compute Optimal Route</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SYNCHRONIZED DIAGNOSTIC REPORTS FEED       */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-card p-5 border border-slate-200 shadow-paper">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Synchronized Laboratory Diagnostic Feed</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Live reports transmitted instantly as technicians complete test counters
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{clinicalReports.length} Reports Filed</span>
              </span>
            </div>

            {clinicalReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No diagnostic reports currently on file.
              </div>
            ) : (
              <div className="space-y-4">
                {clinicalReports.map(report => {
                  const isVerified = report.status === 'verified_by_doctor';
                  const hasAbnormal = report.metrics.some(
                    m => m.flag === 'high' || m.flag === 'critical'
                  );

                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-xl border transition-all ${
                        hasAbnormal && !isVerified
                          ? 'bg-rose-50/40 border-rose-200'
                          : isVerified
                          ? 'bg-slate-50/60 border-slate-200'
                          : 'bg-white border-slate-200 shadow-paper-xs'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {report.testName}
                            </h4>
                            <Badge
                              variant={
                                isVerified
                                  ? 'emerald'
                                  : hasAbnormal
                                  ? 'rose'
                                  : 'cyan'
                              }
                              size="sm"
                            >
                              {isVerified ? 'VERIFIED' : hasAbnormal ? 'ALERT / HIGH' : 'NEW LAB REPORT'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Patient: <strong className="text-slate-700">{report.patientName}</strong> ({report.patientUhid}) • Tech: {report.technicianName} • {report.timestamp}
                          </p>
                        </div>

                        {!isVerified ? (
                          <button
                            onClick={() => handleOpenReview(report.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-paper-xs transition-all"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Sign Off Report</span>
                          </button>
                        ) : (
                          <div className="text-right text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Signed Off</span>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-slate-700 mb-3 bg-white p-2.5 rounded-lg border border-slate-200/80">
                        {report.summary}
                      </p>

                      {/* Metric Chips */}
                      <div className="flex flex-wrap gap-2">
                        {report.metrics.map((m, idx) => (
                          <div
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                              m.flag === 'high' || m.flag === 'critical'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{m.label}:</span>
                            <strong className="font-mono">{m.value} {m.unit}</strong>
                            <span className="text-[10px] text-slate-400">({m.normalRange})</span>
                          </div>
                        ))}
                      </div>

                      {report.doctorNotes && (
                        <div className="mt-3 text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
                          <span className="font-bold text-teal-800">Physician Notes: </span>
                          <span>{report.doctorNotes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review & Sign Off Modal */}
      {reviewingReportId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-modal max-w-lg w-full p-6 shadow-paper-xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Doctor Verification & Sign Off
                </h3>
              </div>
              <button
                onClick={() => setReviewingReportId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide your clinical sign-off, patient instructions, or dosage adjustments. This will be automatically synced to the patient's portal and medical history.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consultant Notes & Follow-up Advice:
              </label>
              <textarea
                rows={4}
                value={doctorNoteInput}
                onChange={e => setDoctorNoteInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReviewingReportId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOff}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-paper-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Sign Off Digitally</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
