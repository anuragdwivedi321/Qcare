import React, { useState } from 'react';
import { 
  FileText, 
  Radio, 
  Footprints,
  X,
  Zap,
  Printer,
  Languages
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { ClinicalBoardingPass } from './ClinicalBoardingPass';
import { HospitalFloorRadar } from '../map/HospitalFloorRadar';
import { ClinicalReportSheet } from './ClinicalReportSheet';
import { HowQCareWorksGuide } from './HowQCareWorksGuide';
import { QBieCompanion } from './QBieCompanion';
import { WhyQCareModal } from '../common/WhyQCareModal';
import { PrintableReceipt } from '../common/PrintableReceipt';

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
    setLanguage
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
    s => !selectedPatient.completedTests.includes(s.testId)
  );

  const upNextToken = upNextStep
    ? patientTokens.find(t => t.testId === upNextStep.testId)
    : undefined;

  const bloodLabWaitingCount = queueTokens.filter(
    t => t.departmentId === 'dept-pathology' && t.status === 'waiting'
  ).length;

  const allCompleted = selectedPatient.completedTests.length > 0 && 
    selectedPatient.prescribedTests.every(id => selectedPatient.completedTests.includes(id));

  // Determine current active counter details if called or up next
  const activeCounterId = calledToken?.counterId || upNextStep?.recommendedCounterId;
  const activeCounter = counters.find(c => c.id === activeCounterId);
  const activeDept = departments.find(d => d.id === (calledToken?.departmentId || upNextStep?.departmentId));

  const waitingAheadCount = upNextStep
    ? queueTokens.filter(t => t.departmentId === upNextStep.departmentId && t.status === 'waiting' && t.patientId !== selectedPatient.id).length
    : 0;

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Minimal Clean Header & Navigation (Rule 1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('journey')}
            className={`py-2 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'journey'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>{language === 'hi' ? 'जांच यात्रा' : 'Diagnostic Journey'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'hi' ? 'रिपोर्ट्स' : 'Diagnostic Reports'}</span>
            {patientReports.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {patientReports.length}
              </span>
            )}
          </button>
        </div>

        {/* Language Toggle, Why QCare, Map, Print Slip */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{language === 'hi' ? 'पर्ची QR' : 'QR Slip'}</span>
          </button>

          <button
            onClick={() => setShowWhyModal(true)}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Why QCare?</span>
          </button>

          <button
            onClick={() => setShowRadarModal(true)}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">{language === 'hi' ? 'अस्पताल नक्शा' : 'Hospital Map'}</span>
          </button>
        </div>
      </div>

      {/* Visual Onboarding & Process Guide */}
      <HowQCareWorksGuide />

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
      <PrintableReceipt
        patient={selectedPatient}
        allTests={tests}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

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
