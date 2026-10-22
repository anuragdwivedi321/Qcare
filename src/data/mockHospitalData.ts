import {
  Hospital,
  Department,
  DiagnosticTest,
  Counter,
  Patient,
  QueueToken,
  ClinicalReport
} from '../types';

export const DEFAULT_HOSPITAL: Hospital = {
  id: 'H001',
  name: 'Max Super Speciality Hospital, Saket',
  code: 'MAX-01',
  shortName: 'Max Saket',
  tagline: 'Tertiary Care & Smart Diagnostic Network',
  address: '1-2, Press Enclave Marg, Saket, New Delhi, Delhi 110017',
  city: 'New Delhi',
  locality: 'Saket',
  contactNumber: '+91 11 2651 5050',
  doctorName: 'Dr. Ananya Sen',
  doctorRoom: 'Chamber 204',
  doctorAvatar: '/doctors/doctor_female_1.jpg',
  doctorGender: 'Female',
  helpdeskPhone: '+91 11 2651 5050',
  officialWebsite: 'https://www.maxhealthcare.in/hospital-network/max-super-speciality-hospital-saket',
  opdTimings: 'Mon – Sat: 08:30 AM – 04:30 PM',
  aliases: ['H001', 'MAX-01', 'MAX01', 'MAX', 'MAX SAKET'],
  departmentsList: ['Cardiology', 'Oncology', 'Neurology', 'Neurosurgery', 'Nephrology', 'General Surgery', 'Radiology and Imaging', 'Ophthalmology', 'Pulmonology', 'ENT'],
  diagnosticServicesList: ['CT', 'Ultrasound', 'Mammography', 'EEG', 'Laboratory services', 'OCT Retina', 'Spirometry', 'Audiometry'],
  dataStatus: 'public_reference_partial'
};

export const REGISTERED_HOSPITALS: Hospital[] = [
  DEFAULT_HOSPITAL,
  {
    id: 'H002',
    name: 'Indraprastha Apollo Hospitals',
    code: 'APOLLO-02',
    shortName: 'Apollo Delhi',
    tagline: 'Advanced Outpatient Flow & Multi-Speciality Diagnostics',
    address: 'NH-19, Jasola Vihar, New Delhi, Delhi 110020',
    city: 'New Delhi',
    locality: 'Jasola Vihar',
    contactNumber: '+91 11 7179 1090',
    doctorName: 'Dr. Rajesh Verma',
    doctorRoom: 'Chamber 101',
    doctorAvatar: '/doctors/doctor_male_1.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 7179 1090',
    officialWebsite: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-delhi',
    opdTimings: 'Mon – Sat: 08:00 AM – 05:00 PM',
    aliases: ['H002', 'APOLLO-02', 'APOLLO02', 'APOLLO', 'APOLLO DELHI', 'SARITA VIHAR'],
    departmentsList: ['Cardiology', 'Oncology', 'Orthopaedics', 'Neurology', 'Nephrology', 'Internal Medicine', 'ENT', 'Ophthalmology', 'Laboratory and Cardio Diagnostics'],
    diagnosticServicesList: ['Laboratory sample collection', 'Cardio diagnostics', 'Apollo Health Check', 'OCT Retina', 'EEG'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H003',
    name: 'All India Institute of Medical Sciences, New Delhi',
    code: 'AIIMS-03',
    shortName: 'AIIMS Delhi',
    tagline: 'Premier Autonomous Institute & Smart Referral Queue',
    address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi, Delhi 110029',
    city: 'New Delhi',
    locality: 'Ansari Nagar East',
    contactNumber: '+91 11 2658 8500',
    doctorName: 'Dr. R. K. Singhal',
    doctorRoom: 'Chamber 12',
    doctorAvatar: '/doctors/doctor_male_2.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 2658 8500',
    officialWebsite: 'https://www.aiims.edu/',
    opdTimings: 'Mon – Sat: 08:00 AM – 01:00 PM',
    aliases: ['H003', 'AIIMS-03', 'AIIMS03', 'AIIMS', 'AIIMS DELHI'],
    departmentsList: ['Cardiology', 'Neurology', 'Nephrology', 'Oncology', 'Radiodiagnosis', 'Pathology', 'Microbiology', 'Pulmonology', 'Ophthalmology'],
    diagnosticServicesList: ['Laboratory services', 'Radiology and imaging', 'Neurophysiology', 'Pulmonary function'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H004',
    name: 'Vardhman Mahavir Medical College and Safdarjung Hospital',
    code: 'SAFDARJUNG-04',
    shortName: 'Safdarjung Hospital',
    tagline: 'Central OPD & Multi-Laboratory Diagnostic Services',
    address: 'Ansari Nagar West, New Delhi, Delhi 110029',
    city: 'New Delhi',
    locality: 'Ansari Nagar West',
    contactNumber: '+91 11 2616 5060',
    doctorName: 'Dr. Sunita Batra',
    doctorRoom: 'Room 108',
    doctorAvatar: '/doctors/doctor_female_2.jpg',
    doctorGender: 'Female',
    helpdeskPhone: '+91 11 2616 5060',
    officialWebsite: 'https://vmmc-sjh.mohfw.gov.in/',
    opdTimings: 'Mon – Sat: 08:30 AM – 01:30 PM',
    aliases: ['H004', 'SAFDARJUNG-04', 'SAFDARJUNG04', 'SAFDARJUNG', 'SJH', 'SJH-04', 'VMMC'],
    departmentsList: ['Pathology', 'Microbiology', 'Biochemistry', 'Haematology', 'Radiodiagnosis', 'Cardiology', 'Neurology'],
    diagnosticServicesList: ['Central sample collection centre', 'Clinical pathology', 'Haematology', 'Molecular pathology', 'Blood bank and transfusion medicine', 'Emergency laboratory', 'Burns and plastic surgery laboratory', 'Gynaecology laboratory', 'HLA laboratory', 'Immunology laboratory', 'Histopathology and cytopathology'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H005',
    name: 'Atal Bihari Vajpayee Institute of Medical Sciences and Dr. Ram Manohar Lohia Hospital',
    code: 'RML-05',
    shortName: 'RML Hospital',
    tagline: 'Comprehensive Central Government Clinical & Diagnostic Wing',
    address: 'Baba Kharak Singh Road, New Delhi, Delhi 110001',
    city: 'New Delhi',
    locality: 'Connaught Place area',
    contactNumber: '+91 11 2336 5525',
    doctorName: 'Dr. Arvind Joshi',
    doctorRoom: 'Room 205',
    doctorAvatar: '/doctors/doctor_male_1.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 2336 5525',
    officialWebsite: 'https://rmlh.mohfw.gov.in/',
    opdTimings: 'Mon – Sat: 08:30 AM – 01:00 PM',
    aliases: ['H005', 'RML-05', 'RML05', 'RML', 'ABVIMS', 'RML HOSPITAL'],
    departmentsList: ['General Medicine', 'General Surgery', 'Orthopaedics', 'Obstetrics and Gynaecology', 'Paediatrics', 'Radiodiagnosis', 'Laboratory services'],
    diagnosticServicesList: ['Laboratory services', 'CT and ultrasound', 'X-ray', 'DEXA Scan'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H006',
    name: 'Lok Nayak Hospital',
    code: 'LNJP-06',
    shortName: 'LNJP Hospital',
    tagline: 'Tertiary Diagnostic & Trauma Care Flow Center',
    address: 'Jawaharlal Nehru Marg, Delhi Gate, New Delhi, Delhi 110002',
    city: 'New Delhi',
    locality: 'Delhi Gate',
    contactNumber: '+91 11 2323 3000',
    doctorName: 'Dr. Meenakshi Sundaram',
    doctorRoom: 'Chamber 14',
    doctorAvatar: '/doctors/doctor_female_1.jpg',
    doctorGender: 'Female',
    helpdeskPhone: '+91 11 2323 3000',
    officialWebsite: 'https://lnjp.delhi.gov.in/',
    opdTimings: 'Mon – Sat: 08:00 AM – 02:00 PM',
    aliases: ['H006', 'LNJP-06', 'LNJP06', 'LNJP', 'LOK NAYAK', 'MAMC'],
    departmentsList: ['Pathology', 'Biochemistry', 'Microbiology', 'Paediatrics', 'Orthopaedics', 'General Surgery', 'Radiology'],
    diagnosticServicesList: ['Ultrasound and Doppler scheduling', 'CT scheduling', 'MRI scheduling', 'Emergency radiology', 'Trauma X-ray', 'OPD chest and abdomen X-ray'],
    dataStatus: 'public_reference_partial'
  }
];

export function findHospitalByQuery(query: string): Hospital | undefined {
  const clean = query.trim();
  if (!clean) return undefined;
  const normalizedCode = clean.toUpperCase().replace(/\s+/g, '-');
  const codeNoHyphen = clean.toUpperCase().replace(/[\s-]+/g, '');
  const rawLower = clean.toLowerCase();

  return REGISTERED_HOSPITALS.find(h => {
    // 1. Direct or normalized ID match (e.g. H001, H002, hosp-max-01)
    if (h.id.toUpperCase() === clean.toUpperCase() || h.id.toUpperCase().replace(/[\s-]+/g, '') === codeNoHyphen) {
      return true;
    }

    // 2. Direct code match (e.g. MAX-01, Max 01, MAX01)
    const hCodeNorm = h.code.toUpperCase().replace(/\s+/g, '-');
    const hCodeNoHyphen = h.code.toUpperCase().replace(/[\s-]+/g, '');
    if (hCodeNorm === normalizedCode || hCodeNoHyphen === codeNoHyphen) {
      return true;
    }

    // 3. Aliases match (e.g. 'H001', 'MAX-01', 'MAX01', 'MAX', 'MAX SAKET')
    if (h.aliases && h.aliases.some(alias => {
      const aNorm = alias.toUpperCase().replace(/\s+/g, '-');
      const aNoHyphen = alias.toUpperCase().replace(/[\s-]+/g, '');
      return aNorm === normalizedCode || aNoHyphen === codeNoHyphen || aNorm === clean.toUpperCase() || aNoHyphen === clean.toUpperCase();
    })) {
      return true;
    }

    // 4. Name, shortName, locality matching
    if (h.name.toLowerCase().includes(rawLower) || h.shortName.toLowerCase().includes(rawLower)) {
      return true;
    }
    if (h.locality && h.locality.toLowerCase().includes(rawLower)) {
      return true;
    }

    return false;
  });
}

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Phlebotomy & Blood Lab',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'Diagnostic Plaza',
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room 12',
      directions: 'From Dr. Ananya Sen (Chamber 204), take Central Tower lift to Ground Floor, cross lobby to Diagnostic Plaza Room 12.'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, ESR, routine microscopy',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Biochemistry & Metabolic Lab',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Diagnostic Plaza',
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room 14',
      directions: 'Ground Floor Diagnostic Plaza, past Phlebotomy, at the end of the east clinical corridor.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiology Diagnostic Suite',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'Central Tower',
      wing: 'Heart Institute Wing',
      floor: '1st Floor',
      room: 'Room 104',
      directions: 'Take Central Tower Elevator to 1st Floor, follow blue floor line to Heart Institute Suite 104.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Radiology & Digital Imaging',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'West Wing',
      wing: 'Imaging Block',
      floor: 'Basement 1',
      room: 'Room B-08',
      directions: 'Take West Wing service stairs or Lift 3 down to Basement 1, follow orange signage to Digital Radiography console.'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Ultrasonography & Doppler Suite',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'Diagnostic Plaza',
      wing: 'Sonography Wing',
      floor: 'Ground Floor',
      room: 'Room 10',
      directions: 'Ground Floor Diagnostic Plaza, adjacent to patient hydration lounge near Room 10.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Ophthalmology & Retina Diagnostic Clinic',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'Central Tower',
      wing: 'Speciality OPD Wing',
      floor: '2nd Floor',
      room: 'Room 218',
      directions: 'Take Central Lift to 2nd Floor, turn right past OPD Pharmacy to Eye & Retina Clinic.'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), fundus photography, automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'ENT & Audiology Testing Suite',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'Central Tower',
      wing: 'Speech & Hearing Bay',
      floor: '1st Floor',
      room: 'Room 120',
      directions: '1st Floor Central Tower, enter Soundproof Audiometry Corridor, Room 120.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'Neuro-Electrophysiology Lab',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'Central Tower',
      wing: 'Neurosciences Suite',
      floor: '2nd Floor',
      room: 'Room 224',
      directions: '2nd Floor Central Tower, follow purple indicator to Neuro-Electrophysiology Lab 224.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS), evoked potentials',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'Pulmonary Function & Spirometry Lab',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'West Wing',
      wing: 'Respiratory OPD',
      floor: 'Ground Floor',
      room: 'Room 116',
      directions: 'Ground Floor West Wing, entrance adjacent to Chest & Allergy Clinic.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops, bronchodilator reversibility testing',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'Bone Mineral Densitometry (DEXA) Suite',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'West Wing',
      wing: 'Bone & Joint Imaging',
      floor: 'Basement 1',
      room: 'Room B-22',
      directions: 'Basement 1 West Wing, adjacent to MRI/CT reception desk, Room B-22.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'Dual-energy X-ray absorptiometry (DEXA) for osteopenia/osteoporosis diagnosis',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

// ==========================================
// MULTI-TENANT HOSPITAL DEPARTMENT MAPPINGS
// Authentic room layouts and turn-by-turn navigation paths per hospital
// ==========================================

const SAFDARJUNG_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Central Blood Collection Centre',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'New OPD Complex',
      wing: 'Gate 2 Corridor',
      floor: 'Ground Floor',
      room: 'Room 18',
      directions: 'From Dr. Sunita Batra (Room 108), turn right along the ground floor corridor towards Gate 2 exit; Room 18 is the Central Blood Collection Bay on your right.'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, routine hematology',
    activeMachines: 3,
    totalMachines: 3,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Clinical Biochemistry Division',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Main Hospital Block',
      wing: 'Clinical Biochemistry Wing',
      floor: '1st Floor',
      room: 'Room 114',
      directions: 'Take connecting ramp from New OPD to Main Hospital Block, take stairs/lift to 1st Floor; Room 114 is directly ahead.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiology Non-Invasive Bay',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'Super Speciality Block (SSB)',
      wing: 'Cardiology Non-Invasive Wing',
      floor: '2nd Floor',
      room: 'Room 208',
      directions: 'Enter SSB glass entrance, take elevator to 2nd Floor, follow red heart signs to ECG Room 208.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Central Digital Radiodiagnosis',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'Emergency & Trauma Block',
      wing: 'Trauma Radiodiagnosis Wing',
      floor: 'Ground Floor',
      room: 'Room 06',
      directions: 'Ground Floor Trauma Block corridor, Room 06 opposite the triage observation unit.'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Ultrasound & Doppler Wing',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'New OPD Complex',
      wing: 'Antenatal & Doppler Diagnostic Wing',
      floor: '1st Floor',
      room: 'Room 112',
      directions: 'Take central escalator or lift in New OPD to 1st Floor; Room 112 is adjacent to Antenatal Clinic.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Retina & Glaucoma Diagnostics',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'Eye OPD Wing',
      wing: 'Eye Diagnostics Section',
      floor: '2nd Floor',
      room: 'Room 210',
      directions: 'Take Eye OPD stairs to 2nd Floor, Room 210 for automated OCT & slit-lamp examination.'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'Audiology & Speech Pathology',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'ENT Block',
      wing: 'Speech & Hearing Bay',
      floor: '3rd Floor',
      room: 'Room 304',
      directions: 'ENT Block 3rd Floor, enter sound-damped corridor to Audiometry Room 304.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'Neurophysiology Lab',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'Super Speciality Block (SSB)',
      wing: 'Neuro Diagnostic Wing',
      floor: '3rd Floor',
      room: 'Room 316',
      directions: 'Take SSB central lift to 3rd Floor, follow purple signs to Digital EEG Room 316.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS)',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'Respiratory Medicine & Spirometry',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'New OPD Complex',
      wing: 'Chest OPD Wing',
      floor: 'Ground Floor',
      room: 'Room 104',
      directions: 'Ground Floor New OPD Complex, two doors down from Dr. Sunita Batra, Room 104.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'Bone Mineral Densitometry (DEXA)',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'Trauma & Orthopaedics Block',
      wing: 'Bone Health Unit',
      floor: 'Basement 1',
      room: 'Room B-06',
      directions: 'Take elevator down to Basement 1 in Orthopaedics Block, Room B-06 on the left.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'DEXA bone density scan for spine & hip',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

const AIIMS_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Central Sample Collection Wing',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'Rajkumari Amrit Kaur (RAK) OPD Block',
      wing: 'Central Blood Collection Hall',
      floor: 'Ground Floor',
      room: 'Room 15',
      directions: 'From Dr. R. K. Singhal (Chamber 12), follow green floor line directly to Central Blood Collection Hall (Room 15).'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, routine hematology',
    activeMachines: 4,
    totalMachines: 4,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Department of Biochemistry',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Main Hospital Building',
      wing: 'Clinical Biochemistry Wing',
      floor: 'Ground Floor',
      room: 'Room 22',
      directions: 'Walk through covered corridor from RAK Block to Main Hospital Ground Floor, Room 22 on the left.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiology Non-Invasive Lab',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'RAK OPD Block',
      wing: 'Cardiology OPD',
      floor: '1st Floor',
      room: 'Room 108',
      directions: 'Take RAK Block central staircase to 1st Floor, Room 108 near ECG testing counters.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Department of Radiodiagnosis',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'Dr. B.R. Ambedkar Block',
      wing: 'Imaging Wing',
      floor: 'Ground Floor',
      room: 'Room 05',
      directions: 'Ground Floor Ambedkar Block, follow blue signage to Digital Chest Radiography counter (Room 05).'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Ultrasound Diagnostic Section',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'RAK OPD Block',
      wing: 'Ultrasound Diagnostic Section',
      floor: 'Ground Floor',
      room: 'Room 19',
      directions: 'Ground Floor RAK Block, past the pharmacy counter to Room 19 waiting area.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Dr. R.P. Centre for Ophthalmic Sciences',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'Dr. R.P. Centre for Ophthalmic Sciences',
      wing: 'Retina & Diagnostics Wing',
      floor: '1st Floor',
      room: 'Room 102',
      directions: 'Cross to Dr. R.P. Centre, take lift to 1st Floor, Room 102 (OCT & Refraction Lab).'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'Speech & Hearing Clinic',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'RAK OPD Block',
      wing: 'Speech & Hearing Clinic',
      floor: '2nd Floor',
      room: 'Room 212',
      directions: '2nd Floor RAK Block, soundproof audiometry testing chamber Room 212.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'Clinical Neurophysiology Lab',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'Neuro-Sciences Centre (NSC)',
      wing: 'Clinical Neurophysiology Lab',
      floor: '1st Floor',
      room: 'Room 118',
      directions: 'NSC Building 1st Floor, enter Neurophysiology corridor to EEG Console 118.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS)',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'Pulmonary Function Laboratory',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'Department of Pulmonary Medicine',
      wing: 'Spirometry & Allergy Lab',
      floor: 'Ground Floor',
      room: 'Room 14',
      directions: 'Ground Floor Pulmonary Wing, follow orange line to Spirometry Cabin Room 14.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'Bone Densitometry Unit',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'Dr. B.R. Ambedkar Block',
      wing: 'Bone Densitometry Unit',
      floor: 'Basement 1',
      room: 'Room B-02',
      directions: 'Take lift to Basement 1 Ambedkar Block, DEXA Bone Mineral Scan Unit Room B-02.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'DEXA bone density scan for spine & hip',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

const APOLLO_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Central Phlebotomy Lounge',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'Apollo Health Check Block',
      wing: 'Central Phlebotomy Hall',
      floor: 'Ground Floor',
      room: 'Room 102',
      directions: 'From Dr. Rajesh Verma (Chamber 101), take connecting ramp to Apollo Health Check Block Ground Floor, Room 102.'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, routine hematology',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Metabolic & Endocrine Lab',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Apollo Health Check Block',
      wing: 'Metabolic & Endocrine Lab',
      floor: 'Ground Floor',
      room: 'Room 106',
      directions: 'Ground Floor Health Check Block, proceed past Phlebotomy to Room 106 counter.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Non-Invasive Cardiology Suite',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'Apollo Heart Centre',
      wing: 'Non-Invasive Cardiology',
      floor: '2nd Floor',
      room: 'Room 204',
      directions: 'Take Heart Centre glass lift to 2nd Floor, follow red cardiac icon to Room 204.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Digital Radiography Console',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'Diagnostic Radiology Tower',
      wing: 'Digital Imaging Bay',
      floor: 'Basement 1',
      room: 'Room B-04',
      directions: 'Take Tower Elevator down to Basement 1, follow yellow pathway to X-Ray Bay B-04.'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Diagnostic Ultrasound Suite',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'Apollo Health Check Block',
      wing: 'Ultrasound Suite',
      floor: 'Ground Floor',
      room: 'Room 110',
      directions: 'Ground Floor Health Check Block, opposite Patient Helpdesk Lounge, Room 110.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Apollo Retina & OCT Centre',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'Main Hospital Block',
      wing: 'Apollo Eye Clinic',
      floor: '2nd Floor',
      room: 'Room 308',
      directions: 'Take Lift A to 2nd Floor, walk straight to Apollo Retina & OCT Centre 308.'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'ENT & Cochlear Implant Bay',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'Main Hospital Block',
      wing: 'ENT & Cochlear Implant Bay',
      floor: '1st Floor',
      room: 'Room 215',
      directions: '1st Floor Main Block, corridor next to Audiology booth 215.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'Neurosciences EEG & Sleep Lab',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'Neurosciences Tower',
      wing: 'EEG & Sleep Lab',
      floor: '2nd Floor',
      room: 'Room 220',
      directions: '2nd Floor Neurosciences Tower, entrance through Room 220.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS)',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'Pulmonary Function Clinic',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'Main Hospital Block',
      wing: 'Chest & Sleep Diagnostics',
      floor: 'Ground Floor',
      room: 'Room 112',
      directions: 'Ground Floor Main Block, near West Gate exit, Room 112.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'Bone Mineral Density Bay',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'Diagnostic Radiology Tower',
      wing: 'Bone Mineral Density Bay',
      floor: 'Basement 1',
      room: 'Room B-12',
      directions: 'Basement 1 Radiology Tower, corridor next to X-Ray console, Room B-12.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'DEXA bone density scan for spine & hip',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

const RML_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Central Phlebotomy Hall',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'New Multi-Storey OPD Building',
      wing: 'Central Phlebotomy Hall',
      floor: 'Ground Floor',
      room: 'Counter 6',
      directions: 'Ground Floor OPD Hall near entrance, Counter 6 for blood draw and token verification.'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, routine hematology',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Central Biochemistry Lab',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Central Laboratory Block',
      wing: 'Biochemistry Division',
      floor: '1st Floor',
      room: 'Room 110',
      directions: '1st Floor Central Lab Block, follow blue corridor strip to Room 110.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiology Diagnostic Bay',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'Cardiology & CTVS Wing',
      wing: 'Cardiac OPD',
      floor: '2nd Floor',
      room: 'Room 214',
      directions: '2nd Floor Cardiology Wing, follow red heart line to ECG Room 214.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Digital Radiography Unit',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'Radiodiagnosis Block',
      wing: 'Digital Radiography Unit',
      floor: 'Ground Floor',
      room: 'Room 08',
      directions: 'Ground Floor Radiodiagnosis Block, entrance opposite Casualty, Room 08.'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Diagnostic Ultrasound Suite',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'New OPD Building',
      wing: 'Diagnostic Ultrasound Suite',
      floor: '1st Floor',
      room: 'Room 118',
      directions: '1st Floor OPD Building, next to gynaecological consultation rooms, Room 118.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Ophthalmic Diagnostics Clinic',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'New OPD Building',
      wing: 'Ophthalmic Diagnostics',
      floor: '3rd Floor',
      room: 'Room 302',
      directions: '3rd Floor OPD Building, follow eye icon to OCT Retina Clinic 302.'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'Audiology Cabin',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'New OPD Building',
      wing: 'Audiology Cabin',
      floor: '2nd Floor',
      room: 'Room 222',
      directions: '2nd Floor OPD Building, opposite Dr. Arvind Joshi (Room 205), Room 222.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'Neurology Department Console',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'Super Speciality Wing',
      wing: 'Neurology Department',
      floor: '4th Floor',
      room: 'Room 408',
      directions: 'Take Super Speciality lift to 4th Floor, Room 408 EEG & EMG console.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS)',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'Spirometry Cabin',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'New OPD Building',
      wing: 'Chest & TB Clinic',
      floor: 'Ground Floor',
      room: 'Room 102',
      directions: 'Ground Floor OPD Building, near South Gate, Spirometry Cabin 102.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'DEXA Bone Suite',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'Radiodiagnosis Block',
      wing: 'DEXA Bone Suite',
      floor: 'Basement 1',
      room: 'Room B-04',
      directions: 'Basement 1 Radiodiagnosis Block, next to MRI reception, Room B-04.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'DEXA bone density scan for spine & hip',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

const LNJP_DEPARTMENTS: Department[] = [
  {
    id: 'dept-pathology',
    name: 'Main Blood Sample Bay',
    code: 'BLD',
    category: 'pathology',
    location: {
      building: 'Main OPD Block',
      wing: 'Central Phlebotomy Bay',
      floor: 'Ground Floor',
      room: 'Room 11',
      directions: 'From Dr. Meenakshi Sundaram (Chamber 14), walk to Ground Floor Main OPD, near registration counter, Room 11 Blood Sample Bay.'
    },
    accentColor: '#DC2626',
    iconName: 'Droplet',
    description: 'Blood sample collection, CBC, routine hematology',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-biochem',
    name: 'Central Biochemistry Section',
    code: 'BIO',
    category: 'biochemistry',
    location: {
      building: 'Central Clinical Lab Building',
      wing: 'Biochemistry Section',
      floor: '1st Floor',
      room: 'Room 105',
      directions: '1st Floor Clinical Lab Building, follow green corridor to Room 105.'
    },
    accentColor: '#D97706',
    iconName: 'FlaskConical',
    description: 'Fasting glucose, HbA1c, Lipid profile, renal panel',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-cardio',
    name: 'Cardiac Diagnostic Bay',
    code: 'ECG',
    category: 'cardiology',
    location: {
      building: 'Main OPD Block',
      wing: 'Cardiac Diagnostic Bay',
      floor: '1st Floor',
      room: 'Room 122',
      directions: '1st Floor OPD Block, same corridor as Dr. Meenakshi Sundaram, Room 122.'
    },
    accentColor: '#2563EB',
    iconName: 'Activity',
    description: '12-lead digital ECG, cardiac rhythm evaluation',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-radiology',
    name: 'Digital X-Ray Section',
    code: 'RAD',
    category: 'radiology',
    location: {
      building: 'Trauma & Emergency Imaging Block',
      wing: 'Digital X-Ray Section',
      floor: 'Ground Floor',
      room: 'Room 04',
      directions: 'Ground Floor Imaging Block, follow yellow signage to Room 04.'
    },
    accentColor: '#7C3AED',
    iconName: 'ScanLine',
    description: 'Low-dose digital X-Ray PA/Lateral views',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ultrasound',
    name: 'Sonography Wing',
    code: 'USG',
    category: 'ultrasound',
    location: {
      building: 'Main OPD Block',
      wing: 'Sonography Wing',
      floor: 'Ground Floor',
      room: 'Room 16',
      directions: 'Ground Floor OPD Block, adjacent to Gynae OPD, Room 16.'
    },
    accentColor: '#0D9488',
    iconName: 'Waves',
    description: 'Whole abdomen, pelvic, and Doppler sonography',
    activeMachines: 2,
    totalMachines: 2,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ophthalmology',
    name: 'Guru Nanak Eye Centre (GNEC)',
    code: 'EYE',
    category: 'ophthalmology',
    location: {
      building: 'Guru Nanak Eye Centre (GNEC)',
      wing: 'Retina & OCT Diagnostic Unit',
      floor: '1st Floor',
      room: 'Room 110',
      directions: 'Walk to Guru Nanak Eye Centre adjacent block, 1st Floor, Room 110.'
    },
    accentColor: '#0284C7',
    iconName: 'Eye',
    description: 'Optical Coherence Tomography (OCT), automated visual refraction',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-ent',
    name: 'Audiology & Speech Clinic',
    code: 'ENT',
    category: 'ent',
    location: {
      building: 'Main OPD Block',
      wing: 'Audiology & Speech Clinic',
      floor: '2nd Floor',
      room: 'Room 208',
      directions: '2nd Floor Main OPD, Soundproof Testing Chamber 208.'
    },
    accentColor: '#D97706',
    iconName: 'Volume2',
    description: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-neurology',
    name: 'LNJP / G.B. Pant Neuro Lab',
    code: 'NEU',
    category: 'neurology',
    location: {
      building: 'G.B. Pant / LNJP Neuro Wing',
      wing: 'Neurophysiology Lab',
      floor: '2nd Floor',
      room: 'Room 215',
      directions: '2nd Floor Neuro Wing, enter Room 215 for digital EEG and nerve studies.'
    },
    accentColor: '#9333EA',
    iconName: 'Brain',
    description: '32-channel digital EEG, nerve conduction studies (NCS)',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-pulmonary',
    name: 'PFT Suite',
    code: 'PFT',
    category: 'pulmonary',
    location: {
      building: 'Chest Clinic & Respiratory Unit',
      wing: 'PFT Suite',
      floor: 'Ground Floor',
      room: 'Room 108',
      directions: 'Ground Floor Chest Clinic, Room 108 Spirometry and allergen testing.'
    },
    accentColor: '#059669',
    iconName: 'Wind',
    description: 'Digital spirometry, flow-volume loops',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  },
  {
    id: 'dept-orthopedics',
    name: 'Bone Mineral Densitometry',
    code: 'DEX',
    category: 'orthopedics',
    location: {
      building: 'Orthopaedic Centre',
      wing: 'Bone Mineral Densitometry',
      floor: 'Basement 1',
      room: 'Room B-02',
      directions: 'Basement 1 Orthopaedic Centre, Room B-02 adjacent to Plaster Room.'
    },
    accentColor: '#E11D48',
    iconName: 'Bone',
    description: 'DEXA bone density scan for spine & hip',
    activeMachines: 1,
    totalMachines: 1,
    availabilityStatus: 'available'
  }
];

export const HOSPITAL_DEPARTMENTS_MAP: Record<string, Department[]> = {
  'MAX-01': INITIAL_DEPARTMENTS,
  'H001': INITIAL_DEPARTMENTS,
  'APOLLO-02': APOLLO_DEPARTMENTS,
  'H002': APOLLO_DEPARTMENTS,
  'AIIMS-03': AIIMS_DEPARTMENTS,
  'H003': AIIMS_DEPARTMENTS,
  'SAFDARJUNG-04': SAFDARJUNG_DEPARTMENTS,
  'H004': SAFDARJUNG_DEPARTMENTS,
  'RML-05': RML_DEPARTMENTS,
  'H005': RML_DEPARTMENTS,
  'LNJP-06': LNJP_DEPARTMENTS,
  'H006': LNJP_DEPARTMENTS
};

export function getDepartmentsForHospital(query: string): Department[] {
  if (!query) return INITIAL_DEPARTMENTS;
  const hosp = findHospitalByQuery(query);
  const code = (hosp ? hosp.code : query).toUpperCase().replace(/\s+/g, '-');
  if (HOSPITAL_DEPARTMENTS_MAP[code]) {
    return HOSPITAL_DEPARTMENTS_MAP[code];
  }
  const id = (hosp ? hosp.id : query).toUpperCase();
  if (HOSPITAL_DEPARTMENTS_MAP[id]) {
    return HOSPITAL_DEPARTMENTS_MAP[id];
  }
  return INITIAL_DEPARTMENTS;
}

export const INITIAL_TESTS: DiagnosticTest[] = [
  {
    id: 'test-fbs',
    code: 'BIO-101',
    name: 'Blood Sugar Fasting',
    technicalName: 'Fasting Blood Glucose (FBG)',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 6,
    requiresFasting: true,
    requiresFullBladder: false,
    preparationNotes: 'Empty stomach / Fasting sample (8-10 hours overnight fasting required)',
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Fasting Blood Glucose', unit: 'mg/dL', normalRange: '70 - 99', defaultValue: '142' }
    ]
  },
  {
    id: 'test-cbc',
    code: 'BLD-101',
    name: 'Blood Collection',
    technicalName: 'Complete Blood Count (CBC)',
    departmentId: 'dept-pathology',
    averageDurationMinutes: 6,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'No fasting required. Stay relaxed and hydrated.',
    standardPrice: 350,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '13.0 - 17.0', defaultValue: '13.5' },
      { label: 'Total Leukocyte Count (TLC)', unit: '/uL', normalRange: '4000 - 11000', defaultValue: '7600' },
      { label: 'Platelet Count', unit: '/uL', normalRange: '150000 - 450000', defaultValue: '240000' }
    ]
  },
  {
    id: 'test-ecg',
    code: 'ECG-201',
    name: 'Heart Rhythm',
    technicalName: '12-Lead Electrocardiogram (ECG)',
    departmentId: 'dept-cardio',
    averageDurationMinutes: 5,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Rest quietly 5 minutes before electrode placement. Remove metal objects.',
    standardPrice: 300,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Heart Rate', unit: 'bpm', normalRange: '60 - 100', defaultValue: '76' },
      { label: 'Rhythm', unit: '', normalRange: 'Sinus Rhythm', defaultValue: 'Sinus Rhythm' },
      { label: 'PR Interval', unit: 'ms', normalRange: '120 - 200', defaultValue: '160' }
    ]
  },
  {
    id: 'test-xray-chest',
    code: 'RAD-301',
    name: 'Chest X-Ray',
    technicalName: 'Digital Chest Radiography (PA View)',
    departmentId: 'dept-radiology',
    averageDurationMinutes: 7,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Remove neck chains, metallic ornaments, and shirts with metal buttons.',
    standardPrice: 450,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Lung Fields', unit: '', normalRange: 'Clear', defaultValue: 'Clear, normal bronchovascular markings' },
      { label: 'Cardiothoracic Ratio', unit: '', normalRange: '< 0.50', defaultValue: '0.46 (Normal)' }
    ]
  },
  {
    id: 'test-usg-abdomen',
    code: 'USG-401',
    name: 'Abdominal Ultrasound',
    technicalName: 'Whole Abdomen Ultrasonography',
    departmentId: 'dept-ultrasound',
    averageDurationMinutes: 12,
    requiresFasting: false,
    requiresFullBladder: true,
    preparationNotes: 'Drink 3-4 glasses of water 45 minutes prior. Hold urine for full bladder visualization.',
    standardPrice: 900,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Liver & Gallbladder', unit: '', normalRange: 'Normal', defaultValue: 'Normal liver size and parenchymal echo' },
      { label: 'Urinary Bladder', unit: '', normalRange: 'Distended', defaultValue: 'Well distended, normal wall thickness' }
    ]
  },
  {
    id: 'test-lipid',
    code: 'BIO-102',
    name: 'Lipid Profile',
    technicalName: 'Fasting Lipid Panel',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 7,
    requiresFasting: true,
    requiresFullBladder: false,
    preparationNotes: '10-12 hours overnight fasting mandatory. Only water allowed.',
    standardPrice: 650,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '< 200', defaultValue: '185' },
      { label: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', defaultValue: '140' },
      { label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '> 40', defaultValue: '44' },
      { label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '< 100', defaultValue: '112' }
    ]
  },
  {
    id: 'test-ppbs',
    code: 'BIO-103',
    name: 'Blood Sugar Post-Meal (PP)',
    technicalName: 'Post-Prandial Blood Glucose (PPBS)',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 6,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Blood sample exactly 2 hours after starting breakfast/meal.',
    prerequisites: ['test-fbs'],
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Post-Meal Glucose (2hr)', unit: 'mg/dL', normalRange: '< 140', defaultValue: '138' }
    ]
  },
  {
    id: 'test-urine',
    code: 'BLD-102',
    name: 'Urine Routine',
    technicalName: 'Urinalysis & Physical-Chemical Microscopy',
    departmentId: 'dept-pathology',
    averageDurationMinutes: 5,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Clean-catch midstream urine sample in sterile container provided.',
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Urine Protein', unit: '', normalRange: 'Nil', defaultValue: 'Nil' },
      { label: 'Urine Sugar', unit: '', normalRange: 'Nil', defaultValue: 'Nil' },
      { label: 'Pus Cells', unit: '/hpf', normalRange: '0 - 5', defaultValue: '1 - 2' }
    ]
  },
  {
    id: 'test-retina-oct',
    code: 'EYE-101',
    name: 'Retinal OCT Scan',
    technicalName: 'Optical Coherence Tomography (Macula & Optic Disc)',
    departmentId: 'dept-ophthalmology',
    averageDurationMinutes: 10,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Pupil dilation drops may be administered 20 mins prior. Temporary blurred vision expected.',
    standardPrice: 1200,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Central Foveal Thickness', unit: 'µm', normalRange: '220 - 280', defaultValue: '242' },
      { label: 'Retinal Nerve Fiber Layer (RNFL)', unit: 'µm', normalRange: '85 - 110', defaultValue: '98' }
    ]
  },
  {
    id: 'test-visual-acuity',
    code: 'EYE-102',
    name: 'Visual Acuity & Refraction',
    technicalName: 'Automated Computerised Refraction & Slit Lamp Exam',
    departmentId: 'dept-ophthalmology',
    averageDurationMinutes: 8,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Bring existing prescription spectacle glasses or contact lenses for baseline comparison.',
    standardPrice: 350,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Right Eye (OD) Visual Acuity', unit: '', normalRange: '6/6', defaultValue: '6/9' },
      { label: 'Left Eye (OS) Visual Acuity', unit: '', normalRange: '6/6', defaultValue: '6/6' },
      { label: 'Intraocular Pressure (IOP)', unit: 'mmHg', normalRange: '10 - 21', defaultValue: '15' }
    ]
  },
  {
    id: 'test-audiometry',
    code: 'ENT-101',
    name: 'Pure Tone Audiometry',
    technicalName: 'Pure Tone Audiometry (PTA) Air & Bone Conduction',
    departmentId: 'dept-ent',
    averageDurationMinutes: 15,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Conducted in a soundproof booth. Avoid loud headphone or factory noise exposure 14 hours prior.',
    standardPrice: 650,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Right Ear PTA Average', unit: 'dB HL', normalRange: '< 25 (Normal)', defaultValue: '18 dB HL' },
      { label: 'Left Ear PTA Average', unit: 'dB HL', normalRange: '< 25 (Normal)', defaultValue: '22 dB HL' }
    ]
  },
  {
    id: 'test-tympanometry',
    code: 'ENT-102',
    name: 'Tympanometry & Reflex',
    technicalName: 'Acoustic Immittance & Middle Ear Compliance',
    departmentId: 'dept-ent',
    averageDurationMinutes: 7,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Ear canals should be clear of wax impaction. Test is quick and painless.',
    standardPrice: 450,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Tympanogram Peak Pressure', unit: 'daPa', normalRange: '-100 to +50', defaultValue: '-15 daPa (Type A)' },
      { label: 'Middle Ear Compliance', unit: 'mL', normalRange: '0.3 - 1.6', defaultValue: '0.8 mL' }
    ]
  },
  {
    id: 'test-eeg',
    code: 'NEU-101',
    name: '32-Channel Digital EEG',
    technicalName: '32-Channel Electroencephalogram with Hyperventilation',
    departmentId: 'dept-neurology',
    averageDurationMinutes: 25,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Wash scalp and hair with plain shampoo; do not apply hair oil, gels, condition sprays, or styling agents.',
    standardPrice: 1800,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Background Alpha Rhythm', unit: 'Hz', normalRange: '8.5 - 12.0', defaultValue: '10.2 Hz, symmetric' },
      { label: 'Epileptiform Discharges', unit: '', normalRange: 'Absent', defaultValue: 'Absent / Normal awake tracing' }
    ]
  },
  {
    id: 'test-ncs',
    code: 'NEU-102',
    name: 'Nerve Conduction Study',
    technicalName: 'Electrophysiological Nerve Conduction Velocity (NCV/NCS)',
    departmentId: 'dept-neurology',
    averageDurationMinutes: 20,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Keep limbs warm. Do not apply hand or body lotions/moisturizers on the test day.',
    standardPrice: 1600,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Median Motor NCV', unit: 'm/s', normalRange: '> 50.0', defaultValue: '54.5 m/s' },
      { label: 'Peroneal Motor NCV', unit: 'm/s', normalRange: '> 42.0', defaultValue: '46.2 m/s' }
    ]
  },
  {
    id: 'test-spirometry',
    code: 'PFT-101',
    name: 'Pulmonary Function Test',
    technicalName: 'Pre & Post Bronchodilator Digital Spirometry',
    departmentId: 'dept-pulmonary',
    averageDurationMinutes: 12,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Do not smoke for 1 hour prior. Avoid large heavy meals 2 hours prior. Wear loose comfortable clothing.',
    standardPrice: 850,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'FEV1 / FVC Ratio', unit: '%', normalRange: '> 75%', defaultValue: '81.4%' },
      { label: 'FEV1 % Predicted', unit: '%', normalRange: '> 80%', defaultValue: '89.2%' }
    ]
  },
  {
    id: 'test-dexa',
    code: 'DEX-101',
    name: 'DEXA Bone Mineral Scan',
    technicalName: 'Dual-Energy X-Ray Absorptiometry (Spine & Hip)',
    departmentId: 'dept-orthopedics',
    averageDurationMinutes: 15,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Do not take calcium supplements or multivitamins on test morning. Avoid clothing with metallic zippers or hooks.',
    standardPrice: 1500,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Lumbar Spine (L1-L4) T-Score', unit: '', normalRange: '> -1.0 (Normal)', defaultValue: '-0.8 (Normal BMD)' },
      { label: 'Femoral Neck T-Score', unit: '', normalRange: '> -1.0 (Normal)', defaultValue: '-1.1 (Mild Osteopenia)' }
    ]
  }
];

export const INITIAL_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-1',
    code: 'B-01',
    name: 'Phlebotomy Bay Alpha',
    departmentId: 'dept-pathology',
    roomNo: 'Room 12',
    technicianName: 'Sunil Kumar',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-bio-1',
    code: 'BIO-01',
    name: 'Biochemistry Counter 1',
    departmentId: 'dept-biochem',
    roomNo: 'Room 14',
    technicianName: 'Anita Sen',
    status: 'active',
    servedCountToday: 6,
    averageServiceMinutes: 6.0
  },
  {
    id: 'counter-ecg-1',
    code: 'E-01',
    name: 'Cardiac Rhythm Station 1',
    departmentId: 'dept-cardio',
    roomNo: 'Room 04',
    technicianName: 'Vikram Das',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 5.0
  },
  {
    id: 'counter-xray-1',
    code: 'X-01',
    name: 'Digital X-Ray Console',
    departmentId: 'dept-radiology',
    roomNo: 'Room 08',
    technicianName: 'Pooja Mehta',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 7.0
  },
  {
    id: 'counter-usg-1',
    code: 'U-01',
    name: 'Sonography Console A',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 10',
    technicianName: 'Dr. K. Sharma',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-eye-1',
    code: 'EYE-01',
    name: 'Ophthalmic OCT & Refraction Desk',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 18',
    technicianName: 'Dr. Vivek Nair',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 9.0
  },
  {
    id: 'counter-ent-1',
    code: 'ENT-01',
    name: 'Audiometric Soundproof Chamber',
    departmentId: 'dept-ent',
    roomNo: 'Room 20',
    technicianName: 'Megha Sen',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 11.0
  },
  {
    id: 'counter-neu-1',
    code: 'NEU-01',
    name: 'Neuro-Physiology Console 1',
    departmentId: 'dept-neurology',
    roomNo: 'Room 24',
    technicianName: 'Rajeev Pillai',
    status: 'active',
    servedCountToday: 2,
    averageServiceMinutes: 22.0
  },
  {
    id: 'counter-pft-1',
    code: 'PFT-01',
    name: 'Pulmonary Spirometry Cabin',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 16',
    technicianName: 'Farhan Ali',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 10.0
  },
  {
    id: 'counter-dex-1',
    code: 'DEX-01',
    name: 'DEXA Bone Densitometer A',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room 22',
    technicianName: 'Geeta Kumari',
    status: 'active',
    servedCountToday: 2,
    averageServiceMinutes: 15.0
  }
];

const SAFDARJUNG_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-sjh',
    code: 'B-01',
    name: 'Central Phlebotomy Counter 1',
    departmentId: 'dept-pathology',
    roomNo: 'Room 18',
    technicianName: 'Ramesh Chander (Lab Asst)',
    status: 'active',
    servedCountToday: 12,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-bio-sjh',
    code: 'BIO-01',
    name: 'Biochemistry Intake Desk',
    departmentId: 'dept-biochem',
    roomNo: 'Room 114',
    technicianName: 'Dr. Neeraj Bansal',
    status: 'active',
    servedCountToday: 9,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-ecg-sjh',
    code: 'E-01',
    name: 'SSB Cardiac Rhythm Station',
    departmentId: 'dept-cardio',
    roomNo: 'Room 208',
    technicianName: 'Praveen Yadav',
    status: 'active',
    servedCountToday: 7,
    averageServiceMinutes: 5.0
  },
  {
    id: 'counter-xray-sjh',
    code: 'X-01',
    name: 'Trauma Digital Radiography Console',
    departmentId: 'dept-radiology',
    roomNo: 'Room 06',
    technicianName: 'Sunita Meena (Radiographer)',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 6.5
  },
  {
    id: 'counter-usg-sjh',
    code: 'U-01',
    name: 'Doppler Sonography Suite 1',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 112',
    technicianName: 'Dr. Aarti Rawat',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-eye-sjh',
    code: 'EYE-01',
    name: 'Eye OPD OCT Desk',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 210',
    technicianName: 'Satish Tyagi',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 8.5
  },
  {
    id: 'counter-ent-sjh',
    code: 'ENT-01',
    name: 'Audiology Sound Cabin',
    departmentId: 'dept-ent',
    roomNo: 'Room 304',
    technicianName: 'Kavita Mathur',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-neu-sjh',
    code: 'NEU-01',
    name: 'SSB Neuro Console',
    departmentId: 'dept-neurology',
    roomNo: 'Room 316',
    technicianName: 'Deepak Sharma',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 20.0
  },
  {
    id: 'counter-pft-sjh',
    code: 'PFT-01',
    name: 'Respiratory Spirometry Unit',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 104',
    technicianName: 'Mohd. Imran',
    status: 'active',
    servedCountToday: 6,
    averageServiceMinutes: 9.0
  },
  {
    id: 'counter-dex-sjh',
    code: 'DEX-01',
    name: 'Trauma Bone Mineral Unit',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room B-06',
    technicianName: 'Vikas Kumar',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 14.0
  }
];

const AIIMS_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-aiims',
    code: 'B-01',
    name: 'RAK Central Sample Collection Counter',
    departmentId: 'dept-pathology',
    roomNo: 'Room 15',
    technicianName: 'Harish Rawat',
    status: 'active',
    servedCountToday: 15,
    averageServiceMinutes: 4.0
  },
  {
    id: 'counter-bio-aiims',
    code: 'BIO-01',
    name: 'Biochemistry Routine Counter',
    departmentId: 'dept-biochem',
    roomNo: 'Room 22',
    technicianName: 'Dr. S. K. Jain',
    status: 'active',
    servedCountToday: 11,
    averageServiceMinutes: 5.0
  },
  {
    id: 'counter-ecg-aiims',
    code: 'E-01',
    name: 'Cardiology OPD ECG Bay',
    departmentId: 'dept-cardio',
    roomNo: 'Room 108',
    technicianName: 'Manoj Tiwari',
    status: 'active',
    servedCountToday: 9,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-xray-aiims',
    code: 'X-01',
    name: 'Ambedkar Block Digital X-Ray',
    departmentId: 'dept-radiology',
    roomNo: 'Room 05',
    technicianName: 'Preeti Deshmukh',
    status: 'active',
    servedCountToday: 10,
    averageServiceMinutes: 6.0
  },
  {
    id: 'counter-usg-aiims',
    code: 'U-01',
    name: 'RAK Sonography Console',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 19',
    technicianName: 'Dr. R. K. Goel',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 11.0
  },
  {
    id: 'counter-eye-aiims',
    code: 'EYE-01',
    name: 'RPC Retina Imaging Station',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 102',
    technicianName: 'Alok Pandey',
    status: 'active',
    servedCountToday: 6,
    averageServiceMinutes: 8.0
  },
  {
    id: 'counter-ent-aiims',
    code: 'ENT-01',
    name: 'Speech & Hearing Audiometry Booth',
    departmentId: 'dept-ent',
    roomNo: 'Room 212',
    technicianName: 'Vandana Rao',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 13.0
  },
  {
    id: 'counter-neu-aiims',
    code: 'NEU-01',
    name: 'NSC Neurophysiology Console',
    departmentId: 'dept-neurology',
    roomNo: 'Room 118',
    technicianName: 'Subhashish Roy',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 20.0
  },
  {
    id: 'counter-pft-aiims',
    code: 'PFT-01',
    name: 'Pulmonary Function Station',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 14',
    technicianName: 'Devender Negi',
    status: 'active',
    servedCountToday: 7,
    averageServiceMinutes: 9.5
  },
  {
    id: 'counter-dex-aiims',
    code: 'DEX-01',
    name: 'Ambedkar Block Bone Density Unit',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room B-02',
    technicianName: 'Sanjay Mishra',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 15.0
  }
];

const APOLLO_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-apollo',
    code: 'B-01',
    name: 'Health Check Phlebotomy Lounge',
    departmentId: 'dept-pathology',
    roomNo: 'Room 102',
    technicianName: 'Amit Saxena',
    status: 'active',
    servedCountToday: 10,
    averageServiceMinutes: 5.0
  },
  {
    id: 'counter-bio-apollo',
    code: 'BIO-01',
    name: 'Metabolic Testing Desk',
    departmentId: 'dept-biochem',
    roomNo: 'Room 106',
    technicianName: 'Dr. Malini Roy',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-ecg-apollo',
    code: 'E-01',
    name: 'Heart Centre ECG Console',
    departmentId: 'dept-cardio',
    roomNo: 'Room 204',
    technicianName: 'Tanvi Kapoor',
    status: 'active',
    servedCountToday: 7,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-xray-apollo',
    code: 'X-01',
    name: 'Radiology Tower X-Ray Console',
    departmentId: 'dept-radiology',
    roomNo: 'Room B-04',
    technicianName: 'Rohan Vashist',
    status: 'active',
    servedCountToday: 6,
    averageServiceMinutes: 6.5
  },
  {
    id: 'counter-usg-apollo',
    code: 'U-01',
    name: 'Health Check Sonography A',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 110',
    technicianName: 'Dr. Sameer Khan',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-eye-apollo',
    code: 'EYE-01',
    name: 'Apollo Retina OCT Desk',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 308',
    technicianName: 'Nisha Gupta',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 8.5
  },
  {
    id: 'counter-ent-apollo',
    code: 'ENT-01',
    name: 'Cochlear & Audiology Chamber',
    departmentId: 'dept-ent',
    roomNo: 'Room 215',
    technicianName: 'Aditya Sen',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-neu-apollo',
    code: 'NEU-01',
    name: 'Neurosciences EEG Cabin',
    departmentId: 'dept-neurology',
    roomNo: 'Room 220',
    technicianName: 'Dr. Priya Nambiar',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 20.0
  },
  {
    id: 'counter-pft-apollo',
    code: 'PFT-01',
    name: 'Pulmonary Diagnostic Console',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 112',
    technicianName: 'Karan Mehra',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 9.0
  },
  {
    id: 'counter-dex-apollo',
    code: 'DEX-01',
    name: 'Bone Mineral Density Console',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room B-12',
    technicianName: 'Suresh Raina',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 14.0
  }
];

const RML_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-rml',
    code: 'B-01',
    name: 'OPD Blood Collection Counter 6',
    departmentId: 'dept-pathology',
    roomNo: 'Counter 6',
    technicianName: 'Babulal Meena',
    status: 'active',
    servedCountToday: 14,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-bio-rml',
    code: 'BIO-01',
    name: 'Central Lab Biochemistry Counter',
    departmentId: 'dept-biochem',
    roomNo: 'Room 110',
    technicianName: 'Dr. Vandana Garg',
    status: 'active',
    servedCountToday: 9,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-ecg-rml',
    code: 'E-01',
    name: 'Cardiology CTVS Rhythm Desk',
    departmentId: 'dept-cardio',
    roomNo: 'Room 214',
    technicianName: 'Gaurav Bisht',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-xray-rml',
    code: 'X-01',
    name: 'Radiodiagnosis Block Console',
    departmentId: 'dept-radiology',
    roomNo: 'Room 08',
    technicianName: 'Pankaj Srivastava',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 6.0
  },
  {
    id: 'counter-usg-rml',
    code: 'U-01',
    name: 'OPD Sonography Console 1',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 118',
    technicianName: 'Dr. Nidhi Batra',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-eye-rml',
    code: 'EYE-01',
    name: 'Ophthalmic OCT & Refraction Clinic',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 302',
    technicianName: 'Ashok Sehgal',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 8.5
  },
  {
    id: 'counter-ent-rml',
    code: 'ENT-01',
    name: 'Audiology Cabin Console',
    departmentId: 'dept-ent',
    roomNo: 'Room 222',
    technicianName: 'Archana Singh',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 11.5
  },
  {
    id: 'counter-neu-rml',
    code: 'NEU-01',
    name: 'Neurology Department Console',
    departmentId: 'dept-neurology',
    roomNo: 'Room 408',
    technicianName: 'Vinod Nair',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 21.0
  },
  {
    id: 'counter-pft-rml',
    code: 'PFT-01',
    name: 'Spirometry Cabin Desk',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 102',
    technicianName: 'Lalit Joshi',
    status: 'active',
    servedCountToday: 5,
    averageServiceMinutes: 9.5
  },
  {
    id: 'counter-dex-rml',
    code: 'DEX-01',
    name: 'Radiodiagnosis Bone Suite Console',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room B-04',
    technicianName: 'Dharmendra Kumar',
    status: 'active',
    servedCountToday: 2,
    averageServiceMinutes: 14.5
  }
];

const LNJP_COUNTERS: Counter[] = [
  {
    id: 'counter-phleb-lnjp',
    code: 'B-01',
    name: 'Main OPD Blood Sample Bay',
    departmentId: 'dept-pathology',
    roomNo: 'Room 11',
    technicianName: 'Mohan Lal',
    status: 'active',
    servedCountToday: 13,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-bio-lnjp',
    code: 'BIO-01',
    name: 'Clinical Lab Biochemistry Desk',
    departmentId: 'dept-biochem',
    roomNo: 'Room 105',
    technicianName: 'Dr. Renu Aggarwal',
    status: 'active',
    servedCountToday: 9,
    averageServiceMinutes: 5.5
  },
  {
    id: 'counter-ecg-lnjp',
    code: 'E-01',
    name: 'Cardiac OPD Rhythm Station',
    departmentId: 'dept-cardio',
    roomNo: 'Room 122',
    technicianName: 'Tarun Verma',
    status: 'active',
    servedCountToday: 7,
    averageServiceMinutes: 4.5
  },
  {
    id: 'counter-xray-lnjp',
    code: 'X-01',
    name: 'Trauma & Emergency X-Ray Unit',
    departmentId: 'dept-radiology',
    roomNo: 'Room 04',
    technicianName: 'Jagdish Prasad',
    status: 'active',
    servedCountToday: 8,
    averageServiceMinutes: 6.0
  },
  {
    id: 'counter-usg-lnjp',
    code: 'U-01',
    name: 'Main OPD Sonography Console',
    departmentId: 'dept-ultrasound',
    roomNo: 'Room 16',
    technicianName: 'Dr. Seema Malik',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-eye-lnjp',
    code: 'EYE-01',
    name: 'Guru Nanak Eye Centre Desk',
    departmentId: 'dept-ophthalmology',
    roomNo: 'Room 110',
    technicianName: 'Mahesh Chand',
    status: 'active',
    servedCountToday: 4,
    averageServiceMinutes: 8.5
  },
  {
    id: 'counter-ent-lnjp',
    code: 'ENT-01',
    name: 'Speech & Hearing Audiometry Desk',
    departmentId: 'dept-ent',
    roomNo: 'Room 208',
    technicianName: 'Sunita Chauhan',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 12.0
  },
  {
    id: 'counter-neu-lnjp',
    code: 'NEU-01',
    name: 'G.B. Pant / LNJP Neuro Lab Console',
    departmentId: 'dept-neurology',
    roomNo: 'Room 215',
    technicianName: 'Pradeep Jha',
    status: 'active',
    servedCountToday: 3,
    averageServiceMinutes: 21.0
  },
  {
    id: 'counter-pft-lnjp',
    code: 'PFT-01',
    name: 'Chest Clinic Spirometry Unit',
    departmentId: 'dept-pulmonary',
    roomNo: 'Room 108',
    technicianName: 'Rameshwar Dayal',
    status: 'active',
    servedCountToday: 6,
    averageServiceMinutes: 9.0
  },
  {
    id: 'counter-dex-lnjp',
    code: 'DEX-01',
    name: 'Orthopaedic Centre BMD Unit',
    departmentId: 'dept-orthopedics',
    roomNo: 'Room B-02',
    technicianName: 'Devraj Singh',
    status: 'active',
    servedCountToday: 2,
    averageServiceMinutes: 15.0
  }
];

export const HOSPITAL_COUNTERS_MAP: Record<string, Counter[]> = {
  'MAX-01': INITIAL_COUNTERS,
  'H001': INITIAL_COUNTERS,
  'APOLLO-02': APOLLO_COUNTERS,
  'H002': APOLLO_COUNTERS,
  'AIIMS-03': AIIMS_COUNTERS,
  'H003': AIIMS_COUNTERS,
  'SAFDARJUNG-04': SAFDARJUNG_COUNTERS,
  'H004': SAFDARJUNG_COUNTERS,
  'RML-05': RML_COUNTERS,
  'H005': RML_COUNTERS,
  'LNJP-06': LNJP_COUNTERS,
  'H006': LNJP_COUNTERS
};

export function getCountersForHospital(query: string): Counter[] {
  if (!query) return INITIAL_COUNTERS;
  const hosp = findHospitalByQuery(query);
  const code = (hosp ? hosp.code : query).toUpperCase().replace(/\s+/g, '-');
  if (HOSPITAL_COUNTERS_MAP[code]) {
    return HOSPITAL_COUNTERS_MAP[code];
  }
  const id = (hosp ? hosp.id : query).toUpperCase();
  if (HOSPITAL_COUNTERS_MAP[id]) {
    return HOSPITAL_COUNTERS_MAP[id];
  }
  return INITIAL_COUNTERS;
}

/**
 * Clean slate default arrays (Zero fake data initially)
 */
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_QUEUE_TOKENS: QueueToken[] = [];
export const INITIAL_CLINICAL_REPORTS: ClinicalReport[] = [];

/**
 * Pre-configured realistic Demo Scenario (Rameshwar Sharma)
 */
export const DEMO_SCENARIO_PATIENT: Patient = {
  id: 'pat-rameshwar',
  uhid: 'QC-2026-9411',
  qrSessionId: 'QC-9411',
  name: 'Rameshwar Sharma',
  age: 52,
  gender: 'Male',
  contact: '+91 98765 43210',
  priority: 'standard',
  doctorPriority: 'normal',
  prescribedDoctorId: 'doc-verma',
  prescribedDoctorName: 'Dr. Rajesh Verma',
  prescribedDoctorRoom: 'Room 104',
  chiefComplaint: 'Chest pain, tightness and uneasiness since yesterday',
  symptoms: 'Substernal chest tightness radiating to left shoulder',
  prescribedTests: ['test-fbs', 'test-cbc', 'test-ecg', 'test-xray-chest'],
  prescribedTestItems: [
    {
      testId: 'test-fbs',
      testName: 'Blood Sugar Fasting',
      technicalName: 'Fasting Blood Glucose (FBG)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Empty stomach / Fasting sample required'
    },
    {
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      technicalName: '12-Lead Electrocardiogram (ECG)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Rest quietly 5 minutes prior'
    },
    {
      testId: 'test-xray-chest',
      testName: 'Chest X-Ray',
      technicalName: 'Digital Chest Radiography (PA View)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Remove metallic ornaments and neck chains'
    },
    {
      testId: 'test-cbc',
      testName: 'Blood Collection',
      technicalName: 'Complete Blood Count (CBC)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Routine venous blood sample'
    }
  ],
  completedTests: [],
  currentLockedDestinationTestId: 'test-fbs', // Stability lock at Room 14
  activeTokenIds: {
    'test-fbs': 'tok-demo-rameshwar-fbs',
    'test-ecg': 'tok-demo-rameshwar-ecg',
    'test-xray-chest': 'tok-demo-rameshwar-xray',
    'test-cbc': 'tok-demo-rameshwar-cbc'
  },
  status: 'in_transit',
  assignedSmartRoute: ['test-fbs', 'test-ecg', 'test-xray-chest', 'test-cbc'],
  registrationTime: '09:15 AM',
  opdTokenNumber: 'OPD-14',
  doctorReviewStatus: 'awaiting_lab_reports',
  notes: 'Fasting status confirmed by patient attendants.'
};

export const DEMO_SCENARIO_TOKENS: QueueToken[] = [
  // Rameshwar's official tokens at all prescribed bays
  {
    id: 'tok-demo-rameshwar-fbs',
    tokenNumber: 'B-14',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 10
  },
  {
    id: 'tok-demo-rameshwar-ecg',
    tokenNumber: 'E-04',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-ecg',
    testName: 'Heart Rhythm',
    departmentId: 'dept-cardio',
    counterId: 'counter-ecg-1',
    roomNo: 'Room 04',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 5
  },
  {
    id: 'tok-demo-rameshwar-xray',
    tokenNumber: 'X-02',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-xray-chest',
    testName: 'Chest X-Ray',
    departmentId: 'dept-radiology',
    counterId: 'counter-rad-1',
    roomNo: 'Room 08',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-demo-rameshwar-cbc',
    tokenNumber: 'BLD-24',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 4,
    estimatedWaitMinutes: 18
  },
  // Background tokens ahead of Rameshwar at Room 14 (Biochemistry)
  {
    id: 'tok-bg-bio-1',
    tokenNumber: 'B-12',
    patientId: 'pat-bg-1',
    patientName: 'Sita Devi',
    patientUhid: 'QC-2026-9408',
    patientAge: 48,
    patientGender: 'Female',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '09:02 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 2
  },
  {
    id: 'tok-bg-bio-2',
    tokenNumber: 'B-13',
    patientId: 'pat-bg-2',
    patientName: 'Vinod Kumar',
    patientUhid: 'QC-2026-9409',
    patientAge: 61,
    patientGender: 'Male',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'senior',
    status: 'waiting',
    issuedAt: '09:08 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 6
  },
  // Background token at Room 04 (Cardiology / ECG)
  {
    id: 'tok-bg-ecg-1',
    tokenNumber: 'E-03',
    patientId: 'pat-bg-3',
    patientName: 'Anita Singh',
    patientUhid: 'QC-2026-9410',
    patientAge: 35,
    patientGender: 'Female',
    testId: 'test-ecg',
    testName: 'Heart Rhythm',
    departmentId: 'dept-cardio',
    counterId: 'counter-ecg-1',
    roomNo: 'Room 04',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '09:12 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 3
  },
  // Background tokens at Room 12 (Phlebotomy / Blood Lab - high congestion)
  {
    id: 'tok-bg-bld-1',
    tokenNumber: 'BLD-21',
    patientId: 'pat-bg-4',
    patientName: 'Manish Verma',
    patientUhid: 'QC-2026-9401',
    patientAge: 29,
    patientGender: 'Male',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:50 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 5
  },
  {
    id: 'tok-bg-bld-2',
    tokenNumber: 'BLD-22',
    patientId: 'pat-bg-5',
    patientName: 'Rekha Gupta',
    patientUhid: 'QC-2026-9402',
    patientAge: 44,
    patientGender: 'Female',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '08:55 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 10
  },
  {
    id: 'tok-bg-bld-3',
    tokenNumber: 'BLD-23',
    patientId: 'pat-bg-6',
    patientName: 'Harish Chandra',
    patientUhid: 'QC-2026-9403',
    patientAge: 58,
    patientGender: 'Male',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:00 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 15
  }
];

export const DEMO_SCENARIO_PATIENTS_LIST: Patient[] = [
  DEMO_SCENARIO_PATIENT,
  {
    id: 'pat-bg-1',
    uhid: 'QC-2026-9408',
    qrSessionId: 'QC-9408',
    name: 'Sita Devi',
    age: 48,
    gender: 'Female',
    contact: '+91 98111 22334',
    priority: 'standard',
    prescribedDoctorId: 'doc-verma',
    prescribedDoctorName: 'Dr. Rajesh Verma',
    prescribedDoctorRoom: 'Room 104',
    chiefComplaint: 'Routine diabetes checkup',
    prescribedTests: ['test-fbs'],
    completedTests: [],
    activeTokenIds: { 'test-fbs': 'tok-bg-bio-1' },
    status: 'in_test',
    assignedSmartRoute: ['test-fbs'],
    registrationTime: '09:00 AM',
    opdTokenNumber: 'OPD-11',
    doctorReviewStatus: 'awaiting_lab_reports'
  },
  {
    id: 'pat-bg-2',
    uhid: 'QC-2026-9409',
    qrSessionId: 'QC-9409',
    name: 'Vinod Kumar',
    age: 61,
    gender: 'Male',
    contact: '+91 98222 33445',
    priority: 'senior',
    prescribedDoctorId: 'doc-verma',
    prescribedDoctorName: 'Dr. Rajesh Verma',
    prescribedDoctorRoom: 'Room 104',
    chiefComplaint: 'Hypertension and dizziness',
    prescribedTests: ['test-fbs', 'test-ecg'],
    completedTests: [],
    activeTokenIds: { 'test-fbs': 'tok-bg-bio-2' },
    status: 'in_transit',
    assignedSmartRoute: ['test-fbs', 'test-ecg'],
    registrationTime: '09:05 AM',
    opdTokenNumber: 'OPD-12',
    doctorReviewStatus: 'awaiting_lab_reports'
  },
  {
    id: 'pat-bg-3',
    uhid: 'QC-2026-9410',
    qrSessionId: 'QC-9410',
    name: 'Anita Singh',
    age: 35,
    gender: 'Female',
    contact: '+91 98333 44556',
    priority: 'standard',
    prescribedDoctorId: 'doc-verma',
    prescribedDoctorName: 'Dr. Rajesh Verma',
    prescribedDoctorRoom: 'Room 104',
    chiefComplaint: 'Heart flutter during work',
    prescribedTests: ['test-ecg'],
    completedTests: [],
    activeTokenIds: { 'test-ecg': 'tok-bg-ecg-1' },
    status: 'in_test',
    assignedSmartRoute: ['test-ecg'],
    registrationTime: '09:10 AM',
    opdTokenNumber: 'OPD-13',
    doctorReviewStatus: 'awaiting_lab_reports'
  }
];
