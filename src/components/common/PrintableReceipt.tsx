import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X, QrCode, ExternalLink } from 'lucide-react';
import { Patient, DiagnosticTest } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';

interface PrintableReceiptProps {
  patient: Patient;
  allTests: DiagnosticTest[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  patient,
  allTests,
  isOpen,
  onClose
}) => {
  const { loginAsPatientWithToken } = useHospitalStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const token = patient.secureQrToken || `token-${patient.id}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qcare.com';
  const sessionUrl = `${origin}/?session=${token}`;

  useEffect(() => {
    if (token) {
      QRCode.toDataURL(sessionUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR Code:', err));
    }
  }, [token, sessionUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const prescribedTestsDetails = patient.prescribedTests.map(tId => {
    const t = allTests.find(item => item.id === tId);
    return {
      id: tId,
      name: t?.name || 'Diagnostic Investigation',
      code: t?.code || 'LAB',
      price: t?.standardPrice || 500,
      prep: t?.preparationNotes
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header (Hidden on Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Thermal Diagnostic Boarding Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-50 print:bg-white print:p-0">
          {/* Thermal Paper Container */}
          <div 
            id="printable-receipt-card"
            className="w-full max-w-[320px] bg-white p-5 border border-slate-300 rounded-2xl shadow-sm text-slate-900 font-mono text-xs space-y-4 print:border-none print:shadow-none print:p-2 print:max-w-none"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
              <div className="flex items-center justify-center gap-1 text-base font-black tracking-tight text-slate-950 font-sans">
                <span>QCare</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>
              <p className="font-bold text-[11px] text-slate-800 uppercase tracking-wider font-sans">
                {patient.hospitalName || 'QCare Demo Hospital'}
              </p>
              <p className="text-[10px] text-slate-500">
                Diagnostic Queue & Smart Patient Routing
              </p>
              <div className="text-[10px] text-slate-400 pt-1">
                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Patient Meta */}
            <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900 font-sans">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UHID:</span>
                <span className="font-bold text-slate-800">{patient.uhid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Sex:</span>
                <span>{patient.age} Yrs / {patient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile:</span>
                <span>{patient.contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consulting Dr:</span>
                <span className="font-sans font-semibold text-slate-800 truncate max-w-[150px]">{patient.prescribedDoctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor Priority:</span>
                <span className={`font-bold font-sans uppercase px-1 rounded text-[10px] ${
                  patient.doctorPriority === 'urgent' 
                    ? 'bg-rose-100 text-rose-700' 
                    : patient.doctorPriority === 'priority'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {patient.doctorPriority || 'Normal'}
                </span>
              </div>
            </div>

            {/* Prescribed Investigations List */}
            <div className="space-y-1.5 py-1 border-b border-dashed border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                Prescribed Investigations ({prescribedTestsDetails.length})
              </span>
              <div className="space-y-1 text-[11px]">
                {prescribedTestsDetails.map((t, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-1 leading-snug">
                    <span className="font-sans font-medium text-slate-800 truncate max-w-[190px]">
                      {idx + 1}. {t.name}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                      [{t.code}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Large Crisp QR Code */}
            <div className="text-center py-2 flex flex-col items-center">
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs inline-block">
                  <img 
                    src={qrDataUrl} 
                    alt="QCare Live Patient Journey QR Code" 
                    className="w-44 h-44 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <p className="font-sans text-[11px] font-bold text-slate-900 mt-2">
                Scan to View Live Diagnostic Journey
              </p>
              <p className="font-sans text-[10px] text-slate-500 max-w-[240px] leading-tight mt-0.5">
                Real-time queue tracking, live estimated wait times & dynamic next room recommendation.
              </p>

              {/* Direct Click to Open Patient Dashboard Link Button (Rule 4 user update) */}
              <div className="mt-3 w-full print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    loginAsPatientWithToken(token);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Click to Open Patient Dashboard ➔</span>
                </button>
                <div className="mt-1.5 text-[9px] text-center text-slate-400 font-mono truncate px-1">
                  {sessionUrl}
                </div>
              </div>
            </div>

            {/* Secure Token Hash */}
            <div className="text-center border-t border-dashed border-slate-300 pt-2 text-[9px] text-slate-400">
              <div className="font-mono">Token: {token}</div>
              <div className="text-slate-400 text-[8px] mt-0.5">
                No app installation required • Keep this slip with you
              </div>
            </div>

            {/* Tear Line */}
            <div className="text-center text-slate-300 tracking-widest text-[8px] pt-1">
              - - - - - - - - - TEAR HERE - - - - - - - - -
            </div>
          </div>
        </div>

        {/* Modal Bottom Close Button (Hidden on Print) */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
