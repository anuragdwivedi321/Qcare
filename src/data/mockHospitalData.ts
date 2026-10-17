import { 
  Department, 
  DiagnosticTest, 
  Counter, 
  Doctor, 
  Patient, 
  QueueToken, 
  ClinicalReport 
} from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Hematology & Clinical Pathology',
    code: 'BLD',
    category: 'pathology',
    location: {
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room G-102 (Phlebotomy Bay)',
      coordX: 25,
      coordY: 30,
    },
    accentColor: '#EF4444', // Red
    iconName: 'Droplets',
    description: 'Blood sample collection, CBC, coagulation, and serum analysis'
  },
  {
    id: 'dept-biochem',
    name: 'Biochemistry & Metabolic Lab',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room G-106 (Metabolic Wing)',
      coordX: 35,
      coordY: 30,
    },
    accentColor: '#F59E0B', // Amber
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Liver & Renal Function profiles'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiology Diagnostic Suite',
    code: 'ECG',
    category: 'cardiology',
    location: {
      wing: 'Central Tower',
      floor: '1st Floor',
      room: 'Room 104-A (Cardiac Rhythm Lab)',
      coordX: 55,
      coordY: 60,
    },
    accentColor: '#0EA5E9', // Electric Cyan
    iconName: 'Activity',
    description: '12-lead digital ECG, Holter monitoring, stress testing'
  },
  {
    id: 'dept-radiology',
    name: 'Radiology & Digital Imaging',
    code: 'RAD',
    category: 'radiology',
    location: {
      wing: 'West Wing',
      floor: 'Basement 1',
      room: 'B1-08 (Digital X-Ray Vault)',
      coordX: 80,
      coordY: 40,
    },
    accentColor: '#8B5CF6', // Purple
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views, fluoroscopy'
  },
  {
    id: 'dept-ultrasound',
    name: 'Ultrasonography & Doppler Unit',
    code: 'USG',
    category: 'ultrasound',
    location: {
      wing: 'West Wing',
      floor: 'Ground Floor',
      room: 'Room G-215 (Sonography Suite)',
      coordX: 80,
      coordY: 75,
    },
    accentColor: '#10B981', // Emerald
    iconName: 'Radar',
    description: 'High-resolution abdominal, pelvic, and arterial Doppler USG'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Ophthalmic Diagnostics & Retina Scan',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      wing: 'East Wing',
      floor: '2nd Floor',
      room: 'Room 208 (Refraction & OCT)',
      coordX: 20,
      coordY: 80,
    },
    accentColor: '#06B6D4', // Teal
    iconName: 'Eye',
    description: 'Tonometry, slit-lamp fundus photography, OCT retinal scans'
  }
];

export const INITIAL_TESTS: DiagnosticTest[] = [
  {
    id: 'test-cbc',
    code: 'BLD-101',
    name: 'Complete Blood Count (CBC / Hemogram)',
    departmentId: 'dept-pathology',
    averageDurationMinutes: 6,
    requiresFasting: false,
    preparationNotes: 'No special dietary restriction needed. Rest 5 mins before draw.',
    standardPrice: 450
  },
  {
    id: 'test-fbs',
    code: 'BIO-201',
    name: 'Fasting Blood Sugar & HbA1c Profile',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 8,
    requiresFasting: true,
    preparationNotes: 'Mandatory 10-12 hours overnight fasting. Water intake allowed.',
    standardPrice: 650
  },
  {
    id: 'test-ecg',
    code: 'ECG-301',
    name: '12-Lead Resting Electrocardiogram (ECG)',
    departmentId: 'dept-cardio',
    averageDurationMinutes: 7,
    requiresFasting: false,
    preparationNotes: 'Wear loose clothing around chest and ankles. Relax breathing.',
    standardPrice: 500
  },
  {
    id: 'test-xray-chest',
    code: 'RAD-401',
    name: 'Chest X-Ray (PA View - Digital)',
    departmentId: 'dept-radiology',
    averageDurationMinutes: 9,
    requiresFasting: false,
    preparationNotes: 'Remove all metallic jewelry, necklaces, and wired garments.',
    standardPrice: 750
  },
  {
    id: 'test-usg-abdomen',
    code: 'USG-501',
    name: 'Whole Abdomen Ultrasound Scan',
    departmentId: 'dept-ultrasound',
    averageDurationMinutes: 14,
    requiresFasting: true,
    requiresFullBladder: true,
    preparationNotes: '4 hours fasting + Drink 1 Litre water 45 mins prior to scan (full bladder).',
    standardPrice: 1600
  },
  {
    id: 'test-oct-retina',
    code: 'EYE-601',
    name: 'Digital Retinal Fundus & OCT Scan',
    departmentId: 'dept-ophthalmology',
    averageDurationMinutes: 10,
    requiresFasting: false,
    preparationNotes: 'Pupillary dilation may cause blurred vision for 2-3 hours.',
    standardPrice: 1200
  },
  {
    id: 'test-ppbs',
    code: 'BIO-202',
    name: 'Post-Prandial Blood Sugar (PPBS)',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 7,
    requiresFasting: false,
    preparationNotes: 'Must be drawn exactly 2 hours post-meal.',
    prerequisites: ['test-fbs'],
    standardPrice: 380
  },
  {
    id: 'test-ct-contrast',
    code: 'RAD-402',
    name: 'Contrast-Enhanced Chest CT Scan',
    departmentId: 'dept-radiology',
    averageDurationMinutes: 15,
    requiresFasting: true,
    preparationNotes: 'Requires verified normal renal profile / CBC before IV contrast administration.',
    prerequisites: ['test-cbc'],
    standardPrice: 3200
  }
];

export const INITIAL_COUNTERS: Counter[] = [
  {
    id: 'counter-bld-1',
    code: 'B-01',
    name: 'Phlebotomy Bay Alpha',
    departmentId: 'dept-pathology',
    technicianName: 'Sumantha Nair (Sr. Tech)',
    status: 'active',
    currentServingTokenId: 'token-rush-bld-01',
    currentPatientId: 'patient-walkin-01',
    servedCountToday: 38,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-bld-2',
    code: 'B-02',
    name: 'Phlebotomy Bay Beta (Express)',
    departmentId: 'dept-pathology',
    technicianName: 'Ramesh Kulkarni',
    status: 'active',
    currentServingTokenId: 'token-rush-bld-02',
    currentPatientId: 'patient-walkin-02',
    servedCountToday: 29,
    averageServiceMinutes: 5.0
  },
  {
    id: 'counter-bio-1',
    code: 'M-01',
    name: 'Metabolic & Sugar Desk',
    departmentId: 'dept-biochem',
    technicianName: 'Farhana Sheikh',
    status: 'active',
    currentServingTokenId: undefined,
    currentPatientId: undefined,
    servedCountToday: 22,
    averageServiceMinutes: 7.0
  },
  {
    id: 'counter-ecg-1',
    code: 'C-01',
    name: 'ECG Station 1 (Rapid)',
    departmentId: 'dept-cardio',
    technicianName: 'Sister Mary Joseph',
    status: 'active',
    currentServingTokenId: undefined,
    currentPatientId: undefined,
    servedCountToday: 18,
    averageServiceMinutes: 6.5
  },
  {
    id: 'counter-rad-1',
    code: 'X-01',
    name: 'Radiology Bay 1',
    departmentId: 'dept-radiology',
    technicianName: 'Arun Verma (Rad Tech)',
    status: 'active',
    currentServingTokenId: undefined,
    currentPatientId: undefined,
    servedCountToday: 15,
    averageServiceMinutes: 8.0
  },
  {
    id: 'counter-usg-1',
    code: 'U-01',
    name: 'Ultrasound Scan Room A',
    departmentId: 'dept-ultrasound',
    technicianName: 'Dr. Sonali Mehta (Sonologist)',
    status: 'active',
    currentServingTokenId: undefined,
    currentPatientId: undefined,
    servedCountToday: 9,
    averageServiceMinutes: 13.0
  },
  {
    id: 'counter-eye-1',
    code: 'E-01',
    name: 'Ophthalmic Laser Room',
    departmentId: 'dept-ophthalmology',
    technicianName: 'Gaurav Sen',
    status: 'active',
    currentServingTokenId: undefined,
    currentPatientId: undefined,
    servedCountToday: 11,
    averageServiceMinutes: 9.0
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-01',
    name: 'Dr. Arvind Swaminathan',
    specialization: 'Senior Consultant Cardiologist',
    department: 'Cardiology OPD',
    roomNo: 'OPD-204',
    activePatientCount: 14
  },
  {
    id: 'doc-02',
    name: 'Dr. Priya Shenoy',
    specialization: 'Head of Internal Medicine & Diabetology',
    department: 'Internal Medicine',
    roomNo: 'OPD-108',
    activePatientCount: 22
  },
  {
    id: 'doc-03',
    name: 'Dr. Vikramaditya Rao',
    specialization: 'Lead Diagnostic Radiologist & Imaging',
    department: 'Radiology',
    roomNo: 'Rad-Lead-01',
    activePatientCount: 9
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-rajesh',
    uhid: 'QC-2026-9411',
    name: 'Rajesh Sharma',
    age: 54,
    gender: 'Male',
    contact: '+91 98201 44521',
    priority: 'standard',
    prescribedDoctorId: 'doc-01',
    prescribedDoctorName: 'Dr. Arvind Swaminathan',
    prescribedTests: ['test-cbc', 'test-ecg', 'test-xray-chest', 'test-usg-abdomen'],
    completedTests: [],
    currentTestId: undefined,
    activeTokenIds: {
      'test-cbc': 'tok-rajesh-cbc',
      'test-ecg': 'tok-rajesh-ecg',
      'test-xray-chest': 'tok-rajesh-xray',
      'test-usg-abdomen': 'tok-rajesh-usg',
    },
    status: 'checked_in',
    assignedSmartRoute: ['test-ecg', 'test-xray-chest', 'test-cbc', 'test-usg-abdomen'],
    assignedNaiveRoute: ['test-cbc', 'test-ecg', 'test-xray-chest', 'test-usg-abdomen'],
    registrationTime: '08:45 AM'
  },
  {
    id: 'pat-balbir',
    uhid: 'QC-2026-8832',
    name: 'Col. Balbir Singh (Retd)',
    age: 73,
    gender: 'Male',
    contact: '+91 94191 00213',
    priority: 'senior',
    prescribedDoctorId: 'doc-02',
    prescribedDoctorName: 'Dr. Priya Shenoy',
    prescribedTests: ['test-fbs', 'test-ecg', 'test-cbc'],
    completedTests: ['test-fbs'],
    currentTestId: 'test-ecg',
    activeTokenIds: {
      'test-fbs': 'tok-balbir-fbs',
      'test-ecg': 'tok-balbir-ecg',
      'test-cbc': 'tok-balbir-cbc',
    },
    status: 'in_test',
    assignedSmartRoute: ['test-fbs', 'test-ecg', 'test-cbc'],
    assignedNaiveRoute: ['test-fbs', 'test-cbc', 'test-ecg'],
    registrationTime: '08:15 AM'
  },
  {
    id: 'pat-ananya',
    uhid: 'QC-2026-9904',
    name: 'Ananya Deshmukh',
    age: 28,
    gender: 'Female',
    contact: '+91 97664 12890',
    priority: 'standard',
    prescribedDoctorId: 'doc-01',
    prescribedDoctorName: 'Dr. Arvind Swaminathan',
    prescribedTests: ['test-cbc', 'test-ecg'],
    completedTests: [],
    currentTestId: undefined,
    activeTokenIds: {
      'test-cbc': 'tok-ananya-cbc',
      'test-ecg': 'tok-ananya-ecg',
    },
    status: 'checked_in',
    assignedSmartRoute: ['test-ecg', 'test-cbc'],
    assignedNaiveRoute: ['test-cbc', 'test-ecg'],
    registrationTime: '09:05 AM'
  },
  {
    id: 'pat-meera',
    uhid: 'QC-2026-7719',
    name: 'Meera Kulkarni',
    age: 62,
    gender: 'Female',
    contact: '+91 98902 33411',
    priority: 'senior',
    prescribedDoctorId: 'doc-02',
    prescribedDoctorName: 'Dr. Priya Shenoy',
    prescribedTests: ['test-oct-retina', 'test-fbs'],
    completedTests: ['test-fbs', 'test-oct-retina'],
    currentTestId: undefined,
    activeTokenIds: {
      'test-fbs': 'tok-meera-fbs',
      'test-oct-retina': 'tok-meera-oct'
    },
    status: 'all_completed',
    assignedSmartRoute: ['test-fbs', 'test-oct-retina'],
    assignedNaiveRoute: ['test-fbs', 'test-oct-retina'],
    registrationTime: '07:30 AM'
  }
];

// Seed realistic queue tokens to illustrate high congestion at blood lab vs empty ECG/Xray
export const INITIAL_QUEUE_TOKENS: QueueToken[] = [
  // Blood Lab Queue (High Congestion: 14 people waiting!)
  {
    id: 'token-rush-bld-01',
    tokenNumber: 'BLD-101',
    patientId: 'patient-walkin-01',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    counterId: 'counter-bld-1',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '08:20 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'token-rush-bld-02',
    tokenNumber: 'BLD-102',
    patientId: 'patient-walkin-02',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    counterId: 'counter-bld-2',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '08:22 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'token-rush-bld-03',
    tokenNumber: 'BLD-103',
    patientId: 'patient-w3',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:25 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 5
  },
  {
    id: 'token-rush-bld-04',
    tokenNumber: 'BLD-104',
    patientId: 'patient-w4',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:26 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 10
  },
  {
    id: 'token-rush-bld-05',
    tokenNumber: 'BLD-105',
    patientId: 'patient-w5',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:28 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 15
  },
  {
    id: 'token-rush-bld-06',
    tokenNumber: 'BLD-106',
    patientId: 'patient-w6',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:30 AM',
    queuePosition: 4,
    estimatedWaitMinutes: 20
  },
  {
    id: 'token-rush-bld-07',
    tokenNumber: 'BLD-107',
    patientId: 'patient-w7',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:33 AM',
    queuePosition: 5,
    estimatedWaitMinutes: 25
  },
  {
    id: 'tok-rajesh-cbc',
    tokenNumber: 'BLD-108',
    patientId: 'pat-rajesh',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:45 AM',
    queuePosition: 6,
    estimatedWaitMinutes: 30
  },
  {
    id: 'tok-ananya-cbc',
    tokenNumber: 'BLD-109',
    patientId: 'pat-ananya',
    testId: 'test-cbc',
    departmentId: 'dept-pathology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:05 AM',
    queuePosition: 7,
    estimatedWaitMinutes: 35
  },

  // ECG Station (Completely Empty / Near-zero wait!)
  {
    id: 'tok-balbir-ecg',
    tokenNumber: 'ECG-201',
    patientId: 'pat-balbir',
    testId: 'test-ecg',
    departmentId: 'dept-cardio',
    counterId: 'counter-ecg-1',
    priority: 'senior',
    status: 'in_progress',
    issuedAt: '08:50 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-rajesh-ecg',
    tokenNumber: 'ECG-202',
    patientId: 'pat-rajesh',
    testId: 'test-ecg',
    departmentId: 'dept-cardio',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:45 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 4 // Immediate next!
  },
  {
    id: 'tok-ananya-ecg',
    tokenNumber: 'ECG-203',
    patientId: 'pat-ananya',
    testId: 'test-ecg',
    departmentId: 'dept-cardio',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:05 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 10
  },

  // Digital X-Ray (Only 1 person ahead)
  {
    id: 'tok-xray-w1',
    tokenNumber: 'RAD-301',
    patientId: 'patient-rad-w1',
    testId: 'test-xray-chest',
    departmentId: 'dept-radiology',
    counterId: 'counter-rad-1',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '08:40 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-rajesh-xray',
    tokenNumber: 'RAD-302',
    patientId: 'pat-rajesh',
    testId: 'test-xray-chest',
    departmentId: 'dept-radiology',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:45 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 5
  },

  // Ultrasound (2 ahead)
  {
    id: 'tok-usg-w1',
    tokenNumber: 'USG-401',
    patientId: 'patient-usg-w1',
    testId: 'test-usg-abdomen',
    departmentId: 'dept-ultrasound',
    counterId: 'counter-usg-1',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '08:35 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-usg-w2',
    tokenNumber: 'USG-402',
    patientId: 'patient-usg-w2',
    testId: 'test-usg-abdomen',
    departmentId: 'dept-ultrasound',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:40 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 14
  },
  {
    id: 'tok-rajesh-usg',
    tokenNumber: 'USG-403',
    patientId: 'pat-rajesh',
    testId: 'test-usg-abdomen',
    departmentId: 'dept-ultrasound',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:45 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 28
  },

  // Finished tokens for completed history
  {
    id: 'tok-balbir-fbs',
    tokenNumber: 'BIO-105',
    patientId: 'pat-balbir',
    testId: 'test-fbs',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    priority: 'senior',
    status: 'completed',
    issuedAt: '08:15 AM',
    calledAt: '08:20 AM',
    completedAt: '08:32 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-meera-fbs',
    tokenNumber: 'BIO-101',
    patientId: 'pat-meera',
    testId: 'test-fbs',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    priority: 'senior',
    status: 'completed',
    issuedAt: '07:35 AM',
    calledAt: '07:40 AM',
    completedAt: '07:52 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-meera-oct',
    tokenNumber: 'EYE-101',
    patientId: 'pat-meera',
    testId: 'test-oct-retina',
    departmentId: 'dept-ophthalmology',
    counterId: 'counter-eye-1',
    priority: 'senior',
    status: 'completed',
    issuedAt: '08:00 AM',
    calledAt: '08:05 AM',
    completedAt: '08:20 AM',
    queuePosition: 0,
    estimatedWaitMinutes: 0
  }
];

export const INITIAL_CLINICAL_REPORTS: ClinicalReport[] = [
  {
    id: 'rep-meera-fbs',
    testId: 'test-fbs',
    testName: 'Fasting Blood Sugar & HbA1c Profile',
    patientId: 'pat-meera',
    patientUhid: 'QC-2026-7719',
    patientName: 'Meera Kulkarni',
    technicianName: 'Farhana Sheikh',
    counterId: 'counter-bio-1',
    timestamp: '07:55 AM Today',
    status: 'verified_by_doctor',
    summary: 'Mild hyperglycemia detected. Elevated HbA1c indicative of borderline diabetic control.',
    metrics: [
      {
        label: 'Fasting Plasma Glucose',
        value: '138',
        unit: 'mg/dL',
        normalRange: '70 - 99 mg/dL',
        flag: 'high'
      },
      {
        label: 'Glycated Hemoglobin (HbA1c)',
        value: '6.8',
        unit: '%',
        normalRange: '< 5.7%',
        flag: 'high'
      },
      {
        label: 'Estimated Average Glucose (eAG)',
        value: '148',
        unit: 'mg/dL',
        normalRange: '< 117 mg/dL',
        flag: 'high'
      }
    ],
    doctorNotes: 'Prescribed Metformin 500mg OD post breakfast. Advised dietary consultation.',
    doctorSignature: 'Dr. Priya Shenoy, MD (Internal Med)'
  },
  {
    id: 'rep-meera-oct',
    testId: 'test-oct-retina',
    testName: 'Digital Retinal Fundus & OCT Scan',
    patientId: 'pat-meera',
    patientUhid: 'QC-2026-7719',
    patientName: 'Meera Kulkarni',
    technicianName: 'Gaurav Sen',
    counterId: 'counter-eye-1',
    timestamp: '08:25 AM Today',
    status: 'uploaded',
    summary: 'Clear macula bilaterally. No signs of proliferative diabetic retinopathy or macular edema.',
    metrics: [
      {
        label: 'Central Subfield Thickness (OD)',
        value: '242',
        unit: 'µm',
        normalRange: '230 - 270 µm',
        flag: 'normal'
      },
      {
        label: 'Central Subfield Thickness (OS)',
        value: '238',
        unit: 'µm',
        normalRange: '230 - 270 µm',
        flag: 'normal'
      },
      {
        label: 'Intraocular Pressure (Goldmann)',
        value: '15.5',
        unit: 'mmHg',
        normalRange: '10 - 21 mmHg',
        flag: 'normal'
      }
    ],
    doctorNotes: undefined,
    doctorSignature: undefined
  },
  {
    id: 'rep-balbir-fbs',
    testId: 'test-fbs',
    testName: 'Fasting Blood Sugar & HbA1c Profile',
    patientId: 'pat-balbir',
    patientUhid: 'QC-2026-8832',
    patientName: 'Col. Balbir Singh (Retd)',
    technicianName: 'Farhana Sheikh',
    counterId: 'counter-bio-1',
    timestamp: '08:35 AM Today',
    status: 'uploaded',
    summary: 'Well-controlled fasting glycemic levels. No acute ketoacidosis risk.',
    metrics: [
      {
        label: 'Fasting Blood Glucose',
        value: '104',
        unit: 'mg/dL',
        normalRange: '70 - 99 mg/dL',
        flag: 'normal'
      },
      {
        label: 'HbA1c',
        value: '5.9',
        unit: '%',
        normalRange: '< 5.7%',
        flag: 'normal'
      }
    ]
  }
];
