/**
 * HIGHFIELD - Main Application Entry (Immersive UI Theme)
 * Assembles the interactive pixel world, autonomous systems, dialogue overlays, HUD,
 * cosmic events, circular moon rotation, automated world phenomena ticker,
 * Monumental Cosmic Spider-Web & Starlight Cinema Screen, and persistent memory interfaces.
 */

import React, { useState, useRef, useCallback } from 'react';
import { WorldCanvas } from './components/WorldCanvas';
import { DialogueBox } from './components/DialogueBox';
import { InteractionPrompt } from './components/InteractionPrompt';
import { CosmicHUD } from './components/CosmicHUD';
import { EventTicker } from './components/EventTicker';
import { HighfieldStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<HighfieldStatus | null>(null);
  const [isDialogueOpen, setIsDialogueOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

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

  const handleStatusUpdate = useCallback((newStatus: HighfieldStatus) => {
    setStatus(newStatus);
  }, []);

  const handleOpenDialogue = useCallback(() => {
    setIsDialogueOpen(true);
  }, []);

  const handleCloseDialogue = useCallback(() => {
    setIsDialogueOpen(false);
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
      />

      {/* 6. Immersive UI Telemetry Footer */}
      <footer className="fixed bottom-2.5 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20 pointer-events-none text-[9px] text-white/30 tracking-widest uppercase">
        <div className="flex gap-4 sm:gap-6">
          <span>LAT: 40.7128</span>
          <span>LONG: -74.0060</span>
          <span className="hidden sm:inline">ALT: 42M</span>
          <span className="hidden sm:inline">GRAV: 0.166g</span>
        </div>
        <div className="text-right">
          <span>HIGHFIELD AUTONOMY ENGINE // v0.2</span>
        </div>
      </footer>
    </main>
  );
}
