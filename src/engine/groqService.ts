/**
 * Q-Bie AI Engine - Powered by Groq Cloud API
 * Real-time patient hospital companion with dynamic patient context.
 */

export interface QBiePatientContext {
  patientName: string;
  uhid: string;
  age: number;
  gender: string;
  hospitalName: string;
  doctorName: string;
  doctorDepartment: string;
  doctorRoom?: string;
  symptoms?: string;
  opdTokenNumber?: string;
  currentStop?: {
    testName: string;
    room: string;
    floor: string;
    estimatedWaitMinutes: number;
    patientsAhead: number;
    reason?: string;
  };
  calledToken?: {
    tokenNumber: string;
    room?: string;
  };
  inProgressToken?: {
    tokenNumber: string;
    testName?: string;
  };
  allCompleted: boolean;
  prescribedTests: Array<{
    name: string;
    room: string;
    floor: string;
    status: 'completed' | 'up_next' | 'queued' | 'in_progress';
    waitMinutes: number;
    queueCount: number;
  }>;
  completedReports: Array<{
    testName: string;
    summary: string;
  }>;
  language?: 'en' | 'hi';
}

const GROQ_API_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_GROQ_API_KEY) ||
  '';

// Priority model list based on verified live availability
const MODEL_CASCADE = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

/**
 * Build rich, live clinical context prompt for Groq
 */
function buildSystemPrompt(ctx: QBiePatientContext): string {
  const testsList = ctx.prescribedTests.map(t => 
    `- ${t.name}: Room ${t.room} (${t.floor}) | Status: ${t.status.toUpperCase()} | Queue: ${t.queueCount} ahead (~${t.waitMinutes}m wait)`
  ).join('\n');

  const reportsList = ctx.completedReports.length > 0
    ? ctx.completedReports.map(r => `- ${r.testName}: ${r.summary}`).join('\n')
    : 'None yet';

  return `You are Q-Bie (QB), a warm, intelligent, and reassuring hospital guide mascot for QCare.
You are helping the patient navigate their hospital visit in real-time.

=== CURRENT REAL PATIENT RECORD ===
Patient Name: ${ctx.patientName} (${ctx.age}y, ${ctx.gender})
UHID: ${ctx.uhid}
Hospital: ${ctx.hospitalName}
Consulting Doctor: ${ctx.doctorName} (${ctx.doctorDepartment}, Room ${ctx.doctorRoom || 'OPD Room 204'})
Chief Complaints / Symptoms: "${ctx.symptoms || 'General OPD Consultation'}"
OPD Token: #${ctx.opdTokenNumber || 'OPD-104'}
All Tests Completed: ${ctx.allCompleted ? 'YES' : 'NO'}

=== LIVE DIAGNOSTIC ROUTE & QUEUES ===
${testsList || 'No prescribed diagnostic tests registered yet.'}

${ctx.calledToken ? `🚨 ACTIVE CALL: Patient's Token #${ctx.calledToken.tokenNumber} is CALLED RIGHT NOW! They must go immediately.` : ''}
${ctx.inProgressToken ? `⏳ IN PROGRESS: Currently undergoing ${ctx.inProgressToken.testName || 'diagnostic test'}.` : ''}
${ctx.currentStop ? `👉 CURRENT TARGET STOP: ${ctx.currentStop.testName} in ${ctx.currentStop.room} (${ctx.currentStop.floor}). Wait: ~${ctx.currentStop.estimatedWaitMinutes} mins (${ctx.currentStop.patientsAhead} ahead).` : ''}

=== VERIFIED COMPLETED TEST REPORTS ===
${reportsList}

=== RESPONSE RULES ===
1. Respond in natural, warm, and helpful Hinglish (or simple English if user speaks English).
2. Keep answers concise: 2 to 3 sentences maximum.
3. ALWAYS reference their real room numbers, floor, and queue times from the record above.
4. If they ask where to go: tell them their exact current target room and floor.
5. If all tests are done: tell them to return to ${ctx.doctorName} in room ${ctx.doctorRoom || 'OPD Room 204'} for final report evaluation.
6. If token is called: instruct them to immediately walk inside the room without delay.
7. Be supportive, empathetic, and 100% accurate. Zero hallucinated room numbers or fake tests.`;
}

/**
 * Call Groq API with automatic model fallback
 */
export async function askQBieAI(
  userQuestion: string,
  patientContext: QBiePatientContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(patientContext);

  for (const model of MODEL_CASCADE) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuestion }
          ],
          max_tokens: 350,
          temperature: 0.6
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          return content;
        }
      }
    } catch {
      // Try next model in cascade
      continue;
    }
  }

  // Fallback to local clinical engine if network or rate limit fails
  return getLocalClinicalFallback(userQuestion, patientContext);
}

/**
 * Deterministic local fallback in case of offline/network issues
 */
function getLocalClinicalFallback(question: string, ctx: QBiePatientContext): string {
  const q = question.toLowerCase();

  if (ctx.calledToken) {
    return `🚨 टोकन #${ctx.calledToken.tokenNumber} बुलाया जा चुका है! कृपया तुरंत अपने निर्धारित कमरे में अंदर जाएँ, स्टाफ आपका इंतजार कर रहा है।`;
  }

  if (ctx.allCompleted) {
    return `🎉 आपकी सभी जांचें पूरी हो चुकी हैं! कृपया अंतिम रिपोर्ट समीक्षा व परामर्श के लिए डॉ. ${ctx.doctorName} (${ctx.doctorRoom || 'OPD Room 204'}) के पास जाएँ।`;
  }

  if (q.includes('where') || q.includes('kahan') || q.includes('kidhar') || q.includes('jaana') || q.includes('next')) {
    if (ctx.currentStop) {
      return `आप सबसे पहले ${ctx.currentStop.room} (${ctx.currentStop.floor}) में ${ctx.currentStop.testName} के लिए जाएँ। वहाँ केवल ${ctx.currentStop.patientsAhead} मरीज आगे हैं और लगभग ~${ctx.currentStop.estimatedWaitMinutes} मिनट का समय लगेगा।`;
    }
    return `कृपया ओपीडी रूम ${ctx.doctorRoom || '204'} में डॉ. ${ctx.doctorName} से परामर्श लें।`;
  }

  if (q.includes('why') || q.includes('skip') || q.includes('kyu') || q.includes('time') || q.includes('order')) {
    return `Q-Care का स्मार्ट एल्गोरिदम आपको लंबी कतारों से बचाकर सबसे खाली कमरे में पहले भेजता है। इससे आपका 30 से 45 मिनट का कीमती समय बचता है!`;
  }

  if (q.includes('fasting') || q.includes('water') || q.includes('pani') || q.includes('khana') || q.includes('diet')) {
    return `फास्टिंग ब्लड टेस्ट के लिए खाना न खाएँ, सादा पानी पी सकते हैं। यदि आपका अल्ट्रासाउंड टेस्ट है, तो पूरा ब्लैडर (पानी पीना) आवश्यक है।`;
  }

  if (q.includes('report') || q.includes('result') || q.includes('रिपोर्ट')) {
    if (ctx.completedReports.length > 0) {
      return `आपकी ${ctx.completedReports.length} रिपोर्ट(s) तैयार हैं और डॉक्टर की स्क्रीन पर सिंक हो चुकी हैं। डॉक्टर फाइनल रिव्यू में इनपर चर्चा करेंगे।`;
    }
    return `जैसे ही लैब में जांच पूरी होगी, आपकी डिजिटल रिपोर्ट तुरंत आपके बोर्डिंग पास पर दिखाई देगी।`;
  }

  if (ctx.currentStop) {
    return `आपका अगला कदम ${ctx.currentStop.room} में ${ctx.currentStop.testName} है (~${ctx.currentStop.estimatedWaitMinutes} मिनट प्रतीक्षा)। किसी भी सहायता के लिए मैं यहाँ हूँ!`;
  }

  return `नमस्ते ${ctx.patientName.split(' ')[0]} जी! मैं Q-Bie हूँ। मैं आपकी सुरक्षित और त्वरित अस्पताल यात्रा में मदद के लिए हमेशा तैयार हूँ।`;
}
