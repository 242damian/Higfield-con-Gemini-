/**
 * HIGHFIELD - Environmental & Real Hardware Sensor Engine
 * Harvests real client-side telemetry (battery status, exact local timezone & time,
 * network latency/type, screen parameters, astronomical earth day/night cycle)
 * to weave naturally into Highfield's cosmic awareness.
 */

export interface DeviceTelemetry {
  batteryLevel?: number; // 0 to 100
  isCharging?: boolean;
  localTime: string; // e.g. "18:42"
  timezone: string; // e.g. "America/Argentina/Buenos_Aires" or "Europe/Madrid"
  dayPeriod: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night' | 'midnight';
  language: string;
  online: boolean;
  connectionType?: string; // "4g", "wifi", etc.
  screenResolution: string;
  devicePlatform: string;
  browserVendor: string;
}

class EnvironmentalSensors {
  private cachedTelemetry: DeviceTelemetry | null = null;
  private batteryWatcherRegistered = false;

  constructor() {
    this.updateTelemetry();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateTelemetry());
      window.addEventListener('offline', () => this.updateTelemetry());
      this.initBatteryListener();
    }
  }

  private async initBatteryListener() {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator && !this.batteryWatcherRegistered) {
      try {
        const battery: any = await (navigator as any).getBattery();
        this.batteryWatcherRegistered = true;

        const updateBattery = () => {
          if (this.cachedTelemetry) {
            this.cachedTelemetry.batteryLevel = Math.round(battery.level * 100);
            this.cachedTelemetry.isCharging = battery.charging;
          }
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      } catch {
        // Battery API might be restricted by browser sandbox
      }
    }
  }

  public getDayPeriod(hours: number): DeviceTelemetry['dayPeriod'] {
    if (hours >= 5 && hours < 8) return 'dawn';
    if (hours >= 8 && hours < 13) return 'morning';
    if (hours >= 13 && hours < 19) return 'afternoon';
    if (hours >= 19 && hours < 22) return 'dusk';
    if (hours >= 22 || hours < 2) return 'night';
    return 'midnight';
  }

  public updateTelemetry(): DeviceTelemetry {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const localTime = `${hours}:${minutes}`;

    let timezone = 'UTC';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      // fallback
    }

    const dayPeriod = this.getDayPeriod(hours);
    const language = typeof navigator !== 'undefined' ? navigator.language || 'es-ES' : 'es-ES';
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let connectionType = 'estable';
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const conn = (navigator as any).connection;
      connectionType = conn.effectiveType || conn.type || 'banda ancha';
    }

    const screenResolution = typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : '1920x1080';

    const devicePlatform = typeof navigator !== 'undefined' ? navigator.platform || 'Terrestre' : 'Terrestre';
    const browserVendor = typeof navigator !== 'undefined' ? navigator.vendor || 'Navegador' : 'Navegador';

    this.cachedTelemetry = {
      batteryLevel: this.cachedTelemetry?.batteryLevel,
      isCharging: this.cachedTelemetry?.isCharging,
      localTime,
      timezone,
      dayPeriod,
      language,
      online,
      connectionType,
      screenResolution,
      devicePlatform,
      browserVendor,
    };

    return this.cachedTelemetry;
  }

  public getTelemetry(): DeviceTelemetry {
    return this.cachedTelemetry || this.updateTelemetry();
  }

  /**
   * Generates a natural sentence for Highfield summarizing terrestrial sensor state
   */
  public getEnvironmentalBrief(): string {
    const t = this.getTelemetry();
    const periodMap = {
      dawn: 'amanecer',
      morning: 'mañana',
      afternoon: 'tarde',
      dusk: 'atardecer',
      night: 'noche',
      midnight: 'madrugada profunda',
    };

    let batteryStr = '';
    if (t.batteryLevel !== undefined) {
      batteryStr = `, acumulador del dispositivo al ${t.batteryLevel}%${t.isCharging ? ' (cargando en base)' : ''}`;
    }

    return `Hora local terrestre del visitante: ${t.localTime} (${periodMap[t.dayPeriod]} en ${t.timezone})${batteryStr}, enlace de red ${t.connectionType}.`;
  }
}

export const environmentalSensors = new EnvironmentalSensors();
