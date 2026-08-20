/**
 * HIGHFIELD - Retro Dialogue Component (Immersive UI Theme)
 * Cinematic conversational UI with typewriter effect, retro audio feedback,
 * character mood avatars, voice recognition (Microphone), natural speech synthesis,
 * and real-time Voice Tuning & Fluidity Panel.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  Play,
  Eye,
  Image as ImageIcon,
  X,
  Palette,
  Globe,
  Radio,
  ExternalLink,
  Battery,
  Clock
} from 'lucide-react';
import { DIALOGUE_NODES } from '../ai/DialogueEngine';
import { geminiBridge, GroundingSource } from '../ai/GeminiBridge';
import { soundManager } from '../engine/AudioEngine';
import { voiceEngine, VoiceState, VoicePreset } from '../engine/VoiceEngine';
import { environmentalSensors, DeviceTelemetry } from '../engine/EnvironmentalSensors';
import { DialogueNode } from '../types';

interface ExtendedDialogueNode extends DialogueNode {
  groundingSources?: GroundingSource[];
}

interface DialogueBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVisionScanner?: () => void;
  onOpenSketchpad?: () => void;
  initialMessage?: string;
  initialImageAttachment?: string;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  isOpen,
  onClose,
  onOpenVisionScanner,
  onOpenSketchpad,
  initialMessage,
  initialImageAttachment,
}) => {
  const [currentNode, setCurrentNode] = useState<ExtendedDialogueNode>(DIALOGUE_NODES.start);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string>('');
  const [isVoiceOutputActive, setIsVoiceOutputActive] = useState<boolean>(true);
  const [isHandsFreeActive, setIsHandsFreeActive] = useState<boolean>(voiceEngine.isHandsFreeMode());
  const [isWebSearchActive, setIsWebSearchActive] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(environmentalSensors.getTelemetry());

  // Voice Tuning Settings Modal
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentPitch, setCurrentPitch] = useState<number>(voiceEngine.getSettings().pitch);
  const [currentRate, setCurrentRate] = useState<number>(voiceEngine.getSettings().rate);
  const [currentVoiceURI, setCurrentVoiceURI] = useState<string | null>(voiceEngine.getSettings().selectedVoiceURI);
  const [currentPreset, setCurrentPreset] = useState<VoicePreset>(voiceEngine.getSettings().preset);

  const textIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update telemetry on mount and interval
  useEffect(() => {
    setTelemetry(environmentalSensors.updateTelemetry());
    const interval = setInterval(() => {
      setTelemetry(environmentalSensors.getTelemetry());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync initial message/attachment when provided
  useEffect(() => {
    if (isOpen) {
      if (initialImageAttachment) {
        setAttachedImage(initialImageAttachment);
      }
      if (initialMessage) {
        setCustomInput(initialMessage);
      }
    }
  }, [isOpen, initialMessage, initialImageAttachment]);

  // Setup Voice Engine listener
  useEffect(() => {
    voiceEngine.setListener({
      onTranscript: (transcript, isFinal) => {
        setCustomInput(transcript);
        if (isFinal && transcript.trim().length > 1) {
          setTimeout(() => {
            triggerSendMessage(transcript.trim());
          }, 300);
        }
      },
      onStateChange: (state, message) => {
        setVoiceState(state);
        if (message) setVoiceStatusMsg(message);
      },
      onVoicesLoaded: (voices) => {
        setAvailableVoices(voices);
      },
    });

    setAvailableVoices(voiceEngine.getRankedSpanishVoices());

    return () => {
      voiceEngine.stopListening();
      voiceEngine.stopSpeaking();
    };
  }, []);

  // Typewriter effect & speech synthesis with adaptive speed
  useEffect(() => {
    if (!isOpen) {
      voiceEngine.stopSpeaking();
      return;
    }

    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
    }

    setIsTyping(true);
    setDisplayedText('');
    const fullText = currentNode.text;
    let index = 0;

    // Speak the response aloud if voice output is active
    if (isVoiceOutputActive) {
      voiceEngine.speak(fullText, () => {
        // Hands-Free loop: if active, start listening automatically after Highfield finishes speaking
        if (voiceEngine.isHandsFreeMode() && isOpen) {
          setTimeout(() => {
            voiceEngine.startListening('es-ES');
          }, 500);
        }
      });
    }

    // Adaptive speed: faster step interval or multiple chars for longer texts
    const intervalMs = fullText.length > 250 ? 12 : 18;
    const stepSize = fullText.length > 350 ? 2 : 1;

    textIntervalRef.current = window.setInterval(() => {
      index = Math.min(fullText.length, index + stepSize);
      setDisplayedText(fullText.substring(0, index));
      if (index % 4 === 0) {
        soundManager.playDialogueBlip(index % 4);
      }

      if (index >= fullText.length) {
        setIsTyping(false);
        if (textIntervalRef.current) clearInterval(textIntervalRef.current);
      }
    }, intervalMs);

    return () => {
      if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    };
  }, [currentNode, isOpen, isVoiceOutputActive]);

  const handleSkipTyping = () => {
    if (isTyping && textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
      setDisplayedText(currentNode.text);
      setIsTyping(false);
    }
  };

  const handleClose = () => {
    voiceEngine.stopSpeaking();
    voiceEngine.stopListening();
    geminiBridge.summarizeCurrentSession().catch((e) => console.warn('Background summarization error:', e));
    onClose();
  };

  const handleSelectOption = (nextNodeId?: string) => {
    soundManager.playDialogueBlip(2);
    if (!nextNodeId) {
      handleClose();
      return;
    }
    const node = DIALOGUE_NODES[nextNodeId];
    if (node) {
      setCurrentNode(node);
    } else {
      handleClose();
    }
  };

  const triggerSendMessage = async (text: string) => {
    if ((!text.trim() && !attachedImage) || isAiLoading) return;
    const effectiveText = text.trim() || 'He transmitido una captura visual a través del visor.';
    const imageToSend = attachedImage;

    setCustomInput('');
    setAttachedImage(null);
    setIsAiLoading(true);
    soundManager.playInteractChime();

    // Query GeminiBridge with Google Search Grounding, environmental telemetry, and optional image
    const response = await geminiBridge.generateReply(
      effectiveText,
      undefined,
      imageToSend || undefined,
      isWebSearchActive
    );

    setIsAiLoading(false);
    setCurrentNode({
      id: 'custom_reply_' + Date.now(),
      text: response.reply,
      characterMood: response.mood,
      groundingSources: response.groundingSources,
      options: [
        { text: 'Preguntar algo más', nextNodeId: 'start' },
        { text: 'Volver a contemplar el horizonte', nextNodeId: undefined },
      ],
    });
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSendMessage(customInput);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedImage(event.target.result as string);
        soundManager.playInteractChime();
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleMicListening = () => {
    soundManager.resume();
    if (voiceState === 'listening') {
      voiceEngine.stopListening();
    } else {
      const started = voiceEngine.startListening('es-ES');
      if (started) {
        soundManager.playInteractChime();
      }
    }
  };

  const toggleHandsFree = () => {
    const next = !isHandsFreeActive;
    setIsHandsFreeActive(next);
    voiceEngine.setHandsFreeMode(next);
    soundManager.playInteractChime();
    if (next && voiceState === 'idle') {
      voiceEngine.startListening('es-ES');
    }
  };

  const toggleVoiceAudio = () => {
    const next = voiceEngine.toggleVoiceOutput();
    setIsVoiceOutputActive(next);
  };

  const handleApplyPreset = (preset: VoicePreset) => {
    voiceEngine.setPreset(preset);
    const settings = voiceEngine.getSettings();
    setCurrentPreset(settings.preset);
    setCurrentPitch(settings.pitch);
    setCurrentRate(settings.rate);
    soundManager.playInteractChime();
  };

  const handleTestVoice = () => {
    voiceEngine.speak('Hola, aquí Highfield. Esta es mi frecuencia de voz calibrada para el horizonte lunar.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="dialogue-overlay"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[760px] max-w-full z-50 pointer-events-auto font-mono"
        >
          <div className="relative bg-[#050508]/95 border-l-4 border-[#ff4e00] border-t border-r border-b border-[#1a1a2e] rounded-xs shadow-[0_0_35px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden text-[#e0e0e0]">
            {/* Top Transmission Header */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#080812] border-b border-[#141424]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-2 h-2 rounded-full bg-[#ff4e00] animate-pulse shadow-[0_0_8px_#ff4e00]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#ff4e00] font-black">
                  LUNAR_RELAY // FREQ: 1420 MHZ
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-xs border border-white/10 bg-white/5 text-white/50 tracking-widest">
                  MOOD: {currentNode.characterMood.toUpperCase()}
                </span>
                {/* Environmental telemetry indicator */}
                <span className="text-[9px] px-2 py-0.5 rounded-xs border border-sky-500/20 bg-sky-500/10 text-sky-300 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{telemetry.localTime} ({telemetry.dayPeriod})</span>
                  {telemetry.batteryLevel !== undefined && (
                    <span className="flex items-center gap-0.5 ml-1 border-l border-sky-500/30 pl-1">
                      <Battery className="w-2.5 h-2.5" />
                      {telemetry.batteryLevel}%
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Hands-Free Mode Toggle */}
                <button
                  onClick={toggleHandsFree}
                  title={isHandsFreeActive ? 'Desactivar modo Manos Libres' : 'Activar modo Manos Libres (conversación continua)'}
                  className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] px-2 border ${
                    isHandsFreeActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'text-white/50 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isHandsFreeActive ? 'animate-pulse text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">Manos Libres</span>
                </button>

                {/* Voice Tuning Config Button */}
                <button
                  id="voice-settings-btn"
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  title="Calibrar Tono de Voz y Fluidez"
                  className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] px-2 border ${
                    showVoiceSettings
                      ? 'bg-[#ff4e00]/20 text-[#ff4e00] border-[#ff4e00]/60'
                      : 'text-white/50 hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ajustar Voz</span>
                </button>

                {/* Voice Audio Synthesizer Mute Toggle */}
                <button
                  onClick={toggleVoiceAudio}
                  title={isVoiceOutputActive ? 'Desactivar voz hablada' : 'Activar voz hablada'}
                  className="text-white/40 hover:text-[#ff4e00] p-1 rounded transition-colors cursor-pointer"
                >
                  {isVoiceOutputActive ? <Volume2 className="w-3.5 h-3.5 text-[#ff4e00]" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  id="close-dialogue-btn"
                  onClick={handleClose}
                  className="text-white/40 hover:text-[#ff4e00] text-[10px] tracking-wider uppercase px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="Cerrar diálogo"
                >
                  [ESC] CLOSE
                </button>
              </div>
            </div>

            {/* Voice Tuning Configuration Dropdown Panel */}
            {showVoiceSettings && (
              <div className="bg-[#090916] border-b border-[#1f1f3a] p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Calibración de Voz y Tono de Highfield</span>
                  </div>
                  <button
                    onClick={handleTestVoice}
                    className="flex items-center gap-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>Probar Voz</span>
                  </button>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleApplyPreset('NATURAL')}
                    className={`px-2.5 py-1.5 rounded border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      currentPreset === 'NATURAL'
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                        : 'bg-[#05050e] border-[#1a1a2e] text-white/60 hover:text-white'
                    }`}
                  >
                    🎙️ Natural y Fluido
                  </button>
                  <button
                    onClick={() => handleApplyPreset('DYNAMIC')}
                    className={`px-2.5 py-1.5 rounded border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      currentPreset === 'DYNAMIC'
                        ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                        : 'bg-[#05050e] border-[#1a1a2e] text-white/60 hover:text-white'
                    }`}
                  >
                    ⚡ Dinámico / Héroe
                  </button>
                  <button
                    onClick={() => handleApplyPreset('COSMIC')}
                    className={`px-2.5 py-1.5 rounded border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      currentPreset === 'COSMIC'
                        ? 'bg-purple-950/90 border-purple-400 text-purple-200'
                        : 'bg-[#05050e] border-[#1a1a2e] text-white/60 hover:text-white'
                    }`}
                  >
                    🌌 Calma Cósmica
                  </button>
                  <button
                    onClick={() => handleApplyPreset('RETRO')}
                    className={`px-2.5 py-1.5 rounded border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      currentPreset === 'RETRO'
                        ? 'bg-red-950/90 border-red-400 text-red-200'
                        : 'bg-[#05050e] border-[#1a1a2e] text-white/60 hover:text-white'
                    }`}
                  >
                    🤖 Transceptor Retro
                  </button>
                </div>

                {/* Voice Selection and Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Voice Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                      Voz del Sistema ({availableVoices.length})
                    </label>
                    <select
                      value={currentVoiceURI || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentVoiceURI(val);
                        voiceEngine.setVoiceURI(val);
                      }}
                      className="w-full bg-[#05050a] border border-[#1a1a2e] rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                    >
                      {availableVoices.length === 0 && <option value="">Voz predeterminada del navegador</option>}
                      {availableVoices.map((v, i) => (
                        <option key={i} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pitch Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/50 uppercase font-bold">
                      <span>Tono (Pitch)</span>
                      <span className="text-cyan-400">{currentPitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.02"
                      value={currentPitch}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentPitch(val);
                        voiceEngine.setPitch(val);
                      }}
                      className="w-full accent-[#ff4e00] cursor-pointer"
                    />
                  </div>

                  {/* Rate Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/50 uppercase font-bold">
                      <span>Velocidad / Fluidez</span>
                      <span className="text-cyan-400">{currentRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.02"
                      value={currentRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentRate(val);
                        voiceEngine.setRate(val);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="p-5 flex flex-col sm:flex-row gap-4 items-start">
              {/* Highfield Pixel Avatar */}
              <div className="w-16 h-16 shrink-0 bg-[#05050a] border border-[#1a1a2e] rounded-xs p-1.5 flex flex-col items-center justify-center relative shadow-inner">
                <div className="w-10 h-10 bg-[#11131a] rounded-t-sm rounded-b-xs relative border border-[#1a1a2e]">
                  <div className="absolute top-2.5 right-1.5 w-4 h-5 bg-[#ffffff] rounded-xs border-2 border-[#ff4e00] shadow-[0_0_10px_rgba(255,78,0,0.8)] animate-pulse" />
                  <div className="absolute -bottom-1 inset-x-0 h-2 bg-[#1e5e3a] rounded-b-xs" />
                </div>
                <span className="text-[8px] text-[#ff4e00] mt-1 uppercase tracking-widest font-black">HIGHFIELD</span>
              </div>

              {/* Text & Responses */}
              <div className="flex-1 w-full space-y-4">
                {/* Speech Bubble */}
                <div
                  onClick={handleSkipTyping}
                  title={isTyping ? "Haz clic para mostrar todo el texto de inmediato" : undefined}
                  className={`min-h-[50px] max-h-56 sm:max-h-72 overflow-y-auto pr-2 text-sm sm:text-base leading-relaxed text-white font-medium italic select-text scrollbar-thin scrollbar-thumb-[#ff4e00]/40 scrollbar-track-black/30 ${
                    isTyping ? 'cursor-pointer' : ''
                  }`}
                >
                  &ldquo;{displayedText}&rdquo;
                  {isTyping && <span className="inline-block w-2 h-4 bg-[#ff4e00] ml-1 animate-ping align-middle" />}
                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-xs text-[#ff4e00] mt-2 not-italic">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando respuesta cognitiva y analizando transmisión...</span>
                    </div>
                  )}
                </div>

                {/* Grounding Web Sources Citations */}
                {currentNode.groundingSources && currentNode.groundingSources.length > 0 && !isTyping && (
                  <div className="p-2.5 rounded bg-sky-950/30 border border-sky-500/20 space-y-1.5 not-italic">
                    <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>Fuentes y Radar Web Terrestre</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentNode.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-sky-500/30 text-[10px] text-sky-200 hover:text-white transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Branching Dialogue Options */}
                {!isTyping && currentNode.options && currentNode.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 not-italic">
                    {currentNode.options.map((option, idx) => (
                      <button
                        key={idx}
                        id={`dialogue-option-${idx}`}
                        onClick={() => handleSelectOption(option.nextNodeId)}
                        className="text-left text-xs bg-[#090914] hover:bg-[#121226] text-white/80 hover:text-white px-3 py-2 rounded-xs border border-[#1a1a2e] hover:border-[#ff4e00]/60 transition-all duration-150 flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate mr-1 font-mono">› {option.text}</span>
                        <span className="text-[10px] text-white/30 group-hover:text-[#ff4e00]">↵</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Voice Status Indicator */}
                {voiceState === 'listening' && (
                  <div className="flex items-center gap-2 bg-[#ff4e00]/10 border border-[#ff4e00]/40 px-3 py-1.5 rounded text-xs text-[#ff4e00] animate-pulse not-italic">
                    <div className="w-2 h-2 rounded-full bg-[#ff4e00] animate-ping" />
                    <span>🎙️ {voiceStatusMsg || 'Escuchándote en directo... habla al micrófono'}</span>
                  </div>
                )}

                {/* Attached Image Preview Chip */}
                {attachedImage && (
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 p-1.5 rounded text-xs not-italic">
                    <img
                      src={attachedImage}
                      alt="Transmisión adjunta"
                      className="w-10 h-10 object-cover rounded border border-emerald-500/40"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-300 block truncate">
                        Imagen lista para análisis de Highfield
                      </span>
                      <span className="text-[9px] text-slate-400">Transmisión óptica vinculada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Eliminar imagen adjunta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Custom Message & Voice Form */}
                <form onSubmit={handleSendCustomMessage} className="pt-2 border-t border-[#141424] flex items-center gap-2 not-italic flex-wrap sm:flex-nowrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {/* Micro Button */}
                  <button
                    type="button"
                    onClick={toggleMicListening}
                    title={voiceState === 'listening' ? 'Detener micrófono' : 'Hablar con Highfield por micrófono'}
                    className={`px-2.5 sm:px-3 py-2 rounded-xs text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      voiceState === 'listening'
                        ? 'bg-[#ff4e00] text-white border-[#ff4e00] animate-pulse shadow-[0_0_12px_#ff4e00]'
                        : 'bg-[#0a0a14] hover:bg-[#151528] text-white/80 hover:text-[#ff4e00] border-[#1a1a2e]'
                    }`}
                  >
                    {voiceState === 'listening' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{voiceState === 'listening' ? 'Grabando...' : 'Hablar'}</span>
                  </button>

                  {/* Image Upload Quick Attachment */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar imagen o ejercicio para que Highfield lo vea"
                    className="p-2 rounded-xs bg-[#0a0a14] hover:bg-[#151528] text-emerald-400/90 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Open Full Vision / Camera HUD */}
                  {onOpenVisionScanner && (
                    <button
                      type="button"
                      onClick={onOpenVisionScanner}
                      title="Abrir Escáner Óptico / Cámara Lunar [OJO]"
                      className="px-2 py-2 rounded-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline text-[10px]">OJO</span>
                    </button>
                  )}

                  {/* Open Cosmic Sketchpad Modal */}
                  {onOpenSketchpad && (
                    <button
                      type="button"
                      onClick={onOpenSketchpad}
                      title="Abrir Taller de Bocetos y Pizarra Cósmica"
                      className="px-2 py-2 rounded-xs bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/50 hover:border-sky-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline text-[10px]">BOCETO</span>
                    </button>
                  )}

                  {/* Web Radar Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsWebSearchActive(!isWebSearchActive);
                      soundManager.playInteractChime();
                    }}
                    title={isWebSearchActive ? 'Radar Web activo: buscando datos actuales de la Tierra' : 'Activar Radar Web (Google Search Grounding)'}
                    className={`p-2 rounded-xs border text-xs font-bold flex items-center transition-all cursor-pointer ${
                      isWebSearchActive
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                        : 'bg-[#0a0a14] hover:bg-[#151528] text-white/40 hover:text-sky-300 border-[#1a1a2e]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={
                      attachedImage
                        ? 'Pregunta algo sobre esta imagen...'
                        : isWebSearchActive
                        ? 'Pregunta noticias, lanzamientos o datos de la Tierra...'
                        : "Escribe, pulsa 'Hablar', 'OJO' o 'BOCETO'..."
                    }
                    className="flex-1 min-w-[140px] bg-[#05050a] border border-[#1a1a2e] rounded-xs px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff4e00]"
                  />

                  <button
                    type="submit"
                    disabled={(!customInput.trim() && !attachedImage) || isAiLoading}
                    className="bg-[#ff4e00]/90 hover:bg-[#ff4e00] disabled:opacity-30 text-white px-3.5 py-2 rounded-xs text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ENVIAR</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Status line */}
            <div className="px-5 py-2 bg-[#050508] text-[9px] text-white/30 uppercase tracking-widest border-t border-[#141424] flex justify-between items-center flex-wrap gap-2">
              <span>Sujeto: Highfield // Enlace Multimodal + Radar Web Activo</span>
              <span className="text-[#ff4e00]/60">
                MIC: {voiceState.toUpperCase()} {isHandsFreeActive && '• HANDS-FREE ON'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

