import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Patient, DiagnosticTest, Department } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Printer, X, ShieldCheck, QrCode as QrIcon, ExternalLink, ArrowRight } from 'lucide-react';

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
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
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
    // 1. Close modal
    onClose();
    // 2. Authenticate and switch directly into patient's Live Boarding Pass view!
    selectAndLoginPatient(patient.id);
  };

  const prescribedList = patient.prescribedTests.map(id => {
    const test = tests.find(t => t.id === id);
    const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;
    return { test, dept };
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="printable-slip-wrapper fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:static print:bg-transparent print:p-0 animate-fadeIn"
    >
      <div className="printable-slip-card bg-white rounded-2xl shadow-2xl max-w-md w-full my-4 sm:my-8 overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-full print:my-0">
        
        {/* Modal Controls Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-700" />
            <span className="font-bold text-slate-900 text-sm">
              Printable Thermal QR Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authentic Thermal Slip Content */}
        <div className="p-5 sm:p-6 font-mono text-xs text-slate-900 bg-white selection:bg-none print:p-0">
          <div className="border border-dashed border-slate-300 p-5 rounded-xl bg-slate-50/50">
            
            {/* Slip Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-base tracking-tight text-slate-900 uppercase font-sans">
                {currentHospital.name}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                {patient.prescribedDoctorName} • {patient.prescribedDoctorRoom}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentHospital.address} • Ph: {currentHospital.contactNumber || '+91 11 4100 2200'}
              </p>
            </div>

            {/* Token & Patient Metadata */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              <div className="flex justify-between items-baseline font-bold text-sm text-slate-900">
                <span className="bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200">
                  TOKEN: {patient.opdTokenNumber}
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  {patient.registrationTime}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="font-semibold text-slate-800">PATIENT: {patient.name}</span>
                <span className="text-slate-600">{patient.age} / {patient.gender}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>UHID: {patient.uhid}</span>
                <span>{patient.contact}</span>
              </div>
              {patient.priority === 'emergency' && (
                <div className="mt-1 text-center py-1 bg-red-600 text-white font-bold text-[10px] rounded uppercase tracking-wider">
                  🚨 EMERGENCY TRIAGE PRIORITY 🚨
                </div>
              )}
            </div>

            {/* Scannable Real QR Code + One-Click Navigation Button */}
            <div className="py-4 text-center border-b border-dashed border-slate-300 flex flex-col items-center bg-white rounded-xl my-2 p-3 shadow-2xs border border-slate-100">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR for ${patient.uhid}`}
                  className="w-40 h-40 border border-slate-300 p-1.5 bg-white rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-40 h-40 border border-slate-200 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                  <QrIcon className="w-10 h-10 animate-pulse text-slate-400" />
                </div>
              )}

              {/* Direct One-Click Navigation CTA (User Request) */}
              <div className="mt-3.5 w-full flex flex-col items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleOpenPatientPass}
                  className="w-full max-w-xs py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-teal-900/10 transition-all cursor-pointer hover:scale-[1.02]"
                  title="Click to directly open patient live boarding pass in this app"
                >
                  <span>Click Here to Open Live Boarding Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                {scanUrl && (
                  <a
                    href={scanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 font-sans font-medium"
                    title="Or open patient pass in a new browser window"
                  >
                    <span>Or open in new browser window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <p className="mt-3 font-bold text-[11px] text-slate-800 font-sans uppercase tracking-tight">
                SCAN WITH ANY PHONE CAMERA
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                Opens live boarding pass & real-time queue position
              </p>
            </div>

            {/* Prescribed Investigations Checklist */}
            <div className="pt-3">
              <p className="font-bold text-[11px] uppercase tracking-wider mb-2 text-slate-900 font-sans">
                {prescribedList.length > 0 ? 'INVESTIGATION ROUTE:' : 'OUTPATIENT ROUTE:'}
              </p>
              <ol className="space-y-2">
                {prescribedList.length === 0 ? (
                  <>
                    <li className="text-[11px]">
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>1. Initial OPD Consultation: {patient.prescribedDoctorName || currentHospital.doctorName}</span>
                        <span className="text-teal-800 font-bold">{patient.prescribedDoctorRoom || currentHospital.doctorRoom}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Present this slip at doctor chamber for initial clinical examination.</p>
                    </li>
                    <li className="text-[11px] pt-1 border-t border-dashed border-slate-200 text-slate-500">
                      <span>2. Prescribed tests will automatically route on your live pass upon scanning the QR code above.</span>
                    </li>
                  </>
                ) : (
                  <>
                    {prescribedList.map(({ test, dept }, idx) => (
                      <li key={test?.id || idx} className="text-[11px]">
                        <div className="flex justify-between font-semibold text-slate-900">
                          <span>{idx + 1}. {test?.name}</span>
                          <span className="text-teal-800 font-bold">{dept?.location.room} · {dept?.location.floor}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>{test?.technicalName}</span>
                          <span>{dept?.location.building || currentHospital.shortName}</span>
                        </div>
                        {dept?.location.directions && (
                          <p className="text-[9.5px] text-teal-900/80 bg-teal-50/60 p-1 rounded mt-0.5 font-sans leading-tight">
                            Route: {dept.location.directions}
                          </p>
                        )}
                        {test?.preparationNotes && (
                          <p className="text-[10px] text-amber-800 italic mt-0.5">
                            * {test.preparationNotes}
                          </p>
                        )}
                      </li>
                    ))}
                    <li className="text-[11px] pt-1.5 border-t border-dashed border-slate-200">
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>{prescribedList.length + 1}. Return to {patient.prescribedDoctorName || currentHospital.doctorName}</span>
                        <span className="text-teal-800 font-bold">{patient.prescribedDoctorRoom || currentHospital.doctorRoom}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Final report review & medicine prescription</p>
                    </li>
                  </>
                )}
              </ol>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>QCare Smart Flow · Hospital Diagnostic Pass</span>
            </div>

            {/* Modal Bottom Actions (Web only) */}
            <div className="mt-4 pt-2 flex items-center gap-2 print:hidden font-sans">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
