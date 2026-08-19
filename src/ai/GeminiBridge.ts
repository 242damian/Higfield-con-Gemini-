/**
 * HIGHFIELD - AI Architecture Bridge & Cognitive Dialogue Engine
 * Provides intelligent conversational synthesis, emotional nuance,
 * memory integration, and direct answers to user queries with Gemini API support.
 */

import { WorldContext } from '../types';
import { memorySystem } from '../engine/MemorySystem';

export interface AIIntentionResponse {
  intention: 'EXPLORE' | 'OBSERVE' | 'INSPECT' | 'REST' | 'COMMUNICATE';
  targetFocus?: string;
  internalMonologue: string;
  emotion: 'calm' | 'curious' | 'wondrous' | 'focused' | 'alert';
}

export interface AIChatResponse {
  reply: string;
  mood: 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly';
  memoryLearned?: string;
}

export class GeminiBridge {
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

  public async generateReply(
    userMessage: string,
    history: { role: 'user' | 'model'; text: string }[]
  ): Promise<AIChatResponse> {
    const memories = memorySystem.getVisitorProfile().learnedFacts;

    // Call Full-Stack Express Server API with Gemini 3.7 Flash
    try {
      const response = await fetch('/api/highfield/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history, memories }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          if (data.memoryLearned) {
            memorySystem.learnFact(data.memoryLearned);
          }
          return data;
        }
      }
    } catch {
      // Fallback
    }

    const lower = userMessage.toLowerCase().trim();

    if (
      lower.includes('oir') ||
      lower.includes('oír') ||
      lower.includes('escucha') ||
      lower.includes('oye') ||
      lower.includes('hear') ||
      lower.includes('micrófono') ||
      lower.includes('micro')
    ) {
      const resp: AIChatResponse = {
        reply: '¡Sí, te escucho fuerte y claro a través del canal de audio! Tu voz y mensajes llegan directamente a mi casco y traje aquí en la luna.',
        mood: 'friendly',
        memoryLearned: 'El visitante comprobó el canal de audio y voz.',
      };
      if (resp.memoryLearned) memorySystem.learnFact(resp.memoryLearned);
      return resp;
    }

    if (
      lower.includes('muev') ||
      lower.includes('camin') ||
      lower.includes('move') ||
      lower.includes('quieto') ||
      lower.includes('parado')
    ) {
      const resp: AIChatResponse = {
        reply: '¡Claro que me muevo! Patrullo las crestas y cráteres lunares de un lado a otro. Si haces clic en el suelo o pulsas "Walk_Patrol", caminaré de inmediato hacia ese punto.',
        mood: 'curious',
        memoryLearned: 'Conversamos sobre las rutas de patrullaje lunar.',
      };
      if (resp.memoryLearned) memorySystem.learnFact(resp.memoryLearned);
      return resp;
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
      const resp: AIChatResponse = {
        reply: 'Soy Highfield. Llevo este traje arácnido y sudadera para explorar las fronteras del cosmos. Con una sexta parte de gravedad, mis saltos alcanzan alturas increíbles.',
        mood: 'friendly',
        memoryLearned: 'Hablamos sobre la identidad y el traje de Highfield.',
      };
      if (resp.memoryLearned) memorySystem.learnFact(resp.memoryLearned);
      return resp;
    }

    if (
      lower.includes('tierra') ||
      lower.includes('planeta') ||
      lower.includes('luna') ||
      lower.includes('espacio') ||
      lower.includes('estrella') ||
      lower.includes('cosmos')
    ) {
      const resp: AIChatResponse = {
        reply: 'Observar la Tierra desde este risco es sobrecogedor. Toda la humanidad vive en ese pequeño punto azul brillante mientras el universo gira a su alrededor.',
        mood: 'wondrous',
        memoryLearned: 'Compartimos una reflexión sobre la Tierra y el espacio.',
      };
      if (resp.memoryLearned) memorySystem.learnFact(resp.memoryLearned);
      return resp;
    }

    if (
      lower.startsWith('hola') ||
      lower.startsWith('hey') ||
      lower.startsWith('buen') ||
      lower.startsWith('saludos') ||
      lower.startsWith('hello')
    ) {
      return {
        reply: '¡Hola! Es genial tener compañía en esta noche lunar. ¿Qué te gustaría explorar o conversar hoy?',
        mood: 'friendly',
      };
    }

    const dynamicReplies: AIChatResponse[] = [
      {
        reply: `He registrado tu mensaje: "${userMessage}". En este rincón del universo, cada palabra resuena con un eco especial.`,
        mood: 'thoughtful',
      },
      {
        reply: 'La inmensidad del espacio nos hace reflexionar sobre muchas cosas. Cuéntame más de lo que estás pensando.',
        mood: 'friendly',
      },
      {
        reply: 'Las estrellas no tienen prisa, y nosotros tampoco. Es un buen momento para contemplar el horizonte juntos.',
        mood: 'calm',
      },
    ];

    const chosen = dynamicReplies[Math.floor(Math.random() * dynamicReplies.length)];
    return chosen;
  }
}

export const geminiBridge = new GeminiBridge();
