import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, X } from 'lucide-react';

export interface SecurityPopoverProps {
  label?: string;
  encryptionStandard?: string;
  complianceText?: string;
  className?: string;
}

export const SecurityPopover: React.FC<SecurityPopoverProps> = ({
  label = 'HIPAA / DISHA Protected',
  encryptionStandard = '256-Bit End-to-End Encrypted',
  complianceText = 'Protected under National Digital Health Mission (ABDM) and Patient Data Privacy Standards. Strictly confidential.',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
        title="View Clinical Security & Privacy Standards"
      >
        <Lock className="w-3 h-3 text-teal-600" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 right-0 sm:left-0 top-full mt-2 w-72 sm:w-80 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-popover animate-fadeIn text-obsidian-900"
          style={{
            boxShadow: '0 4px 6px -1px rgba(15,23,42,0.08), 0 20px 30px -10px rgba(15,23,42,0.14)'
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-black text-obsidian-900">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>{encryptionStandard}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
            {complianceText}
          </p>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>ISO 27001 • NABH Ready</span>
            <span className="text-emerald-600 font-extrabold">Active Protection</span>
          </div>
        </div>
      )}
    </div>
  );
};
