/**
 * Hospital Chime & Token Voice Synthesizer
 * Uses native Web Audio API for harmonic dual-tone hospital chime
 * and Web Speech API for automated voice calling.
 */

class HospitalAudioEngine {
  private ctx: AudioContext | null = null;

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
   * Announces a token call with spoken audio
   */
  public announceToken(tokenNumber: string, counterName: string, room: string) {
    this.playChime();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(
            `Token ${tokenNumber.split('').join(' ')}, please proceed to ${counterName}, ${room}`
          );
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore speech error
        }
      }, 700);
    }
  }
}

export const hospitalAudio = new HospitalAudioEngine();
