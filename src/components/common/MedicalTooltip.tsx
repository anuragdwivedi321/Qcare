import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ShieldCheck } from 'lucide-react';

export interface MedicalTooltipProps {
  term: React.ReactNode;
  explanation: string;
  clinicalSource?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  inlineDotted?: boolean;
}

export const MedicalTooltip: React.FC<MedicalTooltipProps> = ({
  term,
  explanation,
  clinicalSource = 'WHO / National Clinical Guidelines',
  position = 'top',
  className = '',
  inlineDotted = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile on mount & resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200); // 200ms intent delay
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsMobileSheetOpen(true);
    }
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-[#0F172A] border-t-transparent border-x-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-[#0F172A] border-r-transparent border-y-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-[#0F172A] border-l-transparent border-y-transparent';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-[#0F172A] border-b-transparent border-x-transparent';
    }
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`${
          inlineDotted 
            ? 'border-b border-dotted border-slate-400 hover:border-teal-600 cursor-help transition-colors' 
            : 'cursor-pointer'
        }`}
      >
        {term}
      </span>

      {/* Desktop Intent-Delayed Tooltip */}
      {!isMobile && isVisible && (
        <span
          role="tooltip"
          className={`absolute z-50 w-64 p-3 bg-obsidian-900 text-white text-xs rounded-xl border border-white/20 shadow-popover pointer-events-none animate-fadeIn ${getPositionClasses()}`}
          style={{
            backgroundColor: '#0F172A',
            boxShadow: '0 10px 25px -3px rgba(15, 23, 42, 0.4), 0 4px 6px -2px rgba(15, 23, 42, 0.2)'
          }}
        >
          {/* Arrow notch */}
          <span
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
          />

          <span className="block font-medium text-slate-100 leading-relaxed">
            {explanation}
          </span>

          {clinicalSource && (
            <span className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-teal-300 font-bold">
              <span>{clinicalSource}</span>
              <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
            </span>
          )}
        </span>
      )}

      {/* Mobile Dismissible Bottom-Sheet Modal */}
      {isMobile && isMobileSheetOpen && (
        <span 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsMobileSheetOpen(false)}
        >
          <span 
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-left animate-slideUp text-obsidian-900"
            onClick={e => e.stopPropagation()}
          >
            <span className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm font-black text-obsidian-900">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Clinical Context</span>
              </span>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </span>

            <span className="block mt-3 text-sm text-slate-700 leading-relaxed font-medium">
              {explanation}
            </span>

            {clinicalSource && (
              <span className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-bold">
                <span>Verified Source: {clinicalSource}</span>
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
};
