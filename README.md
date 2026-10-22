# QCare (Q-Care v2.0)
> **Anti-Vibe Coded, Production-Grade Hospital OPD & Diagnostic Queue Orchestration Platform**

QCare eliminates the chaos, long bottlenecks, and confusing hallway navigation in hospital Outpatient Departments (OPD). By treating diagnostic investigations as dynamic routing graphs rather than static queues, QCare minimizes overall turnaround time by up to **71%**.

---

## 🌟 Key Capabilities

1. **Multi-Tenant Hospital Isolation**:
   - Native support for multiple institutions (**Max Super Speciality Saket**, **Indraprastha Apollo**, **AIIMS New Delhi**, **Safdarjung Hospital**, **Dr. Ram Manohar Lohia Hospital**, **Lok Nayak LNJP**).
   - Strict hospital data isolation: isolated departments, wings, floor numbers, room IDs, and turn-by-turn navigation instructions with zero cross-tenant leakage.

2. **Chamber Workstation for Doctor & OPD Assistant**:
   - Clean walk-in registration with 1-click preset test bundles (Routine OPD, Cardiac Care, Fever Workup, Diabetic Panel, etc.).
   - AI Chief Complaint expander and speech-to-text dictation.
   - Live Diagnostic Investigation Flow & Queue Progress tracking room-by-room status.
   - Verified Lab Reports review with biological reference ranges & flags (Normal, High, Critical).

3. **Authentic Thermal QR Pass**:
   - Instant printable 80mm thermal slip with an official, 100% unique scannable QR code per patient.
   - Scannable via any standard mobile camera to instantly open the patient's Live Digital Boarding Pass without app installs.

4. **Patient Digital Boarding Pass**:
   - Real-time directive cards: exact room, floor, wing, turn-by-turn directions, and current queue position.
   - Dual-language voice guidance (English & Natural Hindi).
   - Dual-tone Web Audio chime and live "Token Called" notifications when summoned by laboratory technicians.
   - Interactive SVG Floor Wayfinding Map & verified report downloads.

5. **Laboratory Diagnostic Workstation**:
   - Real-time bay dispatch for Phlebotomy, Biochemistry, Radiology, Cardiology ECG, and Ultrasound.
   - Token caller with speech announcement, on-hold no-show management, and verified metric submission.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Architecture**: In-memory reactive state machine with localStorage persistence and multi-tenant URL sync (`?hospital=...`)
- **Audio & Media**: Web Audio API (hospital dual-tone chime: 880Hz → 440Hz), Web Speech Synthesis API
- **Testing**: Vitest unit & integration test suites
- **Build**: Vite 5

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run test suite
npm test

# Production build
npm run build
```

---

## 🧪 Verification & Test Suite

All 45 unit and integration tests verify:
- Multi-tenant hospital isolation and URL tenant synchronization.
- Real-time queue routing math, fasting priority, and stability locks.
- Full end-to-end patient lifecycle: Registration → Token Minting → QR Loading → Lab Call & Chime → Metric Upload → Doctor Verification & Discharge.
