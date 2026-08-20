/**
 * HIGHFIELD - Cosmic HUD & Minimalist Controls (Immersive UI Theme)
 * Provides cyberpunk / retro-sci-fi telemetry indicators, cosmic event triggers,
 * Monumental Star-Catching Cosmic Web & Cinema Screen triggers, logbook access,
 * moon spin rotation, snapshot polaroid, and voice transceiver controls.
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Info,
  Footprints,
  Mic,
  BookOpen,
  Camera,
  Moon,
  Zap,
  RotateCw,
  Film,
  Radio,
  Sliders,
  Bell,
  CloudSun,
  Eye,
  Palette,
} from 'lucide-react';
import { soundManager } from '../engine/AudioEngine';
import { soundscapeEngine } from '../engine/AtmosphericSoundscapeEngine';
import { reminderSystem } from '../engine/ReminderSystem';
import { HighfieldStatus, HighfieldState } from '../types';

interface CosmicHUDProps {
  status: HighfieldStatus | null;
  onSpawnComet: () => void;
  onTriggerPatrol?: () => void;
  onTriggerWebJump?: () => void;
  onTriggerMoonSpin?: () => void;
  onTriggerMeteors?: () => void;
  onTriggerEclipse?: () => void;
  onTriggerCosmicWeb?: () => void;
  onCycleCinemaMode?: () => void;
  onOpenLog?: () => void;
  onOpenSnapshot?: () => void;
  onOpenVisionScanner?: () => void;
  onOpenSketchpad?: () => void;
  onOpenRemindersAndWeather?: (tab?: 'reminders' | 'weather') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  onOpenDialogue: () => void;
}

export const CosmicHUD: React.FC<CosmicHUDProps> = ({
  status,
  onTriggerPatrol,
  onTriggerWebJump,
  onTriggerMoonSpin,
  onTriggerMeteors,
  onTriggerEclipse,
  onTriggerCosmicWeb,
  onCycleCinemaMode,
  onOpenLog,
  onOpenSnapshot,
  onOpenVisionScanner,
  onOpenSketchpad,
  onOpenRemindersAndWeather,
  zoomLevel,
  setZoomLevel,
  onOpenDialogue,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showSoundscapeModal, setShowSoundscapeModal] = useState<boolean>(false);
  const [soundscapeSettings, setSoundscapeSettings] = useState(soundscapeEngine.getSettings());
  const [activeRemindersCount, setActiveRemindersCount] = useState<number>(reminderSystem.getActiveCount());

  useEffect(() => {
    const unsub = reminderSystem.subscribe(() => {
      setActiveRemindersCount(reminderSystem.getActiveCount());
    });
    return unsub;
  }, []);

  const toggleSound = () => {
    soundManager.resume();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    setSoundscapeSettings(soundscapeEngine.getSettings());
  };

  const handleSoundscapeLayer = (layer: 'drone' | 'wind' | 'radio' | 'crystal', val: number) => {
    soundManager.resume();
    soundscapeEngine.setLayerVolume(layer, val);
    setSoundscapeSettings(soundscapeEngine.getSettings());
  };

  const handleTestRadioBurst = () => {
    soundManager.resume();
    soundscapeEngine.playProceduralRadioBurst();
  };

  const handleTestCrystalPing = () => {
    soundManager.resume();
    soundscapeEngine.playProceduralCrystalPing();
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(1, Math.min(1.8, Number((prev + delta).toFixed(2)))));
  };

  const getStateLabel = (state: HighfieldState) => {
    switch (state) {
      case HighfieldState.EXPLORING:
        return { label: 'EXPLORING_PANORAMA', color: 'text-[#ff4e00]' };
      case HighfieldState.OBSERVING:
        return { label: 'OBSERVING_EARTH_ORBIT', color: 'text-cyan-400' };
      case HighfieldState.SITTING:
        return { label: 'SITTING_ON_RIDGE_CREST', color: 'text-cyan-300' };
      case HighfieldState.INSPECTING:
        return { label: 'ANALYZING_REGOLITH_CRYSTALS', color: 'text-purple-400' };
      case HighfieldState.WEB_JUMP:
        return { label: 'LOW_GRAVITY_WEB_VAULT', color: 'text-amber-400' };
      case HighfieldState.WEAVING_WEB:
        return { label: 'WEAVING_COSMIC_CINEMA_WEB', color: 'text-cyan-300' };
      case HighfieldState.PLAYER_DETECTED:
        return { label: 'VISITOR_ACQUIRED', color: 'text-[#ff4e00]' };
      case HighfieldState.INTERACTING:
        return { label: 'TRANSMISSION_ACTIVE', color: 'text-emerald-400' };
      case HighfieldState.SCANNING_GROUND:
        return { label: 'SCANNING_REGOLITH_SPECTRUM', color: 'text-cyan-400' };
      case HighfieldState.ADJUSTING_SENSORS:
        return { label: 'CALIBRATING_VISOR_OPTICS', color: 'text-amber-400' };
      case HighfieldState.CONTEMPLATING_DEEP:
        return { label: 'DEEP_COSMIC_CONTEMPLATION', color: 'text-blue-400' };
      case HighfieldState.STRETCHING_BOOTS:
        return { label: 'TESTING_SUSPENSION_BOOTS', color: 'text-emerald-400' };
      case HighfieldState.CHECKING_WEB_SHOOTERS:
        return { label: 'VERIFYING_WEB_DISPENSERS', color: 'text-cyan-300' };
      case HighfieldState.IDLE:
      default:
        return { label: 'STANDING_SILENT_WATCH', color: 'text-slate-300' };
    }
  };

  const stateInfo = status
    ? getStateLabel(status.state)
    : { label: 'INITIALIZING', color: 'text-slate-400' };

  return (
    <>
      {/* Top Telemetry Header Bar */}
      <header className="fixed top-3 inset-x-3 sm:inset-x-6 flex items-start justify-between z-40 pointer-events-none font-mono">
        {/* Project Status Readout */}
        <div className="pointer-events-auto">
          <div className="text-[9px] tracking-[0.25em] text-white/40 mb-1 uppercase font-bold">
            Project_Status
          </div>
          <div className="flex items-center gap-2.5 bg-[#050508]/85 border border-cyan-900/60 px-3 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            <div className="w-2 h-2 bg-[#ff4e00] rounded-full animate-pulse shadow-[0_0_10px_#ff4e00]" />
            <span className="text-xs font-bold tracking-widest text-[#e0e0e0]">
              HIGHFIELD 0.2 // PANORAMA_ENV
            </span>
          </div>
        </div>

        {/* Center / Quick Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 pointer-events-auto max-w-[78vw]">
          {/* Monumental Cosmic Web & Starlight Cinema Trigger */}
          {onTriggerCosmicWeb && (
            <button
              id="trigger-cosmic-web-btn"
              onClick={onTriggerCosmicWeb}
              title="Desplegar Red Monumental de Filamentos (Pantalla de Cine Estelar) [Tecla W]"
              className="flex items-center gap-1.5 bg-[#081b2a]/95 hover:bg-cyan-950 text-cyan-200 px-3 py-1.5 rounded border border-cyan-400/60 hover:border-cyan-300 text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer group animate-pulse"
            >
              <Film className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-cyan-300">
                Red Cósmica
              </span>
            </button>
          )}

          {/* Cycle Cinema Screen Mode */}
          {onCycleCinemaMode && (
            <button
              id="cycle-cinema-mode-btn"
              onClick={onCycleCinemaMode}
              title="Cambiar proyección: Aurora Boreal / Constelaciones / Memorias de la Tierra [Tecla C]"
              className="hidden lg:flex items-center gap-1.5 bg-[#050508]/90 hover:bg-purple-950/60 text-purple-300 px-2.5 py-1.5 rounded border border-purple-500/40 hover:border-purple-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] tracking-wider uppercase font-bold">
                Modo Cine
              </span>
            </button>
          )}

          {/* Rotación Lunar (Moon Spin) */}
          {onTriggerMoonSpin && (
            <button
              id="trigger-moon-spin-btn"
              onClick={onTriggerMoonSpin}
              title="Iniciar rotación circular del horizonte lunar [Tecla R]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-indigo-950/60 text-indigo-300 px-2.5 py-1.5 rounded border border-indigo-500/40 hover:border-indigo-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Girar Luna
              </span>
            </button>
          )}

          {/* Salto Arácnido (Web Jump) */}
          {onTriggerWebJump && (
            <button
              id="trigger-web-jump-btn"
              onClick={onTriggerWebJump}
              title="Realizar salto con filamento en baja gravedad (1/6g) [Tecla J]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-amber-950/60 text-amber-300 px-2.5 py-1.5 rounded border border-amber-500/40 hover:border-amber-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Salto
              </span>
            </button>
          )}

          {/* Bitácora de Campo (Journal & Memories) */}
          {onOpenLog && (
            <button
              id="open-logbook-btn"
              onClick={onOpenLog}
              title="Abrir Bitácora y Memoria de Highfield [Tecla B]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-cyan-950/60 text-cyan-300 px-2.5 py-1.5 rounded border border-cyan-500/40 hover:border-cyan-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Bitácora
              </span>
            </button>
          )}

          {/* Eclipse Solar Trigger */}
          {onTriggerEclipse && (
            <button
              id="trigger-eclipse-btn"
              onClick={onTriggerEclipse}
              title="Provocar Eclipse Solar con corona llameante"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-red-950/60 text-red-300 px-2.5 py-1.5 rounded border border-red-500/40 hover:border-red-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Moon className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline text-[10px] tracking-wider uppercase font-bold">
                Eclipse
              </span>
            </button>
          )}

          {/* Meteor Shower Trigger */}
          {onTriggerMeteors && (
            <button
              id="trigger-meteor-shower-btn"
              onClick={onTriggerMeteors}
              title="Desatar lluvia de meteoros"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-amber-950/60 text-amber-300 px-2.5 py-1.5 rounded border border-amber-500/40 hover:border-amber-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline text-[10px] tracking-wider uppercase font-bold">
                Meteors
              </span>
            </button>
          )}

          {/* Patrol Walk Trigger */}
          {onTriggerPatrol && (
            <button
              id="trigger-patrol-btn"
              onClick={onTriggerPatrol}
              title="Iniciar paseo lunar autónomo [Tecla P]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-[#0f0f1c] text-[#e0e0e0] hover:text-[#ff4e00] px-2.5 py-1.5 rounded border border-[#1a1a2e] hover:border-[#ff4e00]/50 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Footprints className="w-3.5 h-3.5 text-[#ff4e00] group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Patrol
              </span>
            </button>
          )}

          {/* Snapshot Polaroid Tool */}
          {onOpenSnapshot && (
            <button
              id="snapshot-tool-btn"
              onClick={onOpenSnapshot}
              title="Tomar Foto / Snapshot Polaroid Telemetría"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-cyan-950/60 text-cyan-300 px-2.5 py-1.5 rounded border border-cyan-500/40 hover:border-cyan-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Foto
              </span>
            </button>
          )}

          {/* Recordatorios y Alarmas */}
          {onOpenRemindersAndWeather && (
            <button
              id="open-reminders-btn"
              onClick={() => onOpenRemindersAndWeather('reminders')}
              title="Abrir Cronómetros y Recordatorios [Tecla T]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-[#ff4e00]/20 text-white/90 hover:text-[#ff4e00] px-2.5 py-1.5 rounded border border-[#1a1a2e] hover:border-[#ff4e00]/50 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <Bell className="w-3.5 h-3.5 text-[#ff4e00] group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Alarmas
              </span>
              {activeRemindersCount > 0 && (
                <span className="bg-[#ff4e00] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          )}

          {/* Clima Terrestre & Lunar */}
          {onOpenRemindersAndWeather && (
            <button
              id="open-weather-btn"
              onClick={() => onOpenRemindersAndWeather('weather')}
              title="Consultar Meteorología Terrestre & Telemetría Lunar [Tecla M]"
              className="flex items-center gap-1.5 bg-[#050508]/90 hover:bg-cyan-950/60 text-cyan-300 px-2.5 py-1.5 rounded border border-cyan-500/40 hover:border-cyan-400 text-xs transition-all shadow-sm cursor-pointer group"
            >
              <CloudSun className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[10px] tracking-wider uppercase font-bold">
                Clima
              </span>
            </button>
          )}

          {/* Escáner Óptico / OJO de Highfield (Multimodal Vision) */}
          {onOpenVisionScanner && (
            <button
              id="open-vision-scanner-btn"
              onClick={onOpenVisionScanner}
              title="Activar Sensor Óptico / Ojo de Highfield (Cámara, tareas y análisis visual) [Tecla O o V]"
              className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 px-3 py-1.5 rounded border border-emerald-500/50 hover:border-emerald-400 text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)] cursor-pointer group"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform" />
              <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-400">
                Ojo
              </span>
            </button>
          )}

          {/* Taller de Bocetos Cósmicos (Multimodal Generative Art) */}
          {onOpenSketchpad && (
            <button
              id="open-sketchpad-btn"
              onClick={onOpenSketchpad}
              title="Abrir Taller de Bocetos Cósmicos y Pizarra Lunar [Tecla B]"
              className="flex items-center gap-1.5 bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 px-3 py-1.5 rounded border border-sky-500/50 hover:border-sky-400 text-xs transition-all shadow-[0_0_10px_rgba(56,189,248,0.25)] cursor-pointer group"
            >
              <Palette className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 group-hover:text-sky-300 transition-transform" />
              <span className="text-[10px] tracking-wider uppercase font-bold text-sky-400">
                Boceto
              </span>
            </button>
          )}

          {/* Voice & Dialogue Transceiver Button */}
          <button
            id="voice-dialogue-btn"
            onClick={onOpenDialogue}
            title="Hablar / Comunicar por voz con Highfield [Tecla E]"
            className="flex items-center gap-1.5 bg-[#ff4e00]/20 hover:bg-[#ff4e00]/35 text-white px-3 py-1.5 rounded border border-[#ff4e00]/60 hover:border-[#ff4e00] text-xs transition-all shadow-[0_0_12px_rgba(255,78,0,0.3)] cursor-pointer group"
          >
            <Mic className="w-3.5 h-3.5 text-[#ff4e00] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#ff4e00]">
              Hablar
            </span>
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-[#050508]/85 border border-[#1a1a2e] rounded px-1.5 py-0.5 text-xs text-[#e0e0e0]">
            <button
              id="zoom-out-btn"
              onClick={() => handleZoom(-0.2)}
              title="Alejar"
              className="p-1 hover:text-[#ff4e00] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] px-1 font-mono text-white/50">{zoomLevel}x</span>
            <button
              id="zoom-in-btn"
              onClick={() => handleZoom(0.2)}
              title="Acercar"
              className="p-1 hover:text-[#ff4e00] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            id="audio-toggle-btn"
            onClick={toggleSound}
            title={isMuted ? 'Activar sonido ambiental' : 'Silenciar'}
            className="bg-[#050508]/85 hover:bg-[#0f0f1c] text-[#e0e0e0] hover:text-[#ff4e00] p-1.5 rounded border border-[#1a1a2e] hover:border-[#ff4e00]/50 text-xs transition-all shadow-sm cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#ff4e00]" />
            )}
          </button>

          {/* Soundscape Atmosphere Mixer Button */}
          <button
            id="soundscape-mixer-btn"
            onClick={() => setShowSoundscapeModal(true)}
            title="Calibrar Paisaje Sonoro Cósmico (Drones, Viento Solar, Radio y Cristales)"
            className="bg-[#050508]/85 hover:bg-[#0f0f1c] text-cyan-300 hover:text-cyan-200 p-1.5 rounded border border-cyan-900/60 hover:border-cyan-400/50 text-xs transition-all shadow-sm cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Info Trigger */}
          <button
            id="info-modal-btn"
            onClick={() => setShowInfoModal(true)}
            title="Especificaciones del Sistema"
            className="bg-[#050508]/85 hover:bg-[#0f0f1c] text-[#e0e0e0] hover:text-[#ff4e00] p-1.5 rounded border border-[#1a1a2e] hover:border-[#ff4e00]/50 text-xs transition-all shadow-sm cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Right Side Telemetry Readout */}
      <aside className="fixed top-24 right-4 z-30 pointer-events-none font-mono hidden md:block w-52 space-y-3">
        <div className="border-l-2 border-[#ff4e00]/40 pl-3 py-1 bg-[#050508]/75 backdrop-blur-xs rounded-r">
          <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5 text-[#ff4e00] font-bold">
            Current_Action
          </div>
          <div className="text-[11px] font-bold text-white tracking-wider truncate">
            {stateInfo.label}
          </div>
          {status && (
            <div className="text-[10px] text-white/60 mt-0.5 leading-snug truncate">
              {status.currentAction}
            </div>
          )}
        </div>

        <div className="border-l-2 border-cyan-500/40 pl-3 py-1 bg-[#050508]/75 backdrop-blur-xs rounded-r">
          <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5 text-cyan-400 font-bold">
            Telemetry_Stats
          </div>
          <div className="text-[10px] text-white/70 leading-relaxed">
            Position: [X: {status ? Math.round(status.position.x) : 0}] • Canvas: 540x340
          </div>
        </div>
      </aside>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          id="info-modal-backdrop"
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm font-mono"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            id="info-modal-content"
            className="bg-[#080812] border-l-4 border-[#ff4e00] border-t border-r border-b border-cyan-900/60 max-w-lg w-full rounded p-6 text-[#e0e0e0] shadow-[0_0_40px_rgba(0,0,0,0.9)] space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1a1a2e] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff4e00] rounded-full animate-pulse" />
                <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">
                  HIGHFIELD // IMMERSIVE_SPEC v0.2
                </h3>
              </div>
              <button
                id="close-info-modal"
                onClick={() => setShowInfoModal(false)}
                className="text-white/40 hover:text-[#ff4e00] text-xs px-2 py-1 bg-[#10101f] border border-[#1a1a2e] rounded cursor-pointer transition-colors"
              >
                [ESC] CLOSE
              </button>
            </div>

            <div className="text-xs space-y-3 leading-relaxed text-white/80">
              <p>
                <strong className="text-white">Mundo Autónomo Pixel-Art Panorámico:</strong> Recreación
                expandida del héroe arácnido <strong>Highfield</strong> vigilando la Tierra desde la órbita
                lunar con horizonte curvo rotatorio, pantalla de cine cósmica e inteligencia cognitiva <strong>Gemini</strong>.
              </p>

              <div className="bg-[#05050a] p-3 border-l-2 border-[#ff4e00]/50 border-y border-r border-[#141424] space-y-2 text-[11px]">
                <div className="text-[#ff4e00] font-bold tracking-wider uppercase text-[10px]">
                  CONTROLES Y NOVEDADES:
                </div>
                <div>
                  • <strong>🕸️ Red Monumental Cósmica & Cine Estelar:</strong> Despliega la inmensa telaraña estelar que atrapa la luz de las estrellas como una pantalla de cine flotante frente a la Tierra (botón <strong>Red Cósmica</strong> o tecla <strong>[W]</strong>).
                </div>
                <div>
                  • <strong>✨ Modo Cine:</strong> Alterna proyecciones cósmicas: Auroras Boreales, Constelaciones Vivas y Memorias de la Tierra (tecla <strong>[C]</strong>).
                </div>
                <div>
                  • <strong>Rotación Lunar:</strong> El horizonte lunar debajo de Highfield rota en un arco esférico continuo durante unos segundos y se detiene suavemente (botón <strong>Girar Luna</strong> o tecla <strong>[R]</strong>).
                </div>
                <div>
                  • <strong>Mayor Espacio:</strong> Lienzo panorámico de 540px con libertad total de patrulla y puntos clave de observación.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Soundscape Mixer Modal */}
      {showSoundscapeModal && (
        <div
          id="soundscape-modal-backdrop"
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm font-mono"
          onClick={() => setShowSoundscapeModal(false)}
        >
          <div
            id="soundscape-modal-content"
            className="bg-[#080812] border-l-4 border-cyan-400 border-t border-r border-b border-cyan-900/60 max-w-lg w-full rounded p-6 text-[#e0e0e0] shadow-[0_0_40px_rgba(0,0,0,0.9)] space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1a1a2e] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">
                  ATMOSPHERIC SOUNDSCAPE SYNTHESIZER
                </h3>
              </div>
              <button
                id="close-soundscape-modal"
                onClick={() => setShowSoundscapeModal(false)}
                className="text-white/40 hover:text-cyan-400 text-xs px-2 py-1 bg-[#10101f] border border-[#1a1a2e] rounded cursor-pointer transition-colors"
              >
                [ESC] CLOSE
              </button>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              Motor sonoro procedural en tiempo real mediante <strong>Web Audio API</strong>. Mezcla frecuencias sub-graves cósmicas, viento solar modulado, ráfagas de telemetría por radio y resonancias cristalinas lunares.
            </p>

            {/* Quick Testing Triggers */}
            <div className="flex gap-2">
              <button
                onClick={handleTestRadioBurst}
                className="flex-1 py-1.5 px-2.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all"
              >
                📡 Emitir Telemetría Radio
              </button>
              <button
                onClick={handleTestCrystalPing}
                className="flex-1 py-1.5 px-2.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all"
              >
                💎 Resonar Cristal Lunar
              </button>
            </div>

            {/* Layer Volume Sliders */}
            <div className="space-y-3 bg-[#05050a] p-3.5 border border-[#141424] rounded">
              {/* Drone Layer */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                  <span className="text-cyan-300">1. Drones Sub-Graves (A1 / 55Hz Binaural)</span>
                  <span>{Math.round(soundscapeSettings.droneVolume * 1000)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.005"
                  value={soundscapeSettings.droneVolume}
                  onChange={(e) => handleSoundscapeLayer('drone', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Wind Layer */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                  <span className="text-amber-300">2. Viento Solar (Ruido Rosa Modulado)</span>
                  <span>{Math.round(soundscapeSettings.windVolume * 1000)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.15"
                  step="0.005"
                  value={soundscapeSettings.windVolume}
                  onChange={(e) => handleSoundscapeLayer('wind', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Radio Layer */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                  <span className="text-[#ff4e00]">3. Interferencias & Ráfagas de Radio</span>
                  <span>{Math.round(soundscapeSettings.radioVolume * 1000)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.12"
                  step="0.005"
                  value={soundscapeSettings.radioVolume}
                  onChange={(e) => handleSoundscapeLayer('radio', parseFloat(e.target.value))}
                  className="w-full accent-[#ff4e00] cursor-pointer"
                />
              </div>

              {/* Crystals Layer */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                  <span className="text-purple-300">4. Resonancias de Cristales Celestes</span>
                  <span>{Math.round(soundscapeSettings.crystalsVolume * 1000)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.15"
                  step="0.005"
                  value={soundscapeSettings.crystalsVolume}
                  onChange={(e) => handleSoundscapeLayer('crystal', parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="text-[9px] text-white/40 tracking-wider text-center">
              TEMPORIZACIÓN PROCEDURAL POISSON • SIN BUCLES PREGRABADOS • 100% SINTETIZADO
            </div>
          </div>
        </div>
      )}
    </>
  );
};
