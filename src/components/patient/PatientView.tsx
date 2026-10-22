import React, { useState } from 'react';
import { 
  FileText, 
  Radio, 
  Footprints,
  X,
  Zap,
  Printer,
  Languages,
  ArrowLeft
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { ClinicalBoardingPass } from './ClinicalBoardingPass';
import { HospitalFloorRadar } from '../map/HospitalFloorRadar';
import { ClinicalReportSheet } from './ClinicalReportSheet';
import { QBieCompanion } from './QBieCompanion';
import { WhyQCareModal } from '../common/WhyQCareModal';
import { PrintableSlip } from '../common/PrintableSlip';
import { RouteStep } from '../../types';

export const PatientView: React.FC = () => {
  const {
    selectedPatient,
    currentRoutingPlan,
    clinicalReports,
    queueTokens,
    departments,
    counters,
    tests,
    language,
    setLanguage,
    callingAlert,
    dismissCallingAlert,
    canGoBack,
    navigateBack
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<'journey' | 'reports'>('journey');
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedManualTestId, setSelectedManualTestId] = useState<string | null>(null);

  if (!selectedPatient) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm font-sans">
        No patient profile active. Please sign in via the clinical portal reception gate.
      </div>
    );
  }

  // Reports belonging to this patient
  const patientReports = clinicalReports.filter(r => r.patientId === selectedPatient.id);

  // Patient tokens
  const patientTokens = queueTokens.filter(t => t.patientId === selectedPatient.id);

  // Active called or in-progress token
  const calledToken = patientTokens.find(t => t.status === 'called');
  const inProgressToken = patientTokens.find(t => t.status === 'in_progress');

  // Find next uncompleted step in the optimized route
  const upNextStep = currentRoutingPlan.smartRouteSteps.find(
    (s: RouteStep) => !selectedPatient.completedTests.includes(s.testId)
  );

  const upNextToken = upNextStep
    ? patientTokens.find(t => t.testId === upNextStep.testId)
    : undefined;

  const bloodLabWaitingCount = queueTokens.filter(
    t => t.departmentId === 'dept-pathology' && t.status === 'waiting'
  ).length;

  const allCompleted = selectedPatient.completedTests.length > 0 && 
    selectedPatient.prescribedTests.every((id: string) => selectedPatient.completedTests.includes(id));

  // Determine current active counter details if called or up next
  const activeCounterId = calledToken?.counterId || upNextStep?.recommendedCounterId;
  const activeCounter = counters.find(c => c.id === activeCounterId);
  const activeDept = departments.find(d => d.id === (calledToken?.departmentId || upNextStep?.departmentId));

  const waitingAheadCount = upNextStep
    ? queueTokens.filter(t => t.departmentId === upNextStep.departmentId && t.status === 'waiting' && t.patientId !== selectedPatient.id).length
    : 0;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Live Calling Alert Banner */}
      {callingAlert && (callingAlert.patientName === selectedPatient.name || !callingAlert.patientName) && (
        <div className="bg-teal-700 text-white p-4 rounded-2xl border border-teal-800 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-teal-200">
                Token Called Now · टोकन बुलाया गया
              </p>
              <p className="font-extrabold text-sm sm:text-base text-white">
                Please proceed to {callingAlert.roomNo} ({callingAlert.counterName})
              </p>
            </div>
          </div>
          {dismissCallingAlert && (
            <button
              onClick={dismissCallingAlert}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
      
      {/* Minimal Clean Header & Navigation (Rule 1 & Mobile-First) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canGoBack && (
            <button
              type="button"
              onClick={navigateBack}
              aria-label={language === 'hi' ? 'पिछला पृष्ठ' : 'Go back'}
              className="min-h-[42px] sm:min-h-[40px] px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 flex-1 sm:w-auto">
            <button
              onClick={() => setActiveTab('journey')}
              className={`min-h-[42px] sm:min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                activeTab === 'journey'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <Footprints className="w-4 h-4 shrink-0" />
              <span className="truncate">{language === 'hi' ? 'जांच यात्रा' : 'Diagnostic Journey'}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`min-h-[42px] sm:min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{language === 'hi' ? 'रिपोर्ट्स' : 'Diagnostic Reports'}</span>
              {patientReports.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {patientReports.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Language Toggle, Why QCare, Map, Print Slip */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="min-h-[38px] px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'hi' ? 'पर्ची QR' : 'QR Slip'}</span>
          </button>

          <button
            onClick={() => setShowWhyModal(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-teal-800 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Why QCare?</span>
          </button>

          <button
            onClick={() => setShowRadarModal(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'hi' ? 'नक्शा' : 'Map'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'journey' ? (
        <ClinicalBoardingPass
          patient={selectedPatient}
          routingPlan={currentRoutingPlan}
          upNextStep={upNextStep}
          upNextToken={upNextToken}
          calledToken={calledToken}
          inProgressToken={inProgressToken}
          allCompleted={allCompleted}
          activeCounter={activeCounter}
          activeDept={activeDept}
          waitingAheadCount={waitingAheadCount}
          bloodLabWaitingCount={bloodLabWaitingCount}
          language={language}
          tests={tests}
          departments={departments}
          counters={counters}
          queueTokens={queueTokens}
          selectedManualTestId={selectedManualTestId}
          onSelectManualTest={setSelectedManualTestId}
          onViewReports={() => setActiveTab('reports')}
          onOpenRadar={() => setShowRadarModal(true)}
          onPrintSlip={() => setIsReceiptOpen(true)}
        />
      ) : (
        <ClinicalReportSheet
          reports={patientReports}
          patientUhid={selectedPatient.uhid}
          patientName={selectedPatient.name}
          onBack={() => setActiveTab('journey')}
        />
      )}

      {/* Interactive Q-Bie AI Mascot Companion (Draggable with bounds protection & smart positioning) */}
      <QBieCompanion
        patient={selectedPatient}
        routingPlan={currentRoutingPlan}
        upNextStep={upNextStep}
        calledToken={calledToken}
        inProgressToken={inProgressToken}
        allCompleted={allCompleted}
        reports={patientReports}
        language={language}
      />

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && (
        <PrintableSlip
          patient={selectedPatient}
          tests={tests}
          departments={departments}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {/* Why Q-Care Comparison Modal */}
      <WhyQCareModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
      />

      {/* Radar Map Modal */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {language === 'hi' ? 'अस्पताल फ्लोर नेविगेशन नक्शा' : 'Hospital Floor Navigation Map'}
                </h3>
              </div>
              <button
                onClick={() => setShowRadarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <HospitalFloorRadar onClose={() => setShowRadarModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
