import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  AlertTriangle, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { PriorityLevel, PatientTriageInfo } from '../../types';
import { SearchableCombobox } from './SearchableCombobox';
import { MedicalTooltip } from './MedicalTooltip';
import { SecurityPopover } from './SecurityPopover';
import { 
  validatePatientName, 
  validatePatientAge, 
  validatePatientPhone, 
  validateSymptoms 
} from '../../engine/securitySanitizer';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: string;
  onPatientRegistered?: (triage: PatientTriageInfo) => void;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  onPatientRegistered
}) => {
  const { doctors, currentHospital, registerPatient } = useHospitalStore();

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [contact, setContact] = useState('');
  const [currentIllness, setCurrentIllness] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    preselectedDoctorId || doctors[0]?.id || 'doc-sarah'
  );
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [isManualPriority, setIsManualPriority] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTriage, setSuccessTriage] = useState<PatientTriageInfo | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

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

  // Keep doctor in sync with prop if changed or when hospital branch switches
  useEffect(() => {
    if (preselectedDoctorId && doctors.some(d => d.id === preselectedDoctorId)) {
      setSelectedDoctorId(preselectedDoctorId);
    } else if (doctors.length > 0 && !doctors.some(d => d.id === selectedDoctorId)) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [preselectedDoctorId, doctors, selectedDoctorId]);

  if (!isOpen) return null;

  const handlePrioritySelect = (p: PriorityLevel) => {
    setPriority(p);
    setIsManualPriority(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = validatePatientName(name);
    if (!nameVal.isValid) {
      setErrorMessage(nameVal.error || 'Please enter the patient full name.');
      return;
    }
    const ageVal = validatePatientAge(age);
    if (!ageVal.isValid) {
      setErrorMessage(ageVal.error || 'Please enter a valid age between 0 and 130.');
      return;
    }
    const phoneVal = validatePatientPhone(contact);
    if (!phoneVal.isValid) {
      setErrorMessage(phoneVal.error || 'Please enter a valid 10-digit mobile phone number.');
      return;
    }
    const symptomsVal = validateSymptoms(currentIllness);
    if (!symptomsVal.isValid) {
      setErrorMessage(symptomsVal.error || 'Please describe the chief sickness or symptoms.');
      return;
    }

    setErrorMessage(null);

    const doc = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
    const registered = registerPatient({
      name: nameVal.value,
      age: ageVal.value,
      gender,
      contact: phoneVal.value,
      currentIllness: symptomsVal.value,
      doctorId: selectedDoctorId,
      priority,
      prescribedTests: selectedTestIds
    });

    const triage: PatientTriageInfo = {
      patientId: registered.id,
      uhid: registered.uhid,
      opdTokenNumber: registered.opdTokenNumber || 'OPD-101',
      queuePosition: registered.queuePosition,
      estimatedWaitMinutes: registered.estimatedWaitMinutes,
      priority: registered.priority,
      doctorName: doc?.name || registered.prescribedDoctorName,
      doctorRoom: doc?.roomNo || registered.prescribedDoctorRoom || 'OPD Room'
    };

    setSuccessTriage(triage);
    if (onPatientRegistered) {
      onPatientRegistered(triage);
    }
  };

  const handleDone = () => {
    setSuccessTriage(null);
    setName('');
    setAge('');
    setContact('');
    setCurrentIllness('');
    setSelectedTestIds([]);
    setIsManualPriority(false);
    setPriority('standard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={successTriage ? handleDone : onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span>Register New Walk-in Patient</span>
                </h3>
                {currentHospital && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {currentHospital.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Smart triage & intelligent slotting into doctor OPD queue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={successTriage ? handleDone : onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {successTriage ? (
            /* Success Feedback & Triage Slip */
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-emerald-950">
                    Patient Registered & Slotted in OPD Queue!
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Assigned OPD Token and prioritized into doctor's consultation queue based on medical triage.
                  </p>
                </div>
              </div>

              {/* Triage Detail Slip */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">OPD Token</span>
                    <span className="text-2xl font-bold text-blue-700">
                      #{successTriage.opdTokenNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">UHID</span>
                    <span className="text-sm font-bold text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      {successTriage.uhid}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Consulting Doctor</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {successTriage.doctorName}
                    </strong>
                    <span className="text-[11px] text-slate-500">{successTriage.doctorRoom}</span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Triage Priority</span>
                    <div className="mt-1">
                      {successTriage.priority === 'emergency' && (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Emergency (Acute)
                        </span>
                      )}
                      {successTriage.priority === 'senior' && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs inline-flex items-center gap-1">
                          Senior Citizen (60+)
                        </span>
                      )}
                      {successTriage.priority === 'standard' && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs">
                          Standard OPD
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Queue Position</span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">
                      #{successTriage.queuePosition}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        {successTriage.priority === 'emergency' ? '(Urgent Triage)' : 'in waiting line'}
                      </span>
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Doctor Wait</span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">
                      {successTriage.priority === 'emergency' ? 'Immediate (< 2 mins)' : `~${successTriage.estimatedWaitMinutes} mins`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <span>Continue to OPD Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-2xl animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Phone Number *
                    </label>
                    <SecurityPopover label="256-Bit Encrypted" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="e.g. +91 98200 12345"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all tabular-nums"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 62"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Gender *
                    </label>
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

                {/* Consulting Doctor */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Consulting Doctor *
                    </label>
                    <MedicalTooltip
                      term="Clinical OPD Chamber"
                      explanation="Select the consulting physician for this visit. The patient will be routed to their OPD room."
                      clinicalSource="Hospital Clinical Administration"
                    />
                  </div>
                  <SearchableCombobox
                    options={doctors.map(d => ({
                      id: d.id,
                      label: `${d.name} (${d.roomNo})`,
                      subtext: d.department,
                      category: d.department,
                      badge: `${d.activePatientCount} waiting`,
                      badgeColor: 'teal'
                    }))}
                    value={selectedDoctorId}
                    onChange={setSelectedDoctorId}
                    placeholder="Select Consulting Doctor..."
                    searchPlaceholder="Search doctor or room..."
                    size="md"
                  />
                </div>
              </div>

              {/* Urgency & Medical Priority Selection */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Urgency & Medical Priority *
                  </label>
                  {typeof age === 'number' && age >= 60 && priority === 'senior' && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Auto-detected Senior Citizen (60+)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrioritySelect('standard')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      priority === 'standard'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs block font-bold">Standard</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">FIFO queue slot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrioritySelect('senior')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      priority === 'senior'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs block font-bold">Senior Citizen</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Fast-track slot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrioritySelect('emergency')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      priority === 'emergency'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs block font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Emergency
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Top urgent triage</span>
                  </button>
                </div>
              </div>

              {/* Symptoms / Chief Complaint */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Chief Sickness / Symptoms *
                </label>
                <textarea
                  value={currentIllness}
                  onChange={e => setCurrentIllness(e.target.value)}
                  rows={2}
                  placeholder="e.g. Severe chest pain radiating to left arm, acute palpitations and high fever..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* Optional Diagnostic Tests for Direct Lab Entry */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Prescribe Diagnostic Tests (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">Routes patient directly to lab queues</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'test-cbc', name: 'Blood Test (CBC)', dept: 'Pathology' },
                    { id: 'test-ecg', name: '12-Lead ECG', dept: 'Cardiology' },
                    { id: 'test-usg-abdomen', name: 'Ultrasound', dept: 'Sonography' },
                    { id: 'test-xray-chest', name: 'Chest X-Ray', dept: 'Radiology' },
                    { id: 'test-fbs', name: 'Sugar / HbA1c', dept: 'Biochem' },
                    { id: 'test-vision', name: 'Eye Checkup', dept: 'Ophthalmology' }
                  ].map(testItem => {
                    const isSelected = selectedTestIds.includes(testItem.id);
                    return (
                      <button
                        key={testItem.id}
                        type="button"
                        onClick={() => {
                          setSelectedTestIds(prev =>
                            prev.includes(testItem.id)
                              ? prev.filter(id => id !== testItem.id)
                              : [...prev, testItem.id]
                          );
                        }}
                        className={`p-2.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="block font-bold text-[11px] truncate">{testItem.name}</span>
                          <span className="text-[10px] text-slate-400 block">{testItem.dept}</span>
                        </div>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold border ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'
                        }`}>
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Slot into OPD Queue</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
