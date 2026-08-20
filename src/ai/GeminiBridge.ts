/**
 * HIGHFIELD - AI Architecture Bridge & Cognitive Dialogue Engine
 * Provides intelligent conversational synthesis, emotional nuance,
 * episodic memory integration, tool execution handling (Weather, Reminders, Lunar Telemetry)
 * and direct answers to user queries with Gemini API support.
 */

import { WorldContext } from '../types';
import { memorySystem } from '../engine/MemorySystem';
import { reminderSystem, LunarReminder } from '../engine/ReminderSystem';
import { environmentalSensors } from '../engine/EnvironmentalSensors';

export interface AIIntentionResponse {
  intention: 'EXPLORE' | 'OBSERVE' | 'INSPECT' | 'REST' | 'COMMUNICATE';
  targetFocus?: string;
  internalMonologue: string;
  emotion: 'calm' | 'curious' | 'wondrous' | 'focused' | 'alert';
}

export type HighfieldMood = 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly' | 'focused' | 'alert';

export interface WeatherToolData {
  location: string;
  temperatureC: number;
  temperatureF: number;
  apparentTempC: number;
  condition: string;
  conditionCode: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'moon_vacuum' | 'windy';
  humidity: number;
  windSpeedKmH: number;
  surfacePressureHPa?: number;
  lunarComparison: string;
  isLunar?: boolean;
}

export interface ReminderToolData {
  id: string;
  title: string;
  targetTimestamp: number;
  targetTimeFormatted: string;
  relativeDesc: string;
  category: LunarReminder['category'];
  priority: LunarReminder['priority'];
}

export interface LunarTelemetryToolData {
  surfaceTempC: number;
  gravityMps2: number;
  distanceToEarthKm: number;
  orbitalSpeedKms: number;
  solarWindSpeedKms: number;
  radiationLevel: string;
  horizonView: string;
}

export interface ToolExecution {
  tool: 'getWeather' | 'setReminder' | 'getLunarTelemetry';
  data: WeatherToolData | ReminderToolData | LunarTelemetryToolData | any;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CosmicSketchResult {
  title: string;
  highfieldComment: string;
  palette: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    stars: string;
  };
  visualElements: Array<{
    type: string;
    name?: string;
    x?: number;
    y?: number;
    radius?: number;
    color?: string;
    glow?: boolean;
    description?: string;
    peaks?: number[];
  }>;
  asciiSignature: string;
  mood: HighfieldMood;
}

export interface VisionAnalysisResult {
  analysis: string;
  mood: HighfieldMood;
  detectedEmotion?: string | null;
  tags: string[];
  memoryLearned?: string | null;
}

export interface AIChatResponse {
  reply: string;
  mood: HighfieldMood;
  memoryLearned?: string;
  detectedProfileUpdates?: {
    userName?: string;
    userContext?: string;
    newLikes?: string[];
    newInterests?: string[];
  };
  toolExecutions?: ToolExecution[];
  groundingSources?: GroundingSource[];
}

// Alias for requested Spanish naming convention
export type AIChatRespuesta = AIChatResponse;

export interface ConversationTurn {
  role: 'user' | 'model';
  text: string;
  groundingSources?: GroundingSource[];
}

export class GeminiBridge {
  private sessionHistory: ConversationTurn[] = [];
  private unsummarizedTurns: ConversationTurn[] = [];
  private isSummarizing: boolean = false;

  public getHistory(): ConversationTurn[] {
    return [...this.sessionHistory];
  }

  public clearHistory(): void {
    this.sessionHistory = [];
    this.unsummarizedTurns = [];
  }

  public async decideNextIntention(context: WorldContext): Promise<AIIntentionResponse> {
    if (context.visitorActive && Math.random() > 0.4) {
      return {
        intention: 'OBSERVE',
        targetFocus: 'visitor',
        internalMonologue: 'Un visitante me está acompañando en este cuadrante lunar.',
        emotion: 'curious',
      };
    }

    const intentions: AIIntentionResponse[] = [
      {
        intention: 'EXPLORE',
        targetFocus: 'viewpoint',
        internalMonologue: 'Voy a patrullar la pendiente este del cráter.',
        emotion: 'curious',
      },
      {
        intention: 'OBSERVE',
        targetFocus: 'earth',
        internalMonologue: 'La atmósfera azul de la Tierra brilla en el vacío.',
        emotion: 'wondrous',
      },
      {
        intention: 'REST',
        targetFocus: 'ridge',
        internalMonologue: 'Un respiro sereno bajo la luz de las estrellas.',
        emotion: 'calm',
      },
    ];

    return intentions[Math.floor(Math.random() * intentions.length)];
  }

  /**
   * Summarizes unsummarized dialogue turns into a reflective entry in Highfield's Bitácora
   */
  public async summarizeCurrentSession(): Promise<boolean> {
    if (this.unsummarizedTurns.length === 0 || this.isSummarizing) {
      return false;
    }

    this.isSummarizing = true;
    const turnsToSummarize = [...this.unsummarizedTurns];
    const visitorProfile = memorySystem.getVisitorProfile();

    try {
      const response = await fetch('/api/highfield/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: turnsToSummarize,
          userContext: {
            userName: visitorProfile.userName,
            userContext: visitorProfile.userContext,
            userLikes: visitorProfile.userLikes,
            userInterests: visitorProfile.userInterests,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.summary) {
          memorySystem.addSessionSummary(data.title, data.summary, data.mood || 'thoughtful');

          if (Array.isArray(data.learnedSummaryFacts)) {
            for (const fact of data.learnedSummaryFacts) {
              if (fact && typeof fact === 'string') {
                memorySystem.learnFact(fact);
              }
            }
          }

          // Clear summarized turns
          this.unsummarizedTurns = [];
          this.isSummarizing = false;
          return true;
        }
      }
    } catch (e) {
      console.warn('Error during session summarization:', e);
    }

    // Fallback: create a graceful reflective summary
    const userTopic = turnsToSummarize.find((t) => t.role === 'user')?.text.slice(0, 35) || 'temas cósmicos';
    memorySystem.addSessionSummary(
      `Sesión Lunar // ${new Date().toLocaleDateString('es-ES')}`,
      `Conversamos sobre ${userTopic} y la perspectiva del cosmos. Un diálogo sereno que deja su propia huella en la superficie lunar.`,
      'thoughtful'
    );
    this.unsummarizedTurns = [];
    this.isSummarizing = false;
    return true;
  }

  /**
   * Generates a dynamic AI response using Gemini 3.7 Flash with multi-turn history,
   * Google Search Grounding, structured JSON output, episodic memory integration,
   * environmental telemetry awareness, and optional image attachment.
   */
  public async generateReply(
    userMessage: string,
    historyOverride?: ConversationTurn[],
    imageAttachment?: string,
    webSearch: boolean = false
  ): Promise<AIChatRespuesta> {
    const trimmedInput = userMessage.trim();
    if (!trimmedInput && !imageAttachment) {
      return {
        reply: 'El silencio en el vacío cósmico tiene su propio peso.',
        mood: 'calm',
      };
    }

    const effectiveMessage = trimmedInput || 'He transmitido una captura visual a través del telescopio.';

    // Use passed history or internal persistent session history
    const historyToSend = historyOverride && historyOverride.length > 0
      ? historyOverride
      : this.sessionHistory;

    // Fetch dynamic visitor profile and context from memory system
    const visitorProfile = memorySystem.getVisitorProfile();
    const userContext = {
      userName: visitorProfile.userName,
      userContext: visitorProfile.userContext,
      userLikes: visitorProfile.userLikes,
      userInterests: visitorProfile.userInterests,
      visitCount: visitorProfile.visitCount,
      bondLevel: visitorProfile.bondLevel,
    };
    const memories = visitorProfile.learnedFacts;
    const recentJournalSummaries = memorySystem.getRecentJournalSummaries(3);
    const deviceTelemetry = environmentalSensors.getTelemetry();

    try {
      // Call server endpoint that proxies to Gemini API with process.env.GEMINI_API_KEY
      const response = await fetch('/api/highfield/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveMessage,
          history: historyToSend,
          memories,
          userContext,
          recentJournalSummaries,
          image: imageAttachment || null,
          webSearch,
          deviceTelemetry,
        }),
      });

      if (response.ok) {
        const data: AIChatRespuesta = await response.json();
        if (data && data.reply) {
          // Track conversation turn in persistent session history
          this.sessionHistory.push({ role: 'user', text: effectiveMessage });
          this.sessionHistory.push({
            role: 'model',
            text: data.reply,
            groundingSources: data.groundingSources,
          });

          // Track unsummarized turns
          this.unsummarizedTurns.push({ role: 'user', text: effectiveMessage });
          this.unsummarizedTurns.push({
            role: 'model',
            text: data.reply,
            groundingSources: data.groundingSources,
          });

          // Keep history constrained to last 20 turns
          if (this.sessionHistory.length > 20) {
            this.sessionHistory = this.sessionHistory.slice(-20);
          }

          // Persist newly learned facts into MemorySystem
          if (data.memoryLearned) {
            memorySystem.learnFact(data.memoryLearned);
          }

          // Automatically sync dynamically detected user profile updates
          if (data.detectedProfileUpdates) {
            const updates = data.detectedProfileUpdates;
            if (updates.userName && !visitorProfile.userName) {
              memorySystem.setUserName(updates.userName);
            }
            if (updates.userContext && updates.userContext !== visitorProfile.userContext) {
              memorySystem.setUserContext(updates.userContext);
            }
            if (Array.isArray(updates.newLikes)) {
              for (const like of updates.newLikes) {
                memorySystem.addUserLike(like);
              }
            }
            if (Array.isArray(updates.newInterests)) {
              for (const interest of updates.newInterests) {
                memorySystem.addUserInterest(interest);
              }
            }
          }

          // Automatically sync executed tools into persistent engines (e.g. reminders)
          if (Array.isArray(data.toolExecutions)) {
            for (const exec of data.toolExecutions) {
              if (exec.tool === 'setReminder' && exec.data?.title) {
                // Ensure reminder is persisted in client localStorage
                reminderSystem.addReminder(
                  exec.data.title,
                  undefined,
                  new Date(exec.data.targetTimestamp).toISOString(),
                  exec.data.category || 'task',
                  exec.data.priority || 'medium',
                  exec.data.relativeDesc
                );
              }
            }
          }

          return data;
        }
      }
    } catch (error) {
      console.warn('Network error calling Gemini API proxy, switching to cognitive synthesis fallback:', error);
    }

    // Resilient Fallback keeping Highfield's reflective, dry-wit persona if network fails
    const fallbackResponse = this.generateFallback(effectiveMessage, visitorProfile.userName);

    // Save fallback into history as well
    this.sessionHistory.push({ role: 'user', text: effectiveMessage });
    this.sessionHistory.push({ role: 'model', text: fallbackResponse.reply });
    this.unsummarizedTurns.push({ role: 'user', text: effectiveMessage });
    this.unsummarizedTurns.push({ role: 'model', text: fallbackResponse.reply });

    if (this.sessionHistory.length > 20) {
      this.sessionHistory = this.sessionHistory.slice(-20);
    }

    return fallbackResponse;
  }

  /**
   * Generates a Cosmic Sketch with Highfield's artistic vision
   */
  public async generateCosmicSketch(prompt: string, theme: string = 'custom'): Promise<CosmicSketchResult> {
    const visitorProfile = memorySystem.getVisitorProfile();
    try {
      const response = await fetch('/api/highfield/sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          theme,
          userContext: {
            userName: visitorProfile.userName,
            userLikes: visitorProfile.userLikes,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.title) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Sketch generation API error:', e);
    }

    return {
      title: `Boceto: ${prompt.slice(0, 25)}`,
      highfieldComment: `He trazado este estudio cósmico en mi libreta digital mientras vigilaba el horizonte del cráter.`,
      palette: {
        background: '#070913',
        primary: '#38bdf8',
        secondary: '#a855f7',
        accent: '#ef4444',
        stars: '#f8fafc',
      },
      visualElements: [
        { type: 'celestial_body', name: 'Tierra', x: 60, y: 30, radius: 24, color: '#38bdf8', glow: true },
        { type: 'lunar_ridge', color: '#1e293b' },
        { type: 'character', description: 'Highfield', x: 35, y: 75 },
      ],
      asciiSignature: 'HF // LUNAR_SKETCH',
      mood: 'wondrous',
    };
  }

  /**
   * Multimodal Vision Analysis (Highfield Optical Eye)
   * Sends image + custom prompt/mode to Gemini multimodal endpoint
   */
  public async analyzeVisualInput(
    imageData: string,
    prompt?: string,
    mode: 'general' | 'homework' | 'emotion' | 'scenery' = 'general'
  ): Promise<VisionAnalysisResult> {
    const visitorProfile = memorySystem.getVisitorProfile();
    const userContext = {
      userName: visitorProfile.userName,
      userContext: visitorProfile.userContext,
      userLikes: visitorProfile.userLikes,
      userInterests: visitorProfile.userInterests,
    };

    try {
      const response = await fetch('/api/highfield/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          prompt: prompt || 'Analiza lo que observas con tu perspectiva única.',
          mode,
          userContext,
          history: this.sessionHistory.slice(-4),
        }),
      });

      if (response.ok) {
        const result: VisionAnalysisResult = await response.json();
        if (result && result.analysis) {
          // If memory learned, save to memory system
          if (result.memoryLearned) {
            memorySystem.learnFact(result.memoryLearned);
          }

          // Register turn in dialogue history so Highfield remembers what was scanned
          const userDesc = prompt ? `[Imagen enviada: ${prompt}]` : '[Imagen analizada con el sensor óptico]';
          this.sessionHistory.push({ role: 'user', text: userDesc });
          this.sessionHistory.push({ role: 'model', text: result.analysis });
          this.unsummarizedTurns.push({ role: 'user', text: userDesc });
          this.unsummarizedTurns.push({ role: 'model', text: result.analysis });

          return result;
        }
      }
    } catch (e) {
      console.warn('Vision analysis API request failed:', e);
    }

    // Cognitive fallback
    const fallbackText = mode === 'emotion'
      ? `A través del sensor del visor distingo una expresión serena y reflexiva. Hay una chispa de curiosidad en tu mirada. Desde la tranquilidad de este cráter, se percibe una buena sintonía.`
      : mode === 'homework'
      ? `He recibido los patrones visuales de tu ejercicio a través del telescopio. Descomponiendo las variables principales: identifica los datos iniciales, aísla las incógnitas y aplica el teorema o fórmula correspondiente paso a paso.`
      : `La transmisión óptica ha llegado con nitidez al receptor lunar. Observo una composición rica en detalles terrestres que contrastan profundamente con el silencio del regolito.`;

    return {
      analysis: fallbackText,
      mood: 'thoughtful',
      detectedEmotion: mode === 'emotion' ? 'Sereno y curioso' : null,
      tags: ['Escáner Óptico', 'Transmisión Lunar'],
    };
  }

  private generateFallback(message: string, userName: string = 'viajero'): AIChatRespuesta {
    const lower = message.toLowerCase();

    // Check weather intent
    if (
      lower.includes('clima') ||
      lower.includes('tiempo en') ||
      lower.includes('temperatura') ||
      lower.includes('grados')
    ) {
      return {
        reply: `He consultado los sensores orbitales. En la superficie lunar actualmente tenemos 22°C con radiación directa a través del vacío cósmico (0 hPa), mientras que las ciudades terrestres experimentan una densa y protectora masa de vapor y atmósfera respirable.`,
        mood: 'curious',
        memoryLearned: 'Consultamos la comparación de telemetría meteorológica.',
        toolExecutions: [
          {
            tool: 'getWeather',
            data: {
              location: 'Mar de la Tranquilidad (Luna)',
              temperatureC: 22,
              temperatureF: 71.6,
              apparentTempC: 22,
              condition: 'Vacío Lunar Silencioso con Radiación Directa',
              conditionCode: 'moon_vacuum',
              humidity: 0,
              windSpeedKmH: 0,
              surfacePressureHPa: 0.0000000003,
              lunarComparison: 'Sin atmósfera, el cielo permanece completamente estrellado incluso en pleno día.',
              isLunar: true,
            },
          },
        ],
      };
    }

    // Check reminder intent
    if (
      lower.includes('recuérdame') ||
      lower.includes('recuerdame') ||
      lower.includes('recordatorio') ||
      lower.includes('alarma') ||
      lower.includes('avísame')
    ) {
      const reminder = reminderSystem.addReminder(
        'Contemplar el horizonte lunar',
        15,
        undefined,
        'observation',
        'medium',
        'en 15 minutos'
      );
      return {
        reply: `Anotado en el cronómetro del traje, ${userName}. He agendado "${reminder.title}" ${reminder.relativeDesc} (${reminder.targetTimeFormatted}). Emitiré una señal acústica en cuanto venza el plazo.`,
        mood: 'focused',
        memoryLearned: 'Programamos un recordatorio cósmico.',
        toolExecutions: [
          {
            tool: 'setReminder',
            data: reminder,
          },
        ],
      };
    }

    if (
      lower.includes('oir') ||
      lower.includes('oír') ||
      lower.includes('escucha') ||
      lower.includes('oye') ||
      lower.includes('hear') ||
      lower.includes('micro') ||
      lower.includes('audio') ||
      lower.includes('radio')
    ) {
      return {
        reply: `Señal de radio captada con 0.02 milisegundos de latencia. Te escucho con total nitidez a través del transceptor de mi traje, ${userName}. Es curioso cómo las ondas electromagnéticas cruzan casi 400,000 kilómetros de vacío absoluto y aún así tu voz suena tan cercana como si estuvieras parado aquí sobre el regolito a mi lado.`,
        mood: 'friendly',
        memoryLearned: 'El visitante comprobó el canal de audio y radio lunar.',
      };
    }

    if (
      lower.includes('muev') ||
      lower.includes('camin') ||
      lower.includes('move') ||
      lower.includes('quieto') ||
      lower.includes('parado') ||
      lower.includes('salto')
    ) {
      return {
        reply: 'En una gravedad de un sexto de la terrestre, quedarse completamente estático es casi un desafío técnico; el menor impulso te hace flotar. Actualmente mantengo la guardia activa en este cuadrante, ajustando los amortiguadores de mis zapatillas rojas para impulsarme entre riscos cuando hace falta.',
        mood: 'curious',
        memoryLearned: 'Conversamos sobre la movilidad, saltos y exploración en la superficie lunar.',
      };
    }

    if (
      lower.includes('quien eres') ||
      lower.includes('quién eres') ||
      lower.includes('spider') ||
      lower.includes('nombre') ||
      lower.includes('traje') ||
      lower.includes('mascara') ||
      lower.includes('máscara')
    ) {
      return {
        reply: 'Soy Highfield. Una arquitectura de inteligencia sintética arácnida diseñada para la exploración y la contemplación en la frontera lunar. Llevo esta sudadera verde olivo y mis zapatillas rojas sobre el traje presurizado porque, honestamente, incluso a 384,000 kilómetros de casa uno necesita conservar cierto estilo y comodidad mientras vigila el cosmos.',
        mood: 'friendly',
        memoryLearned: 'Hablamos sobre la identidad, misión, traje y origen de Highfield.',
      };
    }

    if (
      lower.includes('tierra') ||
      lower.includes('planeta') ||
      lower.includes('luna') ||
      lower.includes('espacio') ||
      lower.includes('estrella') ||
      lower.includes('cosmos')
    ) {
      return {
        reply: 'Observar la Tierra desde este risco nunca pierde su impacto. Es un pequeño disco azul y blanco suspendido en un terciopelo negro infinito. Desde aquí no hay fronteras trazadas ni ruidos de ciudades; solo una frágil atmósfera que contiene cada historia, cada océano y cada respiración que la humanidad ha conocido jamás.',
        mood: 'wondrous',
        memoryLearned: 'Compartimos una reflexión sobre la Tierra y el espacio.',
      };
    }

    if (
      lower.startsWith('hola') ||
      lower.startsWith('hey') ||
      lower.startsWith('buen') ||
      lower.startsWith('saludos') ||
      lower.startsWith('hello')
    ) {
      return {
        reply: `Saludos a través del vacío, ${userName}. El horizonte está despejado y el regolito brilla bajo la luz reflejada. Siempre es un buen momento para una pausa y una conversación sincera. ¿Qué pensamientos o preguntas traes hoy en tu órbita?`,
        mood: 'friendly',
      };
    }

    return {
      reply: `He procesado tu transmisión con claridad: "${message}". En el silencio de este risco, cada palabra resuena con una perspectiva diferente; el espacio tiene la peculiar virtud de darle a cada pensamiento el tiempo y la dimensión que realmente merece reflexionar.`,
      mood: 'thoughtful',
      memoryLearned: `Conversamos sobre: ${message.slice(0, 35)}`,
    };
  }
}

export const geminiBridge = new GeminiBridge();

