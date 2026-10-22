/**
 * Hospital Audio Chime & Dual-Lingual Voice Synthesizer
 * 
 * Invariants:
 * 1. Web Audio dual-tone hospital chime strictly 880Hz -> 440Hz harmonic tones.
 * 2. Web Speech API dual-lingual (English + Hindi) broadcast.
 * 3. Graceful abort of previous utterances to prevent speech overlap.
 */

class HospitalAudioEngine {
  private ctx: AudioContext | null = null;
  private currentAnnouncementId: number = 0;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private speechListeners = new Set<(isPlaying: boolean) => void>();

  public onSpeechStatus(listener: (isPlaying: boolean) => void): () => void {
    this.speechListeners.add(listener);
    return () => this.speechListeners.delete(listener);
  }

  private notifySpeechStatus(isPlaying: boolean): void {
    this.speechListeners.forEach(fn => fn(isPlaying));
  }

  private getBestVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      return (
        voices.find(v => v.lang.toLowerCase() === langPrefix.toLowerCase()) ||
        voices.find(v => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase())) ||
        null
      );
    } catch {
      return null;
    }
  }

  /**
   * Instantly stops any ongoing voice synthesis and audio playback.
   */
  public stopAll(): void {
    this.currentAnnouncementId++;
    this.notifySpeechStatus(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe catch for browser speech API edge cases
      }
    }
  }

  /**
   * Plays the official dual-tone hospital notification chime:
   * Tone 1: 880 Hz (A5)
   * Tone 2: 440 Hz (A4)
   */
  public playChime(): void {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: 880 Hz (High chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 440 Hz (Hospital harmonic resolution)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.22);
      gain2.gain.setValueAtTime(0, now + 0.22);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.26);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.85);
    } catch {
      // Audio playback might be deferred by browser policy before initial gesture
    }
  }

  /**
   * Broadcasts token call with Web Audio dual chime (880Hz -> 440Hz)
   * followed by dual-lingual TTS announcement (English then Hindi).
   */
  public announceToken(
    tokenNumber: string,
    counterName: string,
    roomNo: string,
    patientName?: string
  ): void {
    this.stopAll();
    this.playChime();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const myId = ++this.currentAnnouncementId;
    const cleanPatient = patientName && patientName.trim().length > 0 ? patientName.trim() : '';
    const cleanRoom = roomNo.replace(/[()]/g, '').trim();

    // Natural token pronunciation: e.g. "B 14" instead of "B minus 14"
    const naturalToken = tokenNumber.replace(/[-_]/g, ' ').trim();

    const enText = cleanPatient
      ? `Token ${naturalToken}. ${cleanPatient}, please proceed to ${cleanRoom}, ${counterName}.`
      : `Token ${naturalToken}, please proceed to ${cleanRoom}, ${counterName}.`;

    const hiText = cleanPatient
      ? `टोकन ${naturalToken}. ${cleanPatient} जी, कृपया ${cleanRoom}, ${counterName} में जाएं।`
      : `टोकन ${naturalToken}, कृपया ${cleanRoom}, ${counterName} में जाएं।`;

    const speakSequence = () => {
      if (myId !== this.currentAnnouncementId) return;

      try {
        const enUtterance = new SpeechSynthesisUtterance(enText);
        enUtterance.rate = 0.95;
        enUtterance.lang = 'en-IN';
        const enVoice = this.getBestVoice('en-IN') || this.getBestVoice('en');
        if (enVoice) enUtterance.voice = enVoice;

        this.notifySpeechStatus(true);

        enUtterance.onend = () => {
          if (myId !== this.currentAnnouncementId) return;
          setTimeout(() => {
            if (myId !== this.currentAnnouncementId) return;
            try {
              const hiUtterance = new SpeechSynthesisUtterance(hiText);
              hiUtterance.rate = 0.92;
              hiUtterance.lang = 'hi-IN';
              const hiVoice = this.getBestVoice('hi-IN') || this.getBestVoice('hi');
              if (hiVoice) hiUtterance.voice = hiVoice;

              hiUtterance.onend = () => {
                if (myId === this.currentAnnouncementId) {
                  this.notifySpeechStatus(false);
                }
              };
              hiUtterance.onerror = () => {
                if (myId === this.currentAnnouncementId) {
                  this.notifySpeechStatus(false);
                }
              };

              window.speechSynthesis.speak(hiUtterance);
            } catch {
              this.notifySpeechStatus(false);
            }
          }, 350);
        };

        enUtterance.onerror = () => {
          if (myId === this.currentAnnouncementId) {
            this.notifySpeechStatus(false);
          }
        };

        window.speechSynthesis.speak(enUtterance);
      } catch {
        this.notifySpeechStatus(false);
      }
    };

    // 500ms delay for chime to finish reverberating
    setTimeout(() => {
      if (myId === this.currentAnnouncementId) {
        speakSequence();
      }
    }, 500);
  }

  /**
   * Spoken guidance narration for the Patient Mobile Boarding Pass
   */
  public narratePatientBoardingPass(
    language: 'en' | 'hi',
    patientName: string,
    roomNo: string,
    testName: string,
    peopleAhead: number,
    estMinutes: number,
    preparationInstruction?: string
  ): void {
    this.stopAll();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const myId = ++this.currentAnnouncementId;
    let textToSpeak = '';

    if (language === 'hi') {
      textToSpeak = `${patientName} जी, अभी कमरा नंबर ${roomNo}, ${testName} के लिए जाएं। आपके आगे ${peopleAhead} लोग हैं, लगभग ${estMinutes} मिनट का समय लगेगा।`;
      if (preparationInstruction) {
        textToSpeak += ` ध्यान दें: ${preparationInstruction}।`;
      }
    } else {
      textToSpeak = `Hello ${patientName}. Please proceed to Room ${roomNo} for ${testName}. There are ${peopleAhead} people ahead of you, estimated wait is ${estMinutes} minutes.`;
      if (preparationInstruction) {
        textToSpeak += ` Instruction: ${preparationInstruction}.`;
      }
    }

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.93;
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      const voice = this.getBestVoice(utterance.lang) || this.getBestVoice(language);
      if (voice) utterance.voice = voice;

      this.notifySpeechStatus(true);
      utterance.onend = () => {
        if (myId === this.currentAnnouncementId) {
          this.notifySpeechStatus(false);
        }
      };
      utterance.onerror = () => {
        if (myId === this.currentAnnouncementId) {
          this.notifySpeechStatus(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.notifySpeechStatus(false);
    }
  }
}

export const hospitalAudio = new HospitalAudioEngine();
