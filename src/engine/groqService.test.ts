import { describe, it, expect, vi } from 'vitest';
import { askQBieAI, askQBiePublicAI, QBiePatientContext } from './groqService';

describe('Groq AI Service & Q-Bie Companion Engine', () => {
  const mockContext: QBiePatientContext = {
    patientName: 'Rahul Sharma',
    uhid: 'QC-2026-9411',
    age: 45,
    gender: 'Male',
    hospitalName: 'QCare Demo Hospital',
    doctorName: 'Dr. Ananya Sen',
    doctorDepartment: 'Cardiology OPD',
    doctorRoom: 'Room 204',
    symptoms: 'Severe chest pain & breathlessness for 2 days',
    opdTokenNumber: 'OPD-104',
    allCompleted: false,
    currentStop: {
      testName: 'Ultrasonography (USG Abdomen)',
      room: 'Room G-215',
      floor: 'Ground Floor',
      estimatedWaitMinutes: 12,
      patientsAhead: 2,
      reason: 'Shortest queue currently available'
    },
    prescribedTests: [
      {
        name: 'Ultrasonography',
        room: 'Room G-215',
        floor: 'Ground Floor',
        status: 'up_next',
        waitMinutes: 12,
        queueCount: 2
      },
      {
        name: '12-Lead ECG',
        room: 'Room 104-A',
        floor: '1st Floor',
        status: 'queued',
        waitMinutes: 35,
        queueCount: 9
      }
    ],
    completedReports: []
  };

  it('provides deterministic clinical navigation advice when where question is asked', async () => {
    // Test fallback behavior without network dependency
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline simulation'));

    const reply = await askQBieAI('Where should I go right now?', mockContext);
    expect(reply).toBeDefined();
    expect(reply).toContain('Room G-215');
    expect(reply).toContain('Ground Floor');

    global.fetch = originalFetch;
  });

  it('explains time saving and smart routing logic accurately', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline simulation'));

    const reply = await askQBieAI('Why did Q-Care optimize my test order?', mockContext);
    expect(reply).toContain('स्मार्ट');

    global.fetch = originalFetch;
  });

  it('instructs patient to return to doctor when all tests are completed', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline simulation'));

    const completedContext: QBiePatientContext = {
      ...mockContext,
      allCompleted: true,
      currentStop: undefined
    };

    const reply = await askQBieAI('Kahan jana hai ab?', completedContext);
    expect(reply).toContain('डॉ. Dr. Ananya Sen');

    global.fetch = originalFetch;
  });

  it('differentiates pure greetings from well-being questions in public assistant', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline simulation'));

    const greeting = await askQBiePublicAI('hello', 'en');
    expect(greeting).toContain('Qbie');
    expect(greeting).not.toContain('badhiya');

    const wellbeing = await askQBiePublicAI('kaise ho', 'en');
    expect(wellbeing).toContain('badhiya');

    const greetingHi = await askQBiePublicAI('namaste', 'hi');
    expect(greetingHi).toContain('नमस्ते');
    expect(greetingHi).not.toContain('ठीक हूँ');

    global.fetch = originalFetch;
  });
});
