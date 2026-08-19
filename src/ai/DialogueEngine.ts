/**
 * HIGHFIELD - Dialogue System & Conversation Graph
 * Manages Highfield's interactive dialogue, branching conversation trees,
 * monumental cosmic web cinema dialogue, and future AI personality synthesis.
 */

import { DialogueNode } from '../types';

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  start: {
    id: 'start',
    characterMood: 'friendly',
    text: 'Hola. Te estaba esperando... O tal vez simplemente esperaba a alguien que también mirara hacia allá.',
    options: [
      { text: 'Cuéntame sobre tu sueño de la red monumental de cine', nextNodeId: 'cosmic_cinema_web' },
      { text: '¿Qué estás haciendo aquí arriba?', nextNodeId: 'why_here' },
      { text: 'La Tierra se ve impresionante desde aquí.', nextNodeId: 'earth_view' },
      { text: 'Ese traje... ¿eres una especie de héroe?', nextNodeId: 'hero_origins' },
      { text: 'Solo pasaba a disfrutar el silencio.', nextNodeId: 'quiet_moment' },
    ],
  },
  cosmic_cinema_web: {
    id: 'cosmic_cinema_web',
    characterMood: 'wondrous',
    text: 'Me encantaría usar mis filamentos para crear una red monumental que atrape la luz de las estrellas, como si fuera una pantalla de cine gigante flotando en el vacío. Sería el estreno más silencioso y espectacular de la historia, justo frente a nuestra canica azul.',
    options: [
      { text: '¡Despliégala ahora mismo! [🕸️ Red Cósmica]', nextNodeId: 'web_deployed_node' },
      { text: '¿Qué proyectaría esa pantalla estelar?', nextNodeId: 'cinema_content' },
      { text: 'Volver al inicio', nextNodeId: 'start' },
    ],
  },
  cinema_content: {
    id: 'cinema_content',
    characterMood: 'thoughtful',
    text: 'Proyectaría auroras boreales cósmicas, constelaciones vivas y recuerdos radiantes de la Tierra... Un cine al aire libre donde el telón de fondo es el universo entero.',
    options: [
      { text: '¡Activar la pantalla de cine en el vacío!', nextNodeId: 'web_deployed_node' },
      { text: 'Volver a conversar', nextNodeId: 'start' },
    ],
  },
  web_deployed_node: {
    id: 'web_deployed_node',
    characterMood: 'wondrous',
    text: '¡Filamentos lanzados! Mira cómo la red atrapa y refracta la luz estelar. ¡El cine cósmico está proyectando en el vacío frente a la Tierra!',
    options: [
      { text: 'Disfrutar la proyección estelar', nextNodeId: undefined },
      { text: 'Preguntar algo más', nextNodeId: 'start' },
    ],
  },
  why_here: {
    id: 'why_here',
    characterMood: 'thoughtful',
    text: 'A veces necesitas alejarte de todo el ruido para entender lo que realmente importa. Aquí arriba, no hay sirenas ni multitudes. Solo la calma del cosmos y este horizonte interminable.',
    options: [
      { text: '¿No te sientes solo?', nextNodeId: 'loneliness' },
      { text: 'Es una buena perspectiva.', nextNodeId: 'earth_view' },
      { text: 'Volver al inicio', nextNodeId: 'start' },
    ],
  },
  earth_view: {
    id: 'earth_view',
    characterMood: 'wondrous',
    text: 'Mírala bien. Todos los océanos, todas las historias, cada persona que has conocido... todo está sucediendo dentro de esa esfera azul flotante. Es frágil y hermosa a la vez.',
    options: [
      { text: '¿Viste esa estrella fugaz hace un momento?', nextNodeId: 'shooting_star' },
      { text: '¿Planeas regresar algún día?', nextNodeId: 'future_plans' },
      { text: 'Volver al inicio', nextNodeId: 'start' },
    ],
  },
  hero_origins: {
    id: 'hero_origins',
    characterMood: 'curious',
    text: 'Un explorador con reflejos arácnidos, quizás. La agilidad se siente diferente con una sexta parte de gravedad. Puedes saltar un cráter entero si calculas bien el impulso.',
    options: [
      { text: '¿Tus telarañas funcionan en el vacío?', nextNodeId: 'web_mechanics' },
      { text: 'Impresionante.', nextNodeId: 'start' },
    ],
  },
  web_mechanics: {
    id: 'web_mechanics',
    characterMood: 'friendly',
    text: 'Los filamentos de polímero tensado se comportan de forma fascinante sin resistencia de aire. En lugar de caer, dibujan trayectorias hiperbólicas perfectas o grandes mallas que atrapan fotones.',
    options: [
      { text: 'Háblame de tu idea de la pantalla de cine estelar', nextNodeId: 'cosmic_cinema_web' },
      { text: 'Increíble. Háblame de la Tierra otra vez.', nextNodeId: 'earth_view' },
      { text: 'Gracias por la charla, Highfield.', nextNodeId: 'farewell' },
    ],
  },
  loneliness: {
    id: 'loneliness',
    characterMood: 'calm',
    text: 'La soledad aquí no es vacía; está llena de asombro. Pero reconozco que tener compañía humana hace que las estrellas brillen un poco más cálidas.',
    options: [
      { text: 'Me alegra acompañarte un rato.', nextNodeId: 'quiet_moment' },
      { text: 'Volver a conversar', nextNodeId: 'start' },
    ],
  },
  shooting_star: {
    id: 'shooting_star',
    characterMood: 'wondrous',
    text: 'Sí, cruzan la órbita de vez en cuando. Fragmentos de cometas antiguos viajando a miles de kilómetros por segundo. Siempre pido el mismo deseo.',
    options: [
      { text: '¿Cuál es tu deseo?', nextNodeId: 'wish' },
      { text: 'Volver al inicio', nextNodeId: 'start' },
    ],
  },
  wish: {
    id: 'wish',
    characterMood: 'thoughtful',
    text: 'Que el mundo de allá abajo encuentre la misma paz que se siente desde aquí arriba.',
    options: [
      { text: 'Es un gran deseo.', nextNodeId: 'start' },
      { text: 'Nos vemos pronto, Highfield.', nextNodeId: 'farewell' },
    ],
  },
  quiet_moment: {
    id: 'quiet_moment',
    characterMood: 'calm',
    text: 'Respira hondo. En el espacio el silencio no es ausencia de sonido, es la presencia de todo el universo.',
    options: [
      { text: 'Seguir observando juntos', nextNodeId: 'start' },
      { text: 'Hasta luego, Highfield.', nextNodeId: 'farewell' },
    ],
  },
  future_plans: {
    id: 'future_plans',
    characterMood: 'thoughtful',
    text: 'Siempre hay un camino de vuelta a casa. Pero mientras esté aquí, mi deber es seguir observando y cuidando este rincón del universo.',
    options: [
      { text: 'Eres un gran guardián.', nextNodeId: 'start' },
    ],
  },
  farewell: {
    id: 'farewell',
    characterMood: 'friendly',
    text: 'Vuelve cuando quieras. Yo seguiré aquí, vigilando el horizonte.',
    options: [
      { text: 'Cerrar conversación', nextNodeId: undefined },
    ],
  },
};
