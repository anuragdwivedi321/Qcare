import React, { useState } from 'react';
import { MapPin, Stethoscope, Search, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { SearchableCombobox, ComboboxOption } from './SearchableCombobox';

export interface HeroDiscoveryBarProps {
  onSearchSubmit?: (query: { hospitalId: string; departmentId: string; searchKeyword: string }) => void;
  className?: string;
}

export const HeroDiscoveryBar: React.FC<HeroDiscoveryBarProps> = ({
  onSearchSubmit,
  className = '',
}) => {
  const { hospitals, currentHospitalId, setHospital, departments, doctors, queueTokens } = useHospitalStore();

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(currentHospitalId);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // 1. Hospital options for Combobox
  const hospitalOptions: ComboboxOption[] = hospitals.map(h => ({
    id: h.id,
    label: h.shortName || h.name,
    subtext: `${h.city}, ${h.state} • ${h.badge || 'Campus'}`,
    category: h.state || 'North India',
    badge: h.badge,
    badgeColor: 'teal',
  }));

  // 2. Department / Speciality options
  const departmentOptions: ComboboxOption[] = [
    {
      id: 'all',
      label: 'All Clinical Specialities',
      subtext: 'Browse all available OPD departments',
      category: 'Overview',
      badge: `${departments.length} Depts`,
      badgeColor: 'slate',
    },
    ...departments.map(d => {
      const waitingCount = queueTokens.filter(t => t.departmentId === d.id && t.status === 'waiting').length;
      return {
        id: d.id,
        label: d.name,
        subtext: `Room ${d.location.room} (${d.location.floor}) • ${waitingCount} patients waiting`,
        category: 'Specialities',
        badge: d.availabilityStatus === 'unavailable' ? 'Unavailable' : 'Available Today',
        badgeColor: d.availabilityStatus === 'unavailable' ? ('amber' as const) : ('emerald' as const),
      };
    })
  ];

  const handleHospitalChange = (newHospId: string) => {
    setSelectedHospitalId(newHospId);
    setHospital(newHospId);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit({
        hospitalId: selectedHospitalId,
        departmentId: selectedDeptId,
        searchKeyword: searchKeyword.trim(),
      });
    }

    // Give visual confirmation
    const matchedDoctor = doctors.find(d => 
      d.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.department.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    const targetMsg = matchedDoctor 
      ? `Found ${matchedDoctor.name} (${matchedDoctor.department})`
      : selectedDeptId !== 'all'
      ? `Filtered by ${departments.find(d => d.id === selectedDeptId)?.name || 'Speciality'}`
      : `Active Hospital: ${hospitals.find(h => h.id === selectedHospitalId)?.shortName}`;

    setFeedbackToast(targetMsg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      {/* Floating 3-Field Search Container */}
      <form 
        onSubmit={handleSearch}
        className="bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-clinical transition-all"
        style={{
          boxShadow: '0 1px 3px 0 rgba(15,23,42,0.04), 0 10px 25px -5px rgba(15,23,42,0.08)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Field 1: [📍 Hospital Branch / City] */}
          <div className="md:col-span-4">
            <SearchableCombobox
              options={hospitalOptions}
              value={selectedHospitalId}
              onChange={handleHospitalChange}
              placeholder="Select Hospital Branch..."
              searchPlaceholder="Search city, branch, campus..."
              leftIcon={<MapPin className="w-4 h-4 text-teal-600 shrink-0" />}
              size="md"
              triggerClassName="bg-slate-50/70 hover:bg-white"
            />
          </div>

          {/* Field 2: [🩺 Speciality / Health Concern] */}
          <div className="md:col-span-4">
            <SearchableCombobox
              options={departmentOptions}
              value={selectedDeptId}
              onChange={setSelectedDeptId}
              placeholder="Select Speciality / Concern..."
              searchPlaceholder="Cardiology, Pathology, Ultrasound..."
              leftIcon={<Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />}
              size="md"
              triggerClassName="bg-slate-50/70 hover:bg-white"
            />
          </div>

          {/* Field 3: [🔍 Doctor Name or Symptom] */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Doctor name, chest pain, sugar..."
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium text-obsidian-900 placeholder:text-slate-400 shadow-diffused"
              />
            </div>

            {/* Primary Action CTA: [Find & Book Care] */}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm tracking-tight transition-all duration-150 shadow-md hover:shadow-teal-glow flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Find Care</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Quick Triage / Popular Concern Tags */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Common Concerns:</span>
            </span>
            {[
              { label: 'Chest Heaviness', q: 'chest' },
              { label: 'High Sugar / HbA1c', q: 'sugar' },
              { label: 'Abdominal Ultrasound', q: 'ultrasound' },
              { label: 'Full Body Blood Panel', q: 'blood' },
              { label: 'Routine OPD', q: 'general' }
            ].map(tag => (
              <button
                key={tag.label}
                type="button"
                onClick={() => {
                  setSearchKeyword(tag.q);
                  handleSearch();
                }}
                className="text-[11px] font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-teal-200 transition-colors"
              >
                {tag.label}
              </button>
            ))}
          </div>

          {feedbackToast && (
            <div className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{feedbackToast}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
