import React, { useState, useRef, useEffect } from 'react';
import { useHospitalStore, resolveIndianDoctorAvatar } from '../../store/useHospitalStore';
import {
  Stethoscope,
  FlaskConical,
  LogOut,
  User,
  Globe,
  ChevronDown,
  Check,
  ArrowLeft
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Institutional crest — shield + medical cross, drawn on a 20px grid         */
/* -------------------------------------------------------------------------- */
const Crest: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className={className}
    fill="none"
  >
    <path
      d="M10 1.6 16.6 4v5.4c0 3.9-2.8 7-6.6 8.9-3.8-1.9-6.6-5-6.6-8.9V4L10 1.6Z"
      fill="currentColor"
      fillOpacity="0.07"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <path
      d="M9.1 5.9h1.8v2.7h2.7v1.8h-2.7v2.7H9.1v-2.7H6.4V8.6h2.7V5.9Z"
      fill="currentColor"
    />
  </svg>
);

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' }
] as const;

/* Quiet, role-specific tile for staff without a photo avatar */
const ROLE_TILE: Record<
  'lab_tech' | 'patient',
  { label: string; tile: string; Icon: typeof User }
> = {
  lab_tech: {
    label: 'Laboratory technician',
    tile: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    Icon: FlaskConical
  },
  patient: {
    label: 'Patient',
    tile: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    Icon: User
  }
};

export const Header: React.FC = () => {
  const {
    currentHospital,
    currentUser,
    activeLanguage,
    setLanguage,
    signOut,
    canGoBack,
    navigateBack
  } = useHospitalStore();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const doctorAvatar =
    currentUser?.avatar ||
    resolveIndianDoctorAvatar(currentUser?.name || currentHospital.doctorName);

  const isHindi = activeLanguage === 'hi';
  const locality = currentHospital.locality || currentHospital.city;

  const roleTile =
    currentUser && (currentUser.role === 'lab_tech' || currentUser.role === 'patient')
      ? ROLE_TILE[currentUser.role]
      : null;

  const roleLabel =
    currentUser?.role === 'doctor'
      ? 'Doctor'
      : roleTile?.label ?? undefined;

  return (
    <header className="fixed inset-x-0 top-0 z-40 w-full select-none border-b border-slate-200/80 bg-white/80 backdrop-blur-[16px] backdrop-saturate-150 shadow-[0_1px_0_0_rgba(15,23,42,0.015)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* ───────────── Left: brand + institution ───────────── */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          {canGoBack && (
            <button
              type="button"
              onClick={navigateBack}
              aria-label={isHindi ? 'पिछला पृष्ठ / वापस जाएं' : 'Go back to previous page'}
              data-tooltip={isHindi ? 'पिछला पृष्ठ / वापस' : 'Back / पिछला पृष्ठ'}
              className="group flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">{isHindi ? 'वापस' : 'Back'}</span>
            </button>
          )}

          <img
            src="/logo-glossy.png"
            alt="Qcare"
            className="h-8 w-auto shrink-0 object-contain"
            draggable={false}
          />

          <span
            aria-hidden="true"
            className="hidden h-7 w-px shrink-0 bg-slate-200 sm:block"
          />

          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-1.5">
              <Crest className="h-[17px] w-[17px] shrink-0 text-blue-800/90" />
              <span
                title={currentHospital.name}
                className="max-w-[280px] truncate text-[13px] font-semibold leading-[18px] tracking-[-0.01em] text-slate-900"
              >
                {currentHospital.name}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate pl-[23px] text-[11px] leading-4 text-slate-500">
              <span className="truncate">{locality}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="shrink-0">Code:</span>
              <code className="shrink-0 rounded border border-slate-200/80 bg-slate-50 px-1 py-px font-mono text-[10.5px] font-medium tracking-tight text-slate-600">
                {currentHospital.code}
              </code>
            </p>
          </div>
        </div>

        {/* ───────────── Right: identity + utilities ───────────── */}
        <div className="flex shrink-0 items-center gap-1">

          {/* Signed-in staff / patient */}
          {currentUser && (
            <div
              title={roleLabel}
              className="flex items-center gap-2.5 pr-2"
            >
              {currentUser.role === 'doctor' && (
                <div className="relative h-8 w-8 shrink-0">
                  <img
                    src={doctorAvatar}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-full object-cover object-top ring-1 ring-slate-900/10"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.includes('doctor_male_1.jpg')) {
                        img.src = '/doctors/doctor_male_1.jpg';
                      }
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
                  >
                    <Stethoscope className="h-2 w-2" strokeWidth={2.4} />
                  </span>
                </div>
              )}

              {roleTile && (
                <div
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${roleTile.tile}`}
                >
                  <roleTile.Icon className="h-4 w-4" strokeWidth={2} />
                </div>
              )}

              <div className="hidden text-left leading-tight md:block">
                <span className="block max-w-[170px] truncate text-[13px] font-semibold leading-4 text-slate-900">
                  {currentUser.name}
                </span>
                <span className="block max-w-[170px] truncate text-[11px] leading-4 text-slate-500">
                  {currentUser.identifier}
                </span>
              </div>
            </div>
          )}

          <span
            aria-hidden="true"
            className="mx-1.5 hidden h-5 w-px bg-slate-200 sm:block"
          />

          {/* Language */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={showLangMenu}
              aria-label={isHindi ? 'भाषा चुनें' : 'Select language'}
              data-tooltip="Select language / भाषा चुनें"
              className="flex h-8 items-center gap-0.5 rounded-lg px-2 text-slate-500 transition-colors duration-150 hover:bg-slate-100/80 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={1.9} />
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ease-out ${
                  showLangMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Always mounted → no layout shift, pure opacity/transform enter */}
            <div
              role="menu"
              aria-hidden={!showLangMenu}
              className={`absolute right-0 top-full z-50 mt-2 w-40 origin-top-right rounded-xl bg-white p-1 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.16),0_0_0_1px_rgba(15,23,42,0.07)] transition-[opacity,transform,visibility] duration-150 ease-out ${
                showLangMenu
                  ? 'visible translate-y-0 scale-100 opacity-100'
                  : 'invisible -translate-y-1 scale-[0.97] opacity-0'
              }`}
            >
              {LANGUAGES.map(({ code, label }) => {
                const active = activeLanguage === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    tabIndex={showLangMenu ? 0 : -1}
                    onClick={() => {
                      setLanguage(code);
                      setShowLangMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100 focus:outline-none focus-visible:bg-slate-100 ${
                      active
                        ? 'bg-slate-50 font-semibold text-slate-900'
                        : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-blue-700" strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={signOut}
            data-tooltip="Sign out of current workstation session"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} />
            <span className="hidden sm:inline">{isHindi ? 'लॉग आउट' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
