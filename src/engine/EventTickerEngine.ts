/**
 * HIGHFIELD - Automated Event Ticker & World Phenomena Engine
 * Manages autonomous minor world phenomena (Passing Asteroids, Solar Flares,
 * Cosmic Ray Bursts, Micrometeorite Impacts, Solar Wind Auroras)
 * and maintains real-time telemetry logs.
 */

import { WorldPhenomenon, PhenomenonType, EventTickerLog } from '../types';
import { memorySystem } from './MemorySystem';
import { soundManager } from './AudioEngine';

export class EventTickerEngine {
  private activePhenomena: WorldPhenomenon[] = [];
  private logs: EventTickerLog[] = [];
  private nextEventCooldown: number = 12000; // ms
  private maxLogs: number = 15;
  private listeners: ((logs: EventTickerLog[], latest: EventTickerLog | null) => void)[] = [];
  private phenomenonListeners: ((phenomenon: WorldPhenomenon) => void)[] = [];

  constructor() {
    this.addLog({
      category: 'TELEMETRY',
      title: 'EVENT_TICKER_INITIALIZED',
      message: 'Autonomous sensor array online. Monitoring lunar quadrant for cosmic phenomena.',
      severity: 'info',
    });
  }

  public subscribe(callback: (logs: EventTickerLog[], latest: EventTickerLog | null) => void) {
    this.listeners.push(callback);
    callback(this.logs, this.logs[0] || null);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public onPhenomenonTriggered(callback: (phenomenon: WorldPhenomenon) => void) {
    this.phenomenonListeners.push(callback);
    return () => {
      this.phenomenonListeners = this.phenomenonListeners.filter(l => l !== callback);
    };
  }

  public getActivePhenomena(): WorldPhenomenon[] {
    return this.activePhenomena;
  }

  public getLogs(): EventTickerLog[] {
    return this.logs;
  }

  public addLog(entry: Omit<EventTickerLog, 'id' | 'timestamp'>) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: EventTickerLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      ...entry,
    };

    this.logs = [newLog, ...this.logs].slice(0, this.maxLogs);
    this.listeners.forEach(l => l(this.logs, newLog));
  }

  public triggerPhenomenon(forcedType?: PhenomenonType, onThoughtReaction?: (thought: string) => void): WorldPhenomenon {
    const types: PhenomenonType[] = [
      'PASSING_ASTEROID',
      'SOLAR_FLARE',
      'COSMIC_RAY_BURST',
      'MICROMETEORITE_IMPACT',
      'SOLAR_WIND_AURORA',
    ];

    const type = forcedType || types[Math.floor(Math.random() * types.length)];
    let phenomenon: WorldPhenomenon;

    switch (type) {
      case 'PASSING_ASTEROID': {
        const startLeft = Math.random() > 0.5;
        phenomenon = {
          id: `phenom_${Date.now()}`,
          type,
          name: 'Asteroide en Tránsito Orbital',
          description: 'Cuerpo rocoso rico en metales cruzando la exosfera lunar.',
          durationMs: 7000,
          elapsedMs: 0,
          intensity: 1.0,
          active: true,
          params: {
            x: startLeft ? -30 : 570,
            y: 30 + Math.random() * 50,
            vx: startLeft ? 1.8 + Math.random() * 0.8 : -1.8 - Math.random() * 0.8,
            vy: 0.2 + Math.random() * 0.3,
            size: 5 + Math.floor(Math.random() * 4),
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.08,
            tailColor: Math.random() > 0.4 ? '#67e8f9' : '#fcd34d',
          },
        };

        this.addLog({
          category: 'PHENOMENON',
          title: 'ASTEROID_TRANSIT_DETECTED',
          message: `Asteroide rocoso [Ø ${phenomenon.params.size}m] cruzando órbita a alta velocidad.`,
          severity: 'notice',
        });

        if (onThoughtReaction) onThoughtReaction('Ese asteroide dejó un rastro ionizado increíble...');
        soundManager.playCometSwoosh();
        break;
      }

      case 'SOLAR_FLARE': {
        phenomenon = {
          id: `phenom_${Date.now()}`,
          type,
          name: 'Erupción Solar & Onda Ionizante',
          description: 'Pulso electromagnético coronal barriendo el vacío profundo.',
          durationMs: 6500,
          elapsedMs: 0,
          intensity: 1.0,
          active: true,
          params: {
            color: '#ff7828',
            wavePhase: 0,
          },
        };

        this.addLog({
          category: 'PHENOMENON',
          title: 'SOLAR_FLARE_WAVE_INCOMING',
          message: 'Onda electromagnética de fulguración solar impactando sensores.',
          severity: 'alert',
        });

        if (onThoughtReaction) onThoughtReaction('Los sensores del traje parpadean con la radiación solar.');
        soundManager.playCometSwoosh();
        break;
      }

      case 'COSMIC_RAY_BURST': {
        const raysCount = 12;
        const rays = [];
        for (let i = 0; i < raysCount; i++) {
          rays.push({
            x: 40 + Math.random() * 460,
            y: 10 + Math.random() * 120,
            vx: (Math.random() - 0.5) * 3,
            vy: 3 + Math.random() * 4,
            length: 18 + Math.random() * 24,
            alpha: 1.0,
            color: Math.random() > 0.5 ? '#38bdf8' : '#c084fc',
          });
        }

        phenomenon = {
          id: `phenom_${Date.now()}`,
          type,
          name: 'Ráfaga de Rayos Cósmicos',
          description: 'Haces de partículas relativistas procedentes del espacio exterior.',
          durationMs: 4000,
          elapsedMs: 0,
          intensity: 1.0,
          active: true,
          params: { rays },
        };

        this.addLog({
          category: 'PHENOMENON',
          title: 'COSMIC_RAY_BURST_EVENT',
          message: 'Cascada de partículas de alta energía intersectando cuadrante este.',
          severity: 'notice',
        });

        if (onThoughtReaction) onThoughtReaction('Rayos cósmicos cruzando la oscuridad como agujas de luz.');
        break;
      }

      case 'MICROMETEORITE_IMPACT': {
        const impactX = 80 + Math.random() * 380;
        const sparks = [];
        for (let i = 0; i < 10; i++) {
          sparks.push({
            x: impactX,
            y: 0, // set during render relative to terrain
            vx: (Math.random() - 0.5) * 2.4,
            vy: -1.2 - Math.random() * 2.5,
            alpha: 1.0,
            size: 1 + Math.random() * 1.5,
          });
        }

        phenomenon = {
          id: `phenom_${Date.now()}`,
          type,
          name: 'Impacto de Micrometeorito',
          description: 'Destello de colisión de roca espacial en el regolito lunar.',
          durationMs: 3500,
          elapsedMs: 0,
          intensity: 1.0,
          active: true,
          params: { impactX, sparks, flashIntensity: 1.0 },
        };

        this.addLog({
          category: 'PHENOMENON',
          title: 'MICROMETEORITE_IMPACT_SECTOR',
          message: `Impacto cinético en coordenadas [X: ${Math.round(impactX)}]. Destello de regolito registrado.`,
          severity: 'info',
        });

        if (onThoughtReaction) onThoughtReaction('¡Pequeño impacto en la cresta! El polvo lunar brilla caliente.');
        soundManager.playFootstep();
        break;
      }

      case 'SOLAR_WIND_AURORA':
      default: {
        phenomenon = {
          id: `phenom_${Date.now()}`,
          type: 'SOLAR_WIND_AURORA',
          name: 'Velo de Viento Solar',
          description: 'Plasma estelar tenue ondulando en la alta exosfera lunar.',
          durationMs: 8000,
          elapsedMs: 0,
          intensity: 1.0,
          active: true,
          params: { waveOffset: 0 },
        };

        this.addLog({
          category: 'PHENOMENON',
          title: 'SOLAR_WIND_PLASMA_SHEET',
          message: 'Velo electromagnético de viento solar visible sobre la Tierra.',
          severity: 'info',
        });

        if (onThoughtReaction) onThoughtReaction('Un velo de plasma verde sobre el horizonte... Qué calma.');
        break;
      }
    }

    this.activePhenomena.push(phenomenon);
    this.phenomenonListeners.forEach(l => l(phenomenon));

    memorySystem.addJournalEntry({
      title: phenomenon.name,
      content: phenomenon.description,
      category: 'astronomy',
      mood: 'wondrous',
    });

    return phenomenon;
  }

  public update(deltaMs: number, onThoughtReaction?: (thought: string) => void) {
    // 1. Update active phenomena
    for (const p of this.activePhenomena) {
      p.elapsedMs += deltaMs;
      const progress = p.elapsedMs / p.durationMs;
      p.intensity = Math.max(0, 1 - progress);

      if (p.type === 'PASSING_ASTEROID') {
        p.params.x += p.params.vx * (deltaMs / 16);
        p.params.y += p.params.vy * (deltaMs / 16);
        p.params.rotation += p.params.rotSpeed;
      } else if (p.type === 'SOLAR_FLARE') {
        p.params.wavePhase += deltaMs * 0.003;
      } else if (p.type === 'COSMIC_RAY_BURST') {
        for (const ray of p.params.rays) {
          ray.x += ray.vx;
          ray.y += ray.vy;
          ray.alpha = Math.max(0, ray.alpha - 0.015);
        }
      } else if (p.type === 'MICROMETEORITE_IMPACT') {
        p.params.flashIntensity = Math.max(0, p.params.flashIntensity - deltaMs * 0.004);
        for (const sp of p.params.sparks) {
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.08; // Low lunar gravity pull
          sp.alpha = Math.max(0, sp.alpha - deltaMs * 0.001);
        }
      } else if (p.type === 'SOLAR_WIND_AURORA') {
        p.params.waveOffset += deltaMs * 0.0015;
      }

      if (p.elapsedMs >= p.durationMs) {
        p.active = false;
      }
    }

    this.activePhenomena = this.activePhenomena.filter(p => p.active);

    // 2. Autonomous Event Trigger Ticker
    this.nextEventCooldown -= deltaMs;
    if (this.nextEventCooldown <= 0) {
      this.nextEventCooldown = 18000 + Math.random() * 14000; // Triggers every 18s - 32s
      this.triggerPhenomenon(undefined, onThoughtReaction);
    }
  }
}

export const eventTickerEngine = new EventTickerEngine();
