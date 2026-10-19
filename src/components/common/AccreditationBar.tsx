import React from 'react';
import { ShieldCheck, Award, Lock, FileCheck } from 'lucide-react';

export interface AccreditationBarProps {
  className?: string;
}

export const AccreditationBar: React.FC<AccreditationBarProps> = ({
  className = '',
}) => {
  const accreditations = [
    {
      title: 'NABH Accredited',
      code: 'National Board for Hospitals',
      icon: <Award className="w-4 h-4" />,
      colorClass: 'group-hover:text-teal-700 group-hover:border-teal-200 group-hover:bg-teal-50',
    },
    {
      title: 'JCI Standard Ready',
      code: 'International Patient Safety',
      icon: <ShieldCheck className="w-4 h-4" />,
      colorClass: 'group-hover:text-emerald-700 group-hover:border-emerald-200 group-hover:bg-emerald-50',
    },
    {
      title: 'ISO 27001 Certified',
      code: 'Clinical Information Security',
      icon: <Lock className="w-4 h-4" />,
      colorClass: 'group-hover:text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-50',
    },
    {
      title: 'DISHA & ABDM Compliant',
      code: 'Digital Health & Privacy Tier 1',
      icon: <FileCheck className="w-4 h-4" />,
      colorClass: 'group-hover:text-amber-700 group-hover:border-amber-200 group-hover:bg-amber-50',
    },
  ];

  return (
    <div className={`w-full py-4 px-3 sm:px-6 border-y border-slate-200/80 bg-white/70 backdrop-blur-xs ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 shrink-0">
          Clinical Trust & Regulatory Accreditations
        </span>

        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4">
          {accreditations.map((acc, idx) => (
            <div
              key={idx}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-default ${acc.colorClass}`}
            >
              <span className="text-slate-400 transition-colors duration-200">
                {acc.icon}
              </span>
              <div className="text-left">
                <span className="font-bold text-obsidian-900 group-hover:text-inherit block text-[11px] leading-tight transition-colors">
                  {acc.title}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {acc.code}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
