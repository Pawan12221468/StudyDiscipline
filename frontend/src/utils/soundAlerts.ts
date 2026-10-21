/**
 * Synthesized gentle audio notifications using Web Audio API
 * No external audio files required, completely self-contained.
 */

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Gentle two-tone chime for timer and pomodoro completion
   */
  public playCompletionChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: 880.00 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.18);
      gain2.gain.setValueAtTime(0.001, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.22, now + 0.23);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.95);
    } catch (err) {
      console.warn('Audio playback not permitted or unavailable:', err);
    }
  }

  /**
   * Subtle tick or click sound for button interactions
   */
  public playSoftTick(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  /**
   * Harmonious ascending 3-note chime for reminders and break-ends
   * Notes: A4 (440Hz) -> C#5 (554Hz) -> E5 (659Hz)
   */
  public playAttentionChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 440.0, time: 0.0, duration: 0.35, gain: 0.16 },
        { freq: 554.37, time: 0.12, duration: 0.35, gain: 0.18 },
        { freq: 659.25, time: 0.24, duration: 0.65, gain: 0.2 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        g.gain.setValueAtTime(0.001, now + time);
        g.gain.exponentialRampToValueAtTime(gain, now + time + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  /**
   * Gentle reminder chime
   */
  public playGentleNotice(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio context might be restricted
    }
  }

  private isAlarmLoopActive: boolean = false;
  private alarmIntervalId: any = null;
  private activeAlarmOscillators: OscillatorNode[] = [];
  private activeAlarmGain: GainNode | null = null;

  /**
   * Start continuous repeating danger alarm siren (loops until mobile is put away)
   */
  public startDangerAlarmLoop(): void {
    if (this.isAlarmLoopActive) return;
    this.isAlarmLoopActive = true;

    // Trigger immediate danger siren burst
    this.playDangerSirenBurst();

    // Loop siren bursts continuously every 450ms
    this.alarmIntervalId = setInterval(() => {
      if (!this.isAlarmLoopActive) return;
      this.playDangerSirenBurst();
    }, 450);
  }

  /**
   * Stop continuous danger alarm loop immediately as soon as mobile leaves the frame
   */
  public stopDangerAlarmLoop(): void {
    if (!this.isAlarmLoopActive) return;
    this.isAlarmLoopActive = false;

    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }

    // Immediately silence active alarm gain node
    if (this.activeAlarmGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.activeAlarmGain.gain.cancelScheduledValues(now);
        this.activeAlarmGain.gain.setValueAtTime(this.activeAlarmGain.gain.value, now);
        this.activeAlarmGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
      } catch {
        // ignore
      }
    }

    this.activeAlarmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeAlarmOscillators = [];
  }

  /**
   * Single burst of urgent hazard alarm siren
   */
  private playDangerSirenBurst(): void {
    try {
      const ctx = this.getContext();
      if (!ctx || !this.isAlarmLoopActive) return;

      const now = ctx.currentTime;

      // 2 rapid, piercing danger siren sweeps
      const pulses = [
        { start: 0.0, dur: 0.18, freqStart: 950, freqEnd: 660, gain: 0.32 },
        { start: 0.20, dur: 0.20, freqStart: 1060, freqEnd: 720, gain: 0.35 },
      ];

      const masterGain = ctx.createGain();
      this.activeAlarmGain = masterGain;
      masterGain.connect(ctx.destination);

      pulses.forEach(({ start, dur, freqStart, freqEnd, gain }) => {
        if (!this.isAlarmLoopActive) return;

        const tStart = now + start;
        const tEnd = tStart + dur;

        // Sawtooth oscillator for rich, alarming danger timbre
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freqStart, tStart);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, tEnd);

        // Low-pass filter to shape punchy alarm buzzer
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, tStart);
        filter.Q.setValueAtTime(2.5, tStart);

        // Gain envelope for urgent punchy attack & decay
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, tStart);
        gainNode.gain.linearRampToValueAtTime(gain, tStart + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, tEnd);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(tStart);
        osc.stop(tEnd + 0.02);

        this.activeAlarmOscillators.push(osc);
        setTimeout(() => {
          const idx = this.activeAlarmOscillators.indexOf(osc);
          if (idx !== -1) this.activeAlarmOscillators.splice(idx, 1);
        }, (start + dur + 0.1) * 1000);
      });
    } catch (err) {
      console.warn('Audio playback error for danger alarm:', err);
    }
  }

  /**
   * One-shot distraction beep (for backward compatibility)
   */
  public playDistractionBeep(): void {
    this.playDangerSirenBurst();
  }
}

export const soundAlerts = new SoundAlertManager();
