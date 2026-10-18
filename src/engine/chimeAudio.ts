/**
 * Hospital Chime & Token Voice Synthesizer
 * Uses native Web Audio API for harmonic dual-tone hospital chime
 * and Web Speech API for automated voice calling.
 */

class HospitalAudioEngine {
  private ctx: AudioContext | null = null;
  private currentAnnouncementId: number = 0;

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Instantly stops any ongoing voice synthesis, audio queues, and pending repetitions
   */
  public stopAll() {
    this.currentAnnouncementId++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore cancellation error
      }
    }
  }

  /**
   * Plays a crisp, gentle hospital notification chime (F5 -> C6 harmonic ding-dong)
   */
  public playChime() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: F5 (698.46 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: C6 (1046.50 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.25);
      gain2.gain.setValueAtTime(0, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.29);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);
    } catch {
      // Audio might be blocked by browser autoplay policy before user interaction
    }
  }

  /**
   * Announces a token call with spoken audio:
   * 1. Instantly cancels any prior voice so rapid clicks speak ONLY the active token.
   * 2. Speaks: "Token [token], [patientName], please proceed to [counterName], [room]."
   * 3. Repeats EXACTLY twice (2 times) and then terminates.
   */
  public announceToken(tokenNumber: string, counterName: string, room: string, patientName?: string) {
    // 1. Immediately abort any ongoing speech from earlier calls
    this.stopAll();

    // 2. Play chime
    this.playChime();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const myId = ++this.currentAnnouncementId;

    // Readable spelled-out token (e.g. "R A D 1 0 2")
    const formattedToken = tokenNumber.split('').join(' ');
    const cleanPatient = patientName && patientName !== 'Walk-in' && patientName.trim().length > 0
      ? patientName.trim()
      : '';
    const cleanRoom = room.replace(/\(.*\)/g, '').trim();

    // Natural hospital calling announcement
    const textToSpeak = cleanPatient
      ? `Token ${formattedToken}, ${cleanPatient}, please enter ${counterName}, ${cleanRoom}.`
      : `Token ${formattedToken}, please proceed to ${counterName}, ${cleanRoom}.`;

    const speakOnce = (repetition: number) => {
      // If a newer announcement has started, cancel this execution
      if (myId !== this.currentAnnouncementId) return;

      try {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        utterance.onend = () => {
          if (myId !== this.currentAnnouncementId) return;

          // Repeat once more (total 2 times), then stop!
          if (repetition === 1) {
            setTimeout(() => {
              if (myId === this.currentAnnouncementId) {
                speakOnce(2);
              }
            }, 650);
          }
        };

        utterance.onerror = () => {
          // graceful fallback
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // speech API error fallback
      }
    };

    // Give chime 550ms before speech starts
    setTimeout(() => {
      if (myId === this.currentAnnouncementId) {
        speakOnce(1);
      }
    }, 550);
  }
}

export const hospitalAudio = new HospitalAudioEngine();
