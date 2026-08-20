/**
 * HIGHFIELD - Main Application Entry (Immersive UI Theme)
 * Assembles the interactive pixel world, autonomous systems, dialogue overlays, HUD,
 * cosmic events, circular moon rotation, automated world phenomena ticker,
 * Monumental Cosmic Spider-Web & Starlight Cinema Screen, and persistent memory interfaces.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WorldCanvas } from './components/WorldCanvas';
import { DialogueBox } from './components/DialogueBox';
import { InteractionPrompt } from './components/InteractionPrompt';
import { CosmicHUD } from './components/CosmicHUD';
import { EventTicker } from './components/EventTicker';
import { RemindersAndWeatherModal } from './components/RemindersAndWeatherModal';
import { VisionScannerModal } from './components/VisionScannerModal';
import { CosmicCanvasModal } from './components/CosmicCanvasModal';
import { reminderSystem, LunarReminder } from './engine/ReminderSystem';
import { geminiBridge } from './ai/GeminiBridge';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { HighfieldStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<HighfieldStatus | null>(null);
  const [isDialogueOpen, setIsDialogueOpen] = useState<boolean>(false);
  const [dialogueInitialMessage, setDialogueInitialMessage] = useState<string | undefined>(undefined);
  const [dialogueInitialImage, setDialogueInitialImage] = useState<string | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState<boolean>(false);
  const [remindersModalTab, setRemindersModalTab] = useState<'reminders' | 'weather'>('reminders');
  const [isVisionModalOpen, setIsVisionModalOpen] = useState<boolean>(false);
  const [isSketchpadOpen, setIsSketchpadOpen] = useState<boolean>(false);
  const [activeAlarm, setActiveAlarm] = useState<LunarReminder | null>(null);

  const spawnCometRef = useRef<(() => void) | null>(null);
  const triggerPatrolRef = useRef<(() => void) | null>(null);
  const triggerWebJumpRef = useRef<(() => void) | null>(null);
  const triggerMoonSpinRef = useRef<(() => void) | null>(null);
  const triggerMeteorsRef = useRef<(() => void) | null>(null);
  const triggerEclipseRef = useRef<(() => void) | null>(null);
  const triggerCosmicWebRef = useRef<(() => void) | null>(null);
  const cycleCinemaModeRef = useRef<(() => void) | null>(null);
  const openLogRef = useRef<(() => void) | null>(null);
  const openSnapshotRef = useRef<(() => void) | null>(null);

  // Subscribe to reminder alerts
  useEffect(() => {
    const unsub = reminderSystem.subscribe(() => {
      setActiveAlarm(reminderSystem.getActiveAlarm());
    });
    return unsub;
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in text inputs or textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setRemindersModalTab('reminders');
        setIsRemindersModalOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setRemindersModalTab('weather');
        setIsRemindersModalOpen((prev) => !prev);
      } else if (e.key === 'o' || e.key === 'O' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setIsVisionModalOpen((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsSketchpadOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStatusUpdate = useCallback((newStatus: HighfieldStatus) => {
    setStatus(newStatus);
  }, []);

  const handleOpenDialogue = useCallback(() => {
    setIsDialogueOpen(true);
  }, []);

  const handleCloseDialogue = useCallback(() => {
    setIsDialogueOpen(false);
    setDialogueInitialMessage(undefined);
    setDialogueInitialImage(undefined);
  }, []);

  const handleOpenVisionScanner = useCallback(() => {
    setIsVisionModalOpen(true);
  }, []);

  const handleOpenSketchpad = useCallback(() => {
    setIsSketchpadOpen(true);
  }, []);

  const handleOpenDialogueWithContext = useCallback((initialMessage: string, imageAttachment?: string) => {
    setDialogueInitialMessage(initialMessage);
    setDialogueInitialImage(imageAttachment);
    setIsDialogueOpen(true);
  }, []);

  const handleOpenRemindersAndWeather = useCallback((tab: 'reminders' | 'weather' = 'reminders') => {
    setRemindersModalTab(tab);
    setIsRemindersModalOpen(true);
  }, []);

  const handleSpawnComet = useCallback(() => {
    if (spawnCometRef.current) spawnCometRef.current();
  }, []);

  const handleTriggerPatrol = useCallback(() => {
    if (triggerPatrolRef.current) triggerPatrolRef.current();
  }, []);

  const handleTriggerWebJump = useCallback(() => {
    if (triggerWebJumpRef.current) triggerWebJumpRef.current();
  }, []);

  const handleTriggerMoonSpin = useCallback(() => {
    if (triggerMoonSpinRef.current) triggerMoonSpinRef.current();
  }, []);

  const handleTriggerMeteors = useCallback(() => {
    if (triggerMeteorsRef.current) triggerMeteorsRef.current();
  }, []);

  const handleTriggerEclipse = useCallback(() => {
    if (triggerEclipseRef.current) triggerEclipseRef.current();
  }, []);

  const handleTriggerCosmicWeb = useCallback(() => {
    if (triggerCosmicWebRef.current) triggerCosmicWebRef.current();
  }, []);

  const handleCycleCinemaMode = useCallback(() => {
    if (cycleCinemaModeRef.current) cycleCinemaModeRef.current();
  }, []);

  const handleOpenLog = useCallback(() => {
    if (openLogRef.current) openLogRef.current();
  }, []);

  const handleOpenSnapshot = useCallback(() => {
    if (openSnapshotRef.current) openSnapshotRef.current();
  }, []);

  return (
    <main
      id="highfield-app-root"
      className="relative w-screen h-screen overflow-hidden bg-[#050508] select-none font-mono"
    >
      {/* Active Alarm Banner Toast */}
      {activeAlarm && (
        <div className="fixed top-16 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] z-50 pointer-events-auto">
          <div className="bg-red-950/95 border-2 border-red-500 rounded p-3.5 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-between gap-3 text-white animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-red-300 animate-spin" />
              </div>
              <div>
                <div className="text-[10px] text-red-300 uppercase tracking-widest font-black">
                  ¡RECORDATORIO CÓSMICO VENCIDO!
                </div>
                <div className="text-xs font-bold text-white mt-0.5">{activeAlarm.title}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  reminderSystem.toggleComplete(activeAlarm.id);
                  reminderSystem.dismissAlarm();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Hecho</span>
              </button>
              <button
                onClick={() => reminderSystem.dismissAlarm()}
                className="text-white/60 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Descartar alarma"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Core Pixel Canvas & World Engine */}
      <WorldCanvas
        onStatusUpdate={handleStatusUpdate}
        onOpenDialogue={handleOpenDialogue}
        isDialogueOpen={isDialogueOpen}
        zoomLevel={zoomLevel}
        onSpawnCometRef={spawnCometRef}
        onTriggerPatrolRef={triggerPatrolRef}
        onTriggerWebJumpRef={triggerWebJumpRef}
        onTriggerMoonSpinRef={triggerMoonSpinRef}
        onTriggerMeteorsRef={triggerMeteorsRef}
        onTriggerEclipseRef={triggerEclipseRef}
        onTriggerCosmicWebRef={triggerCosmicWebRef}
        onCycleCinemaModeRef={cycleCinemaModeRef}
        onOpenLogRef={openLogRef}
        onOpenSnapshotRef={openSnapshotRef}
      />

      {/* 2. Top Header & Ambient Controls */}
      <CosmicHUD
        status={status}
        onSpawnComet={handleSpawnComet}
        onTriggerPatrol={handleTriggerPatrol}
        onTriggerWebJump={handleTriggerWebJump}
        onTriggerMoonSpin={handleTriggerMoonSpin}
        onTriggerMeteors={handleTriggerMeteors}
        onTriggerEclipse={handleTriggerEclipse}
        onTriggerCosmicWeb={handleTriggerCosmicWeb}
        onCycleCinemaMode={handleCycleCinemaMode}
        onOpenLog={handleOpenLog}
        onOpenSnapshot={handleOpenSnapshot}
        onOpenVisionScanner={handleOpenVisionScanner}
        onOpenSketchpad={handleOpenSketchpad}
        onOpenRemindersAndWeather={handleOpenRemindersAndWeather}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        onOpenDialogue={handleOpenDialogue}
      />

      {/* 3. Automated World Event Ticker Ribbon */}
      <EventTicker />

      {/* 4. Proximity Interaction Prompt */}
      {status && (
        <InteractionPrompt
          status={status}
          isDialogueOpen={isDialogueOpen}
          onInteract={handleOpenDialogue}
        />
      )}

      {/* 5. Cinematic Dialogue Interface */}
      <DialogueBox
        isOpen={isDialogueOpen}
        onClose={handleCloseDialogue}
        onOpenVisionScanner={handleOpenVisionScanner}
        onOpenSketchpad={handleOpenSketchpad}
        initialMessage={dialogueInitialMessage}
        initialImageAttachment={dialogueInitialImage}
      />

      {/* 6. Reminders & Weather Modal */}
      <RemindersAndWeatherModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        defaultTab={remindersModalTab}
      />

      {/* 7. Multimodal Vision Scanner & Facial Telemetry Modal */}
      <VisionScannerModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        geminiBridge={geminiBridge}
        onOpenDialogueWithContext={handleOpenDialogueWithContext}
      />

      {/* 8. Cosmic Sketchpad & Generative Canvas Modal */}
      <CosmicCanvasModal
        isOpen={isSketchpadOpen}
        onClose={() => setIsSketchpadOpen(false)}
        onShareInChat={(title, comment) => {
          handleOpenDialogueWithContext(`[Boceto: ${title}] - ${comment}`);
        }}
      />

      {/* 9. Immersive UI Telemetry Footer */}
      <footer className="fixed bottom-2.5 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20 pointer-events-none text-[9px] text-white/30 tracking-widest uppercase">
        <div className="flex gap-4 sm:gap-6">
          <span>LAT: 40.7128</span>
          <span>LONG: -74.0060</span>
          <span className="hidden sm:inline">ALT: 42M</span>
          <span className="hidden sm:inline">GRAV: 0.166g</span>
        </div>
        <div className="text-right">
          <span>HIGHFIELD AUTONOMY ENGINE // v0.3 MULTIMODAL</span>
        </div>
      </footer>
    </main>
  );
}
