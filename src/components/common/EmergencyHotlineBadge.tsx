import React, { useState } from 'react';
import { PhoneCall, AlertCircle, X, ShieldAlert, ArrowRight, Ambulance } from 'lucide-react';

export interface EmergencyHotlineBadgeProps {
  hotlineNumber?: string;
  ambulanceNumber?: string;
  floating?: boolean;
  className?: string;
}

export const EmergencyHotlineBadge: React.FC<EmergencyHotlineBadgeProps> = ({
  hotlineNumber = '+91 11 4000 9111',
  ambulanceNumber = '108',
  floating = true,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating or Embedded Emergency Trigger */}
      <div 
        className={`${
          floating 
            ? 'fixed bottom-6 left-6 z-40 print:hidden' 
            : 'relative'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-coral-50 hover:bg-coral-100/80 border border-coral-200 text-coral-700 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          title="24/7 Emergency & Triage Hotline"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-coral-600" />
          </span>

          <span className="text-xs font-black tracking-tight text-coral-800 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-coral-600 group-hover:rotate-12 transition-transform" />
            <span>24/7 Emergency: <strong className="font-extrabold text-coral-900 tabular-nums">108 / {hotlineNumber}</strong></span>
          </span>
        </button>
      </div>

      {/* Instant Emergency Triage & One-Tap Call Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-coral-200 text-left animate-scaleUp relative overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
            }}
          >
            {/* Top Red Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-coral-600" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-600">
                  <Ambulance className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-obsidian-900">
                    24/7 Hospital Emergency & Triage
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immediate Critical Care & Ambulance Dispatch
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Emergency Guidance */}
            <div className="mt-4 p-3.5 rounded-2xl bg-coral-50 border border-coral-200/80 text-coral-900 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold block">Red Alert Medical Protocol:</strong>
                  <span>Chest pain, acute breathlessness, sudden numbness, or heavy trauma requires zero OPD queuing. Direct emergency admission is granted upon arrival.</span>
                </div>
              </div>
            </div>

            {/* Direct Calling Buttons */}
            <div className="mt-4 space-y-2.5">
              <a
                href={`tel:${ambulanceNumber}`}
                className="w-full py-3 px-4 rounded-2xl bg-coral-600 hover:bg-coral-700 text-white font-extrabold text-sm tracking-tight flex items-center justify-between shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>Call Emergency Ambulance ({ambulanceNumber})</span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>

              <a
                href={`tel:${hotlineNumber.replace(/\s+/g, '')}`}
                className="w-full py-3 px-4 rounded-2xl bg-obsidian-900 hover:bg-obsidian-950 text-white font-extrabold text-sm tracking-tight flex items-center justify-between shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Hospital Triage Hotline ({hotlineNumber})</span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              QCare Emergency Dispatch is monitored live 24 hours a day, 365 days a year.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
