/**
 * HIGHFIELD - Captain's Log & Memory Terminal Modal
 * Displays Highfield's chronological thought entries, unlocked lunar discoveries, and visitor profile.
 */

import React, { useState } from 'react';
import { BookOpen, Sparkles, Globe, Zap, X, Shield, Clock, Compass } from 'lucide-react';
import { memorySystem, JournalEntry, LunarDiscovery } from '../engine/MemorySystem';

interface CaptainsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaptainsLogModal: React.FC<CaptainsLogModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'discoveries' | 'profile'>('journal');

  if (!isOpen) return null;

  const journal = memorySystem.getJournal();
  const discoveries = memorySystem.getDiscoveries();
  const visitor = memorySystem.getVisitorProfile();

  const getDiscoveryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-purple-400" />;
      default: return <Compass className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090e1a]/95 border border-cyan-500/40 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* CRT Scanline overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-[#060a14]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold tracking-wider text-cyan-200">
                BITÁCORA DE HIGHFIELD // QUADRANT_01
              </h2>
              <p className="text-xs font-mono text-cyan-600">
                Registro de observaciones y recuerdos persistentes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-950/60 rounded-lg border border-transparent hover:border-cyan-500/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 pt-3 border-b border-cyan-900/40 bg-[#040810] gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all ${
              activeTab === 'journal'
                ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            NOTAS DE CAMPO ({journal.length})
          </button>
          <button
            onClick={() => setActiveTab('discoveries')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all ${
              activeTab === 'discoveries'
                ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            DESCUBRIMIENTOS ({discoveries.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            TELEMETRÍA VISITANTE
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#070c17]/60">
          {/* TAB 1: FIELD JOURNAL */}
          {activeTab === 'journal' && (
            <div className="space-y-3">
              {journal.map((entry: JournalEntry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-[#0a1224]/80 border border-cyan-900/40 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {entry.title}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.dateStr}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DISCOVERIES */}
          {activeTab === 'discoveries' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discoveries.map((disc: LunarDiscovery) => (
                <div
                  key={disc.id}
                  className="p-4 rounded-lg bg-[#0a1224]/80 border border-cyan-900/40 hover:border-cyan-500/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-cyan-950/60 rounded border border-cyan-500/20">
                        {getDiscoveryIcon(disc.iconName)}
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-200">
                        {disc.name}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                      {disc.description}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-600 mt-3 pt-2 border-t border-cyan-900/30">
                    REGISTRADO: {new Date(disc.discoveredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: VISITOR PROFILE & STATS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-[#0a1224]/80 border border-cyan-900/40">
                  <div className="text-[10px] font-mono text-cyan-500 mb-1">TOTAL DE VISITAS</div>
                  <div className="text-2xl font-mono font-bold text-cyan-200">{visitor.visitCount}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#0a1224]/80 border border-cyan-900/40">
                  <div className="text-[10px] font-mono text-cyan-500 mb-1">CANAL DE TRANSMISIÓN</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <Shield className="w-4 h-4" />
                    CUÁNTICO ACTIVO
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0a1224]/80 border border-cyan-900/40">
                <div className="text-xs font-mono font-bold text-cyan-300 mb-2">
                  RECUERDOS QUE HIGHFIELD HA APRENDIDO DE TI:
                </div>
                {visitor.learnedFacts.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">
                    Aún no se han registrado recuerdos específicos. Habla con Highfield para compartir ideas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {visitor.learnedFacts.map((fact, idx) => (
                      <li key={idx} className="text-xs font-mono text-slate-300 flex items-start gap-2">
                        <span className="text-cyan-400">▹</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-900/40 bg-[#060a14] flex justify-between items-center text-[10px] font-mono text-cyan-600">
          <span>HIGHFIELD OS v0.2 // MEMORY PERSISTENCE ENGAGED</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded text-xs transition-colors"
          >
            CERRAR TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
