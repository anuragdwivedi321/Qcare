// ==========================================
// Q-Care Domain Types & Data Models
// ==========================================

export type PriorityLevel = 'emergency' | 'senior' | 'standard';

export type TokenStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_progress' 
  | 'completed' 
  | 'skipped';

export type CounterStatus = 'active' | 'paused' | 'closed';

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
  name: string;
  code: string;
  category: 'pathology' | 'cardiology' | 'radiology' | 'ultrasound' | 'biochemistry' | 'ophthalmology';
  location: DepartmentLocation;
  accentColor: string; // Tailwind hex or class
  iconName: string;
  description: string;
}

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  averageDurationMinutes: number; // typical test execution time
  requiresFasting?: boolean;
  requiresFullBladder?: boolean;
  preparationNotes: string;
  prerequisites?: string[]; // IDs of tests that MUST be done before this
  standardPrice: number;
}

export interface Counter {
  id: string;
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
  tokenNumber: string; // e.g., "BLD-104", "ECG-208"
  patientId: string;
  testId: string;
  departmentId: string;
  counterId?: string;
  priority: PriorityLevel;
  status: TokenStatus;
  issuedAt: string;
  calledAt?: string;
  completedAt?: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export interface Patient {
  id: string;
  uhid: string; // e.g., "QC-2026-9411"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  priority: PriorityLevel;
  prescribedDoctorId: string;
  prescribedDoctorName: string;
  prescribedTests: string[]; // test IDs
  completedTests: string[]; // test IDs
  currentTestId?: string;
  activeTokenIds: Record<string, string>; // testId -> tokenId
  status: 'checked_in' | 'in_transit' | 'in_test' | 'all_completed';
  assignedSmartRoute: string[]; // ordered test IDs
  assignedNaiveRoute: string[]; // original sequential test IDs
  registrationTime: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  roomNo: string;
  avatarUrl?: string;
  activePatientCount: number;
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
}

export type ActiveRole = 'patient' | 'doctor' | 'lab_tech' | 'command_center';
