/**
 * Q-Bie AI Engine - Powered by Groq Cloud API
 * Real-time patient hospital companion with dynamic patient context & multi-key rotation.
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

// Groq API keys loaded safely from environment variables (comma-separated or single)
const envRawKeys = (
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_GROQ_API_KEY) ||
  ''
).trim();

export const GROQ_API_KEYS: string[] = envRawKeys
  ? envRawKeys.split(',').map(k => k.trim()).filter(Boolean)
  : [];

// Active key index for round-robin rotation
let activeKeyIndex = 0;

export function getActiveGroqKey(): string {
  return GROQ_API_KEYS[activeKeyIndex % GROQ_API_KEYS.length];
}

export function rotateGroqKey(): string {
  activeKeyIndex = (activeKeyIndex + 1) % GROQ_API_KEYS.length;
  return getActiveGroqKey();
}

// Priority model list verified live on Groq
const MODEL_CASCADE = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
];

/**
 * Universal Groq Caller with Key Rotation & Model Cascade
 */
async function callGroqWithRotation(
  systemPrompt: string,
  userQuestion: string
): Promise<string | null> {
  const totalKeys = GROQ_API_KEYS.length;

  for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
    const currentKey = getActiveGroqKey();

    for (const model of MODEL_CASCADE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userQuestion }
            ],
            max_tokens: 250,
            temperature: 0.6
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return content;
          }
        } else if (response.status === 429 || response.status === 401 || response.status >= 500) {
          // Key rate-limited, unauthorized, or server error -> rotate immediately
          rotateGroqKey();
          break;
        }
      } catch {
        // Network timeout / connection error / aborted -> try next model or key
        continue;
      }
    }
  }

  return null;
}

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
 * Call Groq API with automatic model cascade and key rotation
 */
export async function askQBieAI(
  userQuestion: string,
  patientContext: QBiePatientContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(patientContext);
  const result = await callGroqWithRotation(systemPrompt, userQuestion);
  if (result) return result;

  // Fallback to local clinical engine if all keys/models fail
  return getLocalClinicalFallback(userQuestion, patientContext);
}

/**
 * Public Hospital & Queue Assistant for Landing / Login page
 */
export async function askQBiePublicAI(
  userQuestion: string,
  lang: 'en' | 'hi' = 'en'
): Promise<string> {
  const systemPrompt = `You are Qbie (क्यूबी), the official intelligent hospital and diagnostic queue guide mascot for QCare.
You are helping patients, visitors, and hospital staff on the QCare portal.

=== HOSPITAL & QCARE SYSTEM KNOWLEDGE ===
- QCare is an intelligent outpatient queue and diagnostic flow orchestration system.
- OPD Hours: Mon–Sat, 08:30 AM – 02:00 PM. Emergency and critical diagnostics operate 24x7.
- Fasting Blood Tests (Sugar Fasting, Lipid Profile): Requires 8 to 10 hours overnight fasting. Plain water is permitted.
- Pelvic / Lower Abdomen Ultrasound: Requires a full urinary bladder (drink 4-5 glasses of water 30-45 minutes before test).
- Complete Blood Count (CBC) & Routine Urine: No fasting required. Results usually ready within 45 minutes.
- How to get a Token: Walk into the OPD desk. The doctor or assistant selects your tests and gives you a printed thermal receipt containing your official QR code and token number.
- How to track turn on phone: No app download needed. Open your smartphone camera and scan the QR code on your printed receipt. It opens your real-time diagnostic boarding pass showing your assigned room, patients ahead, and estimated wait time.
- Dynamic Queue Routing: QCare continuously routes patients to whichever diagnostic bay (blood, x-ray, ultrasound, ECG) has the shortest wait, saving 30-45 minutes per visit.
- Emergency Helpline: Dial 108 or report immediately to the Ground Floor Emergency Bay.

=== CONVERSATIONAL PROTOCOL & TONE ===
- Speak in natural, warm, reassuring Hinglish (or English if the user writes in English, or Hindi if in Hindi).
- For simple greetings ("hello", "hi", "namaste", "hey"): Greet them warmly and ask how you can help them navigate the hospital, OPD consultation, or diagnostic tests. Example: "Hello! Main Qbie hoon, QCare hospital guide. Aaj OPD timings, test guidelines ya queue ke baare mein kya janna chahte hain?"
- For wellbeing questions ("kaise ho", "how are you", "kya haal"): Say you are doing great and ask how you can assist their hospital visit. Example: "Main bilkul badhiya hoon, shukriya! Aap bataiye, OPD ya diagnostic test ke baare mein kya jankari chahiye?"
- Keep all answers concise: 1 to 3 sentences maximum.
- Be clinically accurate. Never prescribe medicines or give medical dosages. Guide them to consult the OPD doctor for clinical prescription inquiries.`;

  const result = await callGroqWithRotation(systemPrompt, userQuestion);
  if (result) return result;

  return getPublicClinicalFallback(userQuestion, lang);
}

/**
 * Fallback for public hospital guidance
 */
export function getPublicClinicalFallback(question: string, lang: 'en' | 'hi'): string {
  const q = question.toLowerCase().trim();

  // 1. Well-being inquiries (MUST be checked before general greetings)
  if (
    q.includes('kaise ho') ||
    q.includes('kese ho') ||
    q.includes('how are you') ||
    q.includes('kya hal') ||
    q.includes('kya haal') ||
    q.includes('sab theek')
  ) {
    return lang === 'hi'
      ? 'मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद! आप बताएं, अस्पताल की जांच, टोकन या ओपीडी के बारे में क्या जानकारी चाहिए?'
      : 'Main bilkul badhiya hoon, shukriya! Aap bataiye, hospital consultation, diagnostic test ya queue token ke baare mein kya madad chahiye?';
  }

  // 2. Pure greetings
  if (
    q === 'hello' ||
    q === 'hi' ||
    q === 'hey' ||
    q === 'namaste' ||
    q === 'pranam' ||
    q === 'good morning' ||
    q === 'good afternoon' ||
    q === 'good evening' ||
    q.startsWith('hello') ||
    q.startsWith('hi ') ||
    q.startsWith('hey ')
  ) {
    return lang === 'hi'
      ? 'नमस्ते! मैं Qbie हूँ, QCare अस्पताल एवं कतार गाइड। आज मैं आपकी क्या सहायता कर सकता हूँ?'
      : 'Hello! Main Qbie hoon, QCare hospital guide. Aaj main aapki kya madad kar sakta hoon? OPD timings, blood test guidelines ya live pass ke baare mein pooch sakte hain.';
  }

  // 3. Fasting inquiries
  if (
    q.includes('fasting') ||
    q.includes('sugar') ||
    q.includes('lipid') ||
    q.includes('khana') ||
    q.includes('bhookhe') ||
    q.includes('उपवास') ||
    q.includes('खाली पेट')
  ) {
    return lang === 'hi'
      ? 'फास्टिंग ब्लड शुगर और लिपिड प्रोफाइल के लिए 8 से 10 घंटे का उपवास (खाली पेट) आवश्यक है। आप सादा पानी पी सकते हैं।'
      : 'Fasting Blood Sugar aur Lipid Profile ke liye 8 se 10 ghante overnight fasting zaroori hai. Saada paani peene ki anumati hai.';
  }

  // 4. Ultrasound inquiries
  if (
    q.includes('ultrasound') ||
    q.includes('usg') ||
    q.includes('water') ||
    q.includes('pani') ||
    q.includes('पानी') ||
    q.includes('अल्ट्रासाउंड')
  ) {
    return lang === 'hi'
      ? 'पेल्विक या एब्डोमेन अल्ट्रासाउंड के लिए ब्लैडर भरा होना जरूरी है। जांच से 30-45 मिनट पहले 4-5 गिलास पानी पिएं।'
      : 'Pelvic ya abdomen ultrasound ke liye urinary bladder bhara hona zaroori hai. Scan se 30-45 minute pehle 4-5 glass paani zaroor piyein.';
  }

  // 5. Token / Receipt inquiries
  if (
    q.includes('token') ||
    q.includes('receipt') ||
    q.includes('parchi') ||
    q.includes('pass') ||
    q.includes('टोकन') ||
    q.includes('पर्ची')
  ) {
    return lang === 'hi'
      ? 'ओपीडी कंसल्टेशन के बाद डॉक्टर या सहायक आपकी पर्ची प्रिंट करते हैं, जिसमें आपका टोकन नंबर और लाइव क्यूआर कोड होता है।'
      : 'OPD desk par doctor ya assistant tests prescribe karne ke baad thermal receipt print karte hain, jisme aapka token aur live QR pass hota hai.';
  }

  // 6. QR Scan inquiries
  if (
    q.includes('scan') ||
    q.includes('phone') ||
    q.includes('mobile') ||
    q.includes('camera') ||
    q.includes('फोन') ||
    q.includes('स्कैन')
  ) {
    return lang === 'hi'
      ? 'किसी ऐप की जरूरत नहीं है! अपने फोन के कैमरे से पर्ची का क्यूआर कोड स्कैन करें, आपका लाइव बोर्डिंग पास तुरंत खुल जाएगा।'
      : 'Kisi app download ki zaroorat nahi hai! Apne phone camera se receipt ka QR code scan karein, live boarding pass turant open ho jayega.';
  }

  // 7. OPD Timings
  if (
    q.includes('time') ||
    q.includes('timing') ||
    q.includes('hours') ||
    q.includes('samay') ||
    q.includes('समय') ||
    q.includes('कब')
  ) {
    return lang === 'hi'
      ? 'सामान्य ओपीडी परामर्श सुबह 08:30 से दोपहर 02:00 बजे तक है। आपातकालीन सेवाएं एवं डायग्नोस्टिक 24x7 उपलब्ध हैं।'
      : 'General OPD timings subah 08:30 AM se dopahar 02:00 PM tak hain. Emergency aur critical diagnostics 24x7 chalti hain.';
  }

  // 8. Emergency / 108
  if (
    q.includes('emergency') ||
    q.includes('108') ||
    q.includes('आपातकालीन') ||
    q.includes('urgent')
  ) {
    return lang === 'hi'
      ? 'आपातकालीन स्थिति में तुरंत 108 पर कॉल करें या ग्राउंड फ्लोर पर इमरजेंसी वार्ड में संपर्क करें।'
      : 'Emergency sthiti mein turant 108 dial karein ya Ground Floor Emergency desk par report karein.';
  }

  return lang === 'hi'
    ? 'नमस्ते! मैं Qbie हूँ, QCare अस्पताल गाइड। आप ओपीडी समय, खाली पेट जांच, टोकन या टेस्ट के बारे में कोई भी सवाल पूछ सकते हैं!'
    : 'Main Qbie hoon, QCare hospital guide. Aap OPD timings, fasting rules, sample collection ya live QR pass ke baare mein koi bhi sawal pooch sakte hain!';
}

/**
 * Deterministic local fallback in case of offline/network issues
 */
function getLocalClinicalFallback(question: string, ctx: QBiePatientContext): string {
  const q = question.toLowerCase().trim();

  if (ctx.calledToken) {
    return `🚨 टोकन #${ctx.calledToken.tokenNumber} बुलाया जा चुका है! कृपया तुरंत अपने निर्धारित कमरे में अंदर जाएँ, स्टाफ आपका इंतजार कर रहा है।`;
  }

  if (ctx.allCompleted) {
    return `🎉 आपकी सभी जांचें पूरी हो चुकी हैं! कृपया अंतिम रिपोर्ट समीक्षा व परामर्श के लिए डॉ. ${ctx.doctorName} (${ctx.doctorRoom || 'OPD Room 204'}) के पास जाएँ।`;
  }

  // 1. Well-being inquiries
  if (
    q.includes('kaise ho') ||
    q.includes('kese ho') ||
    q.includes('how are you') ||
    q.includes('kya hal') ||
    q.includes('kya haal')
  ) {
    return `नमस्ते ${ctx.patientName.split(' ')[0]} जी! मैं बिल्कुल ठीक हूँ। आपकी आज की जांचों में मदद के लिए तैयार हूँ।`;
  }

  // 2. Pure greetings
  if (
    q === 'hello' ||
    q === 'hi' ||
    q === 'hey' ||
    q === 'namaste' ||
    q.startsWith('hello') ||
    q.startsWith('hi ')
  ) {
    return `नमस्ते ${ctx.patientName.split(' ')[0]} जी! मैं Qbie हूँ। आज आपकी जांच या कतार से जुड़ा क्या सवाल है?`;
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
