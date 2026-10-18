import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Zap, 
  Users, 
  FileCheck2,
  HeartPulse
} from 'lucide-react';

interface WhyQCareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyQCareModal: React.FC<WhyQCareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Why Choose Q-Care?
                </h2>
                <span className="text-[11px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  AI Dynamic Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                How Q-Care transforms chaotic hospital OPDs into calm, -71% faster diagnostic journeys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          
          {/* Headline Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950">
              <div className="flex items-center justify-between text-blue-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-bold bg-blue-200/60 px-2 py-0.5 rounded-full">-71% Faster</span>
              </div>
              <div className="text-2xl font-bold text-blue-950">42 Mins</div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Avg. total OPD + Lab turnaround (vs 145 mins in traditional hospitals)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold bg-emerald-200/60 px-2 py-0.5 rounded-full">Zero Congestion</span>
              </div>
              <div className="text-2xl font-bold text-emerald-950">0 Paper Slips</div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Step-locked digital boarding pass with live audio chime token calls
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-purple-950">
              <div className="flex items-center justify-between text-purple-600 mb-1">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold bg-purple-200/60 px-2 py-0.5 rounded-full">Multi-Tenant</span>
              </div>
              <div className="text-2xl font-bold text-purple-950">1-Doc to 500-Bed</div>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Scales seamlessly from a single-doctor practice to a tertiary campus
              </p>
            </div>
          </div>

          {/* Deep Side-by-Side Comparison Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Direct Comparison: Traditional Hospital Software vs Q-Care</span>
            </h3>

            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-2xs divide-y divide-slate-200">
              {/* Header row */}
              <div className="grid grid-cols-2 bg-slate-100/80 text-xs font-bold text-slate-700">
                <div className="p-3.5 border-r border-slate-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Traditional HMS (Practo / Cerner / Manual Slips)</span>
                </div>
                <div className="p-3.5 bg-blue-50/70 text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Q-Care AI Dynamic Dispatch</span>
                </div>
              </div>

              {/* Point 1: Queue Algorithm */}
              <div className="grid grid-cols-2 text-xs">
                <div className="p-3.5 border-r border-slate-200 text-slate-600 bg-rose-50/20">
                  <strong className="block text-slate-900 mb-1">❌ Blind Static Queues</strong>
                  Patient stands in a 14-person blood line for 85 minutes while the ECG room right next door sits completely empty.
                </div>
                <div className="p-3.5 bg-blue-50/30 text-blue-950 font-medium">
                  <strong className="block text-blue-900 mb-1">⚡ Dynamic Load-Balanced Dispatch</strong>
                  Patient is routed to the shortest queue first (e.g. ECG in 0 mins), then visits blood collection once its rush clears.
                </div>
              </div>

              {/* Point 2: Tokens & Slips */}
              <div className="grid grid-cols-2 text-xs">
                <div className="p-3.5 border-r border-slate-200 text-slate-600 bg-rose-50/20">
                  <strong className="block text-slate-900 mb-1">❌ Paper Slips & Misplaced Tokens</strong>
                  Paper tokens get wrinkled or lost, patients miss their number when stepping away, leading to arguments at reception.
                </div>
                <div className="p-3.5 bg-blue-50/30 text-blue-950 font-medium">
                  <strong className="block text-blue-900 mb-1">⚡ Digital Step-Locked Boarding Pass</strong>
                  Live digital boarding pass updates per step. Audio hospital chime & door screen calls notify the patient in real time.
                </div>
              </div>

              {/* Point 3: Doctor Visibility */}
              <div className="grid grid-cols-2 text-xs">
                <div className="p-3.5 border-r border-slate-200 text-slate-600 bg-rose-50/20">
                  <strong className="block text-slate-900 mb-1">❌ Doctor OPD Blackout</strong>
                  Doctor has zero idea where the patient is, whether tests were done, or why reports take 2 hours. Doctor sits idle.
                </div>
                <div className="p-3.5 bg-blue-50/30 text-blue-950 font-medium">
                  <strong className="block text-blue-900 mb-1">⚡ Automated 'Reports Ready' Sync</strong>
                  Once lab tech completes test, report syncs to doctor screen. Patient auto-pops into 'Reports Ready' queue with abnormal flags highlighted.
                </div>
              </div>

              {/* Point 4: Multi-Hospital Isolation & Scale */}
              <div className="grid grid-cols-2 text-xs">
                <div className="p-3.5 border-r border-slate-200 text-slate-600 bg-rose-50/20">
                  <strong className="block text-slate-900 mb-1">❌ Mix-up Across Clinics / Overkill for Small OPDs</strong>
                  Generic systems either mix up multi-branch patients or are too bloated for a 1-doctor clinic with attached lab desks.
                </div>
                <div className="p-3.5 bg-blue-50/30 text-blue-950 font-medium">
                  <strong className="block text-blue-900 mb-1">⚡ Strict Tenant Isolation (Single Doctor to Hospital)</strong>
                  Branch scoping guarantees 100% data separation. Works with 1 doctor family clinic just as cleanly as a 500-bed campus.
                </div>
              </div>

              {/* Point 5: Triage Urgency */}
              <div className="grid grid-cols-2 text-xs">
                <div className="p-3.5 border-r border-slate-200 text-slate-600 bg-rose-50/20">
                  <strong className="block text-slate-900 mb-1">❌ First-Come First-Served Only</strong>
                  Elderly patients and acute chest pain patients stand in the same slow line behind routine checkups.
                </div>
                <div className="p-3.5 bg-blue-50/30 text-blue-950 font-medium">
                  <strong className="block text-blue-900 mb-1">⚡ Clinical Safety Gates & Smart Triage</strong>
                  Emergency patients automatically jump to #1 position. Seniors (60+) auto-prioritized. Fasting requirements protected.
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Authenticity Badges */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 sm:p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Hospital Compliance & Security Standards
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NABH Queue Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>FHIR / HL7 Diagnostic Schema</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Zero Cross-Tenant Leakage</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Comfortaa Calming UI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            CityCare Hospital Network • Q-Care Dynamic Dispatch Engine
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98"
          >
            <span>Got it</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
