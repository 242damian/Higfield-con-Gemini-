/**
 * HIGHFIELD - Web Audio API Synthesizer
 * Generates atmospheric cosmic soundscapes, lofi space ambient chords for Zen Mode,
 * Earth beacon radio intercepts, relic discoveries, and pixel-art sound effects procedurally.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  // Zen Mode Lo-Fi generator
  private isZenPlaying: boolean = false;
  private zenTimer: number | null = null;
  private zenGain: GainNode | null = null;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isInitialized = true;
      this.startCosmicAmbience();
    } catch {
      // Audio context might fail if not supported or blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isInitialized) {
      this.init();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    if (this.zenGain && this.ctx) {
      this.zenGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startCosmicAmbience() {
    if (!this.ctx || this.isMuted) return;

    try {
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.filterNode = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note

      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(3, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, this.ctx.currentTime);

      this.droneOsc1.connect(this.filterNode);
      this.droneOsc2.connect(this.filterNode);
      this.filterNode.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      lfo.start();
    } catch {
      // ignore
    }
  }

  public playFootstep() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  public playDialogueBlip(pitchOffset: number = 0) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 340 + pitchOffset * 25 + Math.random() * 20;
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  public playInteractChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {
      // ignore
    }
  }

  public playCometSwoosh() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  public playWebWeaveChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 659.25, 880.0, 1046.5, 1318.5]; // D5, E5, A5, C6, E6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.045, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.6);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Earth Beacon Radio Intercept Tone (Pulsing Morse-like telemetry chime)
   */
  public playBeaconIntercept() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const sequence = [1200, 1500, 1800, 1500, 2200];
      sequence.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.035, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.12);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Lunar Relic Excavation discovery fanfare
   */
  public playRelicExcavationChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [440, 554.37, 659.25, 880, 1108.73]; // A Major triad arpeggio
      chords.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.05, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.8);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Lo-Fi Space Ambient generator for Zen Mode
   */
  public toggleZenLofi(enable?: boolean) {
    this.isZenPlaying = enable !== undefined ? enable : !this.isZenPlaying;

    if (this.isZenPlaying) {
      this.startZenSequence();
    } else {
      this.stopZenSequence();
    }
    return this.isZenPlaying;
  }

  private startZenSequence() {
    if (this.zenTimer) clearInterval(this.zenTimer);

    // Play a gentle warm chord every 4 seconds
    const chordProgressions = [
      [220, 277.18, 329.63, 440], // A Major 7
      [196, 246.94, 293.66, 392], // G Major 7
      [174.61, 220, 261.63, 349.23], // F Major 7
      [164.81, 207.65, 246.94, 329.63], // E minor 7
    ];
    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.ctx || this.isMuted || !this.isZenPlaying) return;
      try {
        const now = this.ctx.currentTime;
        const currentChord = chordProgressions[chordIndex % chordProgressions.length];
        chordIndex++;

        currentChord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.02, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(now);
          osc.stop(now + 3.8);
        });
      } catch {
        // ignore
      }
    };

    playNextChord();
    this.zenTimer = window.setInterval(playNextChord, 4000);
  }

  private stopZenSequence() {
    if (this.zenTimer) {
      clearInterval(this.zenTimer);
      this.zenTimer = null;
    }
  }
}

export const soundManager = new AudioEngine();
