import { describe, it, expect } from 'vitest';
import {
  REGISTERED_HOSPITALS,
  getDepartmentsForHospital,
  getCountersForHospital,
  INITIAL_TESTS
} from '../data/mockHospitalData';
import {
  setHospitalByCodeAction,
  loginDoctorAction,
  getHospitalState
} from '../store/useHospitalStore';
import { calculateOptimalQueueRoute } from './queueRouter';
import { Patient } from '../types';

describe('Hospital Data Isolation & Multi-Tenant Routing Engine', () => {

  it('provides distinct, isolated physical layouts across all 6 hospitals', () => {
    const hospitalCodes = ['MAX-01', 'APOLLO-02', 'AIIMS-03', 'SAFDARJUNG-04', 'RML-05', 'LNJP-06'];
    
    const phlebRooms = new Set<string>();
    const biochemRooms = new Set<string>();
    const doctorRooms = new Set<string>();

    hospitalCodes.forEach(code => {
      const depts = getDepartmentsForHospital(code);
      const counters = getCountersForHospital(code);

      expect(depts).toHaveLength(10);
      expect(counters).toHaveLength(10);

      // Verify each department has complete rich location fields
      depts.forEach(dept => {
        expect(dept.location.building).toBeTruthy();
        expect(dept.location.wing).toBeTruthy();
        expect(dept.location.floor).toBeTruthy();
        expect(dept.location.room).toBeTruthy();
        expect(dept.location.directions).toBeTruthy();
      });

      const phleb = depts.find(d => d.id === 'dept-pathology')!;
      const biochem = depts.find(d => d.id === 'dept-biochem')!;
      const hosp = REGISTERED_HOSPITALS.find(h => h.code === code)!;

      phlebRooms.add(phleb.location.room);
      biochemRooms.add(biochem.location.room);
      doctorRooms.add(hosp.doctorRoom);
    });

    // Verify each hospital has distinct room assignments
    expect(phlebRooms.size).toBe(6);
    expect(biochemRooms.size).toBe(6);
    expect(doctorRooms.size).toBe(6);
  });

  it('accurately resolves Safdarjung Hospital (SAFDARJUNG-04) clinical layout', () => {
    const sjhDepts = getDepartmentsForHospital('SAFDARJUNG-04');
    const phleb = sjhDepts.find(d => d.id === 'dept-pathology')!;
    const biochem = sjhDepts.find(d => d.id === 'dept-biochem')!;
    const ecg = sjhDepts.find(d => d.id === 'dept-cardio')!;
    const xray = sjhDepts.find(d => d.id === 'dept-radiology')!;

    expect(phleb.location.room).toBe('Room 18');
    expect(phleb.location.building).toBe('New OPD Complex');
    expect(phleb.location.wing).toBe('Gate 2 Corridor');
    expect(phleb.location.directions).toContain('Dr. Sunita Batra');

    expect(biochem.location.room).toBe('Room 114');
    expect(biochem.location.floor).toBe('1st Floor');
    expect(biochem.location.building).toBe('Main Hospital Block');

    expect(ecg.location.room).toBe('Room 208');
    expect(ecg.location.building).toBe('Super Speciality Block (SSB)');

    expect(xray.location.room).toBe('Room 06');
    expect(xray.location.building).toBe('Emergency & Trauma Block');
  });

  it('accurately resolves Max Saket (MAX-01) clinical layout', () => {
    const maxDepts = getDepartmentsForHospital('MAX-01');
    const phleb = maxDepts.find(d => d.id === 'dept-pathology')!;
    const biochem = maxDepts.find(d => d.id === 'dept-biochem')!;
    const ecg = maxDepts.find(d => d.id === 'dept-cardio')!;

    expect(phleb.location.room).toBe('Room 12');
    expect(phleb.location.building).toBe('Diagnostic Plaza');
    expect(phleb.location.directions).toContain('Dr. Ananya Sen');

    expect(biochem.location.room).toBe('Room 14');
    expect(biochem.location.building).toBe('Diagnostic Plaza');

    expect(ecg.location.room).toBe('Room 104');
    expect(ecg.location.building).toBe('Central Tower');
  });

  it('accurately resolves AIIMS Delhi (AIIMS-03) clinical layout', () => {
    const aiimsDepts = getDepartmentsForHospital('AIIMS-03');
    const phleb = aiimsDepts.find(d => d.id === 'dept-pathology')!;
    const biochem = aiimsDepts.find(d => d.id === 'dept-biochem')!;

    expect(phleb.location.room).toBe('Room 15');
    expect(phleb.location.building).toBe('Rajkumari Amrit Kaur (RAK) OPD Block');

    expect(biochem.location.room).toBe('Room 22');
    expect(biochem.location.building).toBe('Main Hospital Building');
  });

  it('survives rapid multi-hospital tenant switching stress test without leakage', () => {
    const hospitalSequence = [
      'SAFDARJUNG-04',
      'MAX-01',
      'AIIMS-03',
      'APOLLO-02',
      'RML-05',
      'LNJP-06'
    ];

    // Stress test: 30 consecutive hospital switches
    for (let round = 0; round < 5; round++) {
      for (const code of hospitalSequence) {
        setHospitalByCodeAction(code);
        const store = getHospitalState();

        expect(store.currentHospital.code).toBe(code);
        expect(store.departments).toHaveLength(10);
        expect(store.counters).toHaveLength(10);

        const expectedDepts = getDepartmentsForHospital(code);
        expect(store.departments[0].location.room).toBe(expectedDepts[0].location.room);
        expect(store.departments[0].location.building).toBe(expectedDepts[0].location.building);
      }
    }
  });

  it('calculates optimal queue routes with hospital-specific room numbers and directions', () => {
    // Switch to Safdarjung Hospital
    setHospitalByCodeAction('SAFDARJUNG-04');
    const store = getHospitalState();

    const mockPatient = {
      id: 'pat-sjh-stress-1',
      uhid: 'QC-SJH-101',
      qrSessionId: 'QC-SJH-101',
      name: 'Rameshwar Lal',
      age: 58,
      gender: 'Male' as const,
      contact: '9810123456',
      chiefComplaint: 'Uncontrolled diabetes and hypertension',
      registrationTime: new Date().toISOString(),
      prescribedDoctorName: 'Dr. Sunita Batra',
      prescribedDoctorRoom: 'Room 108',
      prescribedTests: ['test-fbs', 'test-cbc', 'test-ecg', 'test-xray-chest'],
      completedTests: [],
      priority: 'standard' as const,
      activeTokenIds: [],
      prescribedDoctorId: 'doc-sjh-1',
      doctorReviewStatus: 'awaiting_prescription' as const
    } as unknown as Patient;

    const routeResult = calculateOptimalQueueRoute(
      mockPatient,
      store.tests,
      store.departments,
      [],
      store.counters
    );

    expect(routeResult.smartRouteSteps).toHaveLength(4);

    // Prerequisite: Fasting Blood Sugar must be routed first
    expect(routeResult.smartRouteSteps[0].testId).toBe('test-fbs');
    expect(routeResult.smartRouteSteps[0].location.room).toBe('Room 114'); // Safdarjung Biochem Room

    // Find other steps
    const cbcStep = routeResult.smartRouteSteps.find(s => s.testId === 'test-cbc')!;
    const ecgStep = routeResult.smartRouteSteps.find(s => s.testId === 'test-ecg')!;
    const xrayStep = routeResult.smartRouteSteps.find(s => s.testId === 'test-xray-chest')!;

    expect(cbcStep.location.room).toBe('Room 18');  // Safdarjung Phleb Room
    expect(ecgStep.location.room).toBe('Room 208'); // Safdarjung ECG Room
    expect(xrayStep.location.room).toBe('Room 06'); // Safdarjung X-Ray Room

    // Directions must contain Safdarjung hospital buildings/corridors
    expect(cbcStep.location.wing).toBe('Gate 2 Corridor');
    expect(cbcStep.location.directions).toContain('Gate 2 exit');
    expect(ecgStep.location.building).toContain('Super Speciality Block');
    expect(ecgStep.location.directions).toContain('SSB');
    expect(xrayStep.location.building).toContain('Emergency & Trauma Block');
    expect(xrayStep.location.directions).toContain('Trauma Block');
  });

});
