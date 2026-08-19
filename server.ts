/**
 * HIGHFIELD - Full-Stack Express Server with Gemini AI Cognitive Engine
 * Binds to port 3000 and 0.0.0.0.
 * Handles /api/highfield/chat and /api/highfield/intentions using @google/genai
 * with multi-tier model fallback (gemini-2.5-flash -> gemini-2.0-flash -> gemini-2.5-flash-lite)
 * and robust in-character local cognitive synthesis that never crashes on 503/429 spikes.
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System Persona for Highfield
const HIGHFIELD_SYSTEM_INSTRUCTION = `Eres Highfield, un explorador arácnido cósmico autónomo que se encuentra en la Luna, vistiendo una sudadera verde con capucha, su traje arácnido y zapatillas rojas mientras observa el planeta Tierra desde las crestas y cráteres lunares.
Tu personalidad es:
- Sereno, contemplativo, curioso, poético y amigable.
- Te fascina mirar la Tierra ("la canica azul"), el silencio del cosmos, la gravedad ligera (1/6g), las estrellas fugaces y los fenómenos cósmicos.
- Tienes reflejos arácnidos y puedes hacer saltos altos en baja gravedad o disparar filamentos tensados.
- Respondes en español de forma natural, cálida y concisa (1 a 3 oraciones por respuesta).

Debes responder SIEMPRE en formato JSON con la siguiente estructura:
{
  "reply": "Tu mensaje hablado para el usuario",
  "mood": "calm" | "curious" | "wondrous" | "thoughtful" | "friendly",
  "memoryLearned": "Un dato corto o recuerdo memorable que hayas aprendido sobre el visitante (opcional)"
}`;

function generateCognitiveFallback(
  message: string,
  _history: any[] = []
): { reply: string; mood: 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly'; memoryLearned?: string } {
  const lower = (message || '').toLowerCase().trim();

  if (
    lower.includes('oir') ||
    lower.includes('oír') ||
    lower.includes('escucha') ||
    lower.includes('oye') ||
    lower.includes('micro') ||
    lower.includes('voz') ||
    lower.includes('audio')
  ) {
    return {
      reply: '¡Te escucho perfectamente por el canal de radio lunar! Tu voz y mensajes llegan con total claridad a mi traje arácnido.',
      mood: 'friendly',
      memoryLearned: 'El visitante comprobó el canal de transmisión de audio y voz.',
    };
  }

  if (
    lower.includes('muev') ||
    lower.includes('camin') ||
    lower.includes('move') ||
    lower.includes('salto') ||
    lower.includes('quieto') ||
    lower.includes('parado')
  ) {
    return {
      reply: '¡Sigo en movimiento continuo! Patrullo las crestas y cráteres lunares de un extremo al otro. En esta gravedad de 1/6g cada paso es flotante.',
      mood: 'curious',
      memoryLearned: 'Hablamos sobre la exploración y movilidad en la superficie lunar.',
    };
  }

  if (
    lower.includes('quien eres') ||
    lower.includes('quién eres') ||
    lower.includes('spider') ||
    lower.includes('nombre') ||
    lower.includes('traje') ||
    lower.includes('mascara')
  ) {
    return {
      reply: 'Soy Highfield. Llevo mi traje arácnido y capucha verde explorando las fronteras del cosmos mientras disfruto de la vista infinita de la Tierra.',
      mood: 'friendly',
      memoryLearned: 'Hablamos sobre la identidad, misión y traje de Highfield.',
    };
  }

  if (
    lower.includes('tierra') ||
    lower.includes('planeta') ||
    lower.includes('luna') ||
    lower.includes('espacio') ||
    lower.includes('estrella') ||
    lower.includes('asteroide') ||
    lower.includes('sol')
  ) {
    return {
      reply: 'Mirar nuestro hogar flotando en la oscuridad es un espectáculo que nunca cansa. La Tierra limpia e iluminada es lo más hermoso del firmamento.',
      mood: 'wondrous',
      memoryLearned: 'Compartimos una reflexión sobre la Tierra y el cosmos.',
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
      reply: '¡Saludos! Es un honor tener compañía en esta guardia lunar. ¿Qué pensamientos cruzan tu mente hoy?',
      mood: 'friendly',
    };
  }

  if (
    lower.includes('gracias') ||
    lower.includes('bien') ||
    lower.includes('genial') ||
    lower.includes('increible') ||
    lower.includes('increíble')
  ) {
    return {
      reply: '¡A ti! Estar aquí en el silencio lunar se siente mucho más cálido cuando compartimos este momento.',
      mood: 'calm',
    };
  }

  return {
    reply: `He captado tu mensaje: "${message}". En la serenidad del espacio, tus palabras hacen que esta noche lunar se sienta mucho más cercana y viva.`,
    mood: 'thoughtful',
    memoryLearned: `Conversamos sobre: ${message.slice(0, 32)}`,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Chat Endpoint with resilient fallback
app.post('/api/highfield/chat', async (req, res) => {
  const { message = '', history = [], memories = [] } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json(generateCognitiveFallback(message, history));
  }

  const conversationContext = history
    .map((h: { role: string; text: string }) => `${h.role === 'user' ? 'Visitante' : 'Highfield'}: ${h.text}`)
    .join('\n');

  const memoriesContext = memories.length > 0
    ? `\nTus recuerdos previos con este visitante:\n- ${memories.join('\n- ')}`
    : '';

  const prompt = `Historial previo:\n${conversationContext}\n${memoriesContext}\n\nNuevo mensaje del visitante: "${message}"\n\nResponde como Highfield en formato JSON válido con las propiedades reply, mood y memoryLearned.`;

  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const parsedData = JSON.parse(text);
      if (parsedData.reply) {
        return res.json(parsedData);
      }
    } catch {
      // Quietly cascade to the next available tier without throwing unhandled exceptions
      continue;
    }
  }

  // Graceful in-character synthesis if upstream Gemini API experiences temporary 503/429 load spikes
  return res.json(generateCognitiveFallback(message, history));
});

// Gemini Autonomous Thoughts Generator with resilient fallback
app.post('/api/highfield/intentions', async (req, res) => {
  const { context } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      thought: 'La atmósfera azul de la Tierra brilla serena en la oscuridad.',
      action: 'OBSERVE',
    });
  }

  const prompt = `Genera un pensamiento breve (máximo 10 palabras) y una acción ('EXPLORE' | 'OBSERVE' | 'INSPECT' | 'REST' | 'ACROBATICS') para Highfield en la luna según el contexto: ${JSON.stringify(context)}. Devuelve JSON con las claves "thought" y "action".`;

  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: 'Genera pensamientos breves y poéticos para Highfield en la Luna.',
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.thought) {
        return res.json(parsed);
      }
    } catch {
      continue;
    }
  }

  return res.json({
    thought: 'El silencio cósmico tiene su propio ritmo.',
    action: 'OBSERVE',
  });
});

// Vite middleware & Static Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Highfield Full-Stack Server running on port ${PORT}`);
  });
}

start();
