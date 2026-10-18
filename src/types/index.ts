// ==========================================
// Q-Care Domain Types & Data Models
// Multi-Tenant Hospital Diagnostics & Routing
// ==========================================

export type PriorityLevel = 'emergency' | 'senior' | 'standard';

export type DoctorPriority = 'normal' | 'priority' | 'urgent';

export type TokenStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_progress' 
  | 'completed' 
  | 'skipped'
  | 'on_hold'
  | 'awaiting_lab_reports'
  | 'reports_ready';

export type TestPrescriptionStatus = 
  | 'pending'
  | 'recommended'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'unavailable';

export type DoctorReviewStatus = 
  | 'awaiting_prescription' 
  | 'awaiting_lab_reports' 
  | 'reports_ready' 
  | 'in_consultation' 
  | 'completed';

export type HospitalTier = 'multi_specialty' | 'diagnostic_center' | 'single_doctor_clinic';

export interface HospitalQueueSettings {
  autoCall: boolean;
  maxWaitAlertMinutes: number;
  finalInstruction?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code?: string; // e.g. "QCARE-HOSP-001"
  shortName: string;
  tier: HospitalTier;
  tagline: string;
  address: string;
  city?: string;
  state?: string;
  contactNumber?: string;
  email?: string;
  logo?: string;
  numberOfFloors?: number;
  status?: 'active' | 'inactive';
  plan?: 'standard' | 'enterprise';
  workingHours?: string;
  doctorCount: number;
  counterCount: number;
  badge: string;
  accentColor: string;
  queueSettings?: HospitalQueueSettings;
}

export interface PatientTriageInfo {
  patientId?: string;
  hospitalId?: string;
  hospitalName?: string;
  uhid: string;
  opdTokenNumber: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  priority: PriorityLevel;
  doctorPriority?: DoctorPriority;
  doctorName: string;
  doctorRoom: string;
  secureQrToken?: string;
}

export type CounterStatus = 'active' | 'paused' | 'closed';

export type LabAvailabilityStatus = 'available' | 'busy' | 'unavailable';

export type ReportStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'uploaded' 
  | 'verified_by_doctor';

export type MetricFlag = 'normal' | 'high' | 'low' | 'critical';

export interface ClinicalMetric {
  label: string;
  value: string;
  unit: string;
  normalRange: string;
  flag: MetricFlag;
}

export interface ClinicalReport {
  id: string;
  hospitalId?: string;
  testId: string;
  testName: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  technicianName: string;
  counterId: string;
  timestamp: string;
  status: ReportStatus;
  summary: string;
  metrics: ClinicalMetric[];
  doctorNotes?: string;
  doctorSignature?: string;
}

export interface DepartmentLocation {
  wing: 'East Wing' | 'West Wing' | 'Central Tower' | 'Diagnostic Plaza';
  floor: 'Ground Floor' | '1st Floor' | '2nd Floor' | 'Basement 1';
  room: string;
  coordX: number; // for radar / map layout percentage (0-100)
  coordY: number;
}

export interface Department {
  id: string;
  hospitalId?: string;
  name: string;
  code: string;
  category: 'pathology' | 'cardiology' | 'radiology' | 'ultrasound' | 'biochemistry' | 'ophthalmology';
  location: DepartmentLocation;
  accentColor: string; // Tailwind hex or class
  iconName: string;
  description: string;
  availabilityStatus?: LabAvailabilityStatus;
  totalMachines?: number;
  activeMachines?: number;
}

export interface DiagnosticTest {
  id: string;
  hospitalId?: string;
  code: string;
  name: string;
  departmentId: string;
  averageDurationMinutes: number; // typical test execution time
  requiresFasting?: boolean;
  requiresFullBladder?: boolean;
  preparationNotes: string;
  prerequisites?: string[]; // IDs of tests that MUST be done before this
  standardPrice: number;
  defaultPriority?: DoctorPriority;
}

export interface PrescribedTestItem {
  testId: string;
  testName: string;
  priority: DoctorPriority;
  notes?: string;
  preparationInstructions?: string;
  dependencyTestId?: string;
  status: TestPrescriptionStatus;
  completedAt?: string;
  completedByStaff?: string;
}

export interface Counter {
  id: string;
  hospitalId?: string;
  code: string;
  name: string;
  departmentId: string;
  technicianName: string;
  status: CounterStatus;
  currentServingTokenId?: string;
  currentPatientId?: string;
  servedCountToday: number;
  averageServiceMinutes: number;
}

export interface QueueToken {
  id: string;
  hospitalId?: string;
  tokenNumber: string; // e.g., "BLD-104", "ECG-208", "OPD-104"
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  patientAge?: number;
  patientGender?: string;
  testId: string; // e.g. "test-cbc", or "opd-consultation"
  testName?: string;
  departmentId: string;
  doctorId?: string;
  doctorName?: string;
  counterId?: string;
  priority: PriorityLevel;
  doctorPriority?: DoctorPriority;
  status: TokenStatus;
  issuedAt: string;
  calledAt?: string;
  completedAt?: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export interface Patient {
  id: string;
  hospitalId?: string;
  hospitalName?: string;
  uhid: string; // e.g., "QC-2026-9411"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  priority: PriorityLevel;
  doctorPriority?: DoctorPriority;
  prescribedDoctorId: string;
  prescribedDoctorName: string;
  prescribedDoctorRoom?: string;
  department?: string;
  prescribedTests: string[]; // test IDs
  prescribedTestItems?: PrescribedTestItem[];
  completedTests: string[]; // test IDs
  currentTestId?: string;
  activeTokenIds: Record<string, string>; // testId -> tokenId
  status: 'checked_in' | 'in_transit' | 'in_test' | 'all_completed' | 'discharged';
  assignedSmartRoute: string[]; // ordered test IDs
  assignedNaiveRoute?: string[]; // original sequential test IDs
  currentIllness?: string; // e.g. "Severe chest pain & breathlessness for 2 days"
  symptoms?: string; // Sickness description or chief complaint
  registrationTime: string;
  opdTokenNumber?: string; // e.g. "OPD-104"
  doctorReviewStatus?: DoctorReviewStatus;
  secureQrToken?: string;
}

export interface Doctor {
  id: string;
  hospitalId?: string;
  name: string;
  specialization: string;
  department: string;
  roomNo: string;
  avatarUrl?: string;
  activePatientCount: number;
}

export interface StaffMember {
  id: string;
  hospitalId: string;
  staffId: string; // e.g. "STAFF-ADMIN-01"
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'hospital_admin' | 'reception' | 'doctor_assistant' | 'lab_staff';
  assignedLabId?: string;
  assignedLabName?: string;
  status: 'active' | 'inactive';
  password?: string;
}

export interface LabMachine {
  id: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  totalCount: number;
  activeCount: number;
  status: 'operational' | 'degraded' | 'breakdown';
  notes?: string;
}

export interface AuditLog {
  id: string;
  hospitalId: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  action: string;
  patientId?: string;
  patientName?: string;
  oldStatus?: string;
  newStatus?: string;
  details?: string;
  timestamp: string;
}

export interface HospitalFloorRoom {
  id: string;
  hospitalId: string;
  floor: string;
  wing: string;
  roomNumber: string;
  departmentId: string;
  departmentName: string;
  description: string;
}

export interface DepartmentQueueStats {
  departmentId: string;
  departmentName: string;
  activeWaitingCount: number;
  activeCountersCount: number;
  averageServiceTimeMinutes: number;
  estimatedWaitMinutes: number;
  congestionLevel: 'low' | 'moderate' | 'high' | 'bottleneck';
  totalTokensProcessed: number;
}

export interface RouteStep {
  stepNumber: number;
  testId: string;
  testName: string;
  testCode: string;
  departmentId: string;
  departmentName: string;
  location: DepartmentLocation;
  estimatedWaitMinutes: number;
  estimatedDurationMinutes: number;
  walkingTimeFromPrevMinutes: number;
  expectedStartTime: string;
  expectedEndTime: string;
  recommendedCounterId?: string;
  status: 'completed' | 'in_progress' | 'up_next' | 'queued';
  reasonForSequence: string;
  priority?: DoctorPriority;
  preparationNotes?: string;
  waitRangeText?: string; // e.g. "Approx. 12–15 min"
}

export interface QueueRoutingPlan {
  patientId: string;
  calculatedAt: string;
  smartRouteSteps: RouteStep[];
  smartTotalTimeMinutes: number;
  naiveTotalTimeMinutes: number;
  timeSavedMinutes: number;
  percentageSaved: number;
  bottlenecksAvoided: string[];
  fastingSatisfied: boolean;
  transitTotalMinutes: number;
  recommendedNextTestId?: string;
  recommendationReason?: string;
}

export type ActiveRole = 
  | 'patient' 
  | 'doctor' 
  | 'lab_tech'
  | 'super_admin'
  | 'hospital_admin'
  | 'reception'
  | 'doctor_assistant'
  | 'lab_staff'
  | 'kiosk';

export type UserRole = 
  | 'patient' 
  | 'doctor' 
  | 'lab_tech'
  | 'super_admin'
  | 'hospital_admin'
  | 'reception'
  | 'doctor_assistant'
  | 'lab_staff'
  | 'kiosk';

export interface CurrentUser {
  id: string; // patientId, doctorId, counterId, or staffId
  role: UserRole;
  name: string;
  identifier: string; // UHID e.g. "QC-1082", Room No e.g. "OPD Room 12", Counter Code e.g. "Counter B-01", Staff ID e.g. "STAFF-ADMIN-01"
  subtitle?: string;
  departmentId?: string;
  counterId?: string;
  hospitalId?: string;
  hospitalName?: string;
  staffId?: string;
  assignedLabId?: string;
}
