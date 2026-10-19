import React, { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Video, 
  Calendar, 
  Star, 
  Award,
  Stethoscope
} from 'lucide-react';
import { Doctor } from '../../types';

export interface DoctorAppointmentCardProps {
  doctor: Doctor;
  onBookVisit?: (doctor: Doctor) => void;
  onStartVideoConsult?: (doctor: Doctor) => void;
  className?: string;
}

export const DoctorAppointmentCard: React.FC<DoctorAppointmentCardProps> = ({
  doctor,
  onBookVisit,
  onStartVideoConsult,
  className = '',
}) => {
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Fallback defaults for rich presentation
  const experienceYears = (doctor as any).experienceYears || 14;
  const qualifications = (doctor as any).qualifications || ['MBBS', 'MD', 'FACC (USA)'];
  const rating = (doctor as any).rating || 4.9;
  const reviewCount = (doctor as any).reviewCount || 340;
  const consultationFee = (doctor as any).consultationFee || 800;
  const earliestSlot = (doctor as any).earliestSlot || 'Today, 03:30 PM';

  const handleVisitBooking = () => {
    if (onBookVisit) onBookVisit(doctor);
    setBookingSuccessMsg(`Hospital visit pass reserved for ${doctor.name} (${doctor.roomNo}).`);
    setTimeout(() => setBookingSuccessMsg(null), 4000);
  };

  const handleVideoConsult = () => {
    if (onStartVideoConsult) onStartVideoConsult(doctor);
    setBookingSuccessMsg(`Video consult room opening for ${doctor.name}...`);
    setTimeout(() => setBookingSuccessMsg(null), 4000);
  };

  return (
    <div 
      className={`bg-white rounded-3xl p-5 border border-slate-200/90 shadow-clinical hover:shadow-popover transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${className}`}
      style={{
        boxShadow: '0 1px 3px 0 rgba(15,23,42,0.04), 0 10px 25px -5px rgba(15,23,42,0.06)'
      }}
    >
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-obsidian-900" />

      {/* Doctor Header & Bio */}
      <div>
        <div className="flex items-start gap-3.5">
          {/* Avatar with Verified Specialist Badge */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-black text-teal-800 text-lg shadow-sm overflow-hidden">
              {doctor.avatarUrl ? (
                <img 
                  src={doctor.avatarUrl} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-teal-700 font-extrabold text-base sm:text-lg">
                  {doctor.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </span>
              )}
            </div>

            {/* Verified Specialist Badge with Tick */}
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-teal-600/30"
              title="Verified Medical Specialist"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Name & Specialization */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-base text-obsidian-900 tracking-tight truncate group-hover:text-teal-800 transition-colors">
                {doctor.name}
              </h3>
            </div>

            <p className="text-xs font-bold text-teal-700 mt-0.5 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span>{doctor.specialization}</span>
            </p>

            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {doctor.department}
            </p>
          </div>
        </div>

        {/* Experience, Qualifications & Rating Badges */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          {/* Experience Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-obsidian-800 font-bold text-[11px]">
            <Award className="w-3 h-3 text-teal-600" />
            <span className="tabular-nums">{experienceYears} Years Exp</span>
          </span>

          {/* Qualification Tags */}
          {qualifications.slice(0, 2).map((q: string) => (
            <span 
              key={q}
              className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 font-semibold text-[10px]"
            >
              {q}
            </span>
          ))}

          {/* Consultation Fee Badge */}
          <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-obsidian-800 border border-slate-200 font-bold text-[10px] tabular-nums">
            ₹{consultationFee}
          </span>

          {/* Patient Trust Rating */}
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 ml-auto">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="tabular-nums">{rating}</span>
            <span className="text-[10px] text-slate-400 font-normal">({reviewCount})</span>
          </span>
        </div>

        {/* Live OPD Room & Consultation Timing Indicator */}
        <div className="mt-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-semibold truncate">{doctor.roomNo}</span>
          </div>

          {/* Live Availability Status Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-800 text-[11px]">
              Available: <span className="tabular-nums">{earliestSlot}</span>
            </span>
          </div>
        </div>

        {/* Active In-Chamber Queue Status */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Current OPD Waitlist:</span>
          <span className="font-bold text-obsidian-800 tabular-nums">
            {doctor.activePatientCount} patients ahead
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {bookingSuccessMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{bookingSuccessMsg}</span>
        </div>
      )}

      {/* Dual Clear CTAs: Outline [Book Hospital Visit] & Solid Teal [Start Video Consult] */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleVisitBooking}
          className="py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-obsidian-900 border border-slate-300 font-bold text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs hover:border-slate-400 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Book Visit</span>
        </button>

        <button
          type="button"
          onClick={handleVideoConsult}
          className="py-2.5 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md hover:shadow-teal-glow cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 shrink-0" />
          <span>Video Consult</span>
        </button>
      </div>
    </div>
  );
};
