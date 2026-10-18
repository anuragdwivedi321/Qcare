# CityCare Hospital — Diagnostic Queue & Clinical Portal 🏥

An authentic, minimalist clinical operations platform for multi-department outpatient flow and dynamic diagnostic queue routing (inspired by modern EMR systems).

When patients are prescribed multiple investigations (e.g. Complete Blood Count, Fasting Blood Sugar, 12-Lead ECG, Digital Chest X-Ray, Abdominal Ultrasound), traditional hospitals force them to wait in sequential order. A patient may wait 45 minutes in a crowded phlebotomy queue while ECG and X-Ray bays sit idle.

The dynamic queue engine continuously calculates the lowest-wait route for each patient, directing them to empty diagnostic bays first while congested queues clear out.

---

## 🏛️ Architecture & Portals

### 1. Authentic Portal Gate (`AuthScreen.tsx`)
- **Patient Access**: Login via UHID (e.g. `QC-1082`, `QC-2026-9411`) or registered mobile number. Includes 1-click test patient profiles for immediate demonstration.
- **Hospital Staff Access**:
  - **Doctor OPD Access**: 1-click login for consulting physicians (e.g. Dr. Sarah Khan - OPD Room 12, Dr. Arvind Swaminathan - Room OPD-204).
  - **Laboratory Counter Access**: 1-click login for diagnostic bays (Phlebotomy Bay Alpha, ECG Station 1, Radiology Bay 1, etc.).
- Session persistence in local state with user profile and sign-out controls.

### 2. Patient Portal (`PatientView.tsx`)
- **Immediate Direct Directive**: Answers **"Where should I go right now?"** with exact counter, room number, projected wait time, and plain-language routing rationale.
- **Investigation Timeline**: Step-by-step progress tracking with real-time statuses (`Completed`, `In Progress`, `Up Next`, `Waiting in Queue`).
- **Clinical Diagnostic Reports**: Standard medical laboratory sheet with biological reference ranges, observed values, technician remarks, clinician signature, and print capability.
- **Hospital Directory**: Clean room and floor guide.

### 3. Doctor Portal (`DoctorView.tsx`)
- **Today's OPD Queue**: Real-time outpatient list with diagnostic progress indicators.
- **Clinical Chart & Prescriptions**: Modal to issue hospital lab investigations with preparation requirements.
- **Report Review & Sign-Off**: 1-click clinical verification and notes sign-off.

### 4. Lab Technician Station (`LabView.tsx`)
- **Station Selector**: Switch between diagnostic bays (Blood Collection, ECG, Radiology, Ultrasound).
- **Calling Console**: Call patient tokens with hospital chime and voice PA announcement.
- **Results Entry**: Enter clinical parameter values and biological reference flags.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Design System**: Minimalist Hospital Aesthetics (Cobalt Blue `#1d4ed8`, Crisp Whites `#ffffff`, Slate `#0f172a`)
- **Audio**: Dual-tone procedural Web Audio hospital chime + Web Speech synthesis
- **Testing**: Vitest (`npm test`)

---

## 🚀 Commands

```bash
# Run unit test suite
npm test

# Check TypeScript types
npx tsc --noEmit

# Production build
npm run build
```
