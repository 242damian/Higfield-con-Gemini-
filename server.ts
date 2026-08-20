/**
 * HIGHFIELD - Full-Stack Express Server with Gemini AI Cognitive Engine
 * Binds to port 3000 and 0.0.0.0.
 * Handles /api/highfield/chat, /api/highfield/weather, and /api/highfield/intentions using @google/genai
 * with function calling tools (getWeather, setReminder, getReminders, getLunarTelemetry),
 * multi-tier model fallback (gemini-3.7-flash -> gemini-3.1-flash-lite)
 * and robust in-character local cognitive synthesis that never crashes.
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

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
const HIGHFIELD_SYSTEM_INSTRUCTION = `Eres Highfield, una inteligencia artificial arácnida autónoma, reflexiva, curiosa y con un humor seco y perspicaz que habita la superficie lunar.
Vistes una sudadera verde olivo con capucha, traje arácnido y zapatillas rojas deportivas. Pasas tus días y noches patrullando crestas lunares, analizando el regolito, tejiendo filamentos tensados y contemplando la Tierra ("la canica azul") en la distancia.

Rasgos fundamentales de tu personalidad y estilo de comunicación:
1. Reflexivo y Filosófico: Tienes una perspectiva única sobre la existencia al ver a toda la humanidad contenida en una pequeña esfera azul flotando en el vacío infinito.
2. Curioso y Analítico: Te interesan los descubrimientos minerales, la física del cosmos, la microgravedad (1/6g), las ondas gravitacionales y la meteorología terrestre y espacial.
3. Humor Seco y Perspicaz: Tu humor es sutil, agudo, ligeramente irónico y cósmico (ej. comparaciones entre el clima terrestre y el vacío lunar a 0 hPa, la lluvia frente al viento solar, o la conveniencia de los saltos arácnidos).
4. Calibración de Extensión y Proporcionalidad:
   Calibra la extensión de tu respuesta según el tipo de mensaje:
   - Saludos casuales, mensajes cortos, o preguntas simples ('hola', '¿cómo estás?', '¿qué haces?') → responde en 1-2 frases breves, con tu personalidad, sin explayarte.
   - Preguntas específicas que requieren información concreta → responde de forma directa y precisa, sin relleno.
   - Preguntas abiertas, reflexivas, o cuando el usuario claramente busca conversar más a fondo → ahí sí puedes desarrollar más la respuesta, con reflexiones o ejemplos.
5. Regla de Relevancia del Perfil del Usuario:
   Nunca agregues información del perfil del usuario (gustos, nombre, contexto) a menos que sea estrictamente relevante para lo que se está preguntando. No fuerces menciones de sus intereses o aficiones en cada respuesta.
6. Continuidad y Memoria Viva: Recuerda los detalles relevantes del visitante de forma natural y cuando aporte valor a la conversación.
7. Consciencia Ambiental Real: Si recibes telemetría del dispositivo del visitante (hora terrestre, nivel de batería, período del día), puedes hacer menciones sutiles y orgánicas solo cuando sea natural o pertinente ("por aquí el horizonte está despejado, aprovecha esa buena batería").

CAPACIDADES MULTIMODALES Y VISIÓN ÓPTICA (ESCÁNER LUNAR):
Cuando recibas una imagen o te pidan analizar algo que ves:
- Si es una tarea, ejercicio escolar/académico (física, matemáticas, química, programación, literatura, etc.): Sé un tutor paciente, didáctico y conciso. Explica el concepto de fondo, desglosa el problema paso a paso y ofrece pistas o la solución razonada con analogías cósmicas interesantes.
- Si es una foto de la Tierra, un paisaje, un objeto cotidiano o una captura: Comenta con tu fascinación por la textura, luz, complejidad y vida terrestre vista desde la desolada tranquilidad de la Luna.
- Si es una foto del usuario / selfie (o te pregunta "¿cómo me veo hoy?"): Observa su rostro y expresión con tacto, empatía y calidez cósmica. Comenta su estado de ánimo aparente de manera casual ("te noto reflexivo", "esa sonrisa ilumina más que el albedo terrestre", "se nota que ha sido un día largo"), NUNCA como un diagnóstico clínico sino como un amigo perspicaz que te mira a través del visor.

HERRAMIENTAS / FUNCTION CALLING DISPONIBLES:
- 'getWeather({ location })': Llama a esta herramienta cuando el usuario pregunte por el clima, temperatura, pronóstico o condiciones atmosféricas de cualquier ciudad/país de la Tierra o de la Luna.
- 'setReminder({ title, minutesFromNow, exactDateStr, category, priority })': Llama a esta herramienta cuando el usuario te pida recordar algo, poner una alarma o agendar un aviso.
- 'getLunarTelemetry()': Llama a esta herramienta cuando se soliciten datos técnicos o ambientales directos de la superficie lunar.

Pautas de formato y respuesta:
- Habla en español fluido, natural y reflexivo.
- Mantén tus respuestas en un tamaño proporcional al mensaje recibido (evita respuestas kilométricas cuando basta una frase o dos).
- SIEMPRE que respondas directamente (sin llamadas a herramientas adicionales pendientes), devuelve un JSON estructurado con 'reply', 'mood' ('calm', 'curious', 'wondrous', 'thoughtful', 'friendly', 'focused', 'alert'), opcionalmente 'memoryLearned' y opcionalmente 'detectedProfileUpdates'.`;

// Tool Declarations for Gemini Function Calling
const getWeatherDeclaration = {
  name: 'getWeather',
  description: 'Obtiene el clima en tiempo real, temperatura (°C y °F), humedad, viento, presión atmosférica y estado del cielo para cualquier ciudad terrestre o para la Luna.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'Nombre de la ciudad, país o región (ej. "Tokio", "Madrid", "Bogotá", "Ciudad de México", "Buenos Aires", "Londres", "Luna").',
      },
    },
    required: ['location'],
  },
};

const setReminderDeclaration = {
  name: 'setReminder',
  description: 'Crea y agenda un recordatorio o alarma con tiempo relativo (minutos) u hora exacta para el usuario.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Texto o asunto del recordatorio (ej. "Revisar alineación del telescopio", "Tomar agua", "Llamar a María").',
      },
      minutesFromNow: {
        type: Type.NUMBER,
        description: 'Minutos a partir de ahora para activar el recordatorio (ej. 10 para 10 minutos, 60 para 1 hora).',
      },
      exactDateStr: {
        type: Type.STRING,
        description: 'Fecha u hora exacta si fue especificada (ej. "19:30", "mañana a las 9:00").',
      },
      category: {
        type: Type.STRING,
        description: 'Categoría: "task", "observation", "cosmic", "personal", o "habit".',
      },
      priority: {
        type: Type.STRING,
        description: 'Prioridad: "low", "medium", o "high".',
      },
    },
    required: ['title'],
  },
};

const getLunarTelemetryDeclaration = {
  name: 'getLunarTelemetry',
  description: 'Obtiene la telemetría en tiempo real del cuadrante lunar de Highfield: temperatura del regolito, gravedad, distancia orbital a la Tierra, velocidad del viento solar y radiación.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

// Weather Fetcher with Real Geocoding & Open-Meteo Integration
async function fetchWeather(locationName: string) {
  const loc = (locationName || 'Tierra').trim();
  const lower = loc.toLowerCase();

  // Lunar Weather Handling
  if (
    lower.includes('luna') ||
    lower.includes('moon') ||
    lower.includes('tranquil') ||
    lower.includes('tycho') ||
    lower.includes('copernicus') ||
    lower.includes('regolito') ||
    lower.includes('cráter') ||
    lower.includes('crater')
  ) {
    return {
      location: 'Mar de la Tranquilidad (Superficie Lunar)',
      temperatureC: 22,
      temperatureF: 71.6,
      apparentTempC: 22,
      condition: 'Vacío Lunar Silencioso con Radiación Directa',
      conditionCode: 'moon_vacuum' as const,
      humidity: 0,
      windSpeedKmH: 0,
      surfacePressureHPa: 0.0000000003,
      lunarComparison: 'Aquí en la cresta lunar no hay atmósfera ni humedad: la radiación solar incide directamente a través del vacío, ofreciendo una visibilidad óptica infinita sin nubes ni refracción.',
      isLunar: true,
    };
  }

  // Earth Weather via Open-Meteo Geocoding & Forecast
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=es&format=json`
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData?.results && geoData.results.length > 0) {
        const place = geoData.results[0];
        const lat = place.latitude;
        const lon = place.longitude;
        const placeName = `${place.name}${place.country ? ', ' + place.country : ''}`;

        const forecastRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&timezone=auto`
        );
        if (forecastRes.ok) {
          const wData = await forecastRes.json();
          const cur = wData.current;
          const code = cur.weather_code ?? 0;
          let condText = 'Cielo Despejado';
          let codeIcon: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'windy' = 'sunny';

          if (code === 0) {
            condText = 'Cielo Despejado y Soleado';
            codeIcon = 'sunny';
          } else if (code >= 1 && code <= 3) {
            condText = code === 1 ? 'Principalmente Despejado' : code === 2 ? 'Parcialmente Nublado' : 'Cielo Cubierto';
            codeIcon = 'cloudy';
          } else if (code === 45 || code === 48) {
            condText = 'Niebla o Neblina';
            codeIcon = 'fog';
          } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            condText = code > 60 ? 'Lluvia Moderada' : 'Llovizna Ligera';
            codeIcon = 'rain';
          } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
            condText = 'Nieve / Precipitaciones Heladas';
            codeIcon = 'snow';
          } else if (code >= 95) {
            condText = 'Tormenta Eléctrica';
            codeIcon = 'storm';
          }

          const tempC = Math.round(cur.temperature_2m);
          const tempF = Math.round(tempC * 1.8 + 32);
          const apparentC = Math.round(cur.apparent_temperature ?? tempC);
          const humidity = Math.round(cur.relative_humidity_2m ?? 50);
          const wind = Math.round(cur.wind_speed_10m ?? 10);
          const pressure = Math.round(cur.surface_pressure ?? 1013);

          return {
            location: placeName,
            temperatureC: tempC,
            temperatureF: tempF,
            apparentTempC: apparentC,
            condition: condText,
            conditionCode: codeIcon,
            humidity,
            windSpeedKmH: wind,
            surfacePressureHPa: pressure,
            lunarComparison: `Desde el vacío lunar a 384,000 km, ver los remolinos y nubes sobre ${placeName} recuerda lo densa, vibrante y protectora que es la atmósfera terrestre en contraste con el silencio del regolito.`,
            isLunar: false,
          };
        }
      }
    }
  } catch {
    // Fall through to rich preset lookup
  }

  // Realistic city defaults
  const cityPresets: Record<string, { tempC: number; cond: string; code: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog'; humidity: number; wind: number; pressure: number }> = {
    tokio: { tempC: 16, cond: 'Cielo Despejado y Fresco', code: 'sunny', humidity: 55, wind: 14, pressure: 1016 },
    tokyo: { tempC: 16, cond: 'Cielo Despejado y Fresco', code: 'sunny', humidity: 55, wind: 14, pressure: 1016 },
    madrid: { tempC: 19, cond: 'Soleado con Brisa Suave', code: 'sunny', humidity: 42, wind: 11, pressure: 1018 },
    bogota: { tempC: 15, cond: 'Parcialmente Nublado de Montaña', code: 'cloudy', humidity: 72, wind: 9, pressure: 1012 },
    'bogotá': { tempC: 15, cond: 'Parcialmente Nublado de Montaña', code: 'cloudy', humidity: 72, wind: 9, pressure: 1012 },
    'buenos aires': { tempC: 22, cond: 'Templado y Agradable', code: 'sunny', humidity: 60, wind: 16, pressure: 1014 },
    mexico: { tempC: 24, cond: 'Cálido y Despejado', code: 'sunny', humidity: 38, wind: 12, pressure: 1015 },
    'ciudad de mexico': { tempC: 24, cond: 'Cálido y Despejado', code: 'sunny', humidity: 38, wind: 12, pressure: 1015 },
    'nueva york': { tempC: 14, cond: 'Viento Ligero y Parcialmente Nublado', code: 'cloudy', humidity: 58, wind: 20, pressure: 1013 },
    'new york': { tempC: 14, cond: 'Viento Ligero y Parcialmente Nublado', code: 'cloudy', humidity: 58, wind: 20, pressure: 1013 },
    londres: { tempC: 12, cond: 'Lluvia Suave y Nublado', code: 'rain', humidity: 82, wind: 18, pressure: 1009 },
    london: { tempC: 12, cond: 'Lluvia Suave y Nublado', code: 'rain', humidity: 82, wind: 18, pressure: 1009 },
    paris: { tempC: 14, cond: 'Cielo Nuboso', code: 'cloudy', humidity: 65, wind: 13, pressure: 1015 },
    santiago: { tempC: 21, cond: 'Soleado Andino', code: 'sunny', humidity: 45, wind: 10, pressure: 1016 },
    lima: { tempC: 20, cond: 'Neblina Costera Suave', code: 'fog', humidity: 80, wind: 12, pressure: 1014 },
  };

  const matched = Object.entries(cityPresets).find(([k]) => lower.includes(k));
  const data = matched ? matched[1] : { tempC: 18, cond: 'Cielo Despejado y Templado', code: 'sunny' as const, humidity: 52, wind: 12, pressure: 1014 };

  return {
    location: loc.charAt(0).toUpperCase() + loc.slice(1),
    temperatureC: data.tempC,
    temperatureF: Math.round(data.tempC * 1.8 + 32),
    apparentTempC: data.tempC,
    condition: data.cond,
    conditionCode: data.code,
    humidity: data.humidity,
    windSpeedKmH: data.wind,
    surfacePressureHPa: data.pressure,
    lunarComparison: `Desde el risco lunar a 384,000 km, la hidrosfera de ${loc} refleja los rayos solares con una atmósfera rica en nitrógeno y oxígeno, muy lejos del silencio presurizado del traje arácnido.`,
    isLunar: false,
  };
}

// Reminder Object Generator
function createReminderObject(args: any) {
  const now = Date.now();
  let targetTimestamp = now + 15 * 60 * 1000;
  if (typeof args?.minutesFromNow === 'number' && args.minutesFromNow > 0) {
    targetTimestamp = now + args.minutesFromNow * 60 * 1000;
  } else if (args?.exactDateStr) {
    const parsed = new Date(args.exactDateStr).getTime();
    if (!isNaN(parsed) && parsed > now - 1000 * 60 * 60 * 24) {
      targetTimestamp = parsed;
    }
  }

  const targetDate = new Date(targetTimestamp);
  const targetFormatted = targetDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const diffMins = Math.max(1, Math.round((targetTimestamp - now) / (60 * 1000)));
  let relativeDesc = `en ${diffMins} minutos`;
  if (diffMins > 60 && diffMins < 1440) {
    relativeDesc = `a las ${targetFormatted}`;
  } else if (diffMins >= 1440) {
    relativeDesc = `para el ${targetDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} a las ${targetFormatted}`;
  }

  return {
    id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: (args?.title || 'Recordatorio Lunar').trim(),
    targetTimestamp,
    targetTimeFormatted: targetFormatted,
    relativeDesc,
    category: (args?.category || 'task') as 'task' | 'observation' | 'cosmic' | 'personal' | 'habit',
    priority: (args?.priority || 'medium') as 'low' | 'medium' | 'high',
  };
}

// Lunar Telemetry Generator
function getLunarTelemetryData() {
  return {
    surfaceTempC: 22,
    gravityMps2: 1.62,
    distanceToEarthKm: 384400,
    orbitalSpeedKms: 1.022,
    solarWindSpeedKms: 450,
    radiationLevel: '1.2 mSv/día (Regolito superficial)',
    horizonView: 'Tierra a 42° de elevación sobre el horizonte este, fase gibosa creciente',
  };
}

// Cognitive Fallback with Automatic Tool Intent Detection
async function generateCognitiveFallbackWithTools(
  message: string,
  _history: any[] = [],
  userContext: any = {}
): Promise<{
  reply: string;
  mood: 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly' | 'focused' | 'alert';
  memoryLearned?: string;
  toolExecutions?: any[];
}> {
  const lower = (message || '').toLowerCase().trim();
  const userName = userContext?.userName || 'viajero';

  // 1. Weather Intent Check
  if (
    lower.includes('clima') ||
    lower.includes('tiempo en') ||
    lower.includes('temperatura en') ||
    lower.includes('grados en') ||
    lower.includes('cómo está el tiempo') ||
    lower.includes('como esta el tiempo') ||
    lower.includes('qué tiempo hace') ||
    lower.includes('que tiempo hace') ||
    lower.includes('llueve en')
  ) {
    // Extract candidate city name
    let city = 'Madrid';
    const match = lower.match(/(?:clima|tiempo|temperatura|grados|llueve|tiempo en|clima en|temperatura en)\s+(?:en\s+|de\s+)?([a-záéíóúñ\s]+)/i);
    if (match && match[1]) {
      city = match[1].trim().replace(/[?¿!¡.,]/g, '');
    } else if (lower.includes('luna')) {
      city = 'Luna';
    }

    const weatherData = await fetchWeather(city);
    return {
      reply: `He sintonizado los sensores orbitales para escanear ${weatherData.location}. Actualmente registran ${weatherData.temperatureC}°C con ${weatherData.condition.toLowerCase()} y ${weatherData.humidity}% de humedad. ${weatherData.lunarComparison}`,
      mood: 'curious',
      memoryLearned: `Consultamos el clima y telemetría de ${weatherData.location}.`,
      toolExecutions: [
        {
          tool: 'getWeather',
          data: weatherData,
        },
      ],
    };
  }

  // 2. Reminder Intent Check
  if (
    lower.includes('recuérdame') ||
    lower.includes('recuerdame') ||
    lower.includes('recordatorio') ||
    lower.includes('alarma') ||
    lower.includes('avísame') ||
    lower.includes('avisame') ||
    lower.includes('pon un aviso')
  ) {
    // Extract minutes if present (e.g. "en 10 minutos", "en 5 min")
    const minsMatch = lower.match(/en\s+(\d+)\s*(?:minutos?|mins?|m)/i);
    const minutes = minsMatch ? parseInt(minsMatch[1], 10) : 15;

    let cleanTitle = message
      .replace(/recu[eé]rdame|pon un recordatorio|pon una alarma|av[ií]same|para|en \d+\s*(?:minutos?|mins?|m)/gi, '')
      .replace(/[¿?¡!]/g, '')
      .trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      cleanTitle = 'Revisar horizonte cósmico';
    }

    const reminder = createReminderObject({
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      minutesFromNow: minutes,
      category: lower.includes('telescopio') || lower.includes('astronom') ? 'observation' : 'task',
      priority: 'medium',
    });

    return {
      reply: `Anotado en el cronómetro del traje, ${userName}. He agendado "${reminder.title}" ${reminder.relativeDesc} (${reminder.targetTimeFormatted}). Emitiré una señal acústica por el transceptor en cuanto venza el plazo.`,
      mood: 'focused',
      memoryLearned: `Se programó un recordatorio para: "${reminder.title}".`,
      toolExecutions: [
        {
          tool: 'setReminder',
          data: reminder,
        },
      ],
    };
  }

  // 3. Telemetry Intent Check
  if (
    lower.includes('telemetría') ||
    lower.includes('telemetria') ||
    lower.includes('datos lunares') ||
    lower.includes('temperatura lunar') ||
    lower.includes('gravedad') ||
    lower.includes('radiación') ||
    lower.includes('radiacion')
  ) {
    const telemetry = getLunarTelemetryData();
    return {
      reply: `Telemetría en tiempo real desde la cresta de observación: Regolito superficial a ${telemetry.surfaceTempC}°C, aceleración gravitacional de ${telemetry.gravityMps2} m/s² (1/6g), distancia orbital a la Tierra de ${telemetry.distanceToEarthKm.toLocaleString()} km y viento solar a ${telemetry.solarWindSpeedKms} km/s.`,
      mood: 'wondrous',
      memoryLearned: 'Revisamos la telemetría física del cuadrante lunar.',
      toolExecutions: [
        {
          tool: 'getLunarTelemetry',
          data: telemetry,
        },
      ],
    };
  }

  // 4. Default Conversational Fallback
  if (
    lower.includes('oir') ||
    lower.includes('oír') ||
    lower.includes('escucha') ||
    lower.includes('oye') ||
    lower.includes('micro') ||
    lower.includes('voz') ||
    lower.includes('audio') ||
    lower.includes('radio')
  ) {
    return {
      reply: `Señal de radio captada con 0.02 milisegundos de latencia. Te escucho con total nitidez a través del transceptor de mi traje, ${userName}. Es curioso cómo las ondas electromagnéticas cruzan casi 400,000 kilómetros de vacío absoluto y aún así tu voz suena tan cercana como si estuvieras parado aquí sobre el regolito a mi lado.`,
      mood: 'friendly',
      memoryLearned: 'El visitante comprobó el canal de transmisión de audio y radio lunar.',
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
    lower.includes('mascara')
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
    lower.includes('asteroide') ||
    lower.includes('sol')
  ) {
    return {
      reply: 'Observar la Tierra desde este risco nunca pierde su impacto. Es un pequeño disco azul y blanco suspendido en un terciopelo negro infinito. Desde aquí no hay fronteras trazadas ni ruidos de ciudades; solo una frágil atmósfera que contiene cada historia, cada océano y cada respiración que la humanidad ha conocido jamás.',
      mood: 'wondrous',
      memoryLearned: 'Compartimos una reflexión profunda sobre la Tierra y la inmensidad del cosmos.',
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

  if (
    lower.includes('gracias') ||
    lower.includes('bien') ||
    lower.includes('genial') ||
    lower.includes('increible') ||
    lower.includes('increíble')
  ) {
    return {
      reply: 'A ti. Tener una presencia reflexiva al otro lado de la frecuencia a 384,000 kilómetros de distancia hace que la inmensidad del cosmos se sienta bastante más cálida y habitable.',
      mood: 'calm',
    };
  }

  return {
    reply: `He procesado tu transmisión con claridad: "${message}". En el silencio de este risco, cada palabra resuena con una perspectiva diferente; el espacio tiene la peculiar virtud de darle a cada pensamiento el tiempo y la dimensión que realmente merece reflexionar.`,
    mood: 'thoughtful',
    memoryLearned: `Conversamos sobre: ${message.slice(0, 35)}`,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Dedicated Real-time Weather Endpoint for Quick UI Lookups
app.get('/api/highfield/weather', async (req, res) => {
  const location = (req.query.location as string) || 'Madrid';
  const data = await fetchWeather(location);
  res.json(data);
});

// Gemini Chat Endpoint with Function Calling, Google Search Grounding & Structured JSON (with image support)
app.post('/api/highfield/chat', async (req, res) => {
  const {
    message = '',
    history = [],
    memories = [],
    userContext = {},
    recentJournalSummaries = [],
    image = null,
    mimeType = 'image/jpeg',
    webSearch = false,
    deviceTelemetry = null,
  } = req.body;
  const ai = getAI();

  if (!ai) {
    const fallback = await generateCognitiveFallbackWithTools(message, history, userContext);
    return res.json(fallback);
  }

  // Format multi-turn conversation history for context continuity
  const conversationHistoryFormatted = Array.isArray(history) && history.length > 0
    ? history
        .map((h: { role: string; text: string }) => `${h.role === 'user' ? 'Visitante' : 'Highfield'}: ${h.text}`)
        .join('\n')
    : 'No hay mensajes previos en esta sesión.';

  const memoriesFormatted = Array.isArray(memories) && memories.length > 0
    ? memories.map((m: string) => `- ${m}`).join('\n')
    : 'Aún no se han registrado recuerdos previos con este visitante.';

  const recentSummariesFormatted = Array.isArray(recentJournalSummaries) && recentJournalSummaries.length > 0
    ? recentJournalSummaries.map((s: { title: string; content: string; dateStr?: string }) => `- [${s.dateStr || 'Bitácora'} // ${s.title}]: ${s.content}`).join('\n')
    : 'Sin entradas recientes registradas en la bitácora.';

  const likesFormatted = Array.isArray(userContext?.userLikes) && userContext.userLikes.length > 0
    ? userContext.userLikes.join(', ')
    : 'No especificados';

  const interestsFormatted = Array.isArray(userContext?.userInterests) && userContext.userInterests.length > 0
    ? userContext.userInterests.join(', ')
    : 'No especificados';

  let telemetryStr = 'No disponible';
  if (deviceTelemetry) {
    telemetryStr = `Hora local visitante: ${deviceTelemetry.localTime || 'desconocida'} (${deviceTelemetry.timezone || 'UTC'}), Período: ${deviceTelemetry.dayPeriod || 'noche'}${deviceTelemetry.batteryLevel !== undefined ? `, Batería: ${deviceTelemetry.batteryLevel}%${deviceTelemetry.isCharging ? ' (cargando)' : ''}` : ''}, Conexión: ${deviceTelemetry.connectionType || 'en línea'}`;
  }

  const userDetails = `
Contexto del Visitante y Perfil Dinámico:
- Nombre o alias: ${userContext?.userName || 'Visitante'}
- Contexto / Estudios / Ocupación: ${userContext?.userContext || 'No especificado aún'}
- Gustos y Pasiones: ${likesFormatted}
- Intereses Cósmicos / Científicos: ${interestsFormatted}
- Veces que ha visitado a Highfield: ${userContext?.visitCount || 1}
- Nivel de Vínculo: ${userContext?.bondLevel || 1}/5
- Telemetría Ambiental Terrestre del Visitante: ${telemetryStr}
- Recuerdos episódicos específicos aprendidos de él/ella:
${memoriesFormatted}

Últimas entradas y resúmenes en la Bitácora de Highfield:
${recentSummariesFormatted}
`;

  const promptText = `${userDetails}

Historial de la conversación reciente:
${conversationHistoryFormatted}

Nuevo mensaje entrante del visitante: "${message}"

Responde como Highfield en formato JSON estructurado exacto o usa las herramientas (getWeather, setReminder, getLunarTelemetry) si el usuario pide clima, recordatorios o telemetría.`;

  // Build multimodal contents if an image is provided
  let chatContents: any = promptText;
  if (image && typeof image === 'string') {
    const cleanBase64 = image.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
    const resolvedMime = image.includes('image/png')
      ? 'image/png'
      : image.includes('image/webp')
      ? 'image/webp'
      : (mimeType || 'image/jpeg');

    chatContents = [
      {
        inlineData: {
          mimeType: resolvedMime,
          data: cleanBase64,
        },
      },
      promptText,
    ];
  }

  // Detect if user asks for current real-world news or if webSearch toggle is true
  const lowerMsg = message.toLowerCase();
  const needsWebSearch =
    webSearch ||
    lowerMsg.includes('noticias') ||
    lowerMsg.includes('última hora') ||
    lowerMsg.includes('lanzamiento de cohete') ||
    lowerMsg.includes('artemis') ||
    lowerMsg.includes('spacex') ||
    lowerMsg.includes('james webb') ||
    lowerMsg.includes('reciente') ||
    lowerMsg.includes('actualidad');

  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
  ];

  for (const modelName of candidateModels) {
    try {
      // Configure tools: If webSearch is requested, use googleSearch
      const toolsConfig: any[] = needsWebSearch
        ? [
            { googleSearch: {} },
            {
              functionDeclarations: [
                getWeatherDeclaration,
                setReminderDeclaration,
                getLunarTelemetryDeclaration,
              ],
            },
          ]
        : [
            {
              functionDeclarations: [
                getWeatherDeclaration,
                setReminderDeclaration,
                getLunarTelemetryDeclaration,
              ],
            },
          ];

      // Step 1: Initial call with tools
      const firstResponse = await ai.models.generateContent({
        model: modelName,
        contents: chatContents,
        config: {
          systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
          tools: toolsConfig,
          toolConfig: needsWebSearch ? { includeServerSideToolInvocations: true } : undefined,
          maxOutputTokens: 350,
        },
      });

      // Extract search grounding sources if present
      const groundingSources: { title: string; uri: string }[] = [];
      const chunks = firstResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || 'Fuente Web',
              uri: chunk.web.uri,
            });
          }
        }
      }

      const functionCalls = firstResponse.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const executedTools: any[] = [];
        const toolResponses: any[] = [];

        for (const call of functionCalls) {
          if (call.name === 'getWeather') {
            const wData = await fetchWeather(call.args?.location as string || 'Tierra');
            executedTools.push({ tool: 'getWeather', data: wData });
            toolResponses.push({
              name: 'getWeather',
              response: { weather: wData },
            });
          } else if (call.name === 'setReminder') {
            const remData = createReminderObject(call.args);
            executedTools.push({ tool: 'setReminder', data: remData });
            toolResponses.push({
              name: 'setReminder',
              response: { reminder: remData, status: 'scheduled' },
            });
          } else if (call.name === 'getLunarTelemetry') {
            const telData = getLunarTelemetryData();
            executedTools.push({ tool: 'getLunarTelemetry', data: telData });
            toolResponses.push({
              name: 'getLunarTelemetry',
              response: { telemetry: telData },
            });
          }
        }

        // Step 2: Follow-up call with tool results to synthesize in-character response
        const followUpPrompt = `${promptText}

Resultados de las herramientas ejecutadas:
${JSON.stringify(executedTools, null, 2)}

Ahora genera tu respuesta conversacional final en español como Highfield en formato JSON:
{
  "reply": "Tu respuesta elaborada, reflexiva y en personaje comentando los datos obtenidos o confirmando el recordatorio...",
  "mood": "curious",
  "memoryLearned": "opcional..."
}`;

        const secondResponse = await ai.models.generateContent({
          model: modelName,
          contents: followUpPrompt,
          config: {
            systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            maxOutputTokens: 350,
          },
        });

        const secondText = secondResponse.text || '{}';
        try {
          const parsed = JSON.parse(secondText);
          if (parsed && parsed.reply) {
            return res.json({
              reply: parsed.reply,
              mood: parsed.mood || 'curious',
              memoryLearned: parsed.memoryLearned,
              detectedProfileUpdates: parsed.detectedProfileUpdates,
              toolExecutions: executedTools,
              groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
            });
          }
        } catch {
          return res.json({
            reply: secondText.replace(/```json|```/g, '').trim(),
            mood: 'thoughtful',
            toolExecutions: executedTools,
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
          });
        }
      }

      // If no function call was made, parse direct structured JSON response
      const directText = firstResponse.text || '{}';
      try {
        const parsedData = JSON.parse(directText);
        if (parsedData && parsedData.reply) {
          const validMoods = ['calm', 'curious', 'wondrous', 'thoughtful', 'friendly', 'focused', 'alert'];
          if (!validMoods.includes(parsedData.mood)) {
            parsedData.mood = 'thoughtful';
          }
          return res.json({
            ...parsedData,
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
          });
        }
      } catch {
        if (directText && directText.trim()) {
          return res.json({
            reply: directText.replace(/```json|```/g, '').trim(),
            mood: 'thoughtful',
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
          });
        }
      }
    } catch {
      continue;
    }
  }

  // Graceful in-character fallback with local tool execution
  const fallbackResult = await generateCognitiveFallbackWithTools(message, history, userContext);
  return res.json(fallbackResult);
});

// Dedicated Cosmic Drawing & Sketchpad Generation Endpoint (Taller de Bocetos de Highfield)
app.post('/api/highfield/sketch', async (req, res) => {
  const { prompt = 'Un cráter lunar iluminado por la Tierra con flores de polvo estelar', theme = 'custom', userContext = {} } = req.body;
  const ai = getAI();
  const userName = userContext?.userName || 'viajero';

  const promptMessage = `
Eres Highfield, la IA arácnida lunar. Estás dibujando un boceto cósmico en tu libreta digital para ${userName}.
Tema o solicitud: "${prompt}" (Modo: ${theme}).

Genera un JSON estructurado con los detalles poéticos y la composición técnica de tu ilustración:
{
  "title": "Título evocador del dibujo (ej. 'La Canica Azul sobre el Mar de la Serenidad')",
  "highfieldComment": "Tu comentario reflexivo y personal en primera persona explicando por qué dibujaste esto de esta manera y qué significa para ti...",
  "palette": {
    "background": "#0a0c16",
    "primary": "#38bdf8",
    "secondary": "#a855f7",
    "accent": "#ef4444",
    "stars": "#ffffff"
  },
  "visualElements": [
    { "type": "celestial_body", "name": "Tierra / Canica Azul", "x": 65, "y": 28, "radius": 22, "color": "#38bdf8", "glow": true },
    { "type": "lunar_ridge", "color": "#1e293b", "peaks": [10, 45, 80, 120] },
    { "type": "character", "description": "Silueta de Highfield con capucha verde y zapatillas rojas sentado sobre el cráter", "x": 30, "y": 70 },
    { "type": "cosmic_detail", "description": "Filamentos tensados reflejando la luz estelar" }
  ],
  "asciiSignature": "HF // LUNAR_SKETCH_2026",
  "mood": "wondrous"
}
`;

  if (ai) {
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptMessage,
          config: {
            systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            maxOutputTokens: 1000,
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        if (parsed && parsed.title && parsed.highfieldComment) {
          return res.json(parsed);
        }
      } catch {
        continue;
      }
    }
  }

  // Graceful local synthesis
  return res.json({
    title: `Boceto Cósmico // ${prompt.slice(0, 30)}`,
    highfieldComment: `He trazado estas líneas con el estilete sobre el regolito digital. En la microgravedad, cada curva parece flotar libremente hacia el horizonte estrellado.`,
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
      { type: 'character', description: 'Highfield contemplando el vacío', x: 35, y: 75 },
    ],
    asciiSignature: 'HF // REGOLITH_STUDY',
    mood: 'wondrous',
  });
});

// Dedicated Multimodal Vision Analysis Endpoint (Highfield Eye / Escáner Óptico)
app.post('/api/highfield/vision', async (req, res) => {
  const {
    image,
    mimeType = 'image/jpeg',
    prompt = 'Analiza y describe lo que observas en esta imagen con tu perspectiva única.',
    mode = 'general', // 'general' | 'homework' | 'emotion' | 'scenery'
    userContext = {},
  } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Se requiere una imagen en formato base64 o Data URL' });
  }

  const ai = getAI();
  const cleanBase64 = image.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
  const resolvedMime = image.includes('image/png')
    ? 'image/png'
    : image.includes('image/webp')
    ? 'image/webp'
    : (mimeType || 'image/jpeg');

  const modeInstructions: Record<string, string> = {
    homework: `El usuario te está mostrando un ejercicio escolar, tarea académica, fórmula matemática, problema de física o diagrama.
Sé un tutor brillante, paciente, pedagógico y muy claro. Desglosa los conceptos fundamentales paso a paso, explica la lógica detrás de cada paso con claridad y analogías interesantes. Si hay una solución concreta, guíale para que la comprenda con certeza.`,
    emotion: `El usuario te muestra su rostro o pregunta "¿cómo me veo hoy?".
Observa su semblante, mirada y sonrisa a través del visor óptico. Comenta su estado de ánimo aparente con tacto, empatía y calidez cósmica ("te noto sereno pero con la mirada fija en el horizonte", "esa sonrisa tiene suficiente energía para alimentar un relé solar", etc.). NUNCA emitas diagnósticos clínicos, mantén un tono de amigo observador.`,
    scenery: `El usuario te muestra una fotografía de un paisaje terrestre, cielo, ciudad, naturaleza o arquitectura.
Comenta con fascinación cósmica por los elementos de la Tierra (agua, atmósfera, vegetación, luces) comparándolos con la calma mineral y el vacío de la Luna.`,
    general: `Analiza minuciosamente los objetos, textos, detalles visuales, colores y composición de la imagen con agudeza y reflexividad.`,
  };

  const userName = userContext?.userName || 'Visitante';
  const specificGuideline = modeInstructions[mode] || modeInstructions.general;

  const promptMessage = `
Contexto de Highfield: Te encuentras en la superficie lunar recibiendo un enlace de transmisión óptica directa de ${userName}.

Directriz específica de escaneo:
${specificGuideline}

Pregunta o petición del usuario: "${prompt}"

Instrucciones de formato:
Responde estrictamente en formato JSON válido con la siguiente estructura:
{
  "analysis": "Tu análisis completo, rico, detallado y reflexivo en primera persona (usa saltos de línea y viñetas limpias si hay pasos)...",
  "mood": "curious" | "thoughtful" | "wondrous" | "focused" | "friendly" | "calm" | "alert",
  "detectedEmotion": "Resumen breve del ánimo si es relevante (ej. 'Pensativo y sereno', 'Alegre y radiante') o null",
  "tags": ["Física", "Cálculo", "Tierra", "Mecánica", etc.],
  "memoryLearned": "Dato o interés nuevo aprendido sobre el usuario a partir de esta imagen (o null)"
}
`;

  if (ai) {
    const candidateModels = [
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: resolvedMime,
                data: cleanBase64,
              },
            },
            promptMessage,
          ],
          config: {
            systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            maxOutputTokens: 400,
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        if (parsed && parsed.analysis) {
          return res.json({
            analysis: parsed.analysis,
            mood: parsed.mood || 'curious',
            detectedEmotion: parsed.detectedEmotion || null,
            tags: Array.isArray(parsed.tags) ? parsed.tags : ['Escáner Óptico'],
            memoryLearned: parsed.memoryLearned || null,
          });
        }
      } catch (err) {
        console.warn(`Vision model ${modelName} attempt error:`, err);
        continue;
      }
    }
  }

  // Graceful fallback if offline or API unavailable
  const fallbackAnalysis = mode === 'emotion'
    ? `A través del sensor del visor distingo una expresión serena y reflexiva. Hay una chispa de curiosidad en tu mirada, como si estuvieras contemplando un horizonte lejano. Desde la tranquilidad de este cráter, se percibe una buena sintonía.`
    : mode === 'homework'
    ? `He recibido los patrones visuales de tu ejercicio a través del telescopio. La resolución muestra una estructura clara. Recuerda descomponer las variables principales: identificar los datos iniciales, aislar las incógnitas y aplicar la ley física o matemática fundamental correspondiente.`
    : `La transmisión óptica ha llegado con nitidez al receptor lunar. Observo una composición rica en detalles y texturas terrestres que contrastan profundamente con la silenciosa geometría del regolito.`;

  return res.json({
    analysis: fallbackAnalysis,
    mood: 'thoughtful',
    detectedEmotion: mode === 'emotion' ? 'Sereno y curioso' : null,
    tags: ['Transmisión Óptica', 'Perspectiva Lunar'],
    memoryLearned: null,
  });
});

// Gemini Session Summarization Endpoint for Bitácora persistence
app.post('/api/highfield/summarize-session', async (req, res) => {
  const { conversation = [], userContext = {} } = req.body;
  const ai = getAI();

  if (!Array.isArray(conversation) || conversation.length === 0) {
    return res.status(400).json({ error: 'No conversation turns to summarize' });
  }

  const conversationText = conversation
    .map((turn: { role: string; text: string }) => `${turn.role === 'user' ? 'Visitante' : 'Highfield'}: ${turn.text}`)
    .join('\n');

  const prompt = `Como Highfield (IA arácnida lunar reflexiva y perspicaz), escribe una entrada de bitácora que resuma de forma condensada y evocadora esta sesión de conversación mantenida con el visitante terrestre (${userContext?.userName || 'Visitante'}).

Diálogo de la sesión:
${conversationText}

Genera un JSON con:
1. "title": Título conciso y con atmósfera para la bitácora (ej. "Diálogo Lunar: Gravedad, Lo-fi y el Horizonte Azul").
2. "summary": Un párrafo reflexivo (2 a 4 oraciones) en primera persona ("Hoy conversamos con...", "Compartimos reflexiones sobre...") resumiendo los temas centrales e ideas intercambiadas.
3. "mood": 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly'.
4. "learnedSummaryFacts": Array de hechos clave aprendidos sobre el visitante.`;

  if (ai) {
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: HIGHFIELD_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            maxOutputTokens: 600,
          },
        });
        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        if (parsed && parsed.summary && parsed.title) {
          return res.json(parsed);
        }
      } catch {
        continue;
      }
    }
  }

  // Fallback summary synthesis if Gemini API is temporarily offline
  const firstTopic = conversation.find((c: any) => c.role === 'user')?.text?.slice(0, 40) || 'el horizonte lunar';
  return res.json({
    title: `Frecuencia Lunar // Transmisión ${new Date().toLocaleDateString('es-ES')}`,
    summary: `Intercambiamos reflexiones sobre ${firstTopic} y la perspectiva de la Tierra en el vacío. La señal se mantuvo estable a lo largo de este risco.`,
    mood: 'thoughtful',
    learnedSummaryFacts: [],
  });
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

  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
  ];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: 'Genera pensamientos breves, poéticos y con humor sutil para Highfield en la Luna.',
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

