/**
 * HIGHFIELD - Atmospheric Cosmic Soundscape Engine (Web Audio API)
 * Generates rich, procedurally-timed procedural cosmic ambiance:
 * - Sub-bass drifting cosmic drones & binaural oscillations
 * - Solar wind / cosmic breeze with slowly modulated bandpass pink noise
 * - Intermittent deep-space radio interference & telemetry blips
 * - Resonant crystalline pings (lunar crystal micro-resonances)
 * - Organic Poisson-distribution procedural scheduling (never repetitive)
 */

export interface SoundscapeSettings {
  enabled: boolean;
  masterVolume: number;
  droneVolume: number;
  windVolume: number;
  radioVolume: number;
  crystalsVolume: number;
}

export class AtmosphericSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // Master & layer gain nodes
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private radioGain: GainNode | null = null;
  private crystalGain: GainNode | null = null;

  // Drone oscillators
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private droneOscC: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Wind noise nodes
  private noiseBuffer: AudioBuffer | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;

  // Timers for procedural events
  private radioTimer: number | null = null;
  private crystalTimer: number | null = null;
  private windModTimer: number | null = null;

  private settings: SoundscapeSettings = {
    enabled: true,
    masterVolume: 0.12,
    droneVolume: 0.08,
    windVolume: 0.04,
    radioVolume: 0.03,
    crystalsVolume: 0.05,
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('highfield_soundscape_cfg');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('highfield_soundscape_cfg', JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  public init(existingCtx?: AudioContext) {
    if (this.isInitialized && this.ctx) return;

    try {
      if (existingCtx) {
        this.ctx = existingCtx;
      } else {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      this.setupMasterBus();
      this.generateNoiseBuffer();
      this.isInitialized = true;

      if (this.settings.enabled) {
        this.start();
      }
    } catch (e) {
      console.warn('Soundscape initialization notice:', e);
    }
  }

  private setupMasterBus() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Drone Layer
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(this.settings.droneVolume, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Wind Layer
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(this.settings.windVolume, this.ctx.currentTime);
    this.windGain.connect(this.masterGain);

    // Radio Interference Layer
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(this.settings.radioVolume, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    // Crystals Layer
    this.crystalGain = this.ctx.createGain();
    this.crystalGain.gain.setValueAtTime(this.settings.crystalsVolume, this.ctx.currentTime);
    this.crystalGain.connect(this.masterGain);
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of noise loop
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);

    // Pink noise generation algorithm
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isRunning && this.settings.enabled) {
      this.start();
    }
  }

  public start() {
    if (!this.ctx || this.isRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.isRunning = true;
      this.startDrones();
      this.startSolarWind();
      this.scheduleProceduralRadio();
      this.scheduleProceduralCrystals();
    } catch (e) {
      console.warn('Error starting cosmic soundscape:', e);
      this.isRunning = false;
    }
  }

  public stop() {
    if (!this.isRunning) return;

    this.stopDrones();
    this.stopSolarWind();

    if (this.radioTimer) {
      clearTimeout(this.radioTimer);
      this.radioTimer = null;
    }
    if (this.crystalTimer) {
      clearTimeout(this.crystalTimer);
      this.crystalTimer = null;
    }
    if (this.windModTimer) {
      clearInterval(this.windModTimer);
      this.windModTimer = null;
    }

    this.isRunning = false;
  }

  private startDrones() {
    if (!this.ctx || !this.droneGain) return;

    const now = this.ctx.currentTime;

    // Sub-bass root (A0 / 55Hz & subtle fifth / 82.4Hz)
    this.droneOscA = this.ctx.createOscillator();
    this.droneOscB = this.ctx.createOscillator();
    this.droneOscC = this.ctx.createOscillator();

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(140, now);
    this.droneFilter.Q.setValueAtTime(4, now);

    this.droneOscA.type = 'sine';
    this.droneOscA.frequency.setValueAtTime(55.0, now); // Fundamental A1

    this.droneOscB.type = 'triangle';
    this.droneOscB.frequency.setValueAtTime(55.25, now); // Slight binaural beating 0.25Hz

    this.droneOscC.type = 'sine';
    this.droneOscC.frequency.setValueAtTime(110.0, now); // Octave overtone A2

    this.droneOscA.connect(this.droneFilter);
    this.droneOscB.connect(this.droneFilter);
    this.droneOscC.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);

    this.droneOscA.start(now);
    this.droneOscB.start(now);
    this.droneOscC.start(now);

    // Subtle drift modulation
    const driftLfo = this.ctx.createOscillator();
    const driftGain = this.ctx.createGain();
    driftLfo.frequency.setValueAtTime(0.04, now); // 25s cycle
    driftGain.gain.setValueAtTime(45, now);
    driftLfo.connect(driftGain);
    driftGain.connect(this.droneFilter.frequency);
    driftLfo.start(now);
  }

  private stopDrones() {
    if (this.droneOscA) {
      try {
        this.droneOscA.stop();
        this.droneOscA.disconnect();
      } catch {
        // ignore
      }
      this.droneOscA = null;
    }
    if (this.droneOscB) {
      try {
        this.droneOscB.stop();
        this.droneOscB.disconnect();
      } catch {
        // ignore
      }
      this.droneOscB = null;
    }
    if (this.droneOscC) {
      try {
        this.droneOscC.stop();
        this.droneOscC.disconnect();
      } catch {
        // ignore
      }
      this.droneOscC = null;
    }
  }

  private startSolarWind() {
    if (!this.ctx || !this.noiseBuffer || !this.windGain) return;

    const now = this.ctx.currentTime;
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, now);
    this.windFilter.Q.setValueAtTime(2.5, now);

    this.windLfo = this.ctx.createOscillator();
    const windLfoGain = this.ctx.createGain();
    this.windLfo.frequency.setValueAtTime(0.07, now); // ~14 second wind swell
    windLfoGain.gain.setValueAtTime(160, now);
    this.windLfo.connect(windLfoGain);
    windLfoGain.connect(this.windFilter.frequency);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);

    this.windSource.start(now);
    this.windLfo.start(now);
  }

  private stopSolarWind() {
    if (this.windSource) {
      try {
        this.windSource.stop();
        this.windSource.disconnect();
      } catch {
        // ignore
      }
      this.windSource = null;
    }
    if (this.windLfo) {
      try {
        this.windLfo.stop();
        this.windLfo.disconnect();
      } catch {
        // ignore
      }
      this.windLfo = null;
    }
  }

  /**
   * Procedurally triggers subtle deep-space radio crackles & carrier blips
   */
  private scheduleProceduralRadio() {
    if (!this.isRunning && !this.settings.enabled) return;

    // Organic randomized interval between 7s and 22s
    const nextInterval = 7000 + Math.random() * 15000;

    this.radioTimer = window.setTimeout(() => {
      this.playProceduralRadioBurst();
      this.scheduleProceduralRadio();
    }, nextInterval);
  }

  public playProceduralRadioBurst() {
    if (!this.ctx || !this.radioGain || !this.settings.enabled) return;

    try {
      const now = this.ctx.currentTime;
      const burstType = Math.random();

      if (burstType < 0.45) {
        // Telemetry Frequency Chirp
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        const startFreq = 1200 + Math.random() * 800;
        const endFreq = startFreq + (Math.random() > 0.5 ? 400 : -400);

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.Q.setValueAtTime(6, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.radioGain);

        osc.start(now);
        osc.stop(now + 0.15);
      } else if (burstType < 0.8) {
        // Double pulse telemetry packet
        [0, 0.08].forEach((delay) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1760 + Math.random() * 100, now + delay);

          gain.gain.setValueAtTime(0.02, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.05);

          osc.connect(gain);
          gain.connect(this.radioGain!);

          osc.start(now + delay);
          osc.stop(now + delay + 0.06);
        });
      } else {
        // Cosmic Static Swell
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          noise.buffer = this.noiseBuffer;
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2400 + Math.random() * 1000, now);
          filter.Q.setValueAtTime(8, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.018, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.radioGain);

          noise.start(now);
          noise.stop(now + 0.7);
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Procedurally triggers crystalline pings (pentatonic micro-resonances)
   */
  private scheduleProceduralCrystals() {
    if (!this.isRunning && !this.settings.enabled) return;

    // Organic randomized interval between 5s and 16s
    const nextInterval = 5000 + Math.random() * 11000;

    this.crystalTimer = window.setTimeout(() => {
      this.playProceduralCrystalPing();
      this.scheduleProceduralCrystals();
    }, nextInterval);
  }

  public playProceduralCrystalPing() {
    if (!this.ctx || !this.crystalGain || !this.settings.enabled) return;

    try {
      const now = this.ctx.currentTime;
      // High celestial pentatonic notes (E6, G6, A6, B6, D7, E7)
      const celestialPitches = [1318.51, 1567.98, 1760.0, 1975.53, 2349.32, 2637.02, 3135.96];
      const pitch = celestialPitches[Math.floor(Math.random() * celestialPitches.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);

      // Resonant shimmering bell envelope
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2); // long airy ring

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.crystalGain);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch {
      // ignore
    }
  }

  public setMuted(muted: boolean): boolean {
    this.settings.enabled = !muted;
    this.saveSettings();

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.settings.enabled ? this.settings.masterVolume : 0,
        this.ctx.currentTime
      );
    }

    if (this.settings.enabled && !this.isRunning) {
      this.start();
    } else if (!this.settings.enabled && this.isRunning) {
      this.stop();
    }
    return this.settings.enabled;
  }

  public toggleMute(): boolean {
    return this.setMuted(this.settings.enabled);
  }

  public setMasterVolume(vol: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.masterGain && this.ctx && this.settings.enabled) {
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
    }
  }

  public setLayerVolume(layer: 'drone' | 'wind' | 'radio' | 'crystal', vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (layer === 'drone') {
      this.settings.droneVolume = clamped;
      if (this.droneGain && this.ctx) this.droneGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    } else if (layer === 'wind') {
      this.settings.windVolume = clamped;
      if (this.windGain && this.ctx) this.windGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    } else if (layer === 'radio') {
      this.settings.radioVolume = clamped;
      if (this.radioGain && this.ctx) this.radioGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    } else if (layer === 'crystal') {
      this.settings.crystalsVolume = clamped;
      if (this.crystalGain && this.ctx) this.crystalGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public getSettings(): SoundscapeSettings {
    return { ...this.settings };
  }

  public isSoundscapeRunning(): boolean {
    return this.isRunning && this.settings.enabled;
  }
}

export const soundscapeEngine = new AtmosphericSoundscapeEngine();
