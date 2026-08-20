/**
 * HIGHFIELD - World Canvas Component (Immersive UI Theme)
 * Manages 60 FPS rock-solid game loop, full tablet/screen scaling, 540x340 panoramic canvas,
 * circular lunar rotation engine, Automated World Phenomena Ticker (Asteroids, Solar Flares, etc.),
 * Monumental Star-Catching Cosmic Spider-Web & Starlight Cinema Screen, visitor mouse probes,
 * Captain's Logbook, and Snapshot polaroids.
 */

import React, { useEffect, useRef, useState } from 'react';
import { PixelCanvasRenderer } from '../engine/PixelCanvasRenderer';
import { BehaviorEngine } from '../engine/BehaviorEngine';
import { soundManager } from '../engine/AudioEngine';
import { eventTickerEngine } from '../engine/EventTickerEngine';
import { HighfieldStatus, Vector2D } from '../types';
import { CaptainsLogModal } from './CaptainsLogModal';
import { SnapshotModal } from './SnapshotModal';

interface WorldCanvasProps {
  onStatusUpdate: (status: HighfieldStatus) => void;
  onOpenDialogue: () => void;
  isDialogueOpen: boolean;
  zoomLevel: number;
  onSpawnCometRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerPatrolRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerWebJumpRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerMoonSpinRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerMeteorsRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerEclipseRef?: React.MutableRefObject<(() => void) | null>;
  onTriggerCosmicWebRef?: React.MutableRefObject<(() => void) | null>;
  onCycleCinemaModeRef?: React.MutableRefObject<(() => void) | null>;
  onOpenLogRef?: React.MutableRefObject<(() => void) | null>;
  onOpenSnapshotRef?: React.MutableRefObject<(() => void) | null>;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  onStatusUpdate,
  onOpenDialogue,
  isDialogueOpen,
  zoomLevel,
  onSpawnCometRef,
  onTriggerPatrolRef,
  onTriggerWebJumpRef,
  onTriggerMoonSpinRef,
  onTriggerMeteorsRef,
  onTriggerEclipseRef,
  onTriggerCosmicWebRef,
  onCycleCinemaModeRef,
  onOpenLogRef,
  onOpenSnapshotRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelCanvasRenderer | null>(null);
  const behaviorRef = useRef<BehaviorEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastStatusEmitRef = useRef<number>(0);

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  // High-frequency input ref
  const visitorProbeRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 130,
    y: 248,
    active: false,
  });

  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;

  const isDialogueOpenRef = useRef(isDialogueOpen);
  isDialogueOpenRef.current = isDialogueOpen;

  const onOpenDialogueRef = useRef(onOpenDialogue);
  onOpenDialogueRef.current = onOpenDialogue;

  const [currentThought, setCurrentThought] = useState<{ text: string; x: number; y: number } | null>(null);

  // Initialize engine and persistent 60 FPS render loop
  useEffect(() => {
    const renderer = new PixelCanvasRenderer();
    const behavior = new BehaviorEngine(130, 248);
    rendererRef.current = renderer;
    behaviorRef.current = behavior;

    if (onSpawnCometRef) {
      onSpawnCometRef.current = () => {
        renderer.spawnShootingStar(() => soundManager.playCometSwoosh());
        behavior.triggerThought('¡Mira esa estrella fugaz!');
      };
    }

    if (onTriggerPatrolRef) {
      onTriggerPatrolRef.current = () => {
        soundManager.resume();
        soundManager.playInteractChime();
        behavior.triggerImmediateWalk();
      };
    }

    if (onTriggerWebJumpRef) {
      onTriggerWebJumpRef.current = () => {
        soundManager.resume();
        soundManager.playInteractChime();
        behavior.triggerWebJump();
      };
    }

    if (onTriggerMoonSpinRef) {
      onTriggerMoonSpinRef.current = () => {
        soundManager.resume();
        soundManager.playCometSwoosh();
        renderer.triggerMoonRotation();
        behavior.triggerThought('El horizonte lunar gira bajo nuestros pies...');
      };
    }

    if (onTriggerMeteorsRef) {
      onTriggerMeteorsRef.current = () => {
        soundManager.resume();
        renderer.triggerMeteorShower(() => soundManager.playCometSwoosh());
        behavior.triggerThought('¡Lluvia de meteoros cruzando el cielo lunar!');
      };
    }

    if (onTriggerEclipseRef) {
      onTriggerEclipseRef.current = () => {
        soundManager.resume();
        soundManager.playCometSwoosh();
        renderer.triggerEclipse();
        behavior.triggerThought('El Sol se oculta tras la Tierra... La corona es hermosa.');
      };
    }

    if (onTriggerCosmicWebRef) {
      onTriggerCosmicWebRef.current = () => {
        soundManager.resume();
        soundManager.playWebWeaveChime();
        const active = renderer.toggleCosmicWeb(() => soundManager.playWebWeaveChime());
        if (active) {
          behavior.triggerWeaveWeb();
        } else {
          behavior.triggerThought('Recogiendo filamentos estelares...');
        }
      };
    }

    if (onCycleCinemaModeRef) {
      onCycleCinemaModeRef.current = () => {
        soundManager.resume();
        soundManager.playInteractChime();
        const nextMode = renderer.cycleCinemaMode();
        behavior.triggerThought(
          `Modo de Cine Estelar: ${
            nextMode === 'AURORA_CINEMA'
              ? 'Aurora Boreal Cósmica'
              : nextMode === 'CONSTELLATIONS'
              ? 'Constelaciones Vivas'
              : 'Memorias de la Tierra'
          }`
        );
      };
    }

    if (onOpenLogRef) {
      onOpenLogRef.current = () => {
        setIsLogOpen(true);
      };
    }

    if (onOpenSnapshotRef) {
      onOpenSnapshotRef.current = () => {
        setIsSnapshotOpen(true);
      };
    }

    // Force initial autonomous walk
    behavior.triggerImmediateWalk();

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaMs = Math.min(currentTime - lastTimeRef.current, 100);
      lastTimeRef.current = currentTime;

      const canvas = canvasRef.current;

      if (renderer && behavior && canvas) {
        // 1. Update Autonomous Highfield state
        const { stepped, footprintPos } = behavior.update(deltaMs, (x) => renderer.getTerrainHeight(x));

        if (stepped && Math.random() < 0.08) {
          soundManager.playFootstep();
        }

        if (footprintPos) {
          renderer.addFootprint(footprintPos.x, footprintPos.y, behavior.getStatus().facing);
        }

        const status = behavior.getStatus();

        // Throttle React status updates (approx 10Hz)
        if (currentTime - lastStatusEmitRef.current > 90) {
          lastStatusEmitRef.current = currentTime;
          onStatusUpdateRef.current(status);

          // Update thought bubble
          if (status.thought && !isDialogueOpenRef.current) {
            setCurrentThought({
              text: status.thought,
              x: status.position.x,
              y: status.position.y - 48,
            });
          } else {
            setCurrentThought(null);
          }
        }

        // 2. Update Automated Event Ticker & World Phenomena
        eventTickerEngine.update(deltaMs, (thought) => {
          if (!isDialogueOpenRef.current && Math.random() > 0.4) {
            behavior.triggerThought(thought);
          }
        });

        // 3. Update visual animations (includes circular moon spin & web physics)
        renderer.update(deltaMs, status, () => soundManager.playCometSwoosh());

        // 4. Render frame to canvas with active phenomena & cosmic web
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, renderer.width, renderer.height);
          const probe = visitorProbeRef.current;
          const phenomena = eventTickerEngine.getActivePhenomena();
          renderer.render(ctx, status, probe.active ? probe : null, phenomena);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    onSpawnCometRef,
    onTriggerPatrolRef,
    onTriggerWebJumpRef,
    onTriggerMoonSpinRef,
    onTriggerMeteorsRef,
    onTriggerEclipseRef,
    onTriggerCosmicWebRef,
    onCycleCinemaModeRef,
    onOpenLogRef,
    onOpenSnapshotRef,
  ]);

  // Transform client screen coordinates to virtual pixel coordinates (540x340)
  const getVirtualCoords = (clientX: number, clientY: number): Vector2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 540 / rect.width;
    const scaleY = 340 / rect.height;

    const x = Math.max(0, Math.min(540, (clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(340, (clientY - rect.top) * scaleY));
    return { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getVirtualCoords(e.clientX, e.clientY);
    if (coords && behaviorRef.current) {
      visitorProbeRef.current = { x: coords.x, y: coords.y, active: true };
      behaviorRef.current.setVisitorPosition(coords);
      behaviorRef.current.registerUserInteraction();
    }
  };

  const handlePointerLeave = () => {
    visitorProbeRef.current = { ...visitorProbeRef.current, active: false };
    if (behaviorRef.current) {
      behaviorRef.current.setVisitorPosition(null);
    }
  };

  const handleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundManager.resume();
    const coords = getVirtualCoords(e.clientX, e.clientY);
    if (!coords || !behaviorRef.current) return;

    behaviorRef.current.registerUserInteraction();

    const status = behaviorRef.current.getStatus();
    const dx = coords.x - status.position.x;
    const dy = coords.y - status.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If clicked near Highfield, trigger dialogue interaction!
    if (dist < 46 && !isDialogueOpenRef.current) {
      soundManager.playInteractChime();
      behaviorRef.current.startInteraction();
      onOpenDialogueRef.current();
    } else if (coords.y > 170 && !isDialogueOpenRef.current) {
      // Clicked on lunar landscape -> Highfield immediately investigates the point!
      soundManager.playInteractChime();
      behaviorRef.current.triggerImmediateWalk(coords.x);
    }
  };

  // Keyboard shortcuts: [E] Talk, [P] Patrol, [J] Web Jump, [R] Rotate Moon, [W] Cosmic Web, [C] Cycle Cinema, [B] Logbook, [T] Ticker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      behaviorRef.current?.registerUserInteraction();
      if (e.key === 'e' || e.key === 'E') {
        if (!isDialogueOpenRef.current && behaviorRef.current?.getStatus().nearVisitor) {
          soundManager.resume();
          soundManager.playInteractChime();
          behaviorRef.current.startInteraction();
          onOpenDialogueRef.current();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (!isDialogueOpenRef.current) {
          soundManager.resume();
          soundManager.playInteractChime();
          behaviorRef.current?.triggerImmediateWalk();
        }
      } else if (e.key === 'j' || e.key === 'J') {
        if (!isDialogueOpenRef.current) {
          soundManager.resume();
          soundManager.playInteractChime();
          behaviorRef.current?.triggerWebJump();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (!isDialogueOpenRef.current) {
          soundManager.resume();
          soundManager.playWebWeaveChime();
          const active = rendererRef.current?.toggleCosmicWeb(() => soundManager.playWebWeaveChime());
          if (active) {
            behaviorRef.current?.triggerWeaveWeb();
          } else {
            behaviorRef.current?.triggerThought('Recogiendo filamentos estelares...');
          }
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (!isDialogueOpenRef.current) {
          soundManager.resume();
          soundManager.playInteractChime();
          const nextMode = rendererRef.current?.cycleCinemaMode();
          behaviorRef.current?.triggerThought(`Modo de Cine Estelar: ${nextMode}`);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        soundManager.resume();
        soundManager.playCometSwoosh();
        rendererRef.current?.triggerMoonRotation();
        behaviorRef.current?.triggerThought('El horizonte lunar gira bajo nuestros pies...');
      } else if (e.key === 'b' || e.key === 'B') {
        setIsLogOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        eventTickerEngine.triggerPhenomenon();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="world-container"
      className="relative w-screen h-screen flex items-center justify-center overflow-hidden select-none bg-[#050508]"
      onClick={() => soundManager.resume()}
    >
      {/* Background Dither Overlay */}
      <div className="absolute inset-0 bg-dither opacity-20 pointer-events-none" />

      {/* Skewed Ambient Light Ribbons */}
      <div className="absolute top-10 left-1/4 w-32 h-96 bg-[#0f0f1a] border-r border-[#1f1f3a] skew-x-[-15deg] opacity-20 pointer-events-none" />
      <div className="absolute top-28 right-1/4 w-48 h-[600px] bg-[#0f0f1a] border-l border-[#1f1f3a] skew-x-[10deg] opacity-15 pointer-events-none" />

      {/* Expanded Pixel Art Canvas Stage for Tablet & Desktop Full Screen */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out p-1 sm:p-2"
        style={{
          transform: `scale(${zoomLevel})`,
        }}
      >
        <div className="relative w-full h-full max-w-[100vw] max-h-[100vh] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            id="highfield-pixel-canvas"
            width={540}
            height={340}
            onPointerMove={handlePointerMove}
            onPointerDown={handleClick}
            onPointerLeave={handlePointerLeave}
            className="block cursor-crosshair relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-sm"
            style={{
              imageRendering: 'pixelated',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxWidth: '100vw',
              maxHeight: '100vh',
            }}
          />

          {/* Thought Bubble floating above Highfield */}
          {currentThought && !isDialogueOpen && (
            <div
              id="highfield-thought-bubble"
              className="absolute pointer-events-none transition-all duration-300 z-30"
              style={{
                left: `${(currentThought.x / 540) * 100}%`,
                top: `${(currentThought.y / 340) * 100}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-[#05050a]/95 text-white/90 border-l-2 border-[#ff4e00] border-y border-r border-cyan-900/60 px-3.5 py-1.5 rounded-xs text-xs font-mono shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-xs max-w-[240px] text-center leading-relaxed">
                <p className="italic text-[11px] leading-tight font-medium tracking-wide">
                  &ldquo;{currentThought.text}&rdquo;
                </p>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#05050a] border-r border-b border-cyan-900/60 rotate-45" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 scanline z-30 opacity-12 pointer-events-none" />

      {/* Captain's Log Modal */}
      <CaptainsLogModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      {/* Lunar Snapshot Modal */}
      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
};
