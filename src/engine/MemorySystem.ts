/**
 * HIGHFIELD - Episodic Memory, Relic Showcase & Deep Bond System
 * Persists Highfield's thoughts, visitor companion memory, lunar relics showcase,
 * Earth signal intercepts, and discoveries across sessions.
 */

import { LunarRelic, EarthBeacon } from '../types';

export interface JournalEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  title: string;
  content: string;
  category: 'observation' | 'dialogue' | 'discovery' | 'astronomy' | 'earth_signal' | 'relic';
  mood: string;
}

export interface LunarDiscovery {
  id: string;
  name: string;
  category: 'mineral' | 'celestial' | 'phenomenon';
  description: string;
  discoveredAt: number;
  iconName: string;
}

export interface VisitorProfile {
  userName: string;
  visitCount: number;
  firstVisit: number;
  lastVisit: number;
  learnedFacts: string[];
  userInterests: string[];
  favoriteTopic?: string;
  bondLevel: number; // 1 (Visitor) to 5 (Cosmic Brother)
  lastSharedMilestone?: string;
}

const STORAGE_KEY_JOURNAL = 'highfield_journal_v2';
const STORAGE_KEY_VISITOR = 'highfield_visitor_v2';
const STORAGE_KEY_DISCOVERIES = 'highfield_discoveries_v2';
const STORAGE_KEY_RELICS = 'highfield_relics_v2';

export const INITIAL_RELICS: LunarRelic[] = [
  {
    id: 'voyager_golden_disc',
    name: 'Fragmento de Disco de Oro (Voyager)',
    category: 'spacecraft',
    description: 'Placa de cobre bañada en oro con ondas sonoras y saludos de la humanidad grabados en 1977.',
    x: 85,
    y: 258,
    discovered: false,
    iconName: 'Disc',
    shimmerTimer: 0,
    effectType: 'GOLDEN_WEB',
  },
  {
    id: 'sputnik_beacon',
    name: 'Transmisor Esférico Sputnik',
    category: 'historical',
    description: 'Emisor de radio pulido de las primeras sondas espaciales que aún emite un suave pulso en 20.005 MHz.',
    x: 235,
    y: 262,
    discovered: false,
    iconName: 'Radio',
    shimmerTimer: 0,
    effectType: 'CYAN_PULSE' as any,
  },
  {
    id: 'lunar_synth_cassette',
    name: 'Casete Analógico "Cosmic Dreams"',
    category: 'audio_relic',
    description: 'Cinta magnética fosforescente olvidada por un astronauta que contiene pistas lo-fi espaciales.',
    x: 375,
    y: 254,
    discovered: false,
    iconName: 'Cassette',
    shimmerTimer: 0,
    effectType: 'SYNTH_TAPE',
  },
  {
    id: 'plasma_crystal_meteorite',
    name: 'Meteorito de Cristal de Plasma',
    category: 'crystal',
    description: 'Mineral de silicio ionizado que infunde los filamentos de telaraña con un brillo esmeralda resplandeciente.',
    x: 480,
    y: 266,
    discovered: false,
    iconName: 'Sparkles',
    shimmerTimer: 0,
    effectType: 'PLASMA_WEB',
  },
];

export const INITIAL_DISCOVERIES: LunarDiscovery[] = [
  {
    id: 'earth_clouds',
    name: 'Atmósfera Terrestre',
    category: 'celestial',
    description: 'Bioluminiscencia y patrones climáticos rotando sobre los océanos de la Tierra.',
    discoveredAt: Date.now() - 3600000,
    iconName: 'Globe',
  },
  {
    id: 'quartz_regolith',
    name: 'Cuarzo en Regolito Lunar',
    category: 'mineral',
    description: 'Microcristales vítreos fusionados por impacto de meteoritos antiguos.',
    discoveredAt: Date.now() - 7200000,
    iconName: 'Sparkles',
  },
  {
    id: 'shooting_stars_cluster',
    name: 'Estela de Cometa Perihelio',
    category: 'phenomenon',
    description: 'Trazas de polvo hiperbólico cruzando el campo estelar a 42 km/s.',
    discoveredAt: Date.now() - 1800000,
    iconName: 'Zap',
  },
  {
    id: 'cosmic_cinema_web',
    name: 'Red Monumental: Cine en el Vacío',
    category: 'phenomenon',
    description: 'Malla de filamentos arácnidos tensada en el cosmos que refracta la luz de las estrellas como una pantalla de cine frente a la Tierra.',
    discoveredAt: Date.now(),
    iconName: 'Sparkles',
  },
];

export class MemorySystem {
  private journal: JournalEntry[] = [];
  private visitor: VisitorProfile;
  private discoveries: LunarDiscovery[] = [];
  private relics: LunarRelic[] = [];
  private activeFilamentColor: string = '#00f0ff';

  constructor() {
    this.visitor = this.loadVisitor();
    this.journal = this.loadJournal();
    this.discoveries = this.loadDiscoveries();
    this.relics = this.loadRelics();
    this.recordVisit();
  }

  private loadVisitor(): VisitorProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_VISITOR);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return {
      userName: '',
      visitCount: 0,
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      learnedFacts: [],
      userInterests: [],
      bondLevel: 1,
    };
  }

  private loadJournal(): JournalEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JOURNAL);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return [
      {
        id: 'entry_01',
        timestamp: Date.now() - 100000,
        dateStr: new Date().toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        title: 'Primera Guardia Lunar',
        content:
          'El horizonte de la cresta está en calma. La Tierra parece una gema solitaria flotando en el terciopelo negro.',
        category: 'observation',
        mood: 'wondrous',
      },
    ];
  }

  private loadDiscoveries(): LunarDiscovery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DISCOVERIES);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return INITIAL_DISCOVERIES;
  }

  private loadRelics(): LunarRelic[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RELICS);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return INITIAL_RELICS;
  }

  private recordVisit() {
    this.visitor.visitCount += 1;
    this.visitor.lastVisit = Date.now();
    if (this.visitor.visitCount >= 8) this.visitor.bondLevel = 5;
    else if (this.visitor.visitCount >= 5) this.visitor.bondLevel = 4;
    else if (this.visitor.visitCount >= 3) this.visitor.bondLevel = 3;
    else if (this.visitor.visitCount >= 2) this.visitor.bondLevel = 2;
    this.saveVisitor();
  }

  public saveVisitor() {
    try {
      localStorage.setItem(STORAGE_KEY_VISITOR, JSON.stringify(this.visitor));
    } catch {
      // Ignore
    }
  }

  public saveJournal() {
    try {
      localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(this.journal));
    } catch {
      // Ignore
    }
  }

  public saveDiscoveries() {
    try {
      localStorage.setItem(STORAGE_KEY_DISCOVERIES, JSON.stringify(this.discoveries));
    } catch {
      // Ignore
    }
  }

  public saveRelics() {
    try {
      localStorage.setItem(STORAGE_KEY_RELICS, JSON.stringify(this.relics));
    } catch {
      // Ignore
    }
  }

  public setUserName(name: string) {
    this.visitor.userName = name.trim();
    this.saveVisitor();
  }

  public addUserInterest(interest: string) {
    if (!this.visitor.userInterests.includes(interest)) {
      this.visitor.userInterests.push(interest);
      this.saveVisitor();
    }
  }

  public addJournalEntry(
    entry: Omit<JournalEntry, 'id' | 'timestamp' | 'dateStr'>
  ): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: 'entry_' + Date.now(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    this.journal.unshift(newEntry);
    if (this.journal.length > 50) this.journal.pop();
    this.saveJournal();
    return newEntry;
  }

  public learnFact(fact: string) {
    if (!this.visitor.learnedFacts.includes(fact)) {
      this.visitor.learnedFacts.push(fact);
      this.saveVisitor();
      this.addJournalEntry({
        title: 'Recuerdo del Amigo Terrestre',
        content: `He registrado en mi memoria: ${fact}`,
        category: 'dialogue',
        mood: 'thoughtful',
      });
    }
  }

  public recordEarthBeacon(beacon: EarthBeacon) {
    this.addJournalEntry({
      title: `Señal de la Tierra: ${beacon.name}`,
      content: `[Región: ${beacon.region}] ${beacon.thoughtOnIntercept}`,
      category: 'earth_signal',
      mood: 'wondrous',
    });
  }

  public unlockRelic(relicId: string): LunarRelic | null {
    const relic = this.relics.find((r) => r.id === relicId);
    if (relic && !relic.discovered) {
      relic.discovered = true;
      if (relic.effectType === 'GOLDEN_WEB') {
        this.activeFilamentColor = '#ffd700';
      } else if (relic.effectType === 'PLASMA_WEB') {
        this.activeFilamentColor = '#00ff88';
      }
      this.saveRelics();
      this.addJournalEntry({
        title: `Reliquia Excavada: ${relic.name}`,
        content: relic.description,
        category: 'relic',
        mood: 'wondrous',
      });
      return relic;
    }
    return null;
  }

  public unlockDiscovery(discovery: Omit<LunarDiscovery, 'discoveredAt'>): LunarDiscovery {
    const existing = this.discoveries.find((d) => d.id === discovery.id);
    if (existing) return existing;

    const newDisc: LunarDiscovery = {
      ...discovery,
      discoveredAt: Date.now(),
    };
    this.discoveries.push(newDisc);
    this.saveDiscoveries();

    this.addJournalEntry({
      title: `Descubrimiento: ${discovery.name}`,
      content: discovery.description,
      category: 'discovery',
      mood: 'wondrous',
    });

    return newDisc;
  }

  public getRelics(): LunarRelic[] {
    return this.relics;
  }

  public getActiveFilamentColor(): string {
    return this.activeFilamentColor;
  }

  public getJournal(): JournalEntry[] {
    return this.journal;
  }

  public getVisitorProfile(): VisitorProfile {
    return this.visitor;
  }

  public getDiscoveries(): LunarDiscovery[] {
    return this.discoveries;
  }

  /**
   * Generates rich companion memory context for Gemini AI
   */
  public getCompanionPromptContext(): string {
    const profile = this.visitor;
    const parts: string[] = [];

    if (profile.userName) {
      parts.push(`El nombre del usuario es ${profile.userName}.`);
    }
    parts.push(`Nivel de vínculo y confianza cósmica: ${profile.bondLevel}/5 (ha visitado ${profile.visitCount} veces).`);

    if (profile.learnedFacts.length > 0) {
      parts.push(`Cosas que sabes de él: ${profile.learnedFacts.slice(0, 4).join('; ')}.`);
    }

    const discoveredRelicsCount = this.relics.filter((r) => r.discovered).length;
    if (discoveredRelicsCount > 0) {
      parts.push(`Han desenterrado ${discoveredRelicsCount} reliquias juntos en la Luna.`);
    }

    return parts.join(' ');
  }
}

export const memorySystem = new MemorySystem();
