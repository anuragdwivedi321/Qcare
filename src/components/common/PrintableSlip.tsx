import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Patient, DiagnosticTest, Department } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';
import {
  X,
  Clock,
  Printer,
  Download,
  CheckCircle2,
  Phone,
  QrCode as QrIcon,
  FlaskConical,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Eye,
  Activity,
  Droplet,
  ScanLine,
  Waves
} from 'lucide-react';

interface PrintableSlipProps {
  patient: Patient;
  tests: DiagnosticTest[];
  departments: Department[];
  onClose: () => void;
}

export const PrintableSlip: React.FC<PrintableSlipProps> = ({
  patient,
  tests,
  departments,
  onClose
}) => {
  const { currentHospital, selectAndLoginPatient } = useHospitalStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [scanUrl, setScanUrl] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qcare.app';
    const payloadObj = {
      id: patient.id,
      uhid: patient.uhid,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      token: patient.opdTokenNumber,
      tests: patient.prescribedTests,
      status: patient.status,
      docStatus: patient.doctorReviewStatus,
      route: patient.assignedSmartRoute,
      locked: patient.currentLockedDestinationTestId
    };
    const payloadEncoded = encodeURIComponent(btoa(JSON.stringify(payloadObj)));
    const targetUrl = `${origin}/?session=${patient.qrSessionId}&p=${payloadEncoded}`;
    setScanUrl(targetUrl);
    setQrCodeDataUrl('');

    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [patient.id, patient.uhid, patient.qrSessionId, JSON.stringify(patient.prescribedTests)]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleOpenPatientPass = () => {
    onClose();
    selectAndLoginPatient(patient.id);
  };

  const prescribedList = (patient.prescribedTests || []).map(id => {
    const test = tests.find(t => t.id === id);
    const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;
    return { test, dept };
  });

  // Calculate estimated wait time based on tests
  const totalWaitMinutes = prescribedList.reduce((acc, curr) => acc + (curr.test?.averageDurationMinutes || 10), 0);
  const minWait = Math.max(5, Math.floor(totalWaitMinutes * 0.7));
  const maxWait = Math.max(10, Math.ceil(totalWaitMinutes * 1.1));

  // Determine avatar representation
  const isFemale = patient.gender === 'Female';
  const avatarUrl = isFemale ? '/doctors/doctor_female_1.jpg' : '/doctors/doctor_male_1.jpg';

  // Investigation icon helper
  const getTestIcon = (testName?: string) => {
    const lower = (testName || '').toLowerCase();
    if (lower.includes('eye') || lower.includes('retina') || lower.includes('oct') || lower.includes('acuity')) {
      return <Eye className="w-4 h-4 text-sky-500" />;
    }
    if (lower.includes('heart') || lower.includes('ecg') || lower.includes('cardio')) {
      return <Activity className="w-4 h-4 text-blue-500" />;
    }
    if (lower.includes('blood') || lower.includes('sugar') || lower.includes('cbc')) {
      return <Droplet className="w-4 h-4 text-rose-500" />;
    }
    if (lower.includes('x-ray') || lower.includes('xray') || lower.includes('scan')) {
      return <ScanLine className="w-4 h-4 text-purple-500" />;
    }
    if (lower.includes('ultrasound') || lower.includes('usg')) {
      return <Waves className="w-4 h-4 text-teal-500" />;
    }
    return <FlaskConical className="w-4 h-4 text-teal-600" />;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="printable-slip-wrapper fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-center print:static print:bg-transparent print:p-0 animate-fadeIn"
    >
      <div className="printable-slip-card bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200/90 print:border-none print:shadow-none print:max-w-full my-auto transition-all">
        
        {/* Top Header Bar with QCare Logo, Hospital Location & Print Action */}
        <div className="bg-[#0b192c] text-white px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-black text-sm">
                Q
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                Care
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span className="truncate max-w-[240px] sm:max-w-md font-medium">
                {currentHospital.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Print / Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 2-Column Modern Grid matching "New UI (After)" Image 2 */}
        <div className="p-6 sm:p-8 bg-slate-50/50 print:bg-white print:p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (8 cols): Patient Identity, Tokens, Investigations & Route */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Patient Identity Header Card */}
              <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-13 h-13 rounded-full overflow-hidden bg-teal-50 border-2 border-teal-500/40 p-0.5 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={patient.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = '/doctors/doctor_female_1.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                        {patient.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      UHID: {patient.uhid} <span className="mx-1">|</span> {patient.age} Y • {patient.gender}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200/60 shrink-0">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Big Token Number & Estimated Wait Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Token Box */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-center">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Your Token Number
                  </span>
                  <div className="bg-[#0b1f3a] text-white font-mono font-black text-2xl sm:text-3xl text-center py-2.5 px-4 rounded-xl tracking-wider shadow-inner">
                    {patient.opdTokenNumber || 'OPD-REG'}
                  </div>
                </div>

                {/* Estimated Wait Box */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-center">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Estimated Wait
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-6 h-6 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
                        {minWait} – {maxWait} min
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        3 ahead in queue
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescribed Investigations Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <FlaskConical className="w-4 h-4 text-teal-600" />
                  <span>Investigations</span>
                </div>

                <div className="space-y-2">
                  {prescribedList.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                      Standard Outpatient Consultation with {patient.prescribedDoctorName || currentHospital.doctorName} ({patient.prescribedDoctorRoom || currentHospital.doctorRoom})
                    </div>
                  ) : (
                    prescribedList.map(({ test, dept }, idx) => (
                      <div
                        key={test?.id || idx}
                        className="flex items-center gap-3 p-3 bg-sky-50/50 rounded-xl border border-sky-100/80"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white border border-sky-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                          {getTestIcon(test?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {test?.name || 'Diagnostic Investigation'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {dept?.location.room} • {dept?.location.floor}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Your Diagnostic Route Visual Stepper Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <span>Your Diagnostic Route</span>
                </div>

                {/* Stepper Progression */}
                <div className="relative pt-2">
                  {/* Horizontal connecting track line */}
                  <div className="absolute top-[22px] left-[12%] right-[12%] h-[2px] bg-slate-200 z-0">
                    <div className="h-full bg-emerald-500 w-[33%]" />
                  </div>

                  <div className="grid grid-cols-4 gap-2 relative z-10">
                    {/* Step 1: Registration Completed */}
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm font-bold text-xs ring-4 ring-white">
                        ✓
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Registration</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Completed</div>
                      <div className="text-[10px] text-slate-400 font-mono">05:20 PM</div>
                    </div>

                    {/* Step 2: Next Investigation */}
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center mx-auto shadow-sm font-bold text-xs ring-4 ring-white">
                        2
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-tight truncate px-0.5" title={prescribedList[0]?.test?.name || 'Investigation'}>
                        {prescribedList[0]?.test?.name || 'Investigation'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {prescribedList[0]?.dept?.location.room || 'Room 218'}
                      </div>
                      <div className="text-[10px] text-sky-600 font-bold">(Next)</div>
                    </div>

                    {/* Step 3: Subsequent Investigation or Step */}
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-300 flex items-center justify-center mx-auto text-xs font-bold ring-4 ring-white">
                        3
                      </div>
                      <div className="text-xs font-semibold text-slate-700 leading-tight truncate px-0.5" title={prescribedList[1]?.test?.name || 'Visual Acuity'}>
                        {prescribedList[1]?.test?.name || 'Visual Acuity'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {prescribedList[1]?.dept?.location.room || 'Room 218'}
                      </div>
                    </div>

                    {/* Step 4: Reports Ready */}
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-300 flex items-center justify-center mx-auto text-xs font-bold ring-4 ring-white">
                        4
                      </div>
                      <div className="text-xs font-semibold text-slate-700 leading-tight">Reports</div>
                      <div className="text-[10px] text-slate-400">Ready</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (4 cols): Scannable QR Box + Actions */}
            <div className="lg:col-span-4 space-y-3.5">
              
              {/* QR Code Container with Scan Frame */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col items-center text-center">
                <div className="relative p-2.5 bg-white rounded-2xl border-2 border-teal-400/60 shadow-xs">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`QR Code for ${patient.uhid}`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                      <QrIcon className="w-12 h-12 animate-pulse text-teal-600" />
                    </div>
                  )}
                </div>

                {/* Scan Status Badge */}
                <div className="mt-4 w-full py-2.5 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scan to View Live Boarding Pass</span>
                </div>
              </div>

              {/* Action Buttons: Download PDF, Print Slip & Direct Navigation */}
              <div className="space-y-2.5 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 px-4 bg-[#0b1f3a] hover:bg-[#122b4d] active:bg-[#071426] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPatientPass}
                  className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Open Live Boarding Pass View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

          {/* Bottom Hospital Assistance & Room Instruction Strip */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-xs">
                i
              </div>
              <span>
                Please proceed to {prescribedList[0]?.dept?.location.room || 'Room 218'} on {prescribedList[0]?.dept?.location.floor || '2nd Floor'}. Show this QR at the station for quick check-in.
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>Need Help? {currentHospital.contactNumber || '+91 11 2651 5050'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
