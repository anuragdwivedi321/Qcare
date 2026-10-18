import React, { useState } from 'react';
import { 
  FlaskConical, 
  Bell, 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  Send, 
  X, 
  Volume2, 
  Power,
  ArrowLeft,
  QrCode,
  Scan,
  Cpu,
  Zap
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { hospitalAudio } from '../../engine/chimeAudio';
import { ClinicalMetric } from '../../types';

export const LabView: React.FC = () => {
  const {
    counters,
    departments,
    selectedCounterId,
    setSelectedCounter,
    queueTokens,
    patients,
    allPatients,
    tests,
    labMachines,
    callNextToken,
    callSpecificToken,
    startTest,
    putTestOnHold,
    completeTestAndUploadReport,
    toggleCounterStatus,
    checkInPatientAtLab,
    updateLabAvailability,
    updateMachineCounts,
    signOut
  } = useHospitalStore();

  const activeCounter = counters.find(c => c.id === selectedCounterId) || counters[0];
  const activeDept = departments.find(d => d.id === activeCounter.departmentId);

  // Department tokens
  const deptTokens = queueTokens.filter(t => t.departmentId === activeCounter.departmentId);
  const waitingTokens = deptTokens.filter(t => t.status === 'waiting');

  // Currently serving token at this specific counter (robust check via counterId or currentServingTokenId)
  const servingToken = deptTokens.find(
    t => (t.id === activeCounter.currentServingTokenId || t.counterId === activeCounter.id) && 
         (t.status === 'called' || t.status === 'in_progress')
  ) || queueTokens.find(
    t => t.id === activeCounter.currentServingTokenId && (t.status === 'called' || t.status === 'in_progress')
  );

  const matchedPatient = servingToken 
    ? (patients.find(p => p.id === servingToken.patientId) || (allPatients && allPatients.find(p => p.id === servingToken.patientId)))
    : null;
  const servingTest = servingToken ? tests.find(t => t.id === servingToken.testId) : null;
  const servingPatient = matchedPatient || (servingToken ? {
    id: servingToken.patientId,
    uhid: servingToken.patientUhid || 'QC-2026-9411',
    name: servingToken.patientName || 'Registered Patient',
    age: servingToken.patientAge || 45,
    gender: servingToken.patientGender || 'Male',
    contact: '+91 98200 00000',
    priority: servingToken.priority,
    prescribedDoctorId: servingToken.doctorId || 'doc-01',
    prescribedDoctorName: servingToken.doctorName || 'Dr. Arvind Swaminathan',
    prescribedDoctorRoom: 'OPD Room 204',
    currentIllness: servingToken.testName || servingTest?.name || 'Diagnostic Testing',
    symptoms: 'Diagnostic Testing',
    prescribedTests: [servingToken.testId],
    completedTests: [],
    activeTokenIds: {},
    status: 'in_test' as const,
    assignedSmartRoute: [servingToken.testId],
    assignedNaiveRoute: [servingToken.testId],
    registrationTime: servingToken.issuedAt
  } : null);

  // Enter Results Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [metricValues, setMetricValues] = useState<ClinicalMetric[]>([]);

  // Check-In modal state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Department machines
  const deptMachines = labMachines.filter(m => m.departmentId === activeDept?.id);

  // Open modal with clinical parameters tailored to the active test
  const handleOpenFilingModal = () => {
    if (!servingToken) return;

    if (servingToken.testId === 'test-cbc') {
      setSummaryInput('Normocytic normochromic red cell morphology. Leukocyte count and differential within normal limits. Adequate platelets.');
      setMetricValues([
        { label: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', normalRange: '13.0 - 17.0 g/dL', flag: 'normal' },
        { label: 'Total Leucocyte Count (TLC)', value: '7,400', unit: '/µL', normalRange: '4,000 - 11,000 /µL', flag: 'normal' },
        { label: 'Platelet Count', value: '245,000', unit: '/µL', normalRange: '150,000 - 450,000 /µL', flag: 'normal' },
        { label: 'Hematocrit (PCV)', value: '42.5', unit: '%', normalRange: '40 - 50%', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-ecg') {
      setSummaryInput('Normal sinus rhythm with resting rate 72 bpm. Normal PR interval, narrow QRS complexes, no ST-T changes.');
      setMetricValues([
        { label: 'Resting Heart Rate', value: '72', unit: 'bpm', normalRange: '60 - 100 bpm', flag: 'normal' },
        { label: 'PR Interval', value: '156', unit: 'ms', normalRange: '120 - 200 ms', flag: 'normal' },
        { label: 'QRS Duration', value: '86', unit: 'ms', normalRange: '< 120 ms', flag: 'normal' },
        { label: 'QTc Interval', value: '412', unit: 'ms', normalRange: '< 440 ms', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-xray-chest') {
      setSummaryInput('Bilateral lung fields clear. Trachea is central. Normal cardiothoracic ratio. Both costophrenic angles are clear.');
      setMetricValues([
        { label: 'Cardiothoracic Ratio', value: '0.45', unit: 'ratio', normalRange: '< 0.50', flag: 'normal' },
        { label: 'Costophrenic Angles', value: 'Clear', unit: 'status', normalRange: 'Clear', flag: 'normal' },
        { label: 'Bilateral Lung Fields', value: 'Clear', unit: 'status', normalRange: 'Clear', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-fbs') {
      setSummaryInput('Fasting specimen collected after verified 10-hour overnight fast. Glycemic parameters within normal physiological reference.');
      setMetricValues([
        { label: 'Fasting Plasma Glucose', value: '92', unit: 'mg/dL', normalRange: '70 - 99 mg/dL', flag: 'normal' },
        { label: 'Estimated Average Glucose', value: '98', unit: 'mg/dL', normalRange: '< 117 mg/dL', flag: 'normal' }
      ]);
    } else if (servingToken.testId === 'test-lipid') {
      setSummaryInput('Serum clear and non-lipemic. Fasting lipid fractions assessed. Cholesterol ratio calculated.');
      setMetricValues([
        { label: 'Total Serum Cholesterol', value: '185', unit: 'mg/dL', normalRange: '< 200 mg/dL', flag: 'normal' },
        { label: 'Serum Triglycerides', value: '142', unit: 'mg/dL', normalRange: '< 150 mg/dL', flag: 'normal' },
        { label: 'HDL Cholesterol (Good)', value: '48', unit: 'mg/dL', normalRange: '> 40 mg/dL', flag: 'normal' },
        { label: 'LDL Cholesterol', value: '108', unit: 'mg/dL', normalRange: '< 100 mg/dL', flag: 'high' }
      ]);
    } else if (servingToken.testId === 'test-usg-abdomen') {
      setSummaryInput('Sonography of abdomen. Liver normal size and texture. Gallbladder clear. Kidneys unremarkable.');
      setMetricValues([
        { label: 'Liver Parenchyma', value: 'Normal', unit: 'status', normalRange: 'Normal', flag: 'normal' },
        { label: 'Common Bile Duct (CBD)', value: '3.8', unit: 'mm', normalRange: '< 6.0 mm', flag: 'normal' },
        { label: 'Right Kidney Length', value: '10.4', unit: 'cm', normalRange: '9.0 - 12.0 cm', flag: 'normal' },
        { label: 'Left Kidney Length', value: '10.6', unit: 'cm', normalRange: '9.0 - 12.0 cm', flag: 'normal' }
      ]);
    } else {
      setSummaryInput('Diagnostic test completed according to clinical protocol. Values within standard biological range.');
      setMetricValues([
        { label: 'Primary Test Marker', value: '98', unit: 'Index', normalRange: '70 - 110', flag: 'normal' },
        { label: 'Secondary Parameter', value: '1.02', unit: 'ratio', normalRange: '0.8 - 1.2', flag: 'normal' }
      ]);
    }

    setIsReportModalOpen(true);
  };

  const applyPreset = (type: 'normal' | 'borderline' | 'critical') => {
    if (type === 'normal') {
      setSummaryInput('Investigation conducted within standard reference limits. Specimen passed analytical quality criteria.');
      setMetricValues(prev =>
        prev.map(m => {
          let normalVal = m.value;
          if (m.label.includes('Glucose')) normalVal = '92';
          else if (m.label.includes('Heart Rate')) normalVal = '72';
          else if (m.label.includes('Hemoglobin')) normalVal = '14.2';
          else if (m.label.includes('Bile Duct')) normalVal = '3.8';
          return { ...m, value: normalVal, flag: 'normal' };
        })
      );
    } else if (type === 'borderline') {
      setSummaryInput('Borderline variance observed. Advised follow-up with doctor.');
      setMetricValues(prev =>
        prev.map((m, idx) => {
          if (idx === 0) {
            let highVal = m.value;
            if (m.label.includes('Glucose')) highVal = '118';
            else if (m.label.includes('Heart Rate')) highVal = '104';
            else if (m.label.includes('Hemoglobin')) highVal = '11.4';
            else if (m.label.includes('Bile Duct')) highVal = '6.4';
            return { ...m, value: highVal, flag: 'high' };
          }
          return { ...m, flag: 'normal' };
        })
      );
    } else if (type === 'critical') {
      setSummaryInput('High variance detected. Urgent clinical notification advised.');
      setMetricValues(prev =>
        prev.map((m, idx) => {
          if (idx === 0) {
            let critVal = m.value;
            if (m.label.includes('Glucose')) critVal = '285';
            else if (m.label.includes('Heart Rate')) critVal = '164';
            else if (m.label.includes('Hemoglobin')) critVal = '6.8';
            else if (m.label.includes('Bile Duct')) critVal = '11.2';
            return { ...m, value: critVal, flag: 'critical' };
          }
          return { ...m, flag: 'high' };
        })
      );
    }
  };

  const handleCallNext = () => {
    if (activeCounter.status !== 'active') return;
    callNextToken(activeCounter.id);
  };

  const handleStartTest = () => {
    if (servingToken) {
      startTest(servingToken.id);
    }
  };

  const handlePutOnHold = () => {
    if (servingToken) {
      putTestOnHold(servingToken.id);
    }
  };

  const handleReannounce = () => {
    if (servingToken && activeDept) {
      hospitalAudio.announceToken(
        servingToken.tokenNumber, 
        activeCounter.name, 
        activeDept.location.room, 
        servingPatient?.name
      );
    }
  };

  const handleSubmitReport = () => {
    if (!servingToken) return;

    completeTestAndUploadReport(servingToken.id, {
      summary: summaryInput,
      metrics: metricValues
    });

    setIsReportModalOpen(false);
  };

  const handleExecuteCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim() || !activeDept) return;

    checkInPatientAtLab(checkInInput.trim(), activeDept.id);
    setCheckInFeedback(`Checked in patient / token "${checkInInput.trim()}"!`);
    setTimeout(() => {
      setCheckInFeedback(null);
      setIsCheckInOpen(false);
      setCheckInInput('');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Directive Banner: Next Step Guidance (User Rule 4) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-slate-900 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold mb-2 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600 animate-pulse" />
            <span>Next Step Directive</span>
            <span className="text-blue-400">•</span>
            <span className="font-bold">{activeDept?.name} ({activeCounter.name})</span>
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            {servingToken?.status === 'called'
              ? 'Patient Summoned • Awaiting Entry to Lab'
              : servingToken?.status === 'in_progress'
              ? `Conducting ${servingTest?.name || 'Investigation'}`
              : waitingTokens.length > 0
              ? `${waitingTokens.length} Patient${waitingTokens.length === 1 ? '' : 's'} Waiting in Queue`
              : 'Lab Queue Clear • Station on Standby'}
          </h1>

          <p className="text-slate-600 text-xs md:text-sm mt-0.5 font-medium">
            {servingToken?.status === 'called'
              ? `Verify Token #${servingToken.tokenNumber} and patient identity, then click "Start Test".`
              : servingToken?.status === 'in_progress'
              ? 'Complete diagnostic evaluation, then click "Mark Done & Enter Report" to finalize.'
              : waitingTokens.length > 0
              ? 'Click "Call Next Patient" below to summon the next patient in priority order.'
              : 'Awaiting patient routing slips or check-in scans at this diagnostic station.'}
          </p>
        </div>

        {/* Quick Check-In Patient Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCheckInOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border border-slate-200 shadow-sm transition-all flex items-center gap-2"
          >
            <Scan className="w-4 h-4 text-blue-600" />
            <span>Check-In Patient (Scan / ID)</span>
          </button>
        </div>
      </div>

      {/* 0. ALL HOSPITAL DIAGNOSTIC LABS QUICK SWITCHER BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">
              Hospital Diagnostic Units & Diagnostic Labs ({departments.length} Units)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Click any lab to switch station & queue
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {departments.map(dept => {
            const isSelected = activeDept?.id === dept.id;
            const deptWaiting = queueTokens.filter(
              t => t.departmentId === dept.id && (t.status === 'waiting' || t.status === 'in_progress')
            ).length;
            const deptCounter = counters.find(c => c.departmentId === dept.id);

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  if (deptCounter) {
                    setSelectedCounter(deptCounter.id);
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-600/30 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {dept.code}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    deptWaiting > 0 
                      ? 'bg-amber-100 text-amber-800 font-black' 
                      : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {deptWaiting} queue
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-xs truncate" title={dept.name}>
                  {dept.name.split('&')[0].trim()}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {dept.location.room.split('(')[0].trim()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. STATION CONTROLS & MACHINE BREAKDOWN BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
              <FlaskConical className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeCounter.name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {activeCounter.code}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  activeCounter.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {activeCounter.status === 'active' ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Technician: <strong className="text-slate-800">{activeCounter.technicianName}</strong> • {activeDept?.name} ({activeDept?.location.room})
              </p>
            </div>
          </div>

          {/* Station Switcher & Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <select
                value={selectedCounterId}
                onChange={e => setSelectedCounter(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold px-4 py-2 pr-9 text-slate-800 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
              >
                {counters.map(c => {
                  const dept = departments.find(d => d.id === c.departmentId);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {dept?.code}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Lab Availability Toggle */}
            {activeDept && (
              <select
                value={activeDept.availabilityStatus || 'available'}
                onChange={e => updateLabAvailability(activeDept.id, e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold px-3 py-2 text-slate-800 cursor-pointer"
              >
                <option value="available">🟢 Lab Available</option>
                <option value="busy">🟡 Lab Busy</option>
                <option value="unavailable">🔴 Lab Unavailable</option>
              </select>
            )}

            <button
              onClick={() => toggleCounterStatus(activeCounter.id)}
              className={`p-2 rounded-2xl border text-xs flex items-center gap-1.5 transition-all ${
                activeCounter.status === 'active'
                  ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-emerald-600 border-emerald-500 text-white'
              }`}
              title="Toggle Online / Standby"
            >
              <Power className="w-4 h-4" />
            </button>

            <button
              onClick={signOut}
              title="Sign out"
              className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Machine Breakdown Status Row for this Lab */}
        {deptMachines.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Cpu className="w-4 h-4 text-purple-700" />
              <span>Diagnostic Equipment in {activeDept?.name}:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {deptMachines.map(m => {
                const broken = m.totalCount - m.activeCount;
                return (
                  <div key={m.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800">{m.name}:</span>
                    <span className="text-emerald-700 font-semibold">{m.activeCount} Online</span>
                    {broken > 0 && (
                      <span className="text-rose-600 font-bold">({broken} Broken)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (broken > 0) {
                          updateMachineCounts(m.departmentId, m.totalCount, m.totalCount);
                        } else {
                          updateMachineCounts(m.departmentId, m.totalCount, Math.max(0, m.totalCount - 1));
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        broken > 0
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                      }`}
                    >
                      {broken > 0 ? 'Fix Machine' : 'Report Breakdown'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MAIN SERVING AND QUEUE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Left: Active Patient Token & Controls (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/70 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              {/* Header Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${servingToken ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  Currently Serving
                </span>
                <span className="text-xs text-slate-500">
                  Completed Today: <strong className="text-slate-900">{activeCounter.servedCountToday}</strong>
                </span>
              </div>

              {servingToken ? (
                <div className="mt-4 space-y-4">
                  {/* Pipeline Stepper (Visual Flow) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      {/* Step 1: Called */}
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          servingToken.status === 'called'
                            ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-300 animate-pulse'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          ✓
                        </span>
                        <div className="text-left">
                          <span className={`block font-bold leading-tight ${servingToken.status === 'called' ? 'text-amber-900' : 'text-slate-500'}`}>
                            1. Called
                          </span>
                          <span className="text-[10px] text-slate-400">Summoned</span>
                        </div>
                      </div>

                      <div className={`h-0.5 flex-1 mx-2 ${servingToken.status === 'in_progress' ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                      {/* Step 2: Testing / In-Progress */}
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          servingToken.status === 'in_progress'
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          2
                        </span>
                        <div className="text-left">
                          <span className={`block font-bold leading-tight ${servingToken.status === 'in_progress' ? 'text-blue-900' : 'text-slate-500'}`}>
                            2. Testing
                          </span>
                          <span className="text-[10px] text-slate-400">In Progress</span>
                        </div>
                      </div>

                      <div className="h-0.5 flex-1 mx-2 bg-slate-200" />

                      {/* Step 3: Complete Report */}
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-[11px] font-bold">
                          3
                        </span>
                        <div className="text-left">
                          <span className="block font-bold text-slate-400 leading-tight">
                            3. Results
                          </span>
                          <span className="text-[10px] text-slate-400">Enter Values</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Big Token Display Card */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                      CURRENT PATIENT TOKEN
                    </span>
                    <div className="text-5xl sm:text-6xl font-black tracking-tight text-purple-700">
                      {servingToken.tokenNumber}
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${
                        servingToken.status === 'called'
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${servingToken.status === 'called' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                        <span>{servingToken.status === 'called' ? 'Called • Awaiting Entry' : 'Test In Progress'}</span>
                      </span>
                    </div>
                  </div>

                  {/* PROMINENT BOLD PATIENT DOSSIER */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Current Patient Name
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                          {servingPatient?.name || 'Walk-in Patient'}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                          UHID: {servingPatient?.uhid || 'QC-WALKIN'}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                          {servingPatient?.age}Y • {servingPatient?.gender}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize border ${
                          servingToken.priority === 'senior'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : servingToken.priority === 'emergency'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {servingToken.priority}
                        </span>
                      </div>
                    </div>

                    {/* Investigation Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Investigation Required
                        </span>
                        <div className="font-bold text-slate-900 text-sm">
                          {servingTest?.name || 'General Test'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Code: {servingTest?.code} • ~{servingTest?.averageDurationMinutes || 8} mins
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Doctor / OPD Consultation
                        </span>
                        <div className="font-bold text-slate-800 text-xs">
                          {servingPatient?.prescribedDoctorName || 'Dr. Sarah Khan'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {servingPatient?.prescribedDoctorRoom || 'OPD Room 12'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-12 text-center space-y-2">
                  <div className="text-3xl sm:text-4xl font-bold text-slate-300">
                    Station Idle
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Call Next Patient" below to summon the next patient in line.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCallNext}
                  disabled={waitingTokens.length === 0 || activeCounter.status !== 'active'}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
                >
                  <Bell className="w-4 h-4" />
                  <span>{activeCounter.status === 'active' ? 'Call Next Patient' : 'Station Offline'}</span>
                </button>

                {servingToken ? (
                  servingToken.status === 'called' ? (
                    <button
                      onClick={handleStartTest}
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Test & Sample Draw</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenFilingModal}
                      className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Done & Enter Report</span>
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 px-4 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>Standby</span>
                  </button>
                )}
              </div>

              {servingToken && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handlePutOnHold}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Put On Hold</span>
                  </button>
                  <button
                    onClick={handleReannounce}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Repeat Audio Announcement</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Department Waiting Queue (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-700">
                  Waiting Queue ({waitingTokens.length})
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {activeDept?.code}
                </span>
              </div>

              {/* Explicit Token Progression Flow (TK-001 ➔ TK-002) */}
              {(servingToken || waitingTokens.length > 0) && (
                <div className="mt-3 bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Token Progression</span>
                    <span className="text-blue-600 font-mono font-bold">Live Flow</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {servingToken && (
                      <>
                        <div className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold shadow-xs shrink-0 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>{servingToken.tokenNumber}</span>
                          <span className="text-[9px] uppercase font-normal opacity-90">(Serving)</span>
                        </div>
                        {waitingTokens.length > 0 && <span className="text-slate-400 font-bold shrink-0">➔</span>}
                      </>
                    )}
                    {waitingTokens.slice(0, 4).map((tok, idx) => (
                      <React.Fragment key={tok.id}>
                        <div className={`px-2 py-0.5 rounded-lg font-mono font-bold shrink-0 flex items-center gap-1 ${
                          idx === 0
                            ? 'bg-blue-50 text-blue-800 border border-blue-300'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          <span>{tok.tokenNumber}</span>
                          {idx === 0 && <span className="text-[9px] font-semibold text-blue-600">(Next)</span>}
                        </div>
                        {idx < Math.min(waitingTokens.length - 1, 3) && (
                          <span className="text-slate-300 text-[10px] shrink-0">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                    {waitingTokens.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">+{waitingTokens.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}

              {waitingTokens.length === 0 ? (
                <div className="my-12 text-center text-xs text-slate-500 space-y-1">
                  <p>No waiting tokens for {activeDept?.name}.</p>
                  <p className="text-[11px] text-slate-400">Queue is clear.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {waitingTokens.map((tok, idx) => {
                    const p = patients.find(patient => patient.id === tok.patientId) ||
                              (allPatients && allPatients.find(patient => patient.id === tok.patientId));
                    const t = tests.find(test => test.id === tok.testId);
                    const displayName = p?.name || tok.patientName || 'Registered Patient';
                    const displayUhid = p?.uhid || tok.patientUhid || 'QC-REG';
                    const displayAge = p?.age ?? tok.patientAge;
                    const displayGender = p?.gender ?? tok.patientGender;

                    return (
                      <div
                        key={tok.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-bold text-xs">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {displayName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                tok.priority === 'emergency'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : tok.priority === 'senior'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {tok.priority}
                              </span>
                              {displayAge && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({displayAge}y / {displayGender?.[0] || 'M'})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/80">
                                Token #{tok.tokenNumber}
                              </span>
                              <span className="text-slate-700 font-medium">{tok.testName || t?.name || t?.code}</span>
                              {displayUhid && (
                                <span className="text-slate-400 text-[10px]">UHID: {displayUhid}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => callSpecificToken(activeCounter.id, tok.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 text-[11px] font-bold transition-colors shrink-0"
                        >
                          Call ➔
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Check-In Modal */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">Check-In Patient at {activeDept?.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkInFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{checkInFeedback}</span>
              </div>
            )}

            <form onSubmit={handleExecuteCheckIn} className="space-y-3">
              <p className="text-xs text-slate-500">
                Scan thermal slip QR code or enter Patient UHID, Token Number (e.g. USG-201), or Mobile:
              </p>

              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={checkInInput}
                  onChange={e => setCheckInInput(e.target.value)}
                  placeholder="Scan URL, enter UHID or Token #..."
                  className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!checkInInput.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl shadow-xs"
                >
                  Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Results Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Record Findings: {servingTest?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: {servingPatient?.name} ({servingPatient?.uhid})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Quick Presets
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyPreset('normal')}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-center transition-colors shadow-2xs"
                  >
                    ✓ Normal Values
                  </button>
                  <button
                    onClick={() => applyPreset('borderline')}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-center transition-colors shadow-2xs"
                  >
                    ⚠ Borderline
                  </button>
                  <button
                    onClick={() => applyPreset('critical')}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-center transition-colors shadow-2xs"
                  >
                    🚨 High / Alert
                  </button>
                </div>
              </div>

              {/* Observed Numerical Metrics */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Measured Parameters
                </span>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {metricValues.map((metric, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{metric.label}</span>
                        <div className="text-[11px] text-slate-400">Reference: {metric.normalRange}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={metric.value}
                          onChange={e => {
                            const val = e.target.value;
                            setMetricValues(prev =>
                              prev.map((m, mIdx) => (mIdx === idx ? { ...m, value: val } : m))
                            );
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                        />
                        <span className="text-slate-500 text-xs w-10">{metric.unit}</span>

                        <select
                          value={metric.flag}
                          onChange={e => {
                            const flagVal = e.target.value as any;
                            setMetricValues(prev =>
                              prev.map((m, mIdx) => (mIdx === idx ? { ...m, flag: flagVal } : m))
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                            metric.flag === 'normal'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : metric.flag === 'critical'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Technician Remarks:
                </label>
                <textarea
                  value={summaryInput}
                  onChange={e => setSummaryInput(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Counter: {activeCounter.code} • {activeCounter.technicianName}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
