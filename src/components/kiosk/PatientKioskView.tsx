import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Clock, 
  MapPin, 
  ArrowRight, 
  AlertCircle, 
  Languages, 
  RotateCcw, 
  Compass, 
  Users,
  Check,
  Zap
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { calculateOptimalQueueRoute, formatWaitRange } from '../../engine/queueRouter';
import { TRANSLATIONS } from '../../i18n/translations';
import { PrintableReceipt } from '../common/PrintableReceipt';
import { Patient } from '../../types';

export const PatientKioskView: React.FC = () => {
  const {
    patients,
    tests,
    departments,
    counters,
    queueTokens,
    currentHospital,
    language,
    setLanguage
  } = useHospitalStore();

  const [inputQuery, setInputQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState<number>(60);

  const t = TRANSLATIONS[language];

  // Auto reset session timer when a patient is active
  useEffect(() => {
    if (!selectedPatient) return;
    const interval = setInterval(() => {
      setAutoResetTimer(prev => {
        if (prev <= 1) {
          setSelectedPatient(null);
          setInputQuery('');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPatient]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const q = inputQuery.trim().toLowerCase();
    if (!q) {
      setErrorMessage(language === 'hi' ? 'कृपया टोकन, UHID या मोबाइल नंबर दर्ज करें।' : 'Please enter Token, UHID or Mobile number.');
      return;
    }

    const cleanDigits = q.replace(/\D/g, '');
    const found = patients.find(p => {
      const pUhid = p.uhid.toLowerCase();
      const pToken = (p.opdTokenNumber || '').toLowerCase();
      const pContact = p.contact.replace(/\D/g, '');
      const pName = p.name.toLowerCase();
      const pQrToken = (p.secureQrToken || '').toLowerCase();

      return (
        pUhid === q ||
        pUhid.includes(q) ||
        pToken === q ||
        pToken.includes(q) ||
        (cleanDigits.length >= 4 && pContact.includes(cleanDigits)) ||
        pName === q ||
        pQrToken === q
      );
    });

    if (found) {
      setSelectedPatient(found);
      setAutoResetTimer(60);
      setErrorMessage(null);
    } else {
      setErrorMessage(
        language === 'hi'
          ? 'मरीज का रिकॉर्ड नहीं मिला। कृपया रिसेप्शन डेस्क से संपर्क करें।'
          : 'Patient record not found. Please contact the hospital reception desk.'
      );
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setInputQuery('');
    } else if (val === 'BACK') {
      setInputQuery(prev => prev.slice(0, -1));
    } else {
      setInputQuery(prev => prev + val);
    }
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setInputQuery('');
    setErrorMessage(null);
    setAutoResetTimer(60);
  };

  // Compute live routing plan for active patient
  const routingPlan = selectedPatient
    ? calculateOptimalQueueRoute(
        selectedPatient,
        tests,
        departments,
        queueTokens,
        counters
      )
    : null;

  const upNextStep = routingPlan?.smartRouteSteps.find(s => s.status === 'up_next');
  const allCompleted = selectedPatient
    ? selectedPatient.prescribedTests.length > 0 &&
      selectedPatient.prescribedTests.every(tId => selectedPatient.completedTests.includes(tId))
    : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Kiosk Top Header Bar */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-inner">
            QC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
                Self-Service Kiosk • {currentHospital?.name || 'QCare Hospital'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {language === 'hi' ? 'स्मार्ट मरीज नेविगेशन कियोस्क' : 'Smart Patient Queue & Navigation Kiosk'}
            </h1>
          </div>
        </div>

        {/* Language Toggle & Reset */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-all shadow-2xs"
          >
            <Languages className="w-4 h-4 text-blue-600" />
            <span>{language === 'en' ? 'हिंदी में देखें' : 'English'}</span>
          </button>

          {selectedPatient && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 border border-rose-200 transition-all shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'hi' ? 'समाप्त' : 'Exit'} ({autoResetTimer}s)</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen 1: Touch Search Screen (When no patient selected) */}
      {!selectedPatient ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {language === 'hi' ? 'अपनी जांच और कतार की स्थिति देखें' : 'Check Your Live Queue & Test Status'}
            </h2>
            <p className="text-sm text-slate-500">
              {language === 'hi'
                ? 'अपनी पर्ची का टोकन नंबर, UHID या पंजीकृत मोबाइल नंबर दर्ज करें'
                : 'Enter your Token Number, UHID, or 10-digit registered Mobile Number'}
            </p>
          </div>

          {errorMessage && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Large Kiosk Input Field */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
                <input
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  placeholder="e.g. 9876543210, OPD-104, QC-2026-..."
                  className="w-full pl-14 pr-4 py-3.5 text-lg font-bold bg-slate-50 border-2 border-slate-300 rounded-2xl focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-lg transition-all flex items-center gap-2"
              >
                <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Touch On-Screen Numeric Keypad for Physical Kiosks */}
          <div className="max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-inner">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Touch Keypad
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`py-3.5 rounded-2xl font-black text-lg transition-all shadow-xs active:scale-95 ${
                    key === 'CLEAR'
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs uppercase'
                      : key === 'BACK'
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs uppercase'
                      : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Selector for instant testing */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-400 font-medium">Quick 1-Touch Demo Patients</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {patients.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(p);
                    setAutoResetTimer(60);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-bold text-xs transition-colors"
                >
                  {p.name} ({p.opdTokenNumber || p.uhid})
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Screen 2: Patient Live Route & Queue Display */
        <div className="space-y-6">
          
          {/* Patient Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{selectedPatient.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                    {selectedPatient.age} Y / {selectedPatient.gender}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>UHID: <strong className="font-mono text-slate-800">{selectedPatient.uhid}</strong></span>
                  <span>•</span>
                  <span>Token: <strong className="font-mono text-slate-800">{selectedPatient.opdTokenNumber || 'OPD-101'}</strong></span>
                  <span>•</span>
                  <span>Doctor: <strong className="text-slate-800">{selectedPatient.prescribedDoctorName}</strong></span>
                </div>
              </div>
            </div>

            {/* Print Slip Action */}
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 self-stretch md:self-auto justify-center"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{language === 'hi' ? 'थर्मल पर्ची प्रिंट करें' : 'Print QR Thermal Slip'}</span>
            </button>
          </div>

          {/* Primary Directive Banner (User Rule 4: Next Step Guidance) */}
          <div className="rounded-3xl p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase">
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-bounce" />
                  <span>{t.recommendedNextTest}</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                  {allCompleted
                    ? (language === 'hi' ? 'सभी जांच पूरी हो चुकी हैं' : 'All Diagnostic Tests Completed')
                    : upNextStep
                    ? `${language === 'hi' ? 'अगला कदम: ' : 'Proceed To: '} ${upNextStep.testName}`
                    : (language === 'hi' ? 'कतार में अपनी बारी का इंतजार करें' : 'Waiting in Queue')}
                </h3>

                <p className="text-blue-100 text-sm">
                  {allCompleted
                    ? (language === 'hi' ? `कृपया रिपोर्ट समीक्षा के लिए ${selectedPatient.prescribedDoctorName} के पास लौटें।` : `Please return to ${selectedPatient.prescribedDoctorName} for clinical review.`)
                    : upNextStep?.reasonForSequence || (language === 'hi' ? 'कम से कम प्रतीक्षा समय के लिए इस जांच की सिफारिश की गई है।' : 'Recommended for minimal overall hospital waiting time.')}
                </p>
              </div>

              {upNextStep && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col gap-2 shrink-0 min-w-[220px]">
                  <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold">
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <span>{upNextStep.location.floor}, {upNextStep.location.wing}</span>
                  </div>
                  <div className="text-2xl font-black tracking-tight text-white">
                    {upNextStep.location.room}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold pt-1 border-t border-white/10">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{formatWaitRange(upNextStep.estimatedWaitMinutes)} {t.mins} {t.wait}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prescribed Investigations Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>{language === 'hi' ? 'सभी निर्धारित जांचें व कतार' : 'All Prescribed Investigations & Queue Status'}</span>
            </h3>

            <div className="space-y-3">
              {routingPlan?.smartRouteSteps.map((step, idx) => {
                const isDone = selectedPatient.completedTests.includes(step.testId);
                const isCurrent = step.status === 'up_next';

                const waitingAhead = queueTokens.filter(
                  tk => tk.testId === step.testId && tk.status === 'waiting' && tk.patientId !== selectedPatient.id
                ).length;

                return (
                  <div
                    key={step.testId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-slate-50/70 border-slate-200 opacity-70'
                        : isCurrent
                        ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5" /> : idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{step.testName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {step.testCode}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                              {t.nextStep}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{step.location.room} • {step.location.floor}</span>
                          <span>•</span>
                          <span>Duration: ~{step.estimatedDurationMinutes} mins</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{waitingAhead} {language === 'hi' ? 'मरीज आगे हैं' : 'patients ahead'}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          ~{formatWaitRange(step.estimatedWaitMinutes)}
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isDone ? t.completed : isCurrent ? t.upNext : t.waiting}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedPatient && (
        <PrintableReceipt
          patient={selectedPatient}
          allTests={tests}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};
