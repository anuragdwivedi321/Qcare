import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option...',
  className = '',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIdx = options.findIndex(opt => opt.value === value);
        const nextIdx = (currentIdx + 1) % options.length;
        onChange(options[nextIdx].value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIdx = options.findIndex(opt => opt.value === value);
        const prevIdx = (currentIdx - 1 + options.length) % options.length;
        onChange(options[prevIdx].value);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-[#374151] block mb-1.5">
          {label}
        </label>
      )}

      {/* Select Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[42px] px-3.5 py-2 bg-white rounded-md border transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer focus:outline-none ${
          isOpen
            ? 'border-[#0A6B61] ring-2 ring-[#0A6B61]/20 shadow-xs'
            : error
            ? 'border-[#DC2626] focus:border-[#DC2626]'
            : 'border-[#D1D5DB] hover:border-[#9CA3AF] shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[#0A6B61] flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#111827] truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.subLabel && (
                  <span className="text-[11px] text-[#6B7280]">
                    {selectedOption.subLabel}
                  </span>
                )}
                {selectedOption.badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#9CA3AF]">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0A6B61]' : ''
          }`}
        />
      </button>

      {error && <p className="text-xs text-[#DC2626] mt-1">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-md border border-[#D1D5DB] shadow-lg max-h-64 overflow-y-auto py-1 divide-y divide-[#F3F4F6] animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-[#0A6B61]/8 text-[#0A6B61] font-semibold'
                    : 'text-[#1F2937] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 flex items-center justify-center ${
                        isSelected ? 'text-[#0A6B61]' : 'text-[#6B7280]'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#111827]">{option.label}</span>
                      {option.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563]">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.subLabel && (
                      <p className="text-[11px] text-[#6B7280] mt-0.5">{option.subLabel}</p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#0A6B61] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
