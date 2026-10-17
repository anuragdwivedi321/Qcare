import { Header } from './components/common/Header';
import { PatientRouteView } from './components/patient/PatientRouteView';
import { DoctorSyncDesk } from './components/doctor/DoctorSyncDesk';
import { LabCounterCallingConsole } from './components/lab/LabCounterCallingConsole';
import { HospitalCommandCenter } from './components/admin/HospitalCommandCenter';
import { useHospitalStore } from './store/useHospitalStore';
import { HeartPulse, ShieldCheck, Cpu } from 'lucide-react';

export default function App() {
  const { activeRole } = useHospitalStore();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Sticky Top Header */}
      <Header />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeRole === 'patient' && <PatientRouteView />}
        {activeRole === 'doctor' && <DoctorSyncDesk />}
        {activeRole === 'lab_tech' && <LabCounterCallingConsole />}
        {activeRole === 'command_center' && <HospitalCommandCenter />}
      </main>

      {/* Clean Hospital Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">Q-Care Diagnostic Sync</span>
            <span>•</span>
            <span>Multi-Queue Real-time Routing Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-teal-700 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              Dynamic Shortest Estimated Wait Algorithm (DSWTF)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ABDM & Clinical Sync Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
