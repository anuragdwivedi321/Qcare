import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  label: string;
  subtext?: string;
  category?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'teal' | 'amber' | 'slate' | 'coral';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  leftIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  leftIcon,
  label,
  helperText,
  error,
  className = '',
  triggerClassName = '',
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const comboboxId = useId();

  // Selected Option
  const selectedOption = options.find(opt => opt.id === value);

  // Filter options with instant debounce-like reactivity
  const filteredOptions = options.filter(opt => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(q)) ||
      (opt.category && opt.category.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  // Group by category if categories exist
  const categories = Array.from(
    new Set(filteredOptions.map(opt => opt.category || 'General'))
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          onChange(filteredOptions[highlightedIndex].id);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
        break;
    }
  };

  const getBadgeStyle = (badgeColor?: ComboboxOption['badgeColor']) => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'teal':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'coral':
        return 'bg-coral-50 text-coral-700 border-coral-200';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-xl',
    md: 'py-2.5 px-3.5 text-sm rounded-2xl',
    lg: 'py-3 px-4 text-base rounded-2xl'
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label 
          htmlFor={comboboxId}
          className="block text-xs font-bold text-obsidian-700 mb-1.5 tracking-tight"
        >
          {label}
        </label>
      )}

      {/* Main Combobox Trigger */}
      <button
        id={comboboxId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-white border transition-all duration-150 flex items-center justify-between gap-2.5 shadow-diffused text-left ${
          sizeClasses[size]
        } ${
          isOpen
            ? 'border-teal-600 ring-2 ring-teal-500/20'
            : error
            ? 'border-coral-500 ring-1 ring-coral-500/20'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {leftIcon && (
            <span className="text-teal-600 shrink-0 flex items-center justify-center">
              {leftIcon}
            </span>
          )}
          <div className="truncate flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-obsidian-900 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(selectedOption.badgeColor)}`}>
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`} 
        />
      </button>

      {/* Helper text or error message */}
      {error ? (
        <p className="mt-1 text-xs text-coral-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}

      {/* Floating Menu Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1.5 w-full min-w-[280px] max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-popover overflow-hidden animate-fadeIn"
          style={{
            boxShadow: '0 4px 6px -1px rgba(15,23,42,0.08), 0 20px 30px -10px rgba(15,23,42,0.14)'
          }}
        >
          {/* Sticky Internal Search Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium text-obsidian-900 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List with Category Groups */}
          <div 
            ref={listboxRef}
            role="listbox" 
            className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100/60"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No matching options found.
              </div>
            ) : (
              categories.map(category => {
                const categoryOptions = filteredOptions.filter(
                  opt => (opt.category || 'General') === category
                );
                if (categoryOptions.length === 0) return null;

                return (
                  <div key={category} className="pt-1 first:pt-0">
                    {categories.length > 1 && (
                      <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {category}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {categoryOptions.map(opt => {
                        const globalIndex = filteredOptions.findIndex(o => o.id === opt.id);
                        const isSelected = opt.id === value;
                        const isHighlighted = globalIndex === highlightedIndex;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            disabled={opt.disabled}
                            onClick={() => {
                              if (!opt.disabled) {
                                onChange(opt.id);
                                setIsOpen(false);
                              }
                            }}
                            onMouseEnter={() => setHighlightedIndex(globalIndex)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-teal-50 text-teal-900 font-semibold'
                                : isHighlighted
                                ? 'bg-slate-100 text-obsidian-900'
                                : 'text-obsidian-800 hover:bg-slate-50'
                            } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {opt.icon && (
                                <span className="shrink-0 text-slate-500">{opt.icon}</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-obsidian-900 truncate">
                                  {opt.label}
                                </div>
                                {opt.subtext && (
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {opt.subtext}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {opt.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(opt.badgeColor)}`}>
                                  {opt.badge}
                                </span>
                              )}
                              {isSelected && (
                                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
