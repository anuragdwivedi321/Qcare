import { useEffect } from 'react';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { PatientView } from './components/patient/PatientView';
import { DoctorView } from './components/doctor/DoctorView';
import { LabView } from './components/lab/LabView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { HospitalAdminView } from './components/admin/HospitalAdminView';
import { DoctorAssistantView } from './components/assistant/DoctorAssistantView';
import { PatientKioskView } from './components/kiosk/PatientKioskView';
import { useHospitalStore } from './store/useHospitalStore';
import { Sparkles, X, ShieldCheck } from 'lucide-react';

export default function App() {
  const { 
    currentUser, 
    activeRole, 
    currentHospital,
    toastNotification, 
    dismissToast,
    loginAsPatientWithToken
  } = useHospitalStore();

  // Auto-login from real QR Code scan (?session=... or /patient/session/...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('session') || urlParams.get('token');
      let pathToken = '';
      const match = window.location.pathname.match(/\/patient\/session\/([^/?#]+)/);
      if (match && match[1]) {
        pathToken = match[1];
      }
      const activeToken = token || pathToken;
      if (activeToken) {
        loginAsPatientWithToken(activeToken);
      }
    } catch {}
  }, [loginAsPatientWithToken]);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastNotification, dismissToast]);

  // If user navigated into touch kiosk mode without staff login
  if (activeRole === 'kiosk') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
        <PatientKioskView />
      </div>
    );
  }

  // If unauthenticated, present the clean hospital portal gate
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white pt-16 sm:pt-20">
      {/* Global Real-time Live Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-slideIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Clinical Header Bar with Session & Quick Switcher */}
      <Header />

      {/* Main Dedicated Portal Views with Clean Background */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeRole === 'patient' && <PatientView />}
        {activeRole === 'doctor' && <DoctorView />}
        {(activeRole === 'lab_tech' || activeRole === 'lab_staff') && <LabView />}
        {activeRole === 'super_admin' && <SuperAdminView />}
        {activeRole === 'hospital_admin' && <HospitalAdminView />}
        {(activeRole === 'doctor_assistant' || activeRole === 'reception') && <DoctorAssistantView />}
      </main>

      {/* Clean Hospital Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
              QC
            </div>
            <span className="font-bold text-slate-900">{currentHospital.name}</span>
            <span className="text-slate-300">•</span>
            <span>Outpatient Queue & Smart Routing Hub</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Live Broadcast Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
