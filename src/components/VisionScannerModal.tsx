import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  X,
  CheckCircle,
  HelpCircle,
  Smile,
  BookOpen,
  Globe,
  Share2,
  BookmarkPlus,
  Compass,
  Zap,
} from 'lucide-react';
import { GeminiBridge, VisionAnalysisResult, HighfieldMood } from '../ai/GeminiBridge';
import { memorySystem } from '../engine/MemorySystem';

interface VisionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiBridge: GeminiBridge;
  onOpenDialogueWithContext?: (initialMessage: string, imageAttachment?: string) => void;
}

type ScanMode = 'general' | 'homework' | 'emotion' | 'scenery';

export const VisionScannerModal: React.FC<VisionScannerModalProps> = ({
  isOpen,
  onClose,
  geminiBridge,
  onOpenDialogueWithContext,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [scanMode, setScanMode] = useState<ScanMode>('general');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<VisionAnalysisResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [savedToLog, setSavedToLog] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preset prompts per mode
  const presetPrompts: Record<ScanMode, string[]> = {
    general: [
      '¿Qué opinas de lo que ves desde tu perspectiva en la Luna?',
      'Describe minuciosamente los detalles y texturas de esta imagen.',
      '¿Qué misterio o curiosidad encuentras en esta toma?',
    ],
    homework: [
      'Ayúdame a comprender y resolver este ejercicio paso a paso.',
      'Explícame la fórmula o concepto clave que aparece aquí.',
      '¿Dónde podría estar el error en este desarrollo?',
    ],
    emotion: [
      '¿Cómo me veo hoy? Comenta mi estado de ánimo a través del visor.',
      '¿Qué energía o emoción transmite mi rostro en esta foto?',
      'Una observación cósmica y casual sobre mi expresión.',
    ],
    scenery: [
      '¿Qué detalles de la Tierra o la naturaleza destacan en esta foto?',
      'Compara este paisaje terrestre con el vacío y silencio lunar.',
      '¿Cómo se percibirían estas luces o colores desde tu órbita?',
    ],
  };

  // Start / Stop Camera Stream
  const startCamera = async (facing: 'user' | 'environment' = 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Error accessing optical sensor (camera):', err);
      setCameraError('No se pudo inicializar el sensor óptico / cámara. Verifica los permisos del navegador.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Switch camera when modal opens in camera mode
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !imagePreview) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, imagePreview]);

  // Capture frame from video stream
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing camera for natural selfie view
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImagePreview(dataUrl);
    stopCamera();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger optical scan via Gemini Vision API
  const handlePerformScan = async () => {
    if (!imagePreview) return;
    setIsScanning(true);
    setScanResult(null);
    setSavedToLog(false);

    const effectivePrompt = userPrompt.trim() || presetPrompts[scanMode][0];

    try {
      const result = await geminiBridge.analyzeVisualInput(
        imagePreview,
        effectivePrompt,
        scanMode
      );
      setScanResult(result);
    } catch (e) {
      console.error('Optical scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!scanResult) return;
    const title = scanMode === 'emotion'
      ? `Telemetría Óptica // Rostro y Estado de Ánimo`
      : scanMode === 'homework'
      ? `Análisis Académico // Consulta de Tarea`
      : scanMode === 'scenery'
      ? `Observación Terrestre // Registro Visual`
      : `Escáner Óptico // Análisis Visual`;

    memorySystem.addSessionSummary(title, scanResult.analysis, scanResult.mood);
    setSavedToLog(true);
  };

  const handleTransferToChat = () => {
    if (!scanResult || !imagePreview) return;
    if (onOpenDialogueWithContext) {
      const contextSummary = userPrompt
        ? `[Sobre la imagen analizada]: "${userPrompt}"`
        : `[Imagen escaneada con el sensor lunar]: ${scanResult.analysis.slice(0, 80)}...`;
      onOpenDialogueWithContext(contextSummary, imagePreview);
      onClose();
    }
  };

  const resetCapture = () => {
    setImagePreview(null);
    setScanResult(null);
    setSavedToLog(false);
    if (activeTab === 'camera') {
      startCamera(facingMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="vision-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="vision-scanner-window"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-950/40 text-slate-100 overflow-hidden font-mono"
      >
        {/* Top Header Bar */}
        <div
          id="vision-scanner-header"
          className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-emerald-500/20"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-wider text-emerald-400 uppercase">
                  SENSOR ÓPTICO // OJO LUNAR DE HIGHFIELD
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  GEMINI 3.7 FLASH MULTIMODAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transmisión directa de imágenes, tareas académicas y telemetría de ánimo a la Luna
              </p>
            </div>
          </div>

          <button
            id="close-vision-scanner-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar Escáner Óptico"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          id="vision-scanner-mode-selector"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-xs"
        >
          <button
            id="mode-general-btn"
            onClick={() => setScanMode('general')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
              scanMode === 'general'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Observación General</span>
          </button>

          <button
            id="mode-homework-btn"
            onClick={() => setScanMode('homework')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
              scanMode === 'homework'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tutor de Tarea / Fórmulas</span>
          </button>

          <button
            id="mode-emotion-btn"
            onClick={() => setScanMode('emotion')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
              scanMode === 'emotion'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>¿Cómo me veo hoy?</span>
          </button>

          <button
            id="mode-scenery-btn"
            onClick={() => setScanMode('scenery')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
              scanMode === 'scenery'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Paisaje / La Canica Azul</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* If No Image Captured/Selected */}
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Method Switch: Camera vs Upload */}
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                  <button
                    id="tab-camera-btn"
                    onClick={() => setActiveTab('camera')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === 'camera'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cámara en Vivo</span>
                  </button>
                  <button
                    id="tab-upload-btn"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === 'upload'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto / Captura</span>
                  </button>
                </div>

                {activeTab === 'camera' && cameraActive && (
                  <button
                    id="switch-camera-facing-btn"
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Girar Cámara</span>
                  </button>
                )}
              </div>

              {/* Camera Viewport */}
              {activeTab === 'camera' && (
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Optical HUD Overlay */}
                  <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start text-[10px] text-emerald-400/80">
                      <div>REC // OPTICAL_SENSOR_01</div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>LIVE LINK 1/6G</span>
                      </div>
                    </div>

                    {/* Reticle Target */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-36 h-36 border border-dashed border-emerald-500/40 rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                        <div className="w-1.5 h-1.5 bg-emerald-400/80 rounded-full" />
                      </div>
                    </div>

                    <div className="flex justify-between items-end text-[10px] text-slate-400">
                      <div>TARGET ALBEDO: 0.12</div>
                      <div>AZIMUTH: 142.4°</div>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center space-y-3">
                      <HelpCircle className="w-8 h-8 text-amber-400" />
                      <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                      >
                        Reintentar Acceso
                      </button>
                    </div>
                  )}

                  {/* Shutter Capture Button */}
                  {!cameraError && cameraActive && (
                    <button
                      id="shutter-capture-btn"
                      onClick={captureFrame}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-full shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>CAPTURAR TRANSMISIÓN</span>
                    </button>
                  )}
                </div>
              )}

              {/* Upload Dropzone */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80 rounded-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Arrastra una imagen aquí o haz clic para seleccionarla
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Soporta fotos, capturas de ejercicios, fórmulas, selfies o paisajes (PNG, JPG, WEBP)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Image Preview & Scan Execution Interface */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Image with Reticle Overlay */}
              <div className="space-y-2">
                <div className="relative aspect-square sm:aspect-video md:aspect-square bg-black rounded-lg overflow-hidden border border-emerald-500/30">
                  <img
                    src={imagePreview}
                    alt="Transmisión capturada"
                    className="w-full h-full object-contain"
                  />

                  {/* Scanning Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-3">
                      <div className="w-full h-1 bg-emerald-400 absolute top-0 animate-pulse shadow-lg shadow-emerald-400" />
                      <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-emerald-300 tracking-wider animate-pulse">
                        ANALIZANDO TRANSMISIÓN MULTIMODAL...
                      </span>
                    </div>
                  )}

                  <button
                    id="retake-image-btn"
                    onClick={resetCapture}
                    disabled={isScanning}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-slate-300 text-xs rounded border border-slate-700 flex items-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cambiar Imagen</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Prompt & Analysis Results */}
              <div className="flex flex-col space-y-3">
                {/* Prompt Customization */}
                {!scanResult && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Pregunta o instrucción para Highfield:
                      </label>
                      <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder={presetPrompts[scanMode][0]}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />

                      {/* Quick Chips */}
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Sugerencias rápidas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {presetPrompts[scanMode].map((promptText, i) => (
                            <button
                              key={i}
                              onClick={() => setUserPrompt(promptText)}
                              className="text-[11px] text-left px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-600 transition-colors line-clamp-1"
                            >
                              {promptText}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      id="execute-scan-btn"
                      onClick={handlePerformScan}
                      disabled={isScanning}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isScanning ? 'PROCESANDO EN LA LUNA...' : 'INICIAR ANÁLISIS ÓPTICO'}</span>
                    </button>
                  </div>
                )}

                {/* Scan Results View */}
                {scanResult && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-3 space-y-2.5 overflow-y-auto max-h-[38vh]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-emerald-400 uppercase">
                            HIGHFIELD COGNITIVE SCAN
                          </span>
                          {scanResult.detectedEmotion && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                              Ánimo: {scanResult.detectedEmotion}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase">
                          Mood: {scanResult.mood}
                        </span>
                      </div>

                      {/* Analysis Text */}
                      <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {scanResult.analysis}
                      </div>

                      {/* Tags */}
                      {scanResult.tags && scanResult.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/80">
                          {scanResult.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-400 rounded border border-slate-800"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        id="transfer-to-chat-btn"
                        onClick={handleTransferToChat}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Conversar en Chat</span>
                      </button>

                      <button
                        id="save-to-journal-btn"
                        onClick={handleSaveToJournal}
                        disabled={savedToLog}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border ${
                          savedToLog
                            ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {savedToLog ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Guardado en Bitácora</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Guardar en Bitácora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Procesado con Gemini 3.7 Flash Vision API</span>
          </span>
          <span className="hidden sm:inline">Presiona ESC para salir del sensor óptico</span>
        </div>
      </div>
    </div>
  );
};
