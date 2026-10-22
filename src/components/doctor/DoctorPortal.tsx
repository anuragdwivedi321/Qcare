import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useHospitalStore, resolveIndianDoctorAvatar, getHospitalState } from '../../store/useHospitalStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { PrintableSlip } from '../common/PrintableSlip';
import { calculateOptimalQueueRoute } from '../../engine/queueRouter';
import { HISTORICAL_PATIENT_RECORDS, HistoricalPatientRecord } from '../../data/historicalPatientsData';
import { DiagnosticTest, Patient } from '../../types';
import {
  Stethoscope,
  Users,
  Search,
  Check,
  Printer,
  FileCheck,
  Activity,
  Droplet,
  FlaskConical,
  ScanLine,
  Waves,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  FileText,
  Clock3,
  ExternalLink,
  Copy,
  Sparkles,
  Zap,
  HeartPulse,
  Mic,
  MicOff,
  Eye,
  Volume2,
  Brain,
  Wind,
  Bone,
  ArrowLeft,
  Wand2,
  UserPlus,
  User,
  Phone,
  Calendar,
  Filter,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const DP_CSS = `@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');

.dp-root{--dp-blue:#1f6bff;--dp-teal:#12b5a6;--dp-line:rgba(15,40,80,.09);font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;position:relative;isolation:isolate}

/* ---------- ambient aurora (slow, calm, behind everything) ---------- */
.dp-aurora{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.dp-aurora i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;will-change:transform}
.dp-aurora i:nth-child(1){width:46vw;height:46vw;left:-12vw;top:-14vw;background:radial-gradient(circle,#8fc2ff,transparent 66%);animation:dpDrift1 26s ease-in-out infinite alternate}
.dp-aurora i:nth-child(2){width:40vw;height:40vw;right:-10vw;top:6vh;background:radial-gradient(circle,#7fe6d6,transparent 66%);animation:dpDrift2 32s ease-in-out infinite alternate}
.dp-aurora i:nth-child(3){width:38vw;height:38vw;left:28vw;bottom:-20vw;background:radial-gradient(circle,#b9b4ff,transparent 66%);animation:dpDrift3 38s ease-in-out infinite alternate}
@keyframes dpDrift1{to{transform:translate(9vw,7vh) scale(1.12)}}
@keyframes dpDrift2{to{transform:translate(-8vw,10vh) scale(.92)}}
@keyframes dpDrift3{to{transform:translate(-10vw,-8vh) scale(1.15)}}

/* ---------- glass surfaces ---------- */
.dp-root .glass-panel{background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.7));-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);border:1px solid rgba(255,255,255,.95);box-shadow:0 1px 0 rgba(255,255,255,.95) inset,0 0 0 1px var(--dp-line),0 24px 48px -24px rgba(20,60,130,.32),0 2px 6px rgba(20,60,130,.05)}
.dp-root .dp-topbar{position:relative;padding:.42rem .85rem;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,255,255,.74));-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);border:1px solid rgba(255,255,255,.95);box-shadow:0 0 0 1px var(--dp-line),0 16px 36px -22px rgba(20,60,130,.35)}

/* ---------- 1.5s delay test detail tooltip ---------- */
.dp-test-tooltip{position:fixed;width:250px;background:rgba(15,23,42,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;border-radius:14px;padding:8px 12px;border:1px solid rgba(255,255,255,.16);box-shadow:0 16px 36px -8px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08);pointer-events:none;animation:dpTooltipPop .2s cubic-bezier(.2,.9,.3,1.15) backwards;z-index:9999}
.dp-test-tooltip.tip-above::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border-width:6px;border-style:solid;border-color:rgba(15,23,42,.96) transparent transparent transparent}
.dp-test-tooltip.tip-below::after{content:"";position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border-width:6px;border-style:solid;border-color:transparent transparent rgba(15,23,42,.96) transparent}
@keyframes dpTooltipPop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}

/* ---------- one orchestrated entrance ---------- */
.dp-rise{animation:dpRise .7s cubic-bezier(.2,.8,.2,1) backwards}
.dp-grid>.dp-rise:nth-child(1){animation-delay:.06s}
.dp-grid>.dp-rise:nth-child(2){animation-delay:.18s}
@keyframes dpRise{from{opacity:0;transform:translateY(18px)}}
.dp-pop{animation:dpPop .5s cubic-bezier(.2,.9,.3,1.15) backwards}
.dp-root .animate-fadeIn{animation:dpPop .24s cubic-bezier(.2,.9,.3,1.15) backwards;transform-origin:top center}
@keyframes dpPop{from{opacity:0;transform:translateY(8px) scale(.96)}}

/* ---------- doctor identity ---------- */
.dp-avatar{width:38px;height:38px;border-radius:9999px;border:2px solid #fff;box-shadow:0 0 0 2px rgba(31,107,255,.35),0 8px 18px -8px rgba(31,107,255,.6)}
.dp-live{animation:dpLive 2.4s ease-out infinite}
@keyframes dpLive{0%{box-shadow:0 0 0 2px #fff,0 0 0 2px rgba(16,185,129,.55)}70%,100%{box-shadow:0 0 0 2px #fff,0 0 0 9px rgba(16,185,129,0)}}

/* ---------- sliding segmented controls ---------- */
.dp-seg{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:999px;background:rgba(15,40,80,.06);border:1px solid rgba(15,40,80,.07);min-width:210px}
.dp-seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/2);border-radius:999px;background:#fff;box-shadow:0 6px 14px -6px rgba(31,107,255,.45),0 0 0 1px rgba(31,107,255,.14);transition:transform .42s cubic-bezier(.3,1.25,.5,1)}
.dp-seg[data-mode="queue"] .dp-seg-thumb{transform:translateX(100%)}
.dp-seg-btn{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;font-size:13px;font-weight:700;color:#5b6f86;border-radius:999px;cursor:pointer;transition:color .25s}
.dp-seg-btn:hover{color:#1d3350}
.dp-seg-btn.on{color:var(--dp-blue)}
.dp-seg-count{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(15,40,80,.08);color:#4a5f78;transition:background .3s,color .3s}
.dp-seg-btn.on .dp-seg-count{background:var(--dp-blue);color:#fff}

.dp-gender{position:relative;display:grid;grid-template-columns:repeat(3,1fr);height:2.75rem;padding:4px;border-radius:14px;background:rgba(15,40,80,.06);border:1px solid rgba(15,40,80,.08)}
.dp-gender-thumb{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/3);border-radius:10px;background:#fff;box-shadow:0 6px 14px -6px rgba(31,107,255,.45),0 0 0 1px rgba(31,107,255,.18);transition:transform .38s cubic-bezier(.3,1.3,.5,1)}
.dp-gender[data-i="1"] .dp-gender-thumb{transform:translateX(100%)}
.dp-gender[data-i="2"] .dp-gender-thumb{transform:translateX(200%)}
.dp-gender-btn{position:relative;z-index:1;font-size:13px;font-weight:700;color:#5b6f86;cursor:pointer;transition:color .25s}
.dp-gender-btn:hover{color:#1d3350}
.dp-gender-btn.on{color:var(--dp-blue)}

/* ---------- panel headers ---------- */
.dp-ico{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;color:#fff}
.dp-ico-blue{background:linear-gradient(145deg,#3b82ff,#1f56e0);box-shadow:0 8px 18px -8px rgba(31,107,255,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.dp-ico-indigo{background:linear-gradient(145deg,#7a6bff,#4b3fe0);box-shadow:0 8px 18px -8px rgba(98,90,240,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.dp-badge{font-size:11px;font-weight:800;color:#1f56e0;background:rgba(31,107,255,.1);border:1px solid rgba(31,107,255,.22);padding:2px 9px;border-radius:999px}
.dp-badge-pop{animation:dpBadge .45s cubic-bezier(.3,1.7,.5,1)}
@keyframes dpBadge{from{transform:scale(.4);opacity:0}}

/* the one memorable thing: a heartbeat that goes live when tests are chosen */
.dp-ecg{width:96px;height:24px;margin-left:4px;color:#bccadb;transition:color .4s;overflow:visible}
.dp-ecg.live{color:var(--dp-blue)}
.dp-ecg path{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:100;animation:dpTrace 2.6s ease-in-out infinite}
.dp-ecg.live path{animation-duration:1.5s;filter:drop-shadow(0 0 4px rgba(31,107,255,.55))}
@keyframes dpTrace{0%{stroke-dashoffset:100}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}

/* ---------- form fields ---------- */
.dp-root .dp-label{display:block;font-size:12px;font-weight:700;color:#3a5069;margin-bottom:.4rem;letter-spacing:.01em;transition:color .2s}
.dp-root div:focus-within>.dp-label{color:var(--dp-blue)}
.dp-root .dp-field{height:2.75rem;border-radius:14px;background:rgba(244,248,253,.85);border:1px solid rgba(15,40,80,.1);box-shadow:inset 0 1px 2px rgba(15,40,80,.04);transition:border-color .2s,box-shadow .25s,background .2s}
.dp-root .dp-field.dp-sm{height:2.25rem;border-radius:12px}
.dp-root textarea.dp-field{height:auto;min-height:5.5rem;padding:.75rem .9rem;line-height:1.5;resize:vertical}
.dp-root .dp-field:hover{border-color:rgba(31,107,255,.35)}
.dp-root .dp-field:focus,.dp-root .dp-field:focus-within{background:#fff;border-color:var(--dp-blue);box-shadow:0 0 0 4px rgba(31,107,255,.14),0 10px 22px -12px rgba(31,107,255,.5);outline:none}

.dp-root .dp-demo{color:#4b3fe0;background:linear-gradient(135deg,rgba(122,107,255,.14),rgba(31,107,255,.1));border:1px solid rgba(98,90,240,.28);transition:transform .2s,box-shadow .25s}
.dp-root .dp-demo:hover{transform:translateY(-1px);box-shadow:0 10px 20px -10px rgba(98,90,240,.6)}
.dp-root .dp-demo:hover svg,.dp-root .dp-ai:hover svg{animation:dpTwinkle .8s}
@keyframes dpTwinkle{40%{transform:rotate(25deg) scale(1.3)}100%{transform:rotate(0) scale(1)}}

.dp-root .dp-ai{color:#fff;background:linear-gradient(110deg,#1f6bff,#6a5cff 45%,#12b5a6 95%);background-size:200% 100%;box-shadow:0 8px 16px -8px rgba(60,80,255,.75);transition:background-position .6s,transform .15s,box-shadow .25s}
.dp-root .dp-ai:hover{background-position:100% 0;transform:translateY(-1px)}
.dp-root .dp-ai:active{transform:scale(.95)}

.dp-root .dp-quick{background:rgba(255,255,255,.85);border:1px solid rgba(15,40,80,.1);transition:border-color .2s,box-shadow .2s,transform .15s}
.dp-root .dp-quick:hover{border-color:rgba(31,107,255,.4);box-shadow:0 8px 18px -10px rgba(31,107,255,.5)}
.dp-root .dp-quick:active{transform:scale(.97)}

/* ---------- triage ---------- */
.dp-root .dp-tri{background:rgba(255,255,255,.7);border:1px solid rgba(15,40,80,.1);transition:transform .2s,box-shadow .25s,border-color .2s,background .2s}
.dp-root .dp-tri:hover{border-color:rgba(31,107,255,.4);background:#fff}
.dp-root .dp-tri:active{transform:scale(.98)}
.dp-root .dp-tri.on-blue{background:linear-gradient(135deg,rgba(31,107,255,.1),rgba(18,181,166,.08));border-color:var(--dp-blue);box-shadow:0 10px 22px -12px rgba(31,107,255,.6)}
.dp-root .dp-tri.on-rose{background:linear-gradient(135deg,rgba(244,63,94,.1),rgba(251,146,60,.08));border-color:#f43f5e;animation:dpUrgent 2.2s ease-in-out infinite}
@keyframes dpUrgent{0%,100%{box-shadow:0 10px 22px -12px rgba(244,63,94,.6),0 0 0 0 rgba(244,63,94,.25)}50%{box-shadow:0 10px 22px -12px rgba(244,63,94,.6),0 0 0 6px rgba(244,63,94,0)}}

/* ---------- test cards ---------- */
.dp-scroll{scrollbar-width:thin;scrollbar-color:rgba(31,107,255,.3) transparent}
.dp-root .dp-test{position:relative;background:rgba(255,255,255,.8);border:1px solid rgba(15,40,80,.08);box-shadow:0 1px 2px rgba(15,40,80,.04);transition:transform .22s cubic-bezier(.3,1.4,.5,1),box-shadow .25s,border-color .2s,background .2s}
.dp-root .dp-test:hover{transform:translateY(-2px);border-color:rgba(31,107,255,.35);box-shadow:0 14px 26px -16px rgba(31,107,255,.55)}
.dp-root .dp-test:active{transform:scale(.98)}
.dp-root .dp-test:focus-visible{outline:2px solid var(--dp-blue);outline-offset:2px}
.dp-root .dp-test.is-checked{background:linear-gradient(135deg,rgba(31,107,255,.1),rgba(18,181,166,.08));border-color:var(--dp-blue);box-shadow:0 0 0 3px rgba(31,107,255,.12),0 16px 28px -18px rgba(31,107,255,.7)}
.dp-test-ico{background:linear-gradient(145deg,#fff,#eef3fa);box-shadow:0 1px 0 #fff inset,0 0 0 1px rgba(15,40,80,.07),0 4px 10px -4px rgba(15,40,80,.2);transition:transform .35s cubic-bezier(.3,1.5,.5,1),box-shadow .25s}
.dp-test-ico svg{width:1.35rem;height:1.35rem}
.dp-test:hover .dp-test-ico{transform:rotate(-6deg) scale(1.07)}
.dp-test.is-checked .dp-test-ico{background:#fff;box-shadow:0 0 0 1.5px var(--dp-blue),0 8px 16px -8px rgba(31,107,255,.65)}
.dp-check{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(15,40,80,.2);background:#fff;color:#fff;transition:background .2s,border-color .2s}
.dp-check svg{transform:scale(0);transition:transform .3s cubic-bezier(.3,1.8,.5,1)}
.dp-test.is-checked .dp-check{background:linear-gradient(135deg,#1f6bff,#12b5a6);border-color:transparent;animation:dpCheck .42s cubic-bezier(.3,1.6,.5,1)}
.dp-test.is-checked .dp-check svg{transform:scale(1)}
@keyframes dpCheck{0%{transform:scale(.6)}60%{transform:scale(1.25)}100%{transform:scale(1)}}

/* ---------- primary action ---------- */
.dp-root .dp-cta{position:relative;overflow:hidden;color:#fff;background:linear-gradient(110deg,#1f6bff 0%,#5a5cf0 45%,#12b5a6 100%);background-size:200% 100%;box-shadow:0 16px 30px -14px rgba(31,107,255,.75),inset 0 1px 0 rgba(255,255,255,.3);transition:background-position .7s,transform .18s,box-shadow .3s}
.dp-root .dp-cta::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.38) 50%,transparent 65%);transform:translateX(-120%);transition:transform .8s}
.dp-root .dp-cta:hover{background-position:100% 0;transform:translateY(-1px);box-shadow:0 20px 34px -14px rgba(31,107,255,.85),inset 0 1px 0 rgba(255,255,255,.3)}
.dp-root .dp-cta:hover::after{transform:translateX(120%)}
.dp-root .dp-cta:active{transform:scale(.985)}
.dp-root .dp-cta-sm{box-shadow:0 10px 20px -10px rgba(31,107,255,.75),inset 0 1px 0 rgba(255,255,255,.3)}

/* ---------- queue rows, errors, a11y ---------- */
.dp-root .dp-row{transition:background-color .2s,box-shadow .2s}
.dp-root .dp-row:hover{box-shadow:inset 3px 0 0 rgba(31,107,255,.4)}
.dp-root .dp-shake{animation:dpShake .45s}
@keyframes dpShake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.dp-root button:focus-visible,.dp-root [role="checkbox"]:focus-visible{outline:2px solid var(--dp-blue);outline-offset:2px}

@media (prefers-reduced-motion:reduce){
  .dp-root *,.dp-root *::before,.dp-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .dp-aurora i{animation:none}
}
`;

export const DoctorPortal: React.FC = () => {
  const {
    currentHospital,
    currentUser,
    patients,
    tests,
    departments,
    counters,
    queueTokens,
    clinicalReports,
    selectedPatientId,
    setSelectedPatientId,
    activeLanguage,
    registerPatient,
    prescribeTests,
    verifyAndDischargePatient,
    loadDoctorDemoPatients,
    resetToCleanSlate,
    selectAndLoginPatient,
    prefilledWalkinData,
    setPrefilledWalkinData,
    openSearchModal,
    generateAiDemoPatient,
    showToast
  } = useHospitalStore();

  const t = TRANSLATIONS[activeLanguage];

  // ==========================================
  // TOP WORKFLOW NAVIGATION: 'walkin' (DEFAULT) vs 'queue'
  // ==========================================
  const [mainViewMode, setMainViewMode] = useState<'walkin' | 'queue'>('walkin');

  // ==========================================
  // 1. WALK-IN CONSULTATION & REGISTRATION FORM STATE
  // ==========================================
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patPhone, setPatPhone] = useState('');
  const [patComplaint, setPatComplaint] = useState('');
  const [patPriority, setPatPriority] = useState<'standard' | 'emergency'>('standard');
  const [walkinTestIds, setWalkinTestIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [autofillBanner, setAutofillBanner] = useState<string | null>(null);

  // Returning Patient Quick-Search
  const [returningSearchQuery, setReturningSearchQuery] = useState('');
  const [showReturningDropdown, setShowReturningDropdown] = useState(false);

  // Diagnostic Test Discovery
  const [walkinCategoryFilter, setWalkinCategoryFilter] = useState<string>('all');
  const [walkinSearchFilter, setWalkinSearchFilter] = useState('');

  // Thermal Slip Modal State (Shown immediately upon registration)
  const [slipModalPatient, setSlipModalPatient] = useState<Patient | null>(null);

  // Diagnostic Test 1.5s Hover Preview Tooltip State
  const [hoveredTest, setHoveredTest] = useState<{ id: string; top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTestMouseEnter = (testId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTest({
        id: testId,
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }, 1500);
  };

  const handleTestMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTest(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Mobile 2-step wizard state (Step 1: Patient Details -> Step 2: Diagnostic Tests)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  // Speech Recognition & Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Quick Dropdowns State (Symptoms & Bundles)
  const [showQuickSymptoms, setShowQuickSymptoms] = useState(false);
  const [showQuickBundles, setShowQuickBundles] = useState(false);
  const quickSymptomsRef = useRef<HTMLDivElement>(null);
  const quickBundlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickSymptomsRef.current && !quickSymptomsRef.current.contains(e.target as Node)) {
        setShowQuickSymptoms(false);
      }
      if (quickBundlesRef.current && !quickBundlesRef.current.contains(e.target as Node)) {
        setShowQuickBundles(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to global prefilled patient data (e.g. from 56 patient search or AI Demo generator)
  useEffect(() => {
    if (!prefilledWalkinData) return;
    setPatName(prefilledWalkinData.name);
    setPatAge(prefilledWalkinData.age);
    setPatGender(prefilledWalkinData.gender);
    setPatPhone(prefilledWalkinData.contact);
    setPatComplaint(prefilledWalkinData.chiefComplaint);
    if (prefilledWalkinData.testIds && prefilledWalkinData.testIds.length > 0) {
      setWalkinTestIds(prefilledWalkinData.testIds);
    }
    setAutofillBanner(`Autofilled: ${prefilledWalkinData.name} (${prefilledWalkinData.age}Y · ${prefilledWalkinData.gender})`);
    setMainViewMode('walkin');
    setMobileStep(1);
    setPrefilledWalkinData(null);
  }, [prefilledWalkinData, setPrefilledWalkinData]);

  // ==========================================
  // 2. HISTORICAL REGISTRY (56 PATIENTS) MODAL STATE
  // ==========================================
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [historicalSearch, setHistoricalSearch] = useState('');
  const [historicalCategoryFilter, setHistoricalCategoryFilter] = useState<string>('all');

  // ==========================================
  // 3. TODAY'S ACTIVE QUEUE & REPORTS WORKSPACE STATE
  // ==========================================
  const [queueFilter, setQueueFilter] = useState<'all' | 'waiting' | 'in_diagnostics' | 'reports_ready' | 'completed'>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState<'prescribe' | 'route' | 'reports'>('prescribe');
  const [doctorConclusionNotes, setDoctorConclusionNotes] = useState('');

  // Selected patient in Live Queue mode
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || (patients.length > 0 ? patients[0] : null);
  }, [patients, selectedPatientId]);

  // Sync workspace subtab based on patient's diagnostic phase
  useEffect(() => {
    if (!selectedPatient) return;
    if (selectedPatient.doctorReviewStatus === 'reports_ready') {
      setWorkspaceTab('reports');
    } else if (selectedPatient.doctorReviewStatus === 'awaiting_lab_reports') {
      setWorkspaceTab('route');
    } else if (selectedPatient.doctorReviewStatus === 'awaiting_prescription') {
      setWorkspaceTab('prescribe');
    }
  }, [selectedPatient?.id, selectedPatient?.doctorReviewStatus]);

  // Queue KPI counts
  const waitingCount = patients.filter(p => p.doctorReviewStatus === 'awaiting_prescription').length;
  const inDiagCount = patients.filter(p => p.doctorReviewStatus === 'awaiting_lab_reports').length;
  const reportsReadyCount = patients.filter(p => p.doctorReviewStatus === 'reports_ready').length;
  const completedCount = patients.filter(p => p.doctorReviewStatus === 'completed').length;

  // Filtered live queue
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (queueFilter === 'waiting' && p.doctorReviewStatus !== 'awaiting_prescription') return false;
      if (queueFilter === 'in_diagnostics' && p.doctorReviewStatus !== 'awaiting_lab_reports') return false;
      if (queueFilter === 'reports_ready' && p.doctorReviewStatus !== 'reports_ready') return false;
      if (queueFilter === 'completed' && p.doctorReviewStatus !== 'completed') return false;

      if (queueSearchQuery.trim()) {
        const q = queueSearchQuery.trim().toLowerCase();
        const digits = q.replace(/\D/g, '');
        const matchName = p.name.toLowerCase().includes(q);
        const matchUhid = p.uhid.toLowerCase().includes(q);
        const matchToken = p.opdTokenNumber?.toLowerCase().includes(q);
        const matchPhone = digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits);
        return matchName || matchUhid || matchToken || matchPhone;
      }
      return true;
    });
  }, [patients, queueFilter, queueSearchQuery]);

  // Clinical reports for selected queue patient
  const patientReports = useMemo(() => {
    if (!selectedPatient) return [];
    return clinicalReports.filter(r => r.patientId === selectedPatient.id);
  }, [clinicalReports, selectedPatient]);

  // Dynamic route for selected queue patient
  const activeRoutingPlan = useMemo(() => {
    if (!selectedPatient || selectedPatient.prescribedTests.length === 0) return null;
    try {
      return calculateOptimalQueueRoute(
        selectedPatient,
        tests,
        departments,
        queueTokens,
        counters
      );
    } catch {
      return null;
    }
  }, [selectedPatient, tests, departments, queueTokens, counters]);

  // ==========================================
  // RETURNING PATIENT AUTO-SEARCH MATCHES
  // ==========================================
  const returningMatches = useMemo((): { histMatches: HistoricalPatientRecord[]; activeMatches: Patient[] } => {
    const q = returningSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return { histMatches: [], activeMatches: [] };
    const digits = q.replace(/\D/g, '');

    const histMatches = HISTORICAL_PATIENT_RECORDS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits))
    ).slice(0, 5);

    const activeMatches = patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits))
    ).slice(0, 3);

    return { histMatches, activeMatches };
  }, [returningSearchQuery, patients]);

  const handleSelectReturningPatient = (p: HistoricalPatientRecord | Patient) => {
    setPatName(p.name);
    setPatAge(String(p.age));
    setPatGender(p.gender as 'Male' | 'Female' | 'Other');
    setPatPhone(p.contact.replace(/\D/g, '').slice(-10));
    setPatComplaint(p.chiefComplaint || ('symptoms' in p ? (p.symptoms || '') : ''));
    setAutofillBanner(`Autofilled: ${p.name} (${p.uhid})`);
    setReturningSearchQuery('');
    setShowReturningDropdown(false);
  };

  const handleAutofillFromHistoricalModal = (item: HistoricalPatientRecord) => {
    setPatName(item.name);
    setPatAge(String(item.age));
    setPatGender(item.gender);
    setPatPhone(item.contact.replace(/\D/g, '').slice(-10));
    setPatComplaint(item.chiefComplaint);
    setAutofillBanner(`Autofilled from archive: ${item.name} (${item.uhid})`);
    setShowHistoricalModal(false);
    setMainViewMode('walkin');
  };

  // ==========================================
  // DIAGNOSTIC TEST FILTERING & SELECTION
  // ==========================================
  const filteredWalkinTests = useMemo(() => {
    return tests.filter(test => {
      if (walkinCategoryFilter !== 'all') {
        const dept = departments.find(d => d.id === test.departmentId);
        if (dept?.category !== walkinCategoryFilter) return false;
      }
      if (!walkinSearchFilter.trim()) return true;
      const q = walkinSearchFilter.toLowerCase().trim();
      return (
        test.name.toLowerCase().includes(q) ||
        test.technicalName.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q)
      );
    });
  }, [tests, departments, walkinCategoryFilter, walkinSearchFilter]);

  const toggleWalkinTest = (testId: string) => {
    setWalkinTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  // Preset Diagnostic Panels (Expanded with all Clinical Specialties)
  const TEST_BUNDLES = [
    { label: 'Routine OPD', ids: ['test-cbc', 'test-fbs'], desc: 'CBC + Fasting Blood Sugar' },
    { label: 'Cardiac Care', ids: ['test-ecg', 'test-cbc', 'test-lipid'], desc: '12-Lead ECG + CBC + Lipid' },
    { label: 'Fever Workup', ids: ['test-cbc', 'test-urine'], desc: 'CBC + Urinalysis Microscopy' },
    { label: 'Chest & Resp', ids: ['test-xray-chest', 'test-spirometry'], desc: 'Chest X-Ray + Spirometry PFT' },
    { label: 'Diabetic Panel', ids: ['test-fbs', 'test-ppbs', 'test-lipid'], desc: 'FBS + PPBS + Fasting Lipid' },
    { label: 'Ophthalmic Exam', ids: ['test-retina-oct', 'test-visual-acuity'], desc: 'Retinal OCT + Slit Lamp Exam' },
    { label: 'ENT & Audiology', ids: ['test-audiometry', 'test-tympanometry'], desc: 'Audiometry PTA + Tympanometry' },
    { label: 'Abdomen & Sonography', ids: ['test-usg-abdomen', 'test-urine'], desc: 'Abdominal USG + Urinalysis' },
    { label: 'Neuro Screen', ids: ['test-eeg', 'test-ncs'], desc: '32-Ch EEG + Nerve Conduction' },
    { label: 'Bone DEXA Scan', ids: ['test-dexa', 'test-cbc'], desc: 'DEXA Bone Densitometry + CBC' },
    { label: 'Executive Health Check', ids: ['test-cbc', 'test-fbs', 'test-lipid', 'test-ecg', 'test-xray-chest', 'test-usg-abdomen'], desc: 'Comprehensive Multi-Lab Screen' }
  ];

  const applyTestBundle = (ids: string[]) => {
    setWalkinTestIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  // AI Chief Complaint Clinical Sentence Expander & Test Matcher
  const handleAiSuggestTests = () => {
    const raw = (patComplaint || '').trim();
    const lower = raw.toLowerCase();
    const suggested: string[] = [];
    const clinicalSentences: string[] = [];

    if (!raw) {
      setPatComplaint("Patient presents for routine clinical evaluation with generalized fatigue and mild body ache.");
      setWalkinTestIds(prev => Array.from(new Set([...prev, 'test-cbc', 'test-fbs'])));
      return;
    }

    if (/chest|tight|angina|palpitat|heart|sweat|breathless/i.test(lower)) {
      clinicalSentences.push("Patient presents with acute chest discomfort and exertional dyspnea.");
      suggested.push('test-ecg', 'test-xray-chest', 'test-cbc');
    }
    if (/sugar|diabet|thirst|urin|polyuria|fatigue|fbs|hba1c|glucose/i.test(lower)) {
      clinicalSentences.push("Patient reports uncontrolled blood glucose levels accompanied by polyuria and excessive thirst.");
      suggested.push('test-fbs', 'test-ppbs', 'test-lipid');
    }
    if (/fever|chills|cold|bodyache|weakness|vomit|infection|rigor|temp|bukhar/i.test(lower)) {
      clinicalSentences.push("Patient is suffering from high-grade fever associated with chills and generalized malaise.");
      suggested.push('test-cbc', 'test-urine');
    }
    if (/vision|eye|blur|see|cataract|retina|floaters|reading/i.test(lower)) {
      clinicalSentences.push("Patient reports progressive blurring of vision and difficulty with near-distance tasks.");
      suggested.push('test-retina-oct', 'test-visual-acuity');
    }
    if (/ear|hear|sound|ring|tinnitus|vertigo|throat|deaf|earache/i.test(lower)) {
      clinicalSentences.push("Patient complains of hearing difficulty accompanied by episodic tinnitus and vertigo.");
      suggested.push('test-audiometry', 'test-tympanometry');
    }
    if (/headache|seiz|fits|epilep|tremor|numb|tingl|migraine|faint|nerve|sir/i.test(lower)) {
      clinicalSentences.push("Patient presents with recurrent throbbing headaches and occasional episodes of lightheadedness.");
      suggested.push('test-eeg', 'test-ncs');
    }
    if (/cough|breath|wheez|asthma|lungs|phlegm|sputum|smoke|dyspnea|khansi/i.test(lower)) {
      clinicalSentences.push("Patient presents with persistent productive cough, wheezing, and exertional breathlessness.");
      suggested.push('test-spirometry', 'test-xray-chest');
    }
    if (/joint|knee|bone|fracture|back|spine|osteo|stiff|crepitus|dard/i.test(lower)) {
      clinicalSentences.push("Patient complains of bilateral joint pain and morning stiffness exacerbated by weight bearing.");
      suggested.push('test-dexa', 'test-cbc');
    }
    if (/abdom|stomach|liver|jaundice|pain|acidity|gas|digest|pelvic|pet/i.test(lower)) {
      clinicalSentences.push("Patient complains of diffuse abdominal discomfort, nausea, and epigastric tenderness.");
      suggested.push('test-usg-abdomen', 'test-cbc');
    }

    if (clinicalSentences.length > 0) {
      setPatComplaint(clinicalSentences.join(' '));
    } else {
      const clean = raw.charAt(0).toUpperCase() + raw.slice(1);
      setPatComplaint(clean.endsWith('.') ? `Patient presents with ${raw.toLowerCase()}.` : `Patient presents with ${raw.toLowerCase()}, requiring clinical investigation.`);
    }

    if (suggested.length === 0) {
      suggested.push('test-cbc', 'test-fbs');
    }

    setWalkinTestIds(prev => Array.from(new Set([...prev, ...suggested])));
  };

  // Quick symptom chip append helper
  const handleQuickSymptom = (symptom: string) => {
    setPatComplaint(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return symptom;
      if (trimmed.toLowerCase().includes(symptom.toLowerCase())) return prev;
      return `${trimmed}, ${symptom}`;
    });
  };

  // Web Speech API Voice Dictation
  const handleToggleVoiceDictation = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Safe ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Voice dictation not supported in this browser. Please type symptoms or use Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Listening... speak patient symptoms clearly');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPatComplaint(prev => (prev ? `${prev}. ${transcript}` : transcript));
          showToast(`Transcribed: "${transcript}"`);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          showToast(`Microphone notification: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Microphone access denied or unavailable.');
    }
  };

  // ==========================================
  // SUBMIT WALK-IN REGISTRATION & GENERATE THERMAL PASS
  // ==========================================
  const handleRegisterAndIssuePass = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = patPhone.replace(/\D/g, '');
    if (!patName.trim() || patName.trim().length < 2) {
      setFormError('Please enter a valid patient full name (at least 2 characters).');
      return;
    }
    const ageNum = parseInt(patAge, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setFormError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const newPat = registerPatient({
        name: patName.trim(),
        age: ageNum,
        gender: patGender,
        contact: cleanPhone,
        chiefComplaint: patComplaint.trim() || 'General OPD consultation',
        priority: patPriority
      });

      if (walkinTestIds.length > 0) {
        prescribeTests(
          newPat.id,
          walkinTestIds,
          patPriority === 'emergency' ? 'urgent' : 'normal',
          patComplaint
        );
      }

      // Fetch the updated patient from the store with activeTokenIds and prescribedTests populated!
      const refreshedPat = getHospitalState().patients.find(p => p.id === newPat.id) || {
        ...newPat,
        prescribedTests: walkinTestIds,
        assignedSmartRoute: walkinTestIds,
        doctorReviewStatus: walkinTestIds.length > 0 ? 'awaiting_lab_reports' : 'awaiting_prescription',
        status: walkinTestIds.length > 0 ? 'in_transit' : 'registered'
      };

      // Reset form
      setPatName('');
      setPatAge('');
      setPatPhone('');
      setPatComplaint('');
      setPatPriority('standard');
      setWalkinTestIds([]);
      setAutofillBanner(null);

      // Immediately display thermal QR pass with refreshed tests and tokens
      setSelectedPatientId(newPat.id);
      setSlipModalPatient(refreshedPat);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Registration failed. Please review input fields.');
    }
  };

  // ==========================================
  // HISTORICAL RECORDS FILTERING (56 PATIENTS)
  // ==========================================
  const filteredHistoricalRecords = useMemo(() => {
    return HISTORICAL_PATIENT_RECORDS.filter(item => {
      if (historicalCategoryFilter !== 'all') {
        if (historicalCategoryFilter === 'pathology' && !item.completedTests.includes('test-cbc')) return false;
        if (historicalCategoryFilter === 'biochemistry' && !item.completedTests.includes('test-fbs')) return false;
        if (historicalCategoryFilter === 'radiology' && !item.completedTests.includes('test-xray-chest')) return false;
        if (historicalCategoryFilter === 'cardiology' && !item.completedTests.includes('test-ecg')) return false;
        if (historicalCategoryFilter === 'ultrasound' && !item.completedTests.includes('test-usg-abdomen')) return false;
      }
      if (historicalSearch.trim()) {
        const q = historicalSearch.toLowerCase().trim();
        const digits = q.replace(/\D/g, '');
        const matchName = item.name.toLowerCase().includes(q);
        const matchUhid = item.uhid.toLowerCase().includes(q);
        const matchComplaint = item.chiefComplaint.toLowerCase().includes(q);
        const matchDiagnosis = item.diagnosisNotes.toLowerCase().includes(q);
        const matchPhone = digits.length >= 3 && item.contact.replace(/\D/g, '').includes(digits);
        return matchName || matchUhid || matchComplaint || matchDiagnosis || matchPhone;
      }
      return true;
    });
  }, [historicalSearch, historicalCategoryFilter]);

  // Unified department icon helper
  const getDeptIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`;
    switch (iconName) {
      case 'Droplet': return <Droplet className={iconClass} />;
      case 'FlaskConical': return <FlaskConical className={iconClass} />;
      case 'Activity': return <Activity className={iconClass} />;
      case 'ScanLine': return <ScanLine className={iconClass} />;
      case 'Waves': return <Waves className={iconClass} />;
      case 'Eye': return <Eye className={iconClass} />;
      case 'Volume2': return <Volume2 className={iconClass} />;
      case 'Brain': return <Brain className={iconClass} />;
      case 'Wind': return <Wind className={iconClass} />;
      case 'Bone': return <Bone className={iconClass} />;
      default: return <FlaskConical className={iconClass} />;
    }
  };

  // Clinical SVG visual badge for test cards (DNA helix, blood drop, ECG waveform, retina, etc.)
  const getTestVisualBadge = (testId: string, testCode: string) => {
    if (testId.includes('cbc') || testCode.startsWith('BLD-101')) {
      return (
        <svg className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8 6 5 11 5 15a7 7 0 0 0 14 0c0-4-3-9-7-13Z" />
          <path d="M9 14a3 3 0 0 0 4.5 2.5" />
        </svg>
      );
    }
    if (testId.includes('fbs') || testId.includes('ppbs') || testId.includes('lipid') || testCode.startsWith('BIO')) {
      return (
        <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
    }
    if (testId.includes('ecg') || testCode.startsWith('ECG')) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h3l2.5-6 3.5 12 3-8 2 4h4" />
        </svg>
      );
    }
    if (testId.includes('xray') || testCode.startsWith('RAD')) {
      return (
        <svg className="w-5 h-5 text-purple-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 7v10M8 9c2 .5 6 .5 8 0M8 12c2 .5 6 .5 8 0M8 15c2 .5 6 .5 8 0" />
        </svg>
      );
    }
    if (testId.includes('usg') || testCode.startsWith('USG')) {
      return (
        <svg className="w-5 h-5 text-teal-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 4-2 4-2" />
          <path d="M2 16c2.5-4 5.5-4 8 0s5.5 4 8 0" />
        </svg>
      );
    }
    if (testId.includes('retina') || testId.includes('acuity') || testCode.startsWith('EYE')) {
      return (
        <svg className="w-5 h-5 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    if (testId.includes('audio') || testId.includes('tympano') || testCode.startsWith('ENT')) {
      return (
        <svg className="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5Z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    }
    if (testId.includes('eeg') || testId.includes('ncs') || testCode.startsWith('NEU')) {
      return (
        <svg className="w-5 h-5 text-violet-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.8 1.7 3.7A5 5 0 0 0 7 15a5 5 0 0 0 5 5 5 5 0 0 0 5-5c0-1.7-.8-3.2-2-4.1.9-.9 1.5-2.2 1.5-3.6a5 5 0 0 0-4.5-5.3Z" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      );
    }
    if (testId.includes('spiro') || testCode.startsWith('PFT')) {
      return (
        <svg className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v10M7 8c2.5-3 5-3 5 0M17 8c-2.5-3-5-3-5 0" />
          <path d="M8 12c-3 1-5 4-5 8 0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2 0-4-2-7-5-8" />
        </svg>
      );
    }
    if (testId.includes('dexa') || testCode.startsWith('DEX')) {
      return (
        <svg className="w-5 h-5 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 4a2 2 0 0 0-2 2v2H9V6a2 2 0 1 0-4 0v12a2 2 0 1 0 4 0v-2h6v2a2 2 0 1 0 4 0V6a2 2 0 0 0-2-2Z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  };

  return (
    <div className="dp-root text-slate-900 pb-2">
      <style>{DP_CSS}</style>
      <div className="dp-aurora" aria-hidden="true"><i /><i /><i /></div>
      
      {/* ========================================================
          1. TOP CLINICAL WORKSTATION BAR — compact identity strip only
      ======================================================== */}
      <section className="dp-topbar dp-rise glass-header mb-2.5 flex items-center justify-between gap-2">
        {/* Left: Doctor Profile */}
        <div className="flex items-center gap-2.5">
          <div className="dp-avatar relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img
              src={currentUser?.avatar || resolveIndianDoctorAvatar(currentUser?.name || currentHospital.doctorName)}
              alt={currentUser?.name || currentHospital.doctorName}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('doctor_male_1.jpg')) {
                  img.src = '/doctors/doctor_male_1.jpg';
                }
              }}
            />
            <span className="dp-live absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-[17px] font-extrabold text-slate-900 tracking-tight leading-tight">
              {currentUser?.name || currentHospital.doctorName || 'Dr. Ananya Sen'}
            </h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentUser?.identifier || currentHospital.doctorRoom || 'Chamber 204'}
            </span>
          </div>
        </div>

        {/* Right: Walk-in / Queue switcher only */}
        <div className="flex items-center gap-1.5">
          {/* Segmented Mode Pill Switcher */}
          <div className="dp-seg" data-mode={mainViewMode}>
            <span className="dp-seg-thumb" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setMainViewMode('walkin')}
              className={`dp-seg-btn ${mainViewMode === 'walkin' ? 'on' : ''}`}
            >
              Walk-in
            </button>
            <button
              type="button"
              onClick={() => setMainViewMode('queue')}
              className={`dp-seg-btn ${mainViewMode === 'queue' ? 'on' : ''}`}
            >
              <span>Queue</span>
              <span className="dp-seg-count">{patients.length}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. VIEW 1: REBUILT WALK-IN REGISTRATION & ORDER BUILDER
      ======================================================== */}
      {mainViewMode === 'walkin' && (
        <form onSubmit={handleRegisterAndIssuePass} className="space-y-4">
          
              {/* Mobile 2-Step Progress Indicator (Mobile screen wizard < 1024px) */}
          <div className="lg:hidden flex items-center justify-between p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setMobileStep(1)}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                mobileStep === 1 ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              1. Patient Information
            </button>
            <button
              type="button"
              onClick={() => {
                if (!patName.trim()) {
                  setFormError('Please enter patient full name first.');
                  return;
                }
                setFormError('');
                setMobileStep(2);
              }}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mobileStep === 2 ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>2. Prescribe Tests</span>
              {walkinTestIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {walkinTestIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Inline Form Error */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 shadow-2xs dp-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* 2-Column Clinical Grid (Desktop Side-by-Side, Mobile 2-Step) */}
          <div className="dp-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            {/* ----------------------------------------------------
                COLUMN 1: PATIENT REGISTRATION FORM (5 Cols)
            ---------------------------------------------------- */}
            <div className={`dp-rise lg:col-span-5 glass-panel rounded-[34px] p-5 sm:p-6 flex flex-col space-y-4 ${
              mobileStep === 1 ? 'block' : 'hidden lg:block'
            }`}>
              
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80">
                <div className="dp-ico dp-ico-blue">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  New patient
                </h2>
              </div>

              {/* Returning Patient Search + Demo */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={returningSearchQuery}
                      onChange={e => {
                        setReturningSearchQuery(e.target.value);
                        setShowReturningDropdown(true);
                      }}
                      onFocus={() => setShowReturningDropdown(true)}
                      placeholder="Returning patient — name, UHID, phone"
                      data-tooltip="Search past records to autofill form"
                      className="dp-field w-full h-9 pl-8 pr-7 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                    {returningSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setReturningSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={generateAiDemoPatient}
                    data-tooltip="Generate a random Indian patient demo"
                    className="dp-demo h-9 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Demo</span>
                  </button>
                </div>

                {/* Dropdown Results */}
                {showReturningDropdown && returningSearchQuery.trim().length >= 2 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto animate-fadeIn">
                    {returningMatches.histMatches.length === 0 && returningMatches.activeMatches.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        No returning records found for "{returningSearchQuery}"
                      </div>
                    ) : (
                      <>
                        {returningMatches.histMatches.map(hist => (
                          <button
                            key={hist.id}
                            type="button"
                            onClick={() => handleSelectReturningPatient(hist)}
                            className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{hist.name}</span>
                                <span className="font-mono text-[11px] text-slate-500">({hist.uhid})</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {hist.age}Y · {hist.gender} · {hist.contact} · Visited {hist.visitDate}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Select</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="dp-label">
                  Full name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={patName}
                    onChange={e => setPatName(e.target.value)}
                    placeholder="Patient full name"
                    data-tooltip="Enter the patient's full legal name"
                    className="dp-field w-full h-9 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="dp-label">
                    Age (years) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={patAge}
                      onChange={e => setPatAge(e.target.value)}
                      placeholder="Age"
                      data-tooltip="Patient chronological age in years"
                      className="dp-field w-full h-9 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="dp-label">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="dp-gender" data-i={['Male', 'Female', 'Other'].indexOf(patGender)}>
                    <span className="dp-gender-thumb" aria-hidden="true" />
                    {(['Male', 'Female', 'Other'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPatGender(g)}
                        data-tooltip={`Select gender: ${g}`}
                        className={`dp-gender-btn ${patGender === g ? 'on' : ''}`}
                      >
                        {g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="dp-label">
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <div className="dp-field flex rounded-xl border border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 overflow-hidden transition-all shadow-2xs h-9">
                  <span className="inline-flex items-center px-2.5 bg-slate-100/90 text-slate-600 font-semibold text-xs border-r border-slate-200 shrink-0">
                    +91
                  </span>
                  <div className="relative flex-1 flex items-center">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={patPhone}
                      onChange={e => setPatPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98101 23456"
                      data-tooltip="10-digit mobile number for QR token SMS dispatch"
                      className="w-full h-full pl-10 pr-3 text-xs sm:text-sm text-slate-900 bg-transparent outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Chief Complaint with AI, Voice Dictation & Quick Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="dp-label !mb-0">
                    Chief complaint & symptoms <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* Voice Dictation Button */}
                    <button
                      type="button"
                      onClick={handleToggleVoiceDictation}
                      data-tooltip={isListening ? "Listening... click to stop recording" : "Voice dictation"}
                      className={`h-6 px-2 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isListening ? <Mic className="w-3 h-3 animate-bounce" /> : <Mic className="w-3 h-3 text-slate-500" />}
                      <span>{isListening ? 'Listening...' : 'Voice'}</span>
                    </button>

                    {/* AI Expander & Test Matcher Button */}
                    <button
                      type="button"
                      onClick={handleAiSuggestTests}
                      data-tooltip="Clinical AI: expand symptoms into medical sentence & auto-prescribe tests"
                      className="dp-ai h-6.5 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>AI Assist</span>
                    </button>

                    {/* Quick Symptoms Dropdown */}
                    <div className="relative" ref={quickSymptomsRef}>
                      <button
                        type="button"
                        onClick={() => setShowQuickSymptoms(prev => !prev)}
                        className="h-6.5 px-2.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Quick</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showQuickSymptoms ? 'rotate-180' : ''}`} />
                      </button>
                      {showQuickSymptoms && (
                        <div className="absolute right-0 top-7 z-40 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 max-h-48 overflow-y-auto space-y-0.5 animate-fadeIn">
                          {[
                            'Fever & chills',
                            'Chest tightness',
                            'High blood sugar',
                            'Eye blurring',
                            'Body ache',
                            'Abdominal pain',
                            'Persistent cough',
                            'Joint stiffness',
                            'Ear ringing & vertigo'
                          ].map(sym => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => {
                                handleQuickSymptom(sym);
                                setShowQuickSymptoms(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                            >
                              + {sym}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={patComplaint}
                    onChange={e => setPatComplaint(e.target.value)}
                    placeholder="Document symptoms (or type shorthand like 'fever' and click AI)..."
                    data-tooltip="Type symptoms and click AI to expand into a complete sentence"
                    className="dp-field w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                  />
                  {isListening && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-semibold text-rose-700 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Recording voice...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Triage Classification */}
              <div>
                <label className="dp-label">
                  Triage classification
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    data-tooltip="Standard outpatient consultation flow"
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer ${
                      patPriority === 'standard'
                        ? 'dp-tri on-blue font-semibold text-blue-900'
                        : 'dp-tri text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="patPriority"
                      checked={patPriority === 'standard'}
                      onChange={() => setPatPriority('standard')}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      patPriority === 'standard' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {patPriority === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="block leading-tight font-semibold">Standard OPD</span>
                      <span className="text-[10px] text-slate-500 font-normal">Routine Consultation</span>
                    </div>
                  </label>

                  <label
                    data-tooltip="Priority routing with expedited queue dispatch"
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer ${
                      patPriority === 'emergency'
                        ? 'dp-tri on-rose font-semibold text-rose-900'
                        : 'dp-tri text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="patPriority"
                      checked={patPriority === 'emergency'}
                      onChange={() => setPatPriority('emergency')}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      patPriority === 'emergency' ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                    }`}>
                      {patPriority === 'emergency' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="block leading-tight font-semibold">Urgent / Priority</span>
                      <span className="text-[10px] text-rose-600 font-normal">Fast-Track Queue</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mobile "Continue to Tests" CTA (Step 1 -> Step 2) */}
              <div className="lg:hidden pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!patName.trim()) {
                      setFormError('Please enter patient full name.');
                      return;
                    }
                    if (!patPhone.trim() || patPhone.replace(/\D/g, '').length !== 10) {
                      setFormError('Please enter a valid 10-digit mobile number.');
                      return;
                    }
                    setFormError('');
                    setMobileStep(2);
                  }}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Continue to Prescribe Tests ({walkinTestIds.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* ----------------------------------------------------
                COLUMN 2: DIAGNOSTIC INVESTIGATIONS ORDER BUILDER (7 Cols)
            ---------------------------------------------------- */}
            <div className={`dp-rise lg:col-span-7 glass-panel rounded-[34px] p-5 sm:p-6 flex flex-col space-y-3.5 ${
              mobileStep === 2 ? 'block' : 'hidden lg:block'
            }`}>
              
              {/* Mobile Back Button */}
              <div className="lg:hidden pb-1">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="text-xs font-semibold text-blue-600 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to patient information</span>
                </button>
              </div>

              {/* Compact Level Header: Title & Selected Count (Left) + Quick & Search (Right) */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="dp-ico dp-ico-indigo">
                    <FlaskConical className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Investigations
                  </h2>
                  {walkinTestIds.length > 0 && (
                    <span key={walkinTestIds.length} className="dp-badge dp-badge-pop">
                      {walkinTestIds.length}
                    </span>
                  )}
                  <svg className={`dp-ecg hidden sm:block ${walkinTestIds.length > 0 ? 'live' : ''}`} viewBox="0 0 96 24" aria-hidden="true">
                    <path pathLength="100" d="M0 12h26l4-1 5-9 7 20 6-15 4 5h44" />
                  </svg>
                </div>

                {/* Quick Bundles Dropdown & Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative" ref={quickBundlesRef}>
                    <button
                      type="button"
                      onClick={() => setShowQuickBundles(prev => !prev)}
                      className="dp-quick h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Quick</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showQuickBundles ? 'rotate-180' : ''}`} />
                    </button>
                    {showQuickBundles && (
                      <div className="absolute right-0 top-9 z-40 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-fadeIn">
                        <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Diagnostic Bundles
                        </div>
                        {TEST_BUNDLES.map((b, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              applyTestBundle(b.ids);
                              setShowQuickBundles(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
                          >
                            <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                              {b.label}
                            </div>
                            <div className="text-[10px] text-slate-400 group-hover:text-blue-600">
                              {b.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative w-36 sm:w-44 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={walkinSearchFilter}
                      onChange={e => setWalkinSearchFilter(e.target.value)}
                      data-tooltip="Filter tests by name or code"
                      className="dp-field dp-sm w-full h-8 pl-8 pr-6 text-xs rounded-lg border border-slate-200 bg-slate-50/80 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs transition-all"
                    />
                    {walkinSearchFilter && (
                      <button
                        type="button"
                        onClick={() => setWalkinSearchFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnostic Test Cards Grid — Clean, prominent test name, muted room info */}
              <div className="dp-scroll flex-1 min-h-[360px] max-h-[440px] overflow-y-auto pr-1.5 py-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
                {filteredWalkinTests.map((test, idx) => {
                  const isChecked = walkinTestIds.includes(test.id);
                  const dept = departments.find(d => d.id === test.departmentId);

                  return (
                    <div
                      key={test.id}
                      onClick={() => {
                        toggleWalkinTest(test.id);
                        handleTestMouseLeave();
                      }}
                      onMouseEnter={(e) => handleTestMouseEnter(test.id, e)}
                      onMouseLeave={handleTestMouseLeave}
                      className={`dp-test dp-pop ${isChecked ? 'is-checked' : ''} p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer select-none`}
                      style={{ animationDelay: `${Math.min(idx, 14) * 30}ms` }}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleWalkinTest(test.id);
                          handleTestMouseLeave();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="dp-test-ico w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                          {getTestVisualBadge(test.id, test.code)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-[13px] text-slate-900 block truncate">
                            {test.name}
                          </span>
                          <span className="text-[11.5px] text-slate-500 block truncate mt-0.5">
                            {dept ? `${dept.location.room} · ${dept.location.floor}` : 'Diagnostic Bay'}
                            {test.requiresFasting && ' · Fasting'}
                            {test.requiresFullBladder && ' · Full bladder'}
                          </span>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className="dp-check shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column 2 Bottom Action Bar — Primary CTA anchored after tests */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-slate-800 font-bold text-xs block">
                    {walkinTestIds.length > 0
                      ? `${walkinTestIds.length} test${walkinTestIds.length > 1 ? 's' : ''} selected`
                      : '0 tests selected'}
                  </span>
                  <span className="text-slate-400 text-[11px] block truncate">
                    {walkinTestIds.length > 0 ? 'Ready to issue live thermal boarding slip' : 'Select investigations or register directly'}
                  </span>
                </div>
                <button
                  type="submit"
                  data-tooltip="Generate official printable QR boarding slip & route to bays"
                  className="dp-cta h-12 px-6 text-sm font-bold rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shrink-0 shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Register & issue pass</span>
                </button>
              </div>

            </div>

          </div>

        </form>
      )}

      {/* ========================================================
          3. VIEW 2: TODAY'S ACTIVE OPD QUEUE & CLINICAL REPORTS
      ======================================================== */}
      {mainViewMode === 'queue' && (
        <div className="dp-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Patient Queue Roster (4 Cols) */}
          <div className="dp-rise lg:col-span-4 glass-panel rounded-[34px] flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    OPD Chamber Queue
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                    Doctor & Assistant
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-medium">
                  {filteredPatients.length} of {patients.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={queueSearchQuery}
                  onChange={e => setQueueSearchQuery(e.target.value)}
                  placeholder="Search name, UHID, token..."
                  className="w-full h-8 pl-8 pr-7 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
                {queueSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setQueueSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Segmented Status Filter Control */}
              <div className="bg-slate-100/90 p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-200/60 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All', count: patients.length },
                  { id: 'waiting', label: 'Wait', count: waitingCount },
                  { id: 'in_diagnostics', label: 'Lab', count: inDiagCount },
                  { id: 'reports_ready', label: 'Ready', count: reportsReadyCount },
                  { id: 'completed', label: 'Done', count: completedCount }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setQueueFilter(tab.id as typeof queueFilter)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-1 ${
                      queueFilter === tab.id
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono ${
                      queueFilter === tab.id ? 'text-blue-700 font-bold' : 'text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Patients List */}
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Users className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-900">No patients in this view</p>
                  <p className="text-[11px] text-slate-500">
                    Switch to "Walk-in registration" to register a patient, or load sample OPD data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMainViewMode('walkin')}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Go to walk-in registration
                  </button>
                </div>
              ) : (
                filteredPatients.map(patient => {
                  const isSelected = selectedPatient?.id === patient.id;
                  const isEmergency = patient.priority === 'emergency';
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`dp-row w-full text-left p-3.5 flex items-start justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-3 border-l-blue-600'
                          : 'hover:bg-slate-50/70 border-l-3 border-l-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {patient.name}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 shrink-0">
                            {patient.opdTokenNumber}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {patient.age}Y · {patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O'} · {patient.chiefComplaint || 'Consultation'}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px]">
                          {patient.doctorReviewStatus === 'awaiting_prescription' && (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Awaiting prescription
                            </span>
                          )}
                          {patient.doctorReviewStatus === 'awaiting_lab_reports' && (
                            <span className="text-blue-700 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              In lab ({patient.completedTests.length}/{patient.prescribedTests.length})
                            </span>
                          )}
                          {patient.doctorReviewStatus === 'reports_ready' && (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Reports ready
                            </span>
                          )}
                          {patient.doctorReviewStatus === 'completed' && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Discharged
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                            {patient.registrationTime}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Patient Workspace (8 Cols) */}
          <div className="dp-rise lg:col-span-8 space-y-4">
            {!selectedPatient ? (
              <div className="glass-panel rounded-3xl p-8 text-center">
                <p className="text-sm font-bold text-slate-900">No patient selected</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select an outpatient from the roster on the left to track diagnostic progress or review released results.
                </p>
              </div>
            ) : (
              <>
                {/* Workstation Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      Doctor & OPD Assistant Chamber Workstation
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      · Chamber 102 · General Medicine
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                    Verified Staff Access
                  </span>
                </div>

                {/* Patient Header Card */}
                <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {selectedPatient.name}
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                          {selectedPatient.age}Y · {selectedPatient.gender}
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {selectedPatient.opdTokenNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                        <span>UHID: <strong className="text-slate-800">{selectedPatient.uhid}</strong></span>
                        <span>·</span>
                        <span>Phone: <strong className="text-slate-800">+91 {selectedPatient.contact}</strong></span>
                        <span>·</span>
                        <span>Registered: {selectedPatient.registrationTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSlipModalPatient(selectedPatient)}
                        className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAndLoginPatient(selectedPatient.id)}
                        className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                        <span>Patient view</span>
                      </button>
                    </div>
                  </div>

                  {/* Complaint */}
                  <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-800">Chief complaint:</span> {selectedPatient.chiefComplaint || selectedPatient.symptoms || 'General OPD consultation'}
                  </div>

                  {/* Subtabs Segmented Control */}
                  <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 max-w-fit">
                    {[
                      { id: 'route', label: `Diagnostic Flow & Progress (${selectedPatient.completedTests.length}/${selectedPatient.prescribedTests.length})` },
                      { id: 'prescribe', label: `Prescribe / Edit Tests` },
                      { id: 'reports', label: `Verified Reports (${patientReports.length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setWorkspaceTab(tab.id as typeof workspaceTab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          workspaceTab === tab.id
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtab 1: Prescribed tests */}
                {workspaceTab === 'prescribe' && (
                  <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-slate-900">
                        Prescribed investigations ({selectedPatient.prescribedTests.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setPatName(selectedPatient.name);
                          setPatAge(String(selectedPatient.age));
                          setPatGender(selectedPatient.gender);
                          setPatPhone(selectedPatient.contact);
                          setPatComplaint(selectedPatient.chiefComplaint || '');
                          setWalkinTestIds(selectedPatient.prescribedTests);
                          setMainViewMode('walkin');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        + Edit / Prescribe tests
                      </button>
                    </div>

                    {selectedPatient.prescribedTests.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">No diagnostic investigations prescribed yet</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Select tests to route this patient to phlebotomy, radiology, cardiology, or ultrasound bays.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPatName(selectedPatient.name);
                            setPatAge(String(selectedPatient.age));
                            setPatGender(selectedPatient.gender);
                            setPatPhone(selectedPatient.contact);
                            setPatComplaint(selectedPatient.chiefComplaint || '');
                            setMainViewMode('walkin');
                          }}
                          className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Prescribe tests now</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedPatient.prescribedTests.map(tId => {
                          const tObj = tests.find(x => x.id === tId);
                          const dept = departments.find(d => d.id === tObj?.departmentId);
                          const isDone = selectedPatient.completedTests.includes(tId);
                          return (
                            <div key={tId} className="p-3 bg-white rounded-2xl border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
                              <div>
                                <div className="font-semibold text-slate-900">{tObj?.name}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{dept?.name} · {dept?.location.room}</div>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {isDone ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtab 2: Diagnostic Flow & Progress */}
                {workspaceTab === 'route' && (
                  <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">
                          Diagnostic Investigation Flow & Live Queue Progress
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Real-time location, live bay token status, and turnaround times for doctor & assistant.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                          {selectedPatient.completedTests.length} of {selectedPatient.prescribedTests.length} Completed
                        </span>
                      </div>
                    </div>

                    {selectedPatient.prescribedTests.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">No diagnostic investigations prescribed yet</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Prescribe investigations to dispatch patient to diagnostic bays.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPatName(selectedPatient.name);
                            setPatAge(String(selectedPatient.age));
                            setPatGender(selectedPatient.gender);
                            setPatPhone(selectedPatient.contact);
                            setPatComplaint(selectedPatient.chiefComplaint || '');
                            setWalkinTestIds(selectedPatient.prescribedTests);
                            setMainViewMode('walkin');
                          }}
                          className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Prescribe investigations now</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedPatient.prescribedTests.map((tId, idx) => {
                          const test = tests.find(t => t.id === tId);
                          const dept = departments.find(d => d.id === test?.departmentId);
                          const isDone = selectedPatient.completedTests.includes(tId);
                          const isNext = selectedPatient.currentLockedDestinationTestId === tId;
                          const tokenId = selectedPatient.activeTokenIds[tId];
                          const tokenObj = queueTokens.find(t => t.id === tokenId);

                          // Live queue statistics at this department
                          const deptTokens = queueTokens.filter(
                            t => t.departmentId === dept?.id && (t.status === 'waiting' || t.status === 'in_progress') && t.patientId !== selectedPatient.id
                          );
                          const aheadCount = deptTokens.length;
                          const avgDuration = test?.averageDurationMinutes || 8;
                          const waitMins = Math.max(3, aheadCount * avgDuration);

                          return (
                            <div
                              key={tId}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-700'
                                  : isNext
                                  ? 'bg-blue-50/60 border-blue-400 ring-1 ring-blue-500/20'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-start gap-3 min-w-0">
                                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                    isDone
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : isNext
                                      ? 'bg-blue-600 text-white shadow-xs animate-pulse'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs text-slate-900">
                                        {test?.name}
                                      </span>
                                      {test?.technicalName && (
                                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                                          {test.technicalName}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800">{dept?.name}</span>
                                      <span>·</span>
                                      <span className="font-mono text-slate-700 font-bold">{dept?.location.room}</span>
                                      <span>({dept?.location.floor}, {dept?.location.wing})</span>
                                    </div>
                                    {dept?.location.directions && (
                                      <p className="text-[10px] text-slate-500 mt-1 italic">
                                        Directions: {dept.location.directions}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 text-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Completed</span>
                                    </span>
                                  ) : isNext ? (
                                    <div className="text-right">
                                      <span className="inline-flex items-center gap-1.5 text-blue-800 font-extrabold bg-blue-100 px-2.5 py-1 rounded-full border border-blue-300 text-xs shadow-2xs">
                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                        <span>Serving Now · Token {tokenObj?.tokenNumber || 'Active'}</span>
                                      </span>
                                      <span className="block text-[10px] text-blue-700 font-semibold mt-1">
                                        {aheadCount === 0 ? 'Patient at counter' : `${aheadCount} ahead · ~${waitMins}m wait`}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-full text-xs border border-slate-200">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>In Queue · Token {tokenObj?.tokenNumber || 'Queued'}</span>
                                      </span>
                                      <span className="block text-[10px] text-slate-500 mt-1">
                                        {aheadCount > 0 ? `${aheadCount} ahead · ~${waitMins}m wait` : 'Next in line'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Verified Lab Reports Summary Card */}
                    {patientReports.length > 0 ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block">
                              {patientReports.length} Verified Lab Report{patientReports.length > 1 ? 's' : ''} Ready
                            </span>
                            <span className="text-[11px] text-emerald-700 block">
                              Released with biological reference ranges & flags.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWorkspaceTab('reports')}
                          className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                        >
                          <span>Review Reports</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      selectedPatient.prescribedTests.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-slate-500 text-xs">
                          <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Diagnostics in progress at diagnostic bays. Verified findings will automatically sync here once released by technicians.</span>
                        </div>
                      )
                    )}

                    {/* Quick Consultation Disposition & Discharge Bar */}
                    <div className="pt-3 border-t border-slate-200/70 space-y-2.5">
                      <label className="text-xs font-bold text-slate-900 block">
                        Doctor & Assistant Consultation Disposition
                      </label>
                      <textarea
                        rows={2}
                        value={doctorConclusionNotes}
                        onChange={e => setDoctorConclusionNotes(e.target.value)}
                        placeholder="Document final diagnosis, medication instructions (e.g. Tab Sorbitrate 5mg SOS), and follow-up advice..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500">
                          Discharge finalizes this OPD encounter and updates records.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedPatient) return;
                            verifyAndDischargePatient(selectedPatient.id, doctorConclusionNotes);
                            setDoctorConclusionNotes('');
                          }}
                          className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Verify & Complete Consultation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 3: Lab Reports & Verification */}
                {workspaceTab === 'reports' && (
                  <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">
                          Verified diagnostic reports
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Released by laboratory technicians upon test completion.
                        </p>
                      </div>
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {patientReports.length} available
                      </span>
                    </div>

                    {patientReports.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-1">
                        <Clock3 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-900">No reports released yet</p>
                        <p className="text-[11px] text-slate-500">
                          Diagnostic investigations are currently in progress at diagnostic counters.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patientReports.map(rep => (
                          <div key={rep.id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                            <div className="flex items-center justify-between font-semibold text-slate-900 border-b border-slate-200 pb-2">
                              <span>{rep.testName} ({rep.technicalName})</span>
                              <span className="text-slate-500 font-mono text-[10px] font-normal">
                                {rep.timestamp} · {rep.roomNo}
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full text-left text-xs divide-y divide-slate-100">
                                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                  <tr>
                                    <th className="py-2 px-3">Clinical parameter</th>
                                    <th className="py-2 px-3">Observed value</th>
                                    <th className="py-2 px-3">Biological reference</th>
                                    <th className="py-2 px-3 text-right">Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {rep.metrics.map((m, mIdx) => (
                                    <tr key={mIdx}>
                                      <td className="py-2 px-3 font-semibold text-slate-900">{m.label}</td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        {m.value} {m.unit}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 text-[11px]">{m.normalRange}</td>
                                      <td className="py-2 px-3 text-right font-bold text-[11px]">
                                        {m.flag === 'normal' && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Normal</span>}
                                        {m.flag === 'high' && <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">High</span>}
                                        {m.flag === 'low' && <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Low</span>}
                                        {m.flag === 'critical' && <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Critical</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                        {/* Doctor Impression & Discharge */}
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <label className="text-xs font-bold text-slate-900 block">
                            Doctor clinical impression & discharge instructions
                          </label>
                          <textarea
                            rows={3}
                            value={doctorConclusionNotes}
                            onChange={e => setDoctorConclusionNotes(e.target.value)}
                            placeholder="Document final diagnosis, verified findings, medication plan, and follow-up advice..."
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-slate-500">
                              Discharging patient finalizes this OPD encounter.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedPatient) return;
                                verifyAndDischargePatient(selectedPatient.id, doctorConclusionNotes);
                                setDoctorConclusionNotes('');
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Verify results & discharge</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          4. REBUILT OUTPATIENT RECORDS ARCHIVE MODAL (56 PATIENTS)
      ======================================================== */}
      {showHistoricalModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">
                    Outpatient records archive
                  </h3>
                  <span className="text-xs text-blue-700 font-bold bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                    56 completed records
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified outpatient records over the past 6 months · {currentHospital.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoricalModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search Bar (Rounded Pills) */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'All (56)' },
                  { id: 'pathology', label: 'Pathology / CBC' },
                  { id: 'biochemistry', label: 'Biochemistry / FBS' },
                  { id: 'cardiology', label: 'Cardiology / ECG' },
                  { id: 'radiology', label: 'Radiology / X-Ray' },
                  { id: 'ultrasound', label: 'Ultrasound / USG' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setHistoricalCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      historicalCategoryFilter === cat.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-68">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={historicalSearch}
                  onChange={e => setHistoricalSearch(e.target.value)}
                  placeholder="Search by UHID, patient name, contact..."
                  className="w-full h-8.5 pl-8.5 pr-7 text-xs rounded-full border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
                />
                {historicalSearch && (
                  <button
                    type="button"
                    onClick={() => setHistoricalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Historical Patient List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 sm:p-4">
              {filteredHistoricalRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-xs">No historical records match your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistoricalRecords.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.uhid}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{item.name}</span>
                          <span className="text-slate-500">
                            ({item.age}Y · {item.gender})
                          </span>
                          <span className="font-mono text-slate-500">
                            {item.contact}
                          </span>
                          <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Completed
                          </span>
                        </div>

                        <p className="text-slate-700 text-xs">
                          <span className="text-slate-400 font-medium">Complaint:</span> {item.chiefComplaint}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                          <span>Investigations:</span>
                          {item.testNames.map((tName, tIdx) => (
                            <span key={tIdx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-800 font-medium">
                              {tName}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">
                          <strong className="text-slate-800 not-italic font-semibold">Doctor notes:</strong> {item.diagnosisNotes}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <span className="text-[11px] font-mono text-slate-500">
                          {item.visitDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAutofillFromHistoricalModal(item)}
                          className="h-8 px-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Autofill walk-in</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredHistoricalRecords.length} of 56 verified outpatient records</span>
              <button
                type="button"
                onClick={() => setShowHistoricalModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          5. PRINTABLE THERMAL QR SLIP MODAL
      ======================================================== */}
      {slipModalPatient && (
        <PrintableSlip
          patient={slipModalPatient}
          tests={tests}
          departments={departments}
          onClose={() => setSlipModalPatient(null)}
        />
      )}

      {/* ========================================================
          6. DIAGNOSTIC TEST 1.5s HOVER DETAIL TOOLTIP
      ======================================================== */}
      {hoveredTest && (() => {
        const hTest = tests.find(t => t.id === hoveredTest.id);
        if (!hTest) return null;
        const hDept = departments.find(d => d.id === hTest.departmentId);
        const isNearTop = hoveredTest.top < 130;
        return (
          <div
            style={{
              top: isNearTop ? `${hoveredTest.top + 64}px` : `${hoveredTest.top - 10}px`,
              left: `${hoveredTest.left}px`,
              transform: isNearTop ? 'translateX(-50%)' : 'translate(-50%, -100%)'
            }}
            className={`dp-test-tooltip ${isNearTop ? 'tip-below' : 'tip-above'}`}
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
              <span className="font-bold text-xs text-white truncate">{hTest.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold shrink-0">
                {hTest.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between gap-2 text-slate-400 text-[10px]">
                <span className="font-semibold text-slate-200 truncate">
                  {hDept?.location.room} · {hDept?.location.floor}
                </span>
                <span className="text-emerald-400 font-semibold shrink-0">~{hTest.averageDurationMinutes} mins</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {hDept?.location.building || currentHospital.shortName} · {hDept?.location.wing}
              </div>
              {hDept?.location.directions && (
                <div className="text-[9.5px] text-blue-300/90 bg-white/5 px-2 py-1 rounded-lg border border-white/10 leading-tight">
                  <span className="font-semibold text-blue-200">Route: </span>
                  {hDept.location.directions}
                </div>
              )}
              {hTest.technicalName && hTest.technicalName !== hTest.name && (
                <div className="text-[10px] text-slate-300 italic truncate leading-snug">
                  {hTest.technicalName}
                </div>
              )}
              <div className="text-[10px] text-amber-300/90 pt-0.5">
                {hTest.requiresFasting
                  ? '⚠️ Fasting required (8-10 hrs)'
                  : hTest.requiresFullBladder
                  ? '⚠️ Full bladder required'
                  : hTest.preparationNotes || 'No special fasting required'}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
