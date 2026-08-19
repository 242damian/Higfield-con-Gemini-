/**
 * HIGHFIELD - Lunar Snapshot Tool Modal
 * Generates an instant high-resolution retro telemetry polaroid of Highfield on the Moon.
 */

import React from 'react';
import { Camera, Download, X, Check } from 'lucide-react';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, onClose, canvasRef }) => {
  const [snapshotUrl, setSnapshotUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && canvasRef.current) {
      const srcCanvas = canvasRef.current;
      // Create high-res polaroid canvas
      const polaroid = document.createElement('canvas');
      polaroid.width = 840;
      polaroid.height = 680;
      const ctx = polaroid.getContext('2d');

      if (ctx) {
        // Dark frame background
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, polaroid.width, polaroid.height);

        // Border stroke
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, polaroid.width - 20, polaroid.height - 20);

        // Draw game frame
        ctx.drawImage(srcCanvas, 20, 20, 800, 533);

        // Scanline lines over image
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let y = 20; y < 553; y += 4) {
          ctx.fillRect(20, y, 800, 2);
        }

        // Telemetry Stamp text
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('HIGHFIELD // LUNAR HORIZON TELEMETRY', 30, 595);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#94a3b8';
        const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        ctx.fillText(`TIMESTAMP: ${dateStr}  |  GRAVITY: 0.166g  |  QUADRANT: MARE TRANQUILLITATIS`, 30, 625);
        ctx.fillText(`STATUS: AUTONOMOUS PATROL  |  ORBIT: LUNAR SURFACE OVERLOOK`, 30, 648);

        setSnapshotUrl(polaroid.toDataURL('image/png'));
      }
    }
  }, [isOpen, canvasRef]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `highfield_lunar_snapshot_${Date.now()}.png`;
    a.click();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0a0f1d] border border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-[#060a14]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-cyan-200">
              CAPTURA DE TELEMETRÍA // FOTO LUNAR
            </h2>
          </div>
          <button onClick={onClose} className="text-cyan-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Preview */}
        <div className="p-6 flex flex-col items-center bg-[#070c17]/80">
          {snapshotUrl && (
            <img
              src={snapshotUrl}
              alt="Highfield Lunar Snapshot"
              className="w-full rounded border border-cyan-500/30 shadow-lg"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-900/40 bg-[#060a14] flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-cyan-500 hover:text-cyan-300 transition-colors"
          >
            CANCELAR
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {copied ? '¡DESCARGADO!' : 'DESCARGAR FOTO'}
          </button>
        </div>
      </div>
    </div>
  );
};
