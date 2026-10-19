import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  Plus, 
  AlertCircle, 
  Check, 
  FileCheck2, 
  X,
  ShieldCheck,
  ArrowLeft,
  UserPlus,
  ShieldAlert,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { RegisterPatientModal } from '../common/RegisterPatientModal';
import { SearchableCombobox } from '../common/SearchableCombobox';
import { MedicalTooltip } from '../common/MedicalTooltip';
import { DoctorAppointmentCard } from './DoctorAppointmentCard';

type TriageFilter = 'all' | 'needs_tests' | 'in_labs' | 'reports_ready' | 'completed';

export const DoctorView: React.FC = () => {
  const {
    doctors,
    selectedDoctorId,
    setSelectedDoctor,
    currentHospital,
    patients,
    selectedPatientId,
    setSelectedPatient,
    queueTokens,
    tests,
    clinicalReports,
    prescribeTests,
    completeConsultation,
    signOffReport,
    signOut
  } = useHospitalStore();

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Prescribe Tests Modal State
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [prescribeSearch, setPrescribeSearch] = useState('');
  const [prescriptionSuccess, setPrescriptionSuccess] = useState<string | null>(null);
  const [consultationSuccess, setConsultationSuccess] = useState<string | null>(null);

  // New Patient Walk-in Modal State
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [showDoctorCardModal, setShowDoctorCardModal] = useState(false);

  // Review Report Modal State
  const [reviewReportId, setReviewReportId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  const [rosterFilter, setRosterFilter] = useState<'my' | 'all'>('my');
  const [triageFilter, setTriageFilter] = useState<TriageFilter>('all');

  // Filter patients associated with this doctor or OPD
  const myPatients = patients.filter(p => p.prescribedDoctorId === activeDoctor.id);
  const scopedPatients = rosterFilter === 'my' ? myPatients : patients;

  // Live counts for the 5 triage tabs:
  const countAll = scopedPatients.length;
  const countNeedsTests = scopedPatients.filter(
    p => p.prescribedTests.length === 0 && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged'
  ).length;
  const countInLabs = scopedPatients.filter(
    p => p.prescribedTests.length > 0 && p.completedTests.length < p.prescribedTests.length && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged'
  ).length;
  const countReportsReady = scopedPatients.filter(
    p => (p.doctorReviewStatus === 'reports_ready' || (p.prescribedTests.length > 0 && p.completedTests.length >= p.prescribedTests.length)) && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged'
  ).length;
  const countCompleted = scopedPatients.filter(
    p => p.doctorReviewStatus === 'completed' || p.status === 'discharged'
  ).length;

  // Priority weight map
  const priorityScore: Record<string, number> = { emergency: 3, senior: 2, standard: 1 };

  // Helper to get active OPD token for a patient
  const getOpdToken = (patientId: string) =>
    queueTokens.find(t => t.patientId === patientId && t.testId === 'opd-consultation');

  // Filter and smart-sort patients according to clinical triage
  const rawOpdPatients = scopedPatients.filter(p => {
    if (triageFilter === 'needs_tests') {
      return p.prescribedTests.length === 0 && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged';
    }
    if (triageFilter === 'in_labs') {
      return p.prescribedTests.length > 0 && p.completedTests.length < p.prescribedTests.length && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged';
    }
    if (triageFilter === 'reports_ready') {
      return (p.doctorReviewStatus === 'reports_ready' || (p.prescribedTests.length > 0 && p.completedTests.length >= p.prescribedTests.length)) && p.doctorReviewStatus !== 'completed' && p.status !== 'discharged';
    }
    if (triageFilter === 'completed') {
      return p.doctorReviewStatus === 'completed' || p.status === 'discharged';
    }
    return true;
  });

  const opdPatients = [...rawOpdPatients].sort((a, b) => {
    // 1. Emergency patients ALWAYS jump to the top across all triage views!
    const prioA = priorityScore[a.priority] || 1;
    const prioB = priorityScore[b.priority] || 1;
    if (prioA !== prioB) {
      return prioB - prioA; // higher priority first (emergency > senior > standard)
    }

    // 2. Status-specific ordering within the same priority level
    if (triageFilter === 'all') {
      // Order of clinical urgency: Reports Ready (needs review) > New Waiting (needs consult) > In Labs > Discharged
      const getStatusRank = (p: typeof a) => {
        if (p.doctorReviewStatus === 'completed' || p.status === 'discharged') return 4;
        if (p.doctorReviewStatus === 'reports_ready' || (p.prescribedTests.length > 0 && p.completedTests.length >= p.prescribedTests.length)) return 1;
        if (p.prescribedTests.length === 0) return 2;
        return 3; // in labs
      };
      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;
    }

    if (triageFilter === 'in_labs') {
      // Patients closer to finishing diagnostic tests appear earlier
      const diffA = a.prescribedTests.length - a.completedTests.length;
      const diffB = b.prescribedTests.length - b.completedTests.length;
      if (diffA !== diffB) return diffA - diffB;
    }

    // 3. Fallback to OPD Token queue position or registration time
    const tokA = getOpdToken(a.id);
    const tokB = getOpdToken(b.id);
    const posA = tokA?.queuePosition || 999;
    const posB = tokB?.queuePosition || 999;
    return posA - posB;
  });

  // Automatically align selected patient with active triage tab if current selection is not visible
  useEffect(() => {
    if (opdPatients.length > 0 && !opdPatients.some(p => p.id === selectedPatientId)) {
      setSelectedPatient(opdPatients[0].id);
    }
  }, [triageFilter, rosterFilter, selectedDoctorId]);

  // Reports for current patient
  const patientReports = clinicalReports.filter(r => r.patientId === activePatient?.id);

  // Reports needing sign-off
  const pendingSignOffReports = patientReports.filter(r => r.status === 'uploaded');

  const handleToggleTest = (testId: string) => {
    setSelectedTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleApplyBundle = (bundleTestIds: string[]) => {
    setSelectedTestIds(Array.from(new Set([...selectedTestIds, ...bundleTestIds])));
  };

  const handleConfirmPrescription = () => {
    if (!activePatient || selectedTestIds.length === 0) return;
    prescribeTests(activePatient.id, selectedTestIds);
    setPrescriptionSuccess(`Prescribed ${selectedTestIds.length} tests for ${activePatient.name}. OPD review slot reserved.`);
    setSelectedTestIds([]);
    setIsPrescribeOpen(false);
    setTimeout(() => setPrescriptionSuccess(null), 4000);
  };

  const handleOpenReview = (reportId: string) => {
    setReviewReportId(reportId);
    const existing = clinicalReports.find(r => r.id === reportId);
    setDoctorNotes(
      existing?.doctorNotes ||
      'Clinical findings reviewed and correlated with patient vitals. Advised regular exercise, low sodium diet, and scheduled 2-week follow-up.'
    );
  };

  const handleSignOff = () => {
    if (reviewReportId) {
      signOffReport(reviewReportId, doctorNotes);
      setReviewReportId(null);
    }
  };

  const handleDischargePatient = () => {
    if (!activePatient) return;
    completeConsultation(activePatient.id);
    setConsultationSuccess(`Final consultation completed and patient ${activePatient.name} discharged.`);
    setTimeout(() => setConsultationSuccess(null), 4000);
  };

  const reviewingReport = clinicalReports.find(r => r.id === reviewReportId);

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(prescribeSearch.toLowerCase()) ||
    t.code.toLowerCase().includes(prescribeSearch.toLowerCase())
  );

  const isActivePatientReportsReady = Boolean(
    activePatient &&
    (activePatient.doctorReviewStatus === 'reports_ready' ||
      (activePatient.prescribedTests.length > 0 &&
        activePatient.completedTests.length >= activePatient.prescribedTests.length)) &&
    activePatient.doctorReviewStatus !== 'completed' &&
    activePatient.status !== 'discharged'
  );

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. DOCTOR OPD TERMINAL HEADER (Clean Hospital Light Design) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold shrink-0">
            <Stethoscope className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {activeDoctor.name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {activeDoctor.roomNo}
              </span>
              <div className="w-56 sm:w-64">
                <SearchableCombobox
                  options={doctors.map(d => ({
                    id: d.id,
                    label: d.name,
                    subtext: `${d.roomNo} • ${d.specialization}`,
                    category: d.department,
                    badge: `${d.activePatientCount} queued`,
                    badgeColor: 'teal'
                  }))}
                  value={activeDoctor.id}
                  onChange={setSelectedDoctor}
                  placeholder="Switch Doctor Workstation..."
                  searchPlaceholder="Search doctor or room..."
                  size="sm"
                  triggerClassName="py-1 px-2.5 rounded-xl border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-obsidian-800"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeDoctor.specialization} • {activeDoctor.department}
            </p>
          </div>
        </div>

        {/* Live OPD Stats, Walk-in Button & Back to Reception */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="text-xs">
            <span className="text-slate-400 block text-[11px] font-semibold">TODAY'S PATIENTS</span>
            <strong className="text-slate-900 font-bold text-sm">{scopedPatients.length} Total</strong>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[11px] font-semibold">REPORTS FOR REVIEW</span>
            <strong className="text-amber-700 font-bold text-sm">
              {countReportsReady} Ready
            </strong>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          
          {/* Profile Card Preview Button */}
          <button
            type="button"
            onClick={() => setShowDoctorCardModal(true)}
            className="px-3 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span>Profile Card</span>
          </button>

          {/* Quick Add Walk-In Patient Button */}
          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ New Patient</span>
          </button>

          <button
            onClick={signOut}
            title="Back to Reception / Sign out"
            className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {prescriptionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{prescriptionSuccess}</span>
        </div>
      )}

      {consultationSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{consultationSuccess}</span>
        </div>
      )}

      {/* Clinical OPD Guidance Flow Banner */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/80 rounded-3xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <MedicalTooltip
              term="Automated OPD Flow: How Q-Care Manages Your Clinic"
              explanation="Closed-loop outpatient workflow: Walk-in consult, diagnostic dispatch to lowest wait-time labs, and automated return when reports ready."
              clinicalSource="Clinical Workflow Protocol"
              inlineDotted={false}
              className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight"
            />
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 self-start">
            {currentHospital.tier === 'single_doctor_clinic' ? 'Single-Doctor Practice Mode' : `${currentHospital.badge}`}
          </span>
        </div>

        {/* 4-Step Visual Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Step 1</div>
            <div className="font-bold text-slate-900 mt-0.5">Initial Consult</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Walk-in patient checked in to your queue</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Step 2</div>
            <div className="font-bold text-slate-900 mt-0.5">Prescribe Tests</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Order CBC, ECG, X-Ray with 1 click</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-purple-600 uppercase">Step 3</div>
            <div className="font-bold text-slate-900 mt-0.5">Dynamic Lab Dispatch</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Patient routed to shortest queue first</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-700 uppercase">Step 4</div>
            <div className="font-bold text-emerald-950 mt-0.5">'Reports Ready' Return</div>
            <div className="text-[11px] text-emerald-800 mt-0.5">Patient auto-pops back with abnormal flags</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
          {currentHospital.tier === 'single_doctor_clinic' ? (
            <>
              <strong>Single-Doctor Scale:</strong> You are the sole consulting physician at <em>{currentHospital.name}</em>. Attached diagnostic desks report straight back to your workstation so you have full end-to-end control without needing reception staff to relay paper slips.
            </>
          ) : (
            <>
              <strong>Multi-Specialty Efficiency:</strong> Patients never wander corridors searching for lab rooms. Lab technicians upload results directly into this workstation, saving you ~1.5 hours of idle waiting per OPD shift.
            </>
          )}
        </p>
      </div>

      {/* 2. TWO-COLUMN WORKSTATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Today's OPD Patient Queue & Triage Tabs */}
        <div className="lg:col-span-4 space-y-3">
          {/* Scope Toggle & Add Button */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRosterFilter('my')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  rosterFilter === 'my'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Patients ({myPatients.length})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  rosterFilter === 'all'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Hospital ({patients.length})
              </button>
            </div>

            <button
              onClick={() => setIsAddPatientOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-2 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Walk-in</span>
            </button>
          </div>

          {/* 5 Clinical Triage Filters / Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setTriageFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                triageFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All OPD ({countAll})
            </button>
            <button
              type="button"
              onClick={() => setTriageFilter('needs_tests')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                triageFilter === 'needs_tests'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              New ({countNeedsTests})
            </button>
            <button
              type="button"
              onClick={() => setTriageFilter('in_labs')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                triageFilter === 'in_labs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              In Labs ({countInLabs})
            </button>
            <button
              type="button"
              onClick={() => setTriageFilter('reports_ready')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                triageFilter === 'reports_ready'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : countReportsReady > 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold animate-pulse'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>Reports Ready ({countReportsReady})</span>
              {countReportsReady > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
            <button
              type="button"
              onClick={() => setTriageFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                triageFilter === 'completed'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Completed ({countCompleted})
            </button>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {opdPatients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No patients found under this triage tab.
              </div>
            ) : (
              opdPatients.map(p => {
                const isSelected = p.id === activePatient?.id;
                const completedCount = p.completedTests.length;
                const totalCount = p.prescribedTests.length;
                const pReports = clinicalReports.filter(r => r.patientId === p.id);
                const hasUnsignedReport = pReports.some(r => r.status === 'uploaded');
                const allDone = totalCount > 0 && completedCount === totalCount;
                const isDischarged = p.doctorReviewStatus === 'completed' || p.status === 'discharged';
                const isReady = p.doctorReviewStatus === 'reports_ready' || allDone;
                const pOpdToken = queueTokens.find(t => t.patientId === p.id && t.testId === 'opd-consultation');

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : isReady && !isDischarged
                        ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {p.name}
                        </span>
                        {/* OPD Token Pill */}
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          #{p.opdTokenNumber || 'OPD-101'}
                        </span>
                        {/* Live Queue Position Badge */}
                        {pOpdToken && pOpdToken.status !== 'completed' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.priority === 'emergency'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {p.priority === 'emergency' ? 'Queue #1 (Urgent)' : `Queue #${pOpdToken.queuePosition} (~${pOpdToken.estimatedWaitMinutes}m)`}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {p.uhid}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{p.age}Y • {p.gender}</span>
                      <span>•</span>
                      {p.priority === 'emergency' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> Emergency
                        </span>
                      )}
                      {p.priority === 'senior' && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Senior Citizen
                        </span>
                      )}
                      {p.priority === 'standard' && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </div>

                    {/* Sickness / Symptoms */}
                    <div className="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 leading-snug">
                      <span className="font-bold text-amber-900 text-[10px] block">
                        Chief Complaint:
                      </span>
                      <span className="line-clamp-2">{p.currentIllness || p.symptoms || 'General Checkup'}</span>
                    </div>

                    {/* Progress & Queue Status */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        {isDischarged ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Discharged / Completed
                          </span>
                        ) : totalCount === 0 ? (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            New • Needs Tests
                          </span>
                        ) : isReady ? (
                          <span className="text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-300">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> All {totalCount} Ready for Review
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> In Labs ({completedCount} of {totalCount} Done)
                          </span>
                        )}
                      </div>

                      {hasUnsignedReport && !isDischarged && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Review Ready
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Consultation Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <>
              {/* Patient Top Summary Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {activePatient.name}
                      </h2>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-2xl border border-blue-200">
                        Token #{activePatient.opdTokenNumber || 'OPD-101'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      UHID: <span className="font-bold text-slate-800">{activePatient.uhid}</span> • {activePatient.age} Yrs, {activePatient.gender} • Priority: <strong className="text-slate-800 capitalize">{activePatient.priority}</strong> • Reg: {activePatient.registrationTime}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActivePatientReportsReady && (
                      <button
                        onClick={handleDischargePatient}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finish & Discharge</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsPrescribeOpen(true)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Prescribe Tests</span>
                    </button>
                  </div>
                </div>

                {/* Sickness Banner in Patient Dossier */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Reported Symptoms
                  </div>
                  <div className="text-sm font-semibold text-slate-900 leading-snug">
                    "{activePatient.currentIllness || activePatient.symptoms || 'General Outpatient Evaluation'}"
                  </div>
                </div>

                {/* Reports Ready Consultation Banner */}
                {isActivePatientReportsReady && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-950">
                          Diagnostic Workup Complete — All Reports Ready for Final Review!
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Patient is waiting with OPD Token #{activePatient.opdTokenNumber || 'OPD-101'}. Review metrics below and finalize consultation.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDischargePatient}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Discharge Patient</span>
                    </button>
                  </div>
                )}

                {/* Discharged Banner */}
                {(activePatient.doctorReviewStatus === 'completed' || activePatient.status === 'discharged') && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <strong className="font-bold text-slate-900 block text-sm">OPD Consultation Completed</strong>
                      <span>This patient has completed their final consultation and diagnostic review.</span>
                    </div>
                  </div>
                )}

                {/* Prescribed Tests Status Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">
                      Prescribed Tests ({activePatient.prescribedTests.length})
                    </span>
                    <span className="text-slate-500">
                      {activePatient.completedTests.length} of {activePatient.prescribedTests.length} Completed
                    </span>
                  </div>

                  {activePatient.prescribedTests.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                      No tests ordered yet. Click "Prescribe Tests" above to assign diagnostic tests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activePatient.prescribedTests.map(testId => {
                        const test = tests.find(t => t.id === testId);
                        const isDone = activePatient.completedTests.includes(testId);
                        const report = clinicalReports.find(
                          r => r.patientId === activePatient.id && r.testId === testId
                        );

                        return (
                          <div
                            key={testId}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs truncate">
                                {test?.name || testId}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold">
                                {test?.code}
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <span>
                                {isDone ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Report Ready
                                  </span>
                                ) : (
                                  <span className="text-slate-500">In Lab Queue</span>
                                )}
                              </span>

                              {report && report.status === 'uploaded' && (
                                <button
                                  onClick={() => handleOpenReview(report.id)}
                                  className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 transition-colors"
                                >
                                  Sign Off ➔
                                </button>
                              )}
                              {report && report.status === 'verified_by_doctor' && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  ✓ Signed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Quick Prescriptions Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Quick Order Tests
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      1-click to prescribe individual tests for {activePatient.name}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {tests.map(test => {
                    const isAlreadyPrescribed = activePatient.prescribedTests.includes(test.id);
                    const isDone = activePatient.completedTests.includes(test.id);

                    return (
                      <button
                        key={test.id}
                        disabled={isAlreadyPrescribed}
                        onClick={() => {
                          prescribeTests(activePatient.id, [test.id]);
                          setPrescriptionSuccess(`Ordered ${test.name} for ${activePatient.name}.`);
                          setTimeout(() => setPrescriptionSuccess(null), 4000);
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 opacity-80'
                            : isAlreadyPrescribed
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white hover:bg-blue-50/50 hover:border-blue-400 border-slate-200 text-slate-900 shadow-2xs hover:shadow-xs cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-xs truncate">{test.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {test.code}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 line-clamp-1">
                            ~{test.averageDurationMinutes}m • {test.preparationNotes}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] font-bold flex items-center justify-between">
                          <span>
                            {isDone ? (
                              <span className="text-emerald-700">Done ✓</span>
                            ) : isAlreadyPrescribed ? (
                              <span className="text-slate-400">In Progress</span>
                            ) : (
                              <span className="text-blue-600">+ Add Order</span>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pending Sign-Off Section */}
              {pendingSignOffReports.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {pendingSignOffReports.length} Report Awaiting Sign-Off
                      </h3>
                      <p className="text-xs text-slate-600">
                        Results submitted by lab technician. Review metrics and sign report.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pendingSignOffReports.map(report => (
                      <div
                        key={report.id}
                        className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {report.testName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Tech: {report.technicianName} • {report.timestamp}
                          </div>
                          <p className="text-xs text-slate-700 italic mt-1">
                            "{report.summary}"
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenReview(report.id)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          <span>Review & Sign</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
              Select a patient from the OPD queue on the left.
            </div>
          )}
        </div>
      </div>

      {/* Prescribe Tests Modal */}
      {isPrescribeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPrescribeOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Prescribe Tests for {activePatient?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select individual tests or quick clinical bundles.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrescribeOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Quick Clinical Bundles */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Quick Clinical Bundles
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApplyBundle(['test-cbc', 'test-ecg', 'test-xray-chest'])}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold transition-colors"
                  >
                    + Standard Health Screen (CBC + ECG + X-Ray)
                  </button>
                  <button
                    onClick={() => handleApplyBundle(['test-ecg', 'test-lipid', 'test-xray-chest'])}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-colors"
                  >
                    + Cardiac Evaluation (ECG + Lipid + X-Ray)
                  </button>
                  <button
                    onClick={() => handleApplyBundle(['test-fbs', 'test-ppbs'])}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors"
                  >
                    + Diabetic Screen (FBS + PPBS)
                  </button>
                </div>
              </div>

              {/* Search Test Catalog */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Individual Tests
                </span>
                <input
                  type="text"
                  value={prescribeSearch}
                  onChange={e => setPrescribeSearch(e.target.value)}
                  placeholder="Filter tests by name or code..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredTests.map(test => {
                    const isSelected = selectedTestIds.includes(test.id);
                    const alreadyPrescribed = activePatient?.prescribedTests.includes(test.id);

                    return (
                      <div
                        key={test.id}
                        onClick={() => !alreadyPrescribed && handleToggleTest(test.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          alreadyPrescribed
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>{test.name}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {test.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Duration: ~{test.averageDurationMinutes}m • {test.preparationNotes}
                          </p>
                        </div>

                        <div className="shrink-0 pl-2">
                          {alreadyPrescribed ? (
                            <span className="text-[10px] text-slate-500">Already Prescribed</span>
                          ) : (
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {selectedTestIds.length} Tests Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrescribeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleConfirmPrescription}
                  disabled={selectedTestIds.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Order Tests ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Sign-Off Modal */}
      {reviewReportId && reviewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewReportId(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Review & Sign: {reviewingReport.testName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: {reviewingReport.patientName} ({reviewingReport.patientUhid})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewReportId(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Technician remarks */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold block">
                  Lab Technician Observation
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {reviewingReport.summary}
                </p>
              </div>

              {/* Parameters list */}
              <div className="space-y-2">
                <span className="text-slate-500 text-[11px] font-bold block">
                  Measured Values
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {reviewingReport.metrics.map((m, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-900">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">{m.value} {m.unit}</span>
                        <span className="text-[10px] text-slate-400">(Ref: {m.normalRange})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {m.flag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Clinical Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-700 text-xs font-bold block">
                  Doctor's Advice & Remarks:
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={e => setDoctorNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Official Seal Graphic */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-950">
                  Signing will release this report stamped with <strong>{activeDoctor.name}</strong> to the patient.
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewReportId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleSignOff}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Sign & Release Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Walk-in Patient Modal */}
      <RegisterPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        preselectedDoctorId={activeDoctor.id}
        onPatientRegistered={(triage) => {
          if (triage.patientId) {
            setSelectedPatient(triage.patientId);
          } else {
            const matching = patients.find(p => p.uhid === triage.uhid);
            if (matching) {
              setSelectedPatient(matching.id);
            }
          }
          setTriageFilter('needs_tests');
        }}
      />

      {/* Specialist Doctor Appointment & Profile Card Modal */}
      {showDoctorCardModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowDoctorCardModal(false)}
        >
          <div 
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <DoctorAppointmentCard 
              doctor={activeDoctor}
              onBookVisit={() => setShowDoctorCardModal(false)}
              onStartVideoConsult={() => setShowDoctorCardModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
