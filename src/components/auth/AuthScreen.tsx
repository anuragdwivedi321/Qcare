import React, { useState, useEffect } from 'react';
import { 
  User, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  Lock, 
  QrCode, 
  Monitor, 
  X, 
  ChevronRight, 
  FlaskConical
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { PriorityLevel } from '../../types';
import { WhyQCareModal } from '../common/WhyQCareModal';
import { PrintableReceipt } from '../common/PrintableReceipt';
import { SearchableCombobox } from '../common/SearchableCombobox';
import { MedicalTooltip } from '../common/MedicalTooltip';
import { SecurityPopover } from '../common/SecurityPopover';
import { HeroDiscoveryBar } from '../common/HeroDiscoveryBar';
import { AccreditationBar } from '../common/AccreditationBar';
import { EmergencyHotlineBadge } from '../common/EmergencyHotlineBadge';

export const AuthScreen: React.FC = () => {
  const { 
    currentHospital,
    hospitals,
    currentHospitalId,
    setHospital,
    patients, 
    doctors, 
    tests,
    counters,
    departments,
    queueTokens,
    registerPatient,
    loginAsPatient, 
    loginAsLabTech,
    loginAsStaff,
    loginAsPatientWithToken,
    loadDemoScenarioRahul,
    setActiveRole
  } = useHospitalStore();

  const [activePortalTab, setActivePortalTab] = useState<'patient' | 'staff' | 'lab'>('staff');
  const [patientMode, setPatientMode] = useState<'lookup' | 'register'>('lookup');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  // Staff Login Form State
  const [staffHospCode, setStaffHospCode] = useState('QCARE-HOSP-001');
  const [staffIdentifier, setStaffIdentifier] = useState('STAFF-ASST-01');
  const [staffPassword, setStaffPassword] = useState('staff123');

  // Patient Registration Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [contact, setContact] = useState('');
  const [currentIllness, setCurrentIllness] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || 'doc-01');
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [isManualPriority, setIsManualPriority] = useState<boolean>(false);
  const [registeredPatientObj, setRegisteredPatientObj] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Patient Lookup State
  const [lookupInput, setLookupInput] = useState('');

  // Auto-flag Senior Citizen if age >= 60 unless user manually picked Emergency
  useEffect(() => {
    if (!isManualPriority) {
      if (typeof age === 'number' && age >= 60) {
        setPriority('senior');
      } else {
        setPriority('standard');
      }
    }
  }, [age, isManualPriority]);

  const handleStaffLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const res = loginAsStaff(staffHospCode, staffIdentifier, staffPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid staff credentials.');
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) {
      setErrorMessage('Please enter a Token number, UHID, or registered Mobile number.');
      return;
    }

    const res = loginAsPatientWithToken(lookupInput.trim());
    if (!res.success) {
      // Fallback to general loginAsPatient
      const legacySuccess = loginAsPatient(lookupInput.trim());
      if (!legacySuccess) {
        setErrorMessage(res.error || `No patient record found for "${lookupInput}".`);
      } else {
        setErrorMessage(null);
      }
    } else {
      setErrorMessage(null);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter the patient full name.');
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 120) {
      setErrorMessage('Please enter a valid age between 1 and 120.');
      return;
    }
    if (!contact.trim()) {
      setErrorMessage('Please enter a mobile phone number.');
      return;
    }
    if (!currentIllness.trim()) {
      setErrorMessage('Please describe the current symptoms or illness.');
      return;
    }

    setErrorMessage(null);
    const registered = registerPatient({
      name: name.trim(),
      age: Number(age),
      gender,
      contact: contact.trim(),
      currentIllness: currentIllness.trim(),
      doctorId: selectedDoctorId,
      priority,
      autoLogin: false
    });

    setRegisteredPatientObj(registered);
    setIsReceiptOpen(true);
  };

  // Quick 1-Click Launchers
  const handleLaunchRahulDemo = () => {
    loadDemoScenarioRahul();
  };

  const handleLaunchKiosk = () => {
    setActiveRole('kiosk');
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-between select-none bg-slate-50 text-slate-900"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.90), rgba(241, 245, 249, 0.95)), url('/hospital_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Header (Hospital Clean Bright) */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md relative z-10 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-slate-200/90 shrink-0 shadow-xs">
              <img 
                src="/logo.png" 
                alt="QCare Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  QCare Hospital Platform
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Central Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hospital Diagnostic Queue Management & Smart Patient Routing
              </p>
            </div>
          </div>

          {/* Hospital Branch Selector & Controls */}
          <div className="flex items-center gap-2.5">
            <div className="w-[140px] sm:w-[210px]">
              <SearchableCombobox
                options={hospitals.map(h => ({
                  id: h.id,
                  label: h.shortName || h.name,
                  subtext: `${h.city || 'Campus'} • ${h.badge}`,
                  category: h.state || 'Metro Branches',
                  badge: h.badge,
                  badgeColor: 'teal'
                }))}
                value={currentHospitalId}
                onChange={newId => {
                  setHospital(newId);
                  const hosp = hospitals.find(h => h.id === newId);
                  if (hosp?.code) setStaffHospCode(hosp.code);
                  setErrorMessage(null);
                }}
                placeholder="Select Hospital Branch..."
                searchPlaceholder="Search branch or city..."
                size="sm"
                triggerClassName="py-1 px-2.5 rounded-xl border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-obsidian-800"
              />
            </div>

            <button
              onClick={() => setShowWhyModal(true)}
              className="px-3 py-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
              <span className="hidden sm:inline">Why QCare?</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Reception Gate Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center relative z-10">
        
        {/* Prominent Center Brand Hero ("min me bada sa Q-Care") */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-2.5 shadow-clinical border border-slate-200/90 mb-3 mx-auto transition-transform hover:scale-105 duration-300">
            <img 
              src="/logo.png" 
              alt="QCare Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-obsidian-900">
              Q-CARE
            </h1>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              Hospital OS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto mt-2">
            Hospital Diagnostic Queue Management & Smart Patient Routing System
          </p>
        </div>

        {/* Unified 3-Field Hero Discovery Bar */}
        <HeroDiscoveryBar className="mb-6" />

        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-clinical overflow-hidden">
          
          {/* Active Hospital Context Banner */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Active Hospital:</span>
              <strong className="text-slate-900">{currentHospital.name}</strong>
            </div>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Code: {currentHospital.code || currentHospital.id}
            </span>
          </div>

          {/* 3 Portal Selection Tabs (Staff, Patient QR, Lab Tech) */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/70 p-2 gap-2">
            <button
              onClick={() => {
                setActivePortalTab('staff');
                setErrorMessage(null);
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                activePortalTab === 'staff'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Staff Workstation</span>
            </button>

            <button
              onClick={() => {
                setActivePortalTab('patient');
                setErrorMessage(null);
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                activePortalTab === 'patient'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Patient QR Portal</span>
            </button>

            <button
              onClick={() => {
                setActivePortalTab('lab');
                setErrorMessage(null);
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                activePortalTab === 'lab'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Diagnostic Lab Portal</span>
            </button>
          </div>

          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ================= TAB 1: STAFF LOGIN ================= */}
            {activePortalTab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hospital Staff Authentication</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign in to access your role-based workstation (Super Admin, Hospital Admin, Assistant, or Lab).
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Code
                    </label>
                    <input
                      type="text"
                      value={staffHospCode}
                      onChange={e => setStaffHospCode(e.target.value)}
                      placeholder="e.g. QCARE-HOSP-001"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff ID or Email
                    </label>
                    <input
                      type="text"
                      value={staffIdentifier}
                      onChange={e => setStaffIdentifier(e.target.value)}
                      placeholder="e.g. STAFF-ASST-01 or assistant@qcare.demo"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={e => setStaffPassword(e.target.value)}
                      placeholder="e.g. staff123 or admin123"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Fast Fill Pills */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    Quick Credentials Autofill:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffHospCode('QCARE-HOSP-001');
                        setStaffIdentifier('STAFF-ASST-01');
                        setStaffPassword('staff123');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      Doctor Assistant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffHospCode('QCARE-HOSP-001');
                        setStaffIdentifier('STAFF-USG-01');
                        setStaffPassword('staff123');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      USG Lab Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffHospCode('QCARE-HOSP-001');
                        setStaffIdentifier('STAFF-ADMIN-01');
                        setStaffPassword('admin123');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      Hospital Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffHospCode('QCARE-HOSP-001');
                        setStaffIdentifier('STAFF-SUPER-01');
                        setStaffPassword('admin123');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      Super Admin
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authenticate into Workstation</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 2: PATIENT QR PORTAL (NO LOGIN WALL - 1-CLICK ROSTER) ================= */}
            {activePortalTab === 'patient' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Patient QR Portal
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No password required! Click any registered patient below to immediately open their live diagnostic journey.
                    </p>
                  </div>

                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => setPatientMode('lookup')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        patientMode === 'lookup'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Live Patient Roster
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientMode('register')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        patientMode === 'register'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      + Walk-in OPD Register
                    </button>
                  </div>
                </div>

                {patientMode === 'lookup' ? (
                  <div className="space-y-4 pt-1">
                    {/* Instant Search Bar */}
                    <form onSubmit={handleLookupSubmit} className="relative">
                      <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={lookupInput}
                        onChange={e => setLookupInput(e.target.value)}
                        placeholder="Search by Patient Name, Token (#OPD-101), UHID, or Mobile (Press Enter)..."
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </form>

                    {/* Interactive Roster of Registered Patients */}
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {patients
                        .filter(p => {
                          if (!lookupInput.trim()) return true;
                          const q = lookupInput.trim().toLowerCase();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            p.uhid.toLowerCase().includes(q) ||
                            (p.opdTokenNumber && p.opdTokenNumber.toLowerCase().includes(q)) ||
                            p.contact.includes(q)
                          );
                        })
                        .map(p => {
                          const isRahul = p.id === 'pat-rahul-sharma';
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => loginAsPatient(p.uhid)}
                              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group shadow-2xs ${
                                isRahul
                                  ? 'bg-blue-50/70 border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                  isRahul ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700">
                                      {p.name}
                                    </span>
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 font-bold">
                                      {p.opdTokenNumber || p.uhid}
                                    </span>
                                    {p.doctorPriority && p.doctorPriority !== 'normal' && (
                                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                        p.doctorPriority === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {p.doctorPriority}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>{p.age} Y / {p.gender}</span>
                                    <span>•</span>
                                    <span>Dr. {p.prescribedDoctorName}</span>
                                    <span>•</span>
                                    <span className="text-blue-600 font-semibold">
                                      {p.prescribedTests.length} investigations ({p.completedTests.length} done)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="hidden sm:inline-block text-xs font-bold text-blue-600 group-hover:underline">
                                  Open Journey
                                </span>
                                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  /* Walk-In OPD Registration Form */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 52"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                        <SearchableCombobox
                          options={[
                            { id: 'Male', label: 'Male' },
                            { id: 'Female', label: 'Female' },
                            { id: 'Other', label: 'Other' },
                          ]}
                          value={gender}
                          onChange={val => setGender(val as any)}
                          placeholder="Select Gender"
                          size="sm"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                        <SecurityPopover label="256-Bit Encrypted" />
                      </div>
                      <input
                        type="tel"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        placeholder="e.g. 9811223344"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-all tabular-nums"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Consulting Doctor
                        </label>
                        <MedicalTooltip 
                          term="OPD Triage" 
                          explanation="Assigns the patient directly to the doctor's active OPD queue for clinical review and diagnostic orders." 
                          clinicalSource="National Hospital Management Protocol"
                        />
                      </div>
                      <SearchableCombobox
                        options={doctors.map(d => ({
                          id: d.id,
                          label: d.name,
                          subtext: `${d.roomNo} • ${d.specialization}`,
                          category: d.department,
                          badge: `${d.activePatientCount} queued`,
                          badgeColor: 'teal'
                        }))}
                        value={selectedDoctorId}
                        onChange={setSelectedDoctorId}
                        placeholder="Select Consulting Doctor..."
                        searchPlaceholder="Search doctor or room..."
                        size="md"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Triage Priority</label>
                        <MedicalTooltip 
                          term="Clinical Triage Rule"
                          explanation="Emergency patients bypass normal queues immediately. Age 60+ is automatically flagged for Senior Citizen priority."
                          clinicalSource="AIIMS / Emergency Medicine Protocol"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['standard', 'senior', 'emergency'] as PriorityLevel[]).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPriority(p);
                              setIsManualPriority(true);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                              priority === p
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Symptoms</label>
                      <input
                        type="text"
                        value={currentIllness}
                        onChange={e => setCurrentIllness(e.target.value)}
                        placeholder="e.g. Chest discomfort, routine checkup"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
                    >
                      Register & Print Thermal Slip
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ================= TAB 3: DIAGNOSTIC LAB PORTAL ================= */}
            {activePortalTab === 'lab' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Diagnostic Laboratory Workstations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any active diagnostic counter to manage queues, call patients, and verify completions live.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {counters.map(c => {
                    const dept = departments.find(d => d.id === c.departmentId);
                    const waitingCount = queueTokens.filter(t => t.departmentId === c.departmentId && t.status === 'waiting').length;
                    const servingToken = queueTokens.find(t => t.id === c.currentServingTokenId);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => loginAsLabTech(c.id)}
                        className="w-full p-4 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 text-left transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-900">
                                {c.name}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                {c.code}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {dept?.name} • Technician: <strong className="text-slate-800">{c.technicianName}</strong> ({dept?.location.room})
                            </div>
                            <div className="text-[11px] text-purple-700 font-medium mt-1">
                              Serving: {servingToken ? `Token #${servingToken.tokenNumber}` : 'Idle / Ready for next patient'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                            waitingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {waitingCount} waiting in queue
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Trust & Regulatory Accreditation Strip */}
      <AccreditationBar className="relative z-10 my-4" />

      {/* 24/7 Emergency & Triage Hotline Floating Badge */}
      <EmergencyHotlineBadge />

      {/* Footer (Clean Hospital White) */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white/70 backdrop-blur-xs relative z-10">
        <p>QCare Hospital Diagnostic Queue Management & Smart Patient Routing System • Production Build</p>
      </footer>

      {/* Discreet Floating 1-Click Demo Dock (Tucked neatly away on the side - User Feedback) */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsDemoDrawerOpen(true)}
          className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xl border border-slate-200 backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
        >
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Quick Demo Stations</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Slide-out Demo Drawer Panel (Discreet & Clean) */}
      {isDemoDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slideIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">1-Click Live Workstations</h3>
                </div>
                <button
                  onClick={() => setIsDemoDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Instant testing presets for Rahul Sharma demo scenario and clinical staff roles.
              </p>

              <div className="space-y-2 pt-2">
                {/* Rahul Sharma Demo */}
                <button
                  type="button"
                  onClick={() => {
                    handleLaunchRahulDemo();
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-sm hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Rahul Sharma (USG First Demo)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Super Admin */}
                <button
                  type="button"
                  onClick={() => {
                    loginAsStaff('QCARE-HOSP-001', 'super@qcare.demo', 'admin123');
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between"
                >
                  <span>Super Admin Portal</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Hospital Admin */}
                <button
                  type="button"
                  onClick={() => {
                    loginAsStaff('QCARE-HOSP-001', 'admin@qcare.demo', 'admin123');
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between"
                >
                  <span>Hospital Admin Console</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Doctor Assistant */}
                <button
                  type="button"
                  onClick={() => {
                    loginAsStaff('QCARE-HOSP-001', 'assistant@qcare.demo', 'staff123');
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors flex items-center justify-between border border-blue-200"
                >
                  <span>Doctor Assistant Station</span>
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </button>

                {/* USG Lab Staff */}
                <button
                  type="button"
                  onClick={() => {
                    loginAsStaff('QCARE-HOSP-001', 'lab.usg@qcare.demo', 'staff123');
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition-colors flex items-center justify-between border border-purple-200"
                >
                  <span>Ultrasound Lab Station</span>
                  <ChevronRight className="w-4 h-4 text-purple-600" />
                </button>

                {/* Blood Lab Staff */}
                <button
                  type="button"
                  onClick={() => {
                    loginAsStaff('QCARE-HOSP-001', 'lab.blood@qcare.demo', 'staff123');
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors flex items-center justify-between border border-rose-200"
                >
                  <span>Blood Lab Station</span>
                  <ChevronRight className="w-4 h-4 text-rose-600" />
                </button>

                {/* Kiosk Mode */}
                <button
                  type="button"
                  onClick={() => {
                    handleLaunchKiosk();
                    setIsDemoDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center justify-between border border-emerald-200"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-600" />
                    <span>Touch Kiosk Interface</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-[10px] text-slate-400">
                QCare Centralized SaaS Architecture
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Why Q-Care Comparison Modal */}
      <WhyQCareModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
      />

      {/* Printable Receipt Modal if registered */}
      {registeredPatientObj && (
        <PrintableReceipt
          patient={registeredPatientObj}
          allTests={tests}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};
