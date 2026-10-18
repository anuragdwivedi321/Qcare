// ==========================================
// Q-Care Multilingual Translation Dictionary
// English & Hindi (हिंदी)
// ==========================================

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  nextStepDirective: string;
  nextStepBadge: string;
  proceedImmediately: string;
  allTestsCompletedTitle: string;
  allTestsCompletedDesc: string;
  returnToDoctorAdvice: string;
  recommendedNextTest: string;
  currentQueueStatus: string;
  patientsWaitingAhead: string;
  estimatedWaitTime: string;
  approxRange: string;
  labLocation: string;
  room: string;
  floor: string;
  wing: string;
  viewRoute: string;
  hideRoute: string;
  preparationInstructions: string;
  doctorPriority: string;
  doctorPriorityUrgent: string;
  doctorPriorityEmergencyAlert: string;
  doctorPriorityPriority: string;
  doctorPriorityNormal: string;
  statusPending: string;
  statusRecommended: string;
  statusWaiting: string;
  statusInProgress: string;
  statusCompleted: string;
  statusUnavailable: string;
  emergencyProtocol: string;
  printReceipt: string;
  qrScanInstruction: string;
  kioskTitle: string;
  kioskSubtitle: string;
  kioskEnterPlaceholder: string;
  kioskCheckButton: string;
  kioskNotFound: string;
  completedTestsCount: string;
  remainingTestsCount: string;
  timeSavedMsg: string;
  askQbie: string;
  qbieOnline: string;
  mins: string;
  wait: string;
  nextStep: string;
  completed: string;
  upNext: string;
  waiting: string;
  token: string;
  estimatedWait: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    appName: 'QCare',
    appTagline: 'Hospital Diagnostic Queue Management & Smart Patient Routing',
    nextStepDirective: 'NEXT STEP',
    nextStepBadge: 'Recommended Next Destination',
    proceedImmediately: 'Token Called! Please proceed inside immediately.',
    allTestsCompletedTitle: 'All Diagnostic Tests Completed',
    allTestsCompletedDesc: 'All your prescribed clinical samples and scans have been verified.',
    returnToDoctorAdvice: 'Please return to your doctor / consultation area for your final review.',
    recommendedNextTest: 'Recommended Next Test',
    currentQueueStatus: 'Live Queue Status',
    patientsWaitingAhead: 'patients waiting ahead',
    estimatedWaitTime: 'Estimated Wait Time',
    approxRange: 'Approx.',
    labLocation: 'Lab Location',
    room: 'Room',
    floor: 'Floor',
    wing: 'Wing',
    viewRoute: 'View Indoor Map Route',
    hideRoute: 'Close Map',
    preparationInstructions: 'Preparation Instructions',
    doctorPriority: 'Doctor Priority',
    doctorPriorityUrgent: 'Urgent',
    doctorPriorityEmergencyAlert: 'Urgent: Follow hospital emergency protocol immediately.',
    doctorPriorityPriority: 'Priority Fast-Track',
    doctorPriorityNormal: 'Standard Normal',
    statusPending: 'Pending',
    statusRecommended: 'Recommended Up-Next',
    statusWaiting: 'Waiting in Queue',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed & Verified',
    statusUnavailable: 'Temporarily Unavailable',
    emergencyProtocol: 'Follow Hospital Emergency Protocol',
    printReceipt: 'Print Thermal QR Receipt',
    qrScanInstruction: 'Scan this QR to view your live diagnostic journey on your mobile device.',
    kioskTitle: 'Hospital Diagnostic Kiosk',
    kioskSubtitle: 'Enter your Patient ID, Token, or Mobile number to view your live queue position.',
    kioskEnterPlaceholder: 'Enter UHID / Token (e.g. QC-2026-9411 or RAHUL-45)',
    kioskCheckButton: 'Check Live Status',
    kioskNotFound: 'No active patient journey found with this identifier. Please verify at reception.',
    completedTestsCount: 'Completed Tests',
    remainingTestsCount: 'Remaining Tests',
    timeSavedMsg: 'Minutes Saved with Smart Routing',
    askQbie: 'Ask Q-Bie AI',
    qbieOnline: 'Online • Real-Time Queue Companion',
    mins: 'mins',
    wait: 'wait',
    nextStep: 'Next Step',
    completed: 'Completed',
    upNext: 'Up Next',
    waiting: 'Waiting',
    token: 'Your Token',
    estimatedWait: 'Estimated Wait'
  },
  hi: {
    appName: 'क्यू-केयर (QCare)',
    appTagline: 'अस्पताल जांच कतार प्रबंधन एवं स्मार्ट मरीज रूटिंग प्रणाली',
    nextStepDirective: 'अगला कदम (NEXT STEP)',
    nextStepBadge: 'सुझाया गया अगला जांच केंद्र',
    proceedImmediately: 'टोकन बुलाया गया! कृपया तुरंत अंदर जाएं।',
    allTestsCompletedTitle: 'सभी जांच सफलतापूर्वक पूर्ण हो चुकी हैं',
    allTestsCompletedDesc: 'आपके डॉक्टर द्वारा लिखी गई सभी जांचें और रिपोर्ट्स पूरी हो चुकी हैं।',
    returnToDoctorAdvice: 'कृपया अंतिम परामर्श एवं रिपोर्ट समीक्षा के लिए अपने डॉक्टर के पास वापस जाएं।',
    recommendedNextTest: 'सुझाया गया अगला टेस्ट',
    currentQueueStatus: 'लाइव कतार स्थिति',
    patientsWaitingAhead: 'मरीज आपसे आगे कतार में हैं',
    estimatedWaitTime: 'अनुमानित प्रतीक्षा समय',
    approxRange: 'लगभग',
    labLocation: 'लैब का स्थान',
    room: 'कमरा संख्या',
    floor: 'मंजिल',
    wing: 'विंग / ब्लॉक',
    viewRoute: 'रास्ता देखें (अस्पताल नक्शा)',
    hideRoute: 'नक्शा बंद करें',
    preparationInstructions: 'जांच से पहले तैयारी निर्देश',
    doctorPriority: 'डॉक्टर प्राथमिकता स्तर',
    doctorPriorityUrgent: 'अति-आवश्यक (Urgent)',
    doctorPriorityEmergencyAlert: 'अति-आवश्यक: तत्काल अस्पताल आपातकालीन प्रोटोकॉल का पालन करें।',
    doctorPriorityPriority: 'प्राथमिकता (Priority)',
    doctorPriorityNormal: 'सामान्य (Normal)',
    statusPending: 'लंबित (Pending)',
    statusRecommended: 'सुझाया गया अगला',
    statusWaiting: 'कतार में प्रतीक्षारत',
    statusInProgress: 'जांच प्रक्रिया जारी है',
    statusCompleted: 'सत्यापित एवं पूर्ण',
    statusUnavailable: 'अस्थायी रूप से अनुपलब्ध',
    emergencyProtocol: 'अस्पताल आपातकालीन प्रोटोकॉल का पालन करें',
    printReceipt: 'थर्मल क्यूआर रसीद प्रिंट करें',
    qrScanInstruction: 'अपने मोबाइल पर लाइव कतार देखने के लिए इस क्यूआर कोड को स्कैन करें।',
    kioskTitle: 'अस्पताल सेल्फ-सर्विस कियोस्क',
    kioskSubtitle: 'अपनी लाइव कतार स्थिति देखने के लिए मरीज आईडी, टोकन या मोबाइल नंबर दर्ज करें।',
    kioskEnterPlaceholder: 'मरीज आईडी या टोकन दर्ज करें (जैसे QC-2026-9411)',
    kioskCheckButton: 'लाइव स्थिति देखें',
    kioskNotFound: 'इस नंबर से कोई सक्रिय जांच नहीं मिली। कृपया स्वागत काउंटर पर संपर्क करें।',
    completedTestsCount: 'पूर्ण जांचें',
    remainingTestsCount: 'शेष जांचें',
    timeSavedMsg: 'स्मार्ट रूटिंग से बचा समय',
    askQbie: 'क्यू-बी (Q-Bie) से पूछें',
    qbieOnline: 'ऑनलाइन • लाइव अस्पताल साथी',
    mins: 'मिनट',
    wait: 'प्रतीक्षा',
    nextStep: 'अगला कदम',
    completed: 'पूर्ण',
    upNext: 'अगला',
    waiting: 'प्रतीक्षारत',
    token: 'आपका टोकन',
    estimatedWait: 'अनुमानित प्रतीक्षा'
  }
};
