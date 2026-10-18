import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX,
  User, 
  Stethoscope, 
  FlaskConical, 
  Bell, 
  Clock,
  ArrowLeft,
  Building2,
  Zap
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { WhyQCareModal } from './WhyQCareModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    activeRole,
    hospitals,
    currentHospitalId,
    setHospital,
    signOut,
    soundEnabled,
    toggleSound,
    latestAnnouncement
  } = useHospitalStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  let portalBadge = {
    title: 'Patient Portal',
    dotColor: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <User className="w-3.5 h-3.5 text-blue-600" />
  };

  if (activeRole === 'super_admin') {
    portalBadge = {
      title: 'Platform Super Admin',
      dotColor: 'bg-purple-600',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Building2 className="w-3.5 h-3.5 text-purple-600" />
    };
  } else if (activeRole === 'hospital_admin') {
    portalBadge = {
      title: 'Hospital Admin Console',
      dotColor: 'bg-amber-600',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Building2 className="w-3.5 h-3.5 text-amber-600" />
    };
  } else if (activeRole === 'doctor_assistant' || activeRole === 'reception') {
    portalBadge = {
      title: 'Doctor Assistant Station',
      dotColor: 'bg-blue-600',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
    };
  } else if (activeRole === 'doctor') {
    portalBadge = {
      title: 'Doctor OPD Chamber',
      dotColor: 'bg-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
    };
  } else if (activeRole === 'lab_tech' || activeRole === 'lab_staff') {
    portalBadge = {
      title: 'Diagnostic Lab Station',
      dotColor: 'bg-purple-600',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
    };
  } else if (activeRole === 'kiosk') {
    portalBadge = {
      title: 'Self-Service Kiosk',
      dotColor: 'bg-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <User className="w-3.5 h-3.5 text-emerald-600" />
    };
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Real-time Hospital Audio Call Announcement Banner */}
      {latestAnnouncement && (
        <div className="bg-blue-50 text-blue-900 text-xs px-4 py-2 border-b border-blue-200 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 shrink-0 animate-bounce" />
              <span className="font-black text-blue-800">
                TOKEN #{latestAnnouncement.tokenNumber}
              </span>
              <span className="text-slate-700">
                Please proceed to <strong>{latestAnnouncement.counterName}</strong> ({latestAnnouncement.room})
              </span>
            </div>
            <span className="text-slate-500 text-[11px] shrink-0 font-medium">
              {latestAnnouncement.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Main Single-Line Header Bar (h-16) - Full width with safe padding to never clip Exit */}
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Hospital Brand & Clean Branch Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs">
            <img 
              src="/logo.png" 
              alt="QCare Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                QCare
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md hidden xs:inline-block">
                Hospital OS
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Clean Hospital Branch Dropdown */}
            <div className="relative inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 hidden md:inline-block shrink-0" />
              <select
                value={currentHospitalId}
                onChange={e => setHospital(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs max-w-[130px] sm:max-w-[200px] truncate"
                title="Switch Hospital Branch / Tenant Scope"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.shortName} ({h.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center / Middle ("min me") Bada Sa Q-CARE Branding */}
        <div className="hidden md:flex items-center gap-2.5 absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200/90 shadow-2xs">
            <img 
              src="/logo.png" 
              alt="QCare Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl lg:text-3xl tracking-tight text-slate-900 font-sans">
              Q-CARE
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hidden xl:inline-block">
              Hospital Platform
            </span>
          </div>
        </div>

        {/* Portal Identifier Pill */}
        <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-xs shadow-2xs shrink-0">
          <span className={`w-2 h-2 rounded-full ${portalBadge.dotColor} animate-pulse`} />
          <span className="font-bold text-slate-700">
            {portalBadge.title}
          </span>
        </div>

        {/* User Profile, Clock, Controls & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {currentUser && (
            <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-2xl text-xs shadow-2xs shrink-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold border shrink-0 ${portalBadge.badgeClass}`}>
                {portalBadge.icon}
              </div>
              <div className="text-left hidden sm:block max-w-[110px] md:max-w-[140px]">
                <div className="font-bold text-slate-900 leading-tight truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate hidden md:block">
                  {currentUser.subtitle || currentUser.role.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">{currentTime}</span>
          </div>

          {/* Why Q-Care Button */}
          <button
            onClick={() => setShowWhyModal(true)}
            title="Why Choose Q-Care vs Traditional HMS"
            className="px-3 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span className="hidden sm:inline">Why Q-Care?</span>
          </button>

          {/* Voice & Sound Announcement Controller Button */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Voice Calling & Chimes: ACTIVE (2x Token Repeat) — Click to Mute' : 'Voice Calling: MUTED — Click to Enable'}
            className={`px-2.5 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              soundEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden xs:inline-block" />
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              </>
            )}
          </button>

          {/* Sign Out / Exit Button - Guaranteed 100% visible, shrink-0, never clipped */}
          <button
            onClick={signOut}
            title="Back to Reception / Sign out"
            className="px-3 sm:px-3.5 py-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Why Q-Care Modal */}
      <WhyQCareModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
      />
    </header>
  );
};
