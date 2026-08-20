import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette,
  Sparkles,
  Download,
  BookMarked,
  MessageSquare,
  X,
  Play,
  RotateCcw,
  Layers,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { geminiBridge, CosmicSketchResult } from '../ai/GeminiBridge';
import { memorySystem } from '../engine/MemorySystem';
import { soundManager } from '../engine/AudioEngine';

interface CosmicCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareInChat: (sketchTitle: string, comment: string) => void;
}

const PRESET_CONCEPTS = [
  { id: 'earth_crater', label: 'La Canica Azul sobre el Cráter', prompt: 'La Tierra como una canica azul brillante suspendida sobre un cráter lunar sereno' },
  { id: 'stardust_flower', label: 'Flor de Polvo Estelar', prompt: 'Una extraña flor fosforescente de polvo estelar brotando del regolito lunar' },
  { id: 'spider_guard', label: 'Highfield en Guardia Cósmica', prompt: 'Highfield con su sudadera verde olivo y zapatillas rojas observando las estrellas' },
  { id: 'cosmic_web', label: 'Constelación de la Red', prompt: 'Una telaraña de filamentos cósmicos conectando estrellas lejanas en el vacío' },
  { id: 'solar_eclipse', label: 'Eclipse Solar desde la Luna', prompt: 'La Tierra eclipsando el Sol con un anillo de atmósfera ardiente y auroras' }
];

export const CosmicCanvasModal: React.FC<CosmicCanvasModalProps> = ({
  isOpen,
  onClose,
  onShareInChat
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('earth_crater');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawProgress, setDrawProgress] = useState<number>(0);
  const [currentSketch, setCurrentSketch] = useState<CosmicSketchResult | null>(null);
  const [savedToJournal, setSavedToJournal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Generate initial sketch on modal open if none exists
  useEffect(() => {
    if (isOpen && !currentSketch && !isGenerating) {
      handleGenerate(PRESET_CONCEPTS[0].prompt, 'earth_crater');
    }
  }, [isOpen]);

  const handleGenerate = async (promptText: string, theme: string) => {
    setIsGenerating(true);
    setSavedToJournal(false);
    soundManager.playInteractChime();

    try {
      const sketchData = await geminiBridge.generateCosmicSketch(promptText, theme);
      setCurrentSketch(sketchData);
      startDrawingAnimation(sketchData);
    } catch (e) {
      console.warn('Error generating sketch:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const startDrawingAnimation = (sketch: CosmicSketchResult) => {
    setIsDrawing(true);
    setDrawProgress(0);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsDrawing(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsDrawing(false);
      return;
    }

    let progress = 0;
    const startTime = performance.now();
    const duration = 2200; // 2.2s animation

    const render = (time: number) => {
      const elapsed = time - startTime;
      progress = Math.min(1, elapsed / duration);
      setDrawProgress(Math.round(progress * 100));

      drawCanvas(ctx, canvas.width, canvas.height, sketch, progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        setIsDrawing(false);
        soundManager.playWebWeaveChime();
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(render);
  };

  const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sketch: CosmicSketchResult,
    progress: number
  ) => {
    // 1. Background
    ctx.fillStyle = sketch.palette.background || '#070913';
    ctx.fillRect(0, 0, width, height);

    // 2. Deep Space Stars (Procedural deterministic grid)
    const starCount = 140;
    for (let i = 0; i < starCount * progress; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 223.7) % (height * 0.7));
      const sRadius = (i % 5 === 0) ? 2.2 : (i % 3 === 0 ? 1.5 : 0.9);
      const alpha = 0.3 + ((i % 7) / 10) * 0.7;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();

      // Occasional star twinkle cross
      if (i % 18 === 0 && progress > 0.4) {
        ctx.strokeStyle = `rgba(217, 249, 157, 0.4)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }

    // 3. Cosmic Web Filaments (Spider Silk)
    if (progress > 0.2) {
      const webProgress = Math.min(1, (progress - 0.2) / 0.6);
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * webProgress})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      ctx.beginPath();
      ctx.moveTo(width * 0.1, height * 0.2);
      ctx.quadraticCurveTo(width * 0.45, height * 0.15, width * 0.85, height * 0.35);
      ctx.moveTo(width * 0.2, height * 0.4);
      ctx.quadraticCurveTo(width * 0.5, height * 0.3, width * 0.9, height * 0.15);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Celestial Body (Earth or Moon or Sun)
    if (progress > 0.3) {
      const earthProgress = Math.min(1, (progress - 0.3) / 0.5);
      const ex = width * 0.65;
      const ey = height * 0.3;
      const er = 45 * earthProgress;

      // Glow atmosphere
      const glowGrad = ctx.createRadialGradient(ex, ey, er * 0.7, ex, ey, er * 1.6);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      glowGrad.addColorStop(0.6, 'rgba(30, 58, 138, 0.2)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, er * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base
      const earthGrad = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er);
      earthGrad.addColorStop(0, '#bae6fd');
      earthGrad.addColorStop(0.35, '#0284c7');
      earthGrad.addColorStop(0.75, '#0f172a');
      earthGrad.addColorStop(1, '#020617');

      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric swirl
      if (earthProgress > 0.8) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, er * 0.75, -0.4, 1.2);
        ctx.stroke();
      }
    }

    // 5. Lunar Surface / Mountain Ridge (Silhouettes)
    if (progress > 0.5) {
      const ridgeProgress = Math.min(1, (progress - 0.5) / 0.5);
      const baseY = height * 0.72;

      // Back ridge
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY + 15);
      ctx.quadraticCurveTo(width * 0.25, baseY - 20, width * 0.5, baseY + 10);
      ctx.quadraticCurveTo(width * 0.75, baseY - 35, width, baseY);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Foreground Crater Ridge
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY + 40);
      ctx.bezierCurveTo(
        width * 0.2, baseY + 20,
        width * 0.4, baseY + 60,
        width * 0.65, baseY + 35
      );
      ctx.bezierCurveTo(
        width * 0.85, baseY + 15,
        width * 0.95, baseY + 45,
        width, baseY + 50
      );
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Regolith highlight line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, baseY + 40);
      ctx.bezierCurveTo(
        width * 0.2, baseY + 20,
        width * 0.4, baseY + 60,
        width * 0.65, baseY + 35
      );
      ctx.bezierCurveTo(
        width * 0.85, baseY + 15,
        width * 0.95, baseY + 45,
        width, baseY + 50
      );
      ctx.stroke();
    }

    // 6. Highfield Character Silhouette (Hoodie & Red Sneakers)
    if (progress > 0.7) {
      const charProgress = Math.min(1, (progress - 0.7) / 0.3);
      ctx.save();
      ctx.globalAlpha = charProgress;

      const hx = width * 0.28;
      const hy = height * 0.68;

      // Olive Green Hoodie Body
      ctx.fillStyle = '#4d7c0f'; // Olive green
      ctx.beginPath();
      ctx.ellipse(hx, hy, 16, 22, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Hoodie Hood / Mask
      ctx.fillStyle = '#365314';
      ctx.beginPath();
      ctx.arc(hx, hy - 20, 11, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (Lunar Visor White glow)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 3, hy - 21, 2.5, 0, Math.PI * 2);
      ctx.arc(hx + 7, hy - 21, 2, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy + 16);
      ctx.lineTo(hx - 10, hy + 34);
      ctx.moveTo(hx + 6, hy + 16);
      ctx.lineTo(hx + 12, hy + 33);
      ctx.stroke();

      // Red Sneakers
      ctx.fillStyle = '#ef4444'; // Red shoes
      ctx.beginPath();
      ctx.roundRect(hx - 16, hy + 32, 12, 6, 3);
      ctx.roundRect(hx + 8, hy + 31, 12, 6, 3);
      ctx.fill();

      // White soles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 16, hy + 36, 12, 2);
      ctx.fillRect(hx + 8, hy + 35, 12, 2);

      ctx.restore();
    }

    // 7. Tech Watermark & Highfield Signature
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.fillText(`LUNAR OBSERVATORY // QUADRANT 7-B`, 18, 28);
    ctx.fillText(`${sketch.asciiSignature || 'HIGHFIELD // 2026'}`, width - 180, height - 16);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `highfield_boceto_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    soundManager.playInteractChime();
  };

  const handleSaveToJournal = () => {
    if (!currentSketch) return;
    memorySystem.addJournalEntry({
      title: `Boceto Cósmico: ${currentSketch.title}`,
      content: `${currentSketch.highfieldComment}\n\n[Firma: ${currentSketch.asciiSignature}]`,
      category: 'discovery',
      mood: 'wondrous',
    });
    setSavedToJournal(true);
    soundManager.playInteractChime();
  };

  const handleShare = () => {
    if (!currentSketch) return;
    onShareInChat(currentSketch.title, currentSketch.highfieldComment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-wide text-slate-100 flex items-center gap-2">
                  Taller de Bocetos Cósmicos
                  <span className="text-xs px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/20 font-mono">
                    Highfield Canvas
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ilustraciones y estudios visuales trazados en la superficie lunar
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Concept Selector Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
                <span>Temas de Observación Rápida</span>
                {isDrawing && (
                  <span className="text-sky-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Trazando: {drawProgress}%
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_CONCEPTS.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => {
                      setSelectedPreset(concept.id);
                      handleGenerate(concept.prompt, concept.id);
                    }}
                    disabled={isGenerating || isDrawing}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      selectedPreset === concept.id
                        ? 'bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                    } disabled:opacity-50`}
                  >
                    {concept.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pídele un boceto a Highfield (ej. 'Un rover explorando un túnel de lava')..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    setSelectedPreset('custom');
                    handleGenerate(customPrompt.trim(), 'custom');
                  }
                }}
                disabled={isGenerating || isDrawing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-sky-500 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                onClick={() => {
                  if (customPrompt.trim()) {
                    setSelectedPreset('custom');
                    handleGenerate(customPrompt.trim(), 'custom');
                  }
                }}
                disabled={!customPrompt.trim() || isGenerating || isDrawing}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Crear</span>
              </button>
            </div>

            {/* Canvas & Commentary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Canvas Frame */}
              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-inner aspect-[4/3] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />

                {isGenerating && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-xs font-mono text-slate-300">
                      Highfield ajustando coordenadas y paleta...
                    </p>
                  </div>
                )}
              </div>

              {/* Highfield's Artistic Reflection */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider">
                      Reflexión del Creador
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {currentSketch?.mood || 'wondrous'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">
                    {currentSketch?.title || 'Preparando lienzo...'}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{currentSketch?.highfieldComment || 'Observando el vacío para encontrar el ángulo correcto.'}"
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Firma:</span>
                    <span className="text-slate-300">{currentSketch?.asciiSignature || 'HF // OBSERVATORY'}</span>
                  </div>
                </div>

                {/* Interactive Action Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating || !currentSketch}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-all text-center gap-1 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-medium">Descargar</span>
                  </button>

                  <button
                    onClick={handleSaveToJournal}
                    disabled={isGenerating || !currentSketch || savedToJournal}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-all text-center gap-1 disabled:opacity-50"
                  >
                    {savedToJournal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <BookMarked className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-medium">
                      {savedToJournal ? 'Guardado' : 'A la Bitácora'}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    disabled={isGenerating || !currentSketch}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 transition-all text-center gap-1 disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-medium">Al Diálogo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
