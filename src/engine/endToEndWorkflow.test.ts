import { describe, it, expect, beforeEach } from 'vitest';
import {
  getHospitalState,
  resetToCleanSlateAction,
  setHospitalByCodeAction,
  registerPatientAction,
  prescribeTestsAction,
  callPatientAction,
  completeTestAndUploadReportAction,
  verifyAndDischargePatientAction,
  loginAsPatientWithSessionAction
} from '../store/useHospitalStore';

describe('End-to-End Hospital OPD & Diagnostic Flow Integration', () => {
  beforeEach(() => {
    resetToCleanSlateAction();
  });

  it('runs complete lifecycle: Register -> Prescribe -> QR Scan -> Lab Call -> Report Upload -> Doctor Discharge', () => {
    // 1. Switch to Safdarjung Hospital (SAFDARJUNG-04)
    setHospitalByCodeAction('SAFDARJUNG-04');
    const state0 = getHospitalState();
    expect(state0.currentHospital.code).toBe('SAFDARJUNG-04');

    // Verify hospital rooms match Safdarjung's Super Speciality Block
    const pathDept = state0.departments.find(d => d.id === 'dept-pathology');
    expect(pathDept?.location.room).toContain('Room 18');
    expect(pathDept?.location.directions).toContain('Gate 2');

    // 2. Doctor / Assistant registers a walk-in patient
    const registered = registerPatientAction({
      name: 'Pooja Verma',
      age: 38,
      gender: 'Female',
      contact: '9876543210',
      chiefComplaint: 'Severe recurrent fatigue & dizziness'
    });

    expect(registered.name).toBe('Pooja Verma');
    expect(registered.uhid).toMatch(/^QC-2026-\d{4}$/);
    expect(registered.qrSessionId).toMatch(/^QC-\d{4}$/);

    // 3. Prescribe CBC & Fasting Blood Sugar
    prescribeTestsAction(registered.id, ['test-cbc', 'test-fbs'], 'urgent');

    const state1 = getHospitalState();
    const patientAfterPrescribe = state1.patients.find(p => p.id === registered.id)!;
    expect(patientAfterPrescribe.prescribedTests).toEqual(['test-cbc', 'test-fbs']);
    expect(patientAfterPrescribe.doctorReviewStatus).toBe('awaiting_lab_reports');

    // Check minted tokens have Safdarjung specific room numbers
    const cbcTokenId = patientAfterPrescribe.activeTokenIds['test-cbc'];
    const cbcToken = state1.queueTokens.find(t => t.id === cbcTokenId)!;
    expect(cbcToken.roomNo).toContain('Room 18');
    expect(cbcToken.patientName).toBe('Pooja Verma');

    // 4. Patient scans QR code on phone (Simulate loginAsPatientWithSession)
    const loginSuccess = loginAsPatientWithSessionAction(registered.qrSessionId);
    expect(loginSuccess).toBe(true);

    const state2 = getHospitalState();
    expect(state2.activeRole).toBe('patient');
    expect(state2.selectedPatientId).toBe(registered.id);

    // 5. Lab Tech calls patient at Pathology Lab (Room 18)
    callPatientAction(cbcToken.id);

    const state3 = getHospitalState();
    expect(state3.callingAlert).not.toBeNull();
    expect(state3.callingAlert?.patientName).toBe('Pooja Verma');
    expect(state3.callingAlert?.roomNo).toContain('Room 18');

    // 6. Lab Tech enters parameters and completes CBC test
    completeTestAndUploadReportAction(
      cbcToken.id,
      { 'Hemoglobin (Hb)': '10.5', 'Total Leukocyte Count (TLC)': '8400' },
      'Sample collected without hemolysis.'
    );

    const state4 = getHospitalState();
    expect(state4.callingAlert).toBeNull(); // Alert cleared upon test completion
    expect(state4.clinicalReports.length).toBe(1);

    const cbcReport = state4.clinicalReports[0];
    expect(cbcReport.testName).toContain('Blood Collection');
    expect(cbcReport.technicalName).toContain('Complete Blood Count');
    expect(cbcReport.patientName).toBe('Pooja Verma');
    expect(cbcReport.roomNo).toContain('Room 18');

    // Patient's completed tests now include CBC, and status updated
    const patientAfterCbc = state4.patients.find(p => p.id === registered.id)!;
    expect(patientAfterCbc.completedTests).toContain('test-cbc');
    expect(patientAfterCbc.doctorReviewStatus).toBe('awaiting_lab_reports'); // FBS still remaining

    // 7. Complete second test (FBS)
    const fbsTokenId = patientAfterCbc.activeTokenIds['test-fbs'];
    completeTestAndUploadReportAction(
      fbsTokenId,
      { 'Fasting Blood Glucose': '92' },
      'Fasting state verified (10h overnight).'
    );

    const state5 = getHospitalState();
    const patientAllDone = state5.patients.find(p => p.id === registered.id)!;
    expect(patientAllDone.completedTests).toEqual(['test-cbc', 'test-fbs']);
    expect(patientAllDone.doctorReviewStatus).toBe('reports_ready');
    expect(patientAllDone.status).toBe('all_completed');
    expect(state5.clinicalReports.length).toBe(2);

    // 8. Doctor reviews verified reports and discharges patient
    verifyAndDischargePatientAction(
      registered.id,
      'Mild anemia observed (Hb 10.5). Advised Tab Autrin OD x 30 days and dietary iron.'
    );

    const state6 = getHospitalState();
    const dischargedPatient = state6.patients.find(p => p.id === registered.id)!;
    expect(dischargedPatient.status).toBe('discharged');
    expect(dischargedPatient.doctorReviewStatus).toBe('completed');
    expect(dischargedPatient.notes).toContain('Mild anemia');

    // All reports marked as verified by doctor
    const verifiedReports = state6.clinicalReports.filter(r => r.patientId === registered.id);
    expect(verifiedReports.every(r => r.status === 'verified_by_doctor')).toBe(true);
  });

  it('correctly routes and syncs multi-specialty lab bays (PFT, Eye OCT, ENT, DEXA)', () => {
    setHospitalByCodeAction('MAX-01');
    const registered = registerPatientAction({
      name: 'Rohan Malhotra',
      age: 45,
      gender: 'Male',
      contact: '9811122233',
      chiefComplaint: 'Vision blurring and chronic dyspnea on exertion'
    });

    // Prescribe across 3 different specialty bays: Pulmonary, Ophthalmology, and Cardiology
    prescribeTestsAction(registered.id, ['test-spirometry', 'test-retina-oct', 'test-ecg'], 'normal');

    const s1 = getHospitalState();
    const pat = s1.patients.find(p => p.id === registered.id)!;
    expect(pat.prescribedTests.length).toBe(3);

    // Verify token exists in Pulmonary Bay
    const pftTokens = s1.queueTokens.filter(t => t.departmentId === 'dept-pulmonary' && t.patientId === registered.id);
    expect(pftTokens.length).toBe(1);
    expect(pftTokens[0].tokenNumber).toContain('PFT');

    // Verify token exists in Ophthalmology Bay
    const eyeTokens = s1.queueTokens.filter(t => t.departmentId === 'dept-ophthalmology' && t.patientId === registered.id);
    expect(eyeTokens.length).toBe(1);
    expect(eyeTokens[0].tokenNumber).toContain('EYE');

    // Verify token exists in Cardiology Bay
    const ecgTokens = s1.queueTokens.filter(t => t.departmentId === 'dept-cardio' && t.patientId === registered.id);
    expect(ecgTokens.length).toBe(1);
    expect(ecgTokens[0].tokenNumber).toMatch(/^(E|ECG)/);

    // Complete PFT in lab with normal findings
    completeTestAndUploadReportAction(
      pftTokens[0].id,
      { 'FEV1 / FVC Ratio': '82.5%', 'FEV1 % Predicted': '91.0%' },
      'Good patient effort on spirometry maneuver.'
    );

    const s2 = getHospitalState();
    const pftReport = s2.clinicalReports.find(r => r.testId === 'test-spirometry');
    expect(pftReport).toBeDefined();
    expect(pftReport?.metrics.length).toBeGreaterThan(0);
    expect(pftReport?.technicianNotes).toContain('Good patient effort');

    // Verify patient portal progress
    const patAfterPft = s2.patients.find(p => p.id === registered.id)!;
    expect(patAfterPft.completedTests).toContain('test-spirometry');
    expect(patAfterPft.status).toBe('in_transit');
    expect(patAfterPft.doctorReviewStatus).toBe('awaiting_lab_reports');
  });
});
