import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  Zap, 
  FastForward, 
  User, 
  Stethoscope, 
  FlaskConical, 
  LayoutDashboard,
  Radio
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { ActiveRole } from '../../types';

export const Header: React.FC = () => {
  const {
    activeRole,
    setActiveRole,
    soundEnabled,
    toggleSound,
    autoSimulateTraffic,
    toggleAutoTraffic,
    simulateRush,
    advanceAllCounters,
    resetToDemoBaseline,
    latestAnnouncement,
    cumulativeTimeSavedMinutes,
    queueTokens
  } = useHospitalStore();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const waitingTokensCount = queueTokens.filter(t => t.status === 'waiting').length;

  const roles: { id: ActiveRole; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'patient',
      label: 'Patient Navigator',
      icon: <User className="w-4 h-4" />,
      badge: 'Smart Route'
    },
    {
      id: 'doctor',
      label: 'Doctor OPD Desk',
      icon: <Stethoscope className="w-4 h-4" />
    },
    {
      id: 'lab_tech',
      label: 'Lab Calling Console',
      icon: <FlaskConical className="w-4 h-4" />
    },
    {
      id: 'command_center',
      label: 'Floor Ops Radar',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: 'Live'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-paper-sm">
      {/* Top Notification Announcement Bar if active */}
      {latestAnnouncement && (
        <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-900 text-white text-xs px-4 py-1.5 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
            </span>
            <span className="font-semibold text-cyan-200 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              LATEST COUNTER CALL:
            </span>
            <span className="font-bold text-white tracking-wide">
              Token #{latestAnnouncement.tokenNumber}
            </span>
            <span className="text-cyan-100">
              called to <strong className="text-white">{latestAnnouncement.counterName}</strong> ({latestAnnouncement.room})
            </span>
            <span className="text-cyan-300 text-[11px] ml-auto">
              {latestAnnouncement.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-600/25">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-lg tracking-tight text-slate-900">
                Q-Care <span className="text-teal-600 font-bold">Sync</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Hospital Multi-Queue Router
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Dynamic Bottleneck Bypass & Diagnostic Synchronization
            </p>
          </div>
        </div>

        {/* Global Live Stats & Audio toggle */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-semibold shadow-paper-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saved Today:</span>
            <strong className="text-emerald-900 font-bold font-mono">
              {cumulativeTimeSavedMinutes} mins
            </strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Active Waiting:</span>
            <strong className="font-mono text-slate-900 font-bold">
              {waitingTokensCount}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Hospital Audio Chime' : 'Unmute Hospital Audio Chime'}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Simulation Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoTraffic}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all shadow-paper-xs ${
              autoSimulateTraffic
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-glow-brand font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle autonomous background patient traffic simulation"
          >
            <span className={`w-2 h-2 rounded-full ${autoSimulateTraffic ? 'bg-white animate-ping' : 'bg-slate-400'}`}></span>
            <span className="hidden sm:inline">Auto-Flow:</span>
            <span>{autoSimulateTraffic ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => simulateRush('dept-pathology', 8)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all shadow-paper-xs"
            title="Simulate a sudden surge of 8 patients at Hematology / Blood Lab"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Surge Blood Lab (+8)</span>
          </button>

          <button
            onClick={advanceAllCounters}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5 transition-all shadow-paper-xs"
            title="Call the next patient token across all active counters"
          >
            <FastForward className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Advance Counters</span>
          </button>

          <button
            onClick={resetToDemoBaseline}
            className="p-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all"
            title="Reset scenario to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto">
          <nav className="flex items-center gap-1.5">
            {roles.map(r => {
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-teal-800 shadow-paper-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={isActive ? 'text-teal-600' : 'text-slate-500'}>
                    {r.icon}
                  </span>
                  <span>{r.label}</span>
                  {r.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time Dynamic Dispatch Engine Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
