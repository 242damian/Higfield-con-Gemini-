/**
 * HIGHFIELD - Advanced Voice Audio & Speech Synthesis Engine
 * Provides ultra-fluid Speech Synthesis (TTS) with natural voice ranking,
 * text purification (removing markdown and emoji artifacts for smooth cadence),
 * dynamic pitch and rate controls, and microphone speech recognition.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'unsupported' | 'error';
export type VoicePreset = 'NATURAL' | 'COSMIC' | 'DYNAMIC' | 'RETRO';

export interface VoiceSettings {
  pitch: number;
  rate: number;
  selectedVoiceURI: string | null;
  preset: VoicePreset;
  voiceEnabled: boolean;
}

export interface VoiceListenerCallback {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onStateChange: (state: VoiceState, message?: string) => void;
  onVoicesLoaded?: (voices: SpeechSynthesisVoice[]) => void;
}

const STORAGE_KEY_VOICE_CONFIG = 'highfield_voice_config_v2';

export class VoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private speechSynth: SpeechSynthesis | null = null;
  private voiceEnabled: boolean = true;
  private callback: VoiceListenerCallback | null = null;

  private pitch: number = 1.02;
  private rate: number = 1.06;
  private selectedVoiceURI: string | null = null;
  private preset: VoicePreset = 'NATURAL';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadSavedConfig();

    if (typeof window !== 'undefined') {
      // 1. Setup Speech Recognition
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'es-ES';

          this.recognition.onstart = () => {
            this.isListening = true;
            this.callback?.onStateChange('listening', 'Escuchando tu voz...');
          };

          this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const current = finalTranscript || interimTranscript;
            if (current && this.callback) {
              this.callback.onTranscript(current, Boolean(finalTranscript));
            }
          };

          this.recognition.onerror = (event: any) => {
            console.warn('Speech recognition notice:', event.error);
            this.isListening = false;
            this.callback?.onStateChange('idle', `Micrófono: ${event.error}`);
          };

          this.recognition.onend = () => {
            this.isListening = false;
            this.callback?.onStateChange('idle');
          };
        } catch (e) {
          console.warn('Speech recognition not available:', e);
        }
      }

      // 2. Setup Speech Synthesis
      if ('speechSynthesis' in window) {
        this.speechSynth = window.speechSynthesis;
        this.initVoices();
      }
    }
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pitch) this.pitch = parsed.pitch;
        if (parsed.rate) this.rate = parsed.rate;
        if (parsed.selectedVoiceURI) this.selectedVoiceURI = parsed.selectedVoiceURI;
        if (parsed.preset) this.preset = parsed.preset;
        if (parsed.voiceEnabled !== undefined) this.voiceEnabled = parsed.voiceEnabled;
      }
    } catch {
      // ignore
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem(
        STORAGE_KEY_VOICE_CONFIG,
        JSON.stringify({
          pitch: this.pitch,
          rate: this.rate,
          selectedVoiceURI: this.selectedVoiceURI,
          preset: this.preset,
          voiceEnabled: this.voiceEnabled,
        })
      );
    } catch {
      // ignore
    }
  }

  private initVoices() {
    if (!this.speechSynth) return;

    const populate = () => {
      this.cachedVoices = this.getRankedSpanishVoices();
      this.callback?.onVoicesLoaded?.(this.cachedVoices);
    };

    populate();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = populate;
    }
  }

  /**
   * Sorts voices to prioritize neural, natural, and high-clarity Spanish voices
   */
  public getRankedSpanishVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynth) return [];
    const allVoices = this.speechSynth.getVoices();

    const spanishVoices = allVoices.filter((v) =>
      v.lang.toLowerCase().startsWith('es') || v.name.toLowerCase().includes('spanish')
    );

    // Score voice quality
    const scoreVoice = (v: SpeechSynthesisVoice) => {
      let score = 0;
      const name = v.name.toLowerCase();
      if (name.includes('natural') || name.includes('neural')) score += 50;
      if (name.includes('google') || name.includes('cloud')) score += 40;
      if (name.includes('premium') || name.includes('enhanced')) score += 35;
      if (name.includes('microsoft') || name.includes('online')) score += 30;
      if (name.includes('paulina') || name.includes('monica') || name.includes('jorge') || name.includes('diego')) score += 25;
      if (name.includes('carlos') || name.includes('alvaro') || name.includes('raul')) score += 20;
      if (v.lang === 'es-ES' || v.lang === 'es-MX' || v.lang === 'es-US') score += 10;
      return score;
    };

    return spanishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public setListener(cb: VoiceListenerCallback) {
    this.callback = cb;
    if (this.cachedVoices.length > 0) {
      this.callback.onVoicesLoaded?.(this.cachedVoices);
    }
  }

  /**
   * Cleans text from emojis, Markdown, code symbols and bracketed text
   * so speech synthesis sounds fluid, natural and pauses naturally at commas and periods.
   */
  public cleanTextForSpeech(text: string): string {
    return text
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove bracketed actions like [🕸️ Red Cósmica] or [ESC]
      .replace(/\[[^\]]*\]/g, '')
      // Remove emojis and special unicode symbols
      .replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Remove Markdown formatting like **, *, _, #, `, ~
      .replace(/[*_#`~>]/g, '')
      // Replace multiple dots / ellipses with a short comma pause
      .replace(/\.{3,}/g, ', ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speak text out loud using natural synthesized voice
   */
  public speak(text: string, onDone?: () => void) {
    if (!this.speechSynth || !this.voiceEnabled) {
      if (onDone) onDone();
      return;
    }

    try {
      this.speechSynth.cancel();

      const cleaned = this.cleanTextForSpeech(text);
      if (!cleaned) {
        if (onDone) onDone();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'es-ES';
      utterance.pitch = this.pitch;
      utterance.rate = this.rate;

      // Select assigned voice or highest-ranked Spanish voice
      const voices = this.getRankedSpanishVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (this.selectedVoiceURI) {
        chosenVoice = voices.find((v) => v.voiceURI === this.selectedVoiceURI);
      }

      if (!chosenVoice && voices.length > 0) {
        chosenVoice = voices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      }

      utterance.onstart = () => {
        this.callback?.onStateChange('speaking', 'Highfield transmitiendo voz...');
      };

      utterance.onend = () => {
        this.callback?.onStateChange('idle');
        if (onDone) onDone();
      };

      utterance.onerror = () => {
        this.callback?.onStateChange('idle');
        if (onDone) onDone();
      };

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onDone) onDone();
    }
  }

  public stopSpeaking() {
    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  public startListening(lang: string = 'es-ES'): boolean {
    if (!this.recognition) {
      this.callback?.onStateChange('unsupported', 'Tu navegador no soporta reconocimiento de voz directo.');
      return false;
    }

    try {
      this.stopSpeaking();
      this.recognition.lang = lang;
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Could not start recognition:', e);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Stop recognition error:', e);
      }
    }
    this.isListening = false;
    this.callback?.onStateChange('idle');
  }

  public setVoiceURI(uri: string) {
    this.selectedVoiceURI = uri;
    this.saveConfig();
  }

  public setPitch(val: number) {
    this.pitch = Math.max(0.5, Math.min(1.8, Number(val.toFixed(2))));
    this.saveConfig();
  }

  public setRate(val: number) {
    this.rate = Math.max(0.6, Math.min(1.8, Number(val.toFixed(2))));
    this.saveConfig();
  }

  public setPreset(preset: VoicePreset) {
    this.preset = preset;
    switch (preset) {
      case 'NATURAL':
        this.pitch = 1.04;
        this.rate = 1.08;
        break;
      case 'COSMIC':
        this.pitch = 0.94;
        this.rate = 0.96;
        break;
      case 'DYNAMIC':
        this.pitch = 1.12;
        this.rate = 1.18;
        break;
      case 'RETRO':
        this.pitch = 0.85;
        this.rate = 1.0;
        break;
    }
    this.saveConfig();
  }

  public toggleVoiceOutput(enable?: boolean): boolean {
    this.voiceEnabled = enable !== undefined ? enable : !this.voiceEnabled;
    if (!this.voiceEnabled) {
      this.stopSpeaking();
    }
    this.saveConfig();
    return this.voiceEnabled;
  }

  public isVoiceOutputEnabled(): boolean {
    return this.voiceEnabled;
  }

  public getSettings(): VoiceSettings {
    return {
      pitch: this.pitch,
      rate: this.rate,
      selectedVoiceURI: this.selectedVoiceURI,
      preset: this.preset,
      voiceEnabled: this.voiceEnabled,
    };
  }
}

export const voiceEngine = new VoiceEngine();
