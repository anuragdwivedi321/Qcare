import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Stethoscope, 
  FlaskConical, 
  Printer, 
  Clock, 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  X, 
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { DoctorPriority, Patient } from '../../types';
import { PrintableReceipt } from '../common/PrintableReceipt';

export const DoctorAssistantView: React.FC = () => {
  const {
    tests,
    doctors,
    patients,
    currentHospital,
    createPatientDiagnosticJourney,
    loadDemoScenarioRahul
  } = useHospitalStore();

  // Patient Registration Form State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientMobile, setPatientMobile] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || 'doc-01');
  const [department, setDepartment] = useState('General Medicine');
  const [overallPriority, setOverallPriority] = useState<DoctorPriority>('normal');

  // Sync selectedDoctorId when doctors change
  useEffect(() => {
    if (doctors.length > 0 && (!selectedDoctorId || !doctors.some(d => d.id === selectedDoctorId))) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Selected Tests State: Record of testId -> { selected: boolean, priority: DoctorPriority, notes: string, prep: string, dependency?: string }
  const [selectedTests, setSelectedTests] = useState<Record<string, {
    selected: boolean;
    priority: DoctorPriority;
    notes: string;
    prep: string;
    dependency?: string;
  }>>(() => {
    const map: Record<string, any> = {};
    tests.forEach(t => {
      map[t.id] = {
        selected: false,
        priority: 'normal',
        notes: '',
        prep: t.preparationNotes || '',
        dependency: t.prerequisites?.[0]
      };
    });
    return map;
  });

  // Modal states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [receiptPatient, setReceiptPatient] = useState<Patient | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  const handleToggleTest = (testId: string) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        selected: !prev[testId]?.selected
      }
    }));
  };

  const handleTestPriorityChange = (testId: string, priority: DoctorPriority) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        priority
      }
    }));
  };

  const handleTestNotesChange = (testId: string, notes: string) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        notes
      }
    }));
  };

  const activeSelectedTestsList = tests.filter(t => selectedTests[t.id]?.selected);

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientName.trim()) {
      setFormError('Patient full name is required.');
      return;
    }
    if (!patientAge || Number(patientAge) <= 0 || Number(patientAge) > 125) {
      setFormError('Valid patient age is required.');
      return;
    }
    if (!patientMobile.trim() || patientMobile.replace(/\D/g, '').length < 8) {
      setFormError('Valid mobile number (at least 8-10 digits) is required.');
      return;
    }
    if (activeSelectedTestsList.length === 0) {
      setFormError('Please prescribe at least one diagnostic test.');
      return;
    }

    setIsReviewOpen(true);
  };

  const handleConfirmAndIssueSlip = () => {
    const payloadTests = activeSelectedTestsList.map(t => ({
      testId: t.id,
      priority: selectedTests[t.id]?.priority || overallPriority,
      notes: selectedTests[t.id]?.notes,
      preparationInstructions: selectedTests[t.id]?.prep || t.preparationNotes,
      dependencyTestId: selectedTests[t.id]?.dependency || t.prerequisites?.[0]
    }));

    const result = createPatientDiagnosticJourney({
      name: patientName.trim(),
      age: Number(patientAge),
      gender: patientGender,
      contact: patientMobile.trim(),
      doctorName: selectedDoctor ? selectedDoctor.name : 'Dr. Senior Consultant',
      department: department,
      doctorPriority: overallPriority,
      tests: payloadTests
    });

    setIsReviewOpen(false);
    setReceiptPatient(result.patient);
    setIsReceiptOpen(true);

    // Reset Form
    setPatientName('');
    setPatientAge('');
    setPatientMobile('');
    setOverallPriority('normal');
    setSelectedTests(prev => {
      const reset: Record<string, any> = {};
      Object.keys(prev).forEach(k => {
        reset[k] = { ...prev[k], selected: false, notes: '' };
      });
      return reset;
    });
  };

  const handleQuickLoadRahulDemo = () => {
    const rahul = loadDemoScenarioRahul();
    setReceiptPatient(rahul);
    setIsReceiptOpen(true);
  };

  const filteredRecentPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.uhid.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.contact.includes(searchFilter)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner Directive (Rule 4: Next Step Guidance) */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-100 text-xs font-semibold mb-2 tracking-wide uppercase">
            <Stethoscope className="w-3.5 h-3.5 text-blue-200" />
            <span>Doctor Assistant Station</span>
            <span className="text-blue-300">•</span>
            <span>{currentHospital?.name || 'QCare Hospital'}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Prescribe Diagnostic Investigations</h1>
          <p className="text-blue-100/90 text-xs md:text-sm mt-0.5">
            Register patient, select investigations with priority flags, and print the thermal QR routing slip.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleQuickLoadRahulDemo}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
            <span>Load Demo: Rahul Sharma</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Prescribed Investigations Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Details Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">1. Patient Information</h2>
          </div>

          <form onSubmit={handleOpenReview} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    value={patientAge}
                    onChange={e => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={patientGender}
                    onChange={e => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={patientMobile}
                  onChange={e => setPatientMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribing Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer font-medium text-slate-800"
                  >
                    {doctors.length === 0 ? (
                      <>
                        <option value="doc-01">Dr. Arvind Swaminathan (OPD-204)</option>
                        <option value="doc-02">Dr. Priya Shenoy (OPD-108)</option>
                        <option value="doc-03">Dr. Vikramaditya Rao (Rad-Lead-01)</option>
                        <option value="doc-sarah">Dr. Sarah Khan (OPD Room 12)</option>
                      </>
                    ) : (
                      doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.roomNo}) — {d.department}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Overall Doctor Clinical Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'priority', 'urgent'] as DoctorPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverallPriority(p)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                        overallPriority === p
                          ? p === 'urgent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : p === 'priority'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Directive button pointing to step 2 */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group active:scale-98"
              >
                <span>Review & Issue Thermal Slip</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Selected {activeSelectedTestsList.length} test{activeSelectedTestsList.length === 1 ? '' : 's'}
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Diagnostic Investigations Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Select Prescribed Tests ({activeSelectedTestsList.length} Selected)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click card to select / unselect</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto max-h-[560px] pr-1">
            {tests.map(test => {
              const isSelected = !!selectedTests[test.id]?.selected;
              const testPrio = selectedTests[test.id]?.priority || 'normal';

              return (
                <div
                  key={test.id}
                  onClick={() => handleToggleTest(test.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{test.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {test.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 pl-7 mb-2">
                      {test.preparationNotes}
                    </p>

                    <div className="pl-7 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        ~{test.averageDurationMinutes} mins
                      </span>
                      {test.requiresFasting && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                          Fasting Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Test-specific Priority and Note config if selected */}
                  {isSelected && (
                    <div
                      className="mt-3 pt-2.5 border-t border-blue-100 pl-7 space-y-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">Test Priority:</span>
                        <div className="flex items-center gap-1">
                          {(['normal', 'priority', 'urgent'] as DoctorPriority[]).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleTestPriorityChange(test.id, p)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize ${
                                testPrio === p
                                  ? p === 'urgent'
                                    ? 'bg-rose-600 text-white'
                                    : p === 'priority'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Clinical instructions or notes (optional)..."
                        value={selectedTests[test.id]?.notes || ''}
                        onChange={e => handleTestNotesChange(test.id, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Recent Patients & Thermal Slips
            </h3>
            <p className="text-xs text-slate-500">
              List of patients prescribed investigations today in {currentHospital?.name}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search UHID, name, mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">UHID</th>
                <th className="py-2.5 px-3">Age / Sex</th>
                <th className="py-2.5 px-3">Prescribed Doctor</th>
                <th className="py-2.5 px-3">Investigations</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3 text-right">Thermal Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecentPatients.slice(0, 8).map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.uhid}</td>
                  <td className="py-2.5 px-3 text-slate-600">{p.age} Y / {p.gender}</td>
                  <td className="py-2.5 px-3 text-slate-700">{p.prescribedDoctorName}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      {p.prescribedTests.length} tests
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        p.doctorPriority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : p.doctorPriority === 'priority'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.doctorPriority || 'normal'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptPatient(p);
                        setIsReceiptOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print QR</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal before issuance */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Review Patient & Prescriptions</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Patient:</span>{' '}
                  <strong className="text-slate-900">{patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Age / Sex:</span>{' '}
                  <strong className="text-slate-900">{patientAge} Y / {patientGender}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mobile:</span>{' '}
                  <strong className="text-slate-900 font-mono">{patientMobile}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Consultant:</span>{' '}
                  <strong className="text-slate-900">{selectedDoctor?.name}</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Prescribed Investigations ({activeSelectedTestsList.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeSelectedTestsList.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {selectedTests[t.id]?.priority || overallPriority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                QCare Smart Router will automatically sequence these investigations to minimize wait times across hospital counters.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
              >
                Back & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAndIssueSlip}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Confirm & Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {receiptPatient && (
        <PrintableReceipt
          patient={receiptPatient}
          allTests={tests}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};
