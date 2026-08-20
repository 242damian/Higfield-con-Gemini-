/**
 * HIGHFIELD - Captain's Log & Dynamic Memory Terminal Modal
 * Displays Highfield's chronological thought entries, unlocked lunar discoveries,
 * session summaries, and an editable dynamic visitor profile.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Globe,
  Zap,
  X,
  Shield,
  Clock,
  Compass,
  User,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  MessageSquare,
  FileText
} from 'lucide-react';
import { memorySystem, JournalEntry, LunarDiscovery, VisitorProfile } from '../engine/MemorySystem';
import { geminiBridge } from '../ai/GeminiBridge';

interface CaptainsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaptainsLogModal: React.FC<CaptainsLogModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'discoveries' | 'profile'>('journal');
  const [journalFilter, setJournalFilter] = useState<'all' | 'session_summary' | 'discovery' | 'dialogue'>('all');
  
  // State for re-rendering on updates
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [discoveries, setDiscoveries] = useState<LunarDiscovery[]>([]);
  const [visitor, setVisitor] = useState<VisitorProfile>(memorySystem.getVisitorProfile());

  // Editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContext, setEditContext] = useState('');
  const [newLikeInput, setNewLikeInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);

  const refreshData = () => {
    setJournal([...memorySystem.getJournal()]);
    setDiscoveries([...memorySystem.getDiscoveries()]);
    const prof = memorySystem.getVisitorProfile();
    setVisitor({ ...prof });
    setEditName(prof.userName);
    setEditContext(prof.userContext);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    memorySystem.setUserName(editName);
    memorySystem.setUserContext(editContext);
    setIsEditingProfile(false);
    refreshData();
  };

  const handleAddLike = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLikeInput.trim()) {
      memorySystem.addUserLike(newLikeInput.trim());
      setNewLikeInput('');
      refreshData();
    }
  };

  const handleRemoveLike = (like: string) => {
    memorySystem.removeUserLike(like);
    refreshData();
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterestInput.trim()) {
      memorySystem.addUserInterest(newInterestInput.trim());
      setNewInterestInput('');
      refreshData();
    }
  };

  const handleRemoveInterest = (interest: string) => {
    memorySystem.removeUserInterest(interest);
    refreshData();
  };

  const handleRemoveFact = (idx: number) => {
    memorySystem.removeLearnedFact(idx);
    refreshData();
  };

  const handleManualSummarize = async () => {
    setIsSummarizing(true);
    setSummaryMessage(null);
    try {
      const generated = await geminiBridge.summarizeCurrentSession();
      if (generated) {
        setSummaryMessage('¡Nueva entrada de resumen sintetizada y guardada en la bitácora!');
      } else {
        setSummaryMessage('No hay mensajes nuevos pendientes de resumir en esta sesión.');
      }
      refreshData();
    } catch {
      setSummaryMessage('Error al sintetizar el resumen.');
    } finally {
      setIsSummarizing(false);
      setTimeout(() => setSummaryMessage(null), 4000);
    }
  };

  const filteredJournal = journal.filter((entry) => {
    if (journalFilter === 'all') return true;
    return entry.category === journalFilter;
  });

  const getDiscoveryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-purple-400" />;
      default: return <Compass className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getCategoryBadge = (category: JournalEntry['category']) => {
    switch (category) {
      case 'session_summary':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 flex items-center gap-1">
            <FileText className="w-3 h-3 text-purple-400" /> RESUMEN DE SESIÓN
          </span>
        );
      case 'discovery':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> DESCUBRIMIENTO
          </span>
        );
      case 'dialogue':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-cyan-400" /> DIÁLOGO
          </span>
        );
      case 'relic':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
            RELIQUIA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-900 border border-slate-700 text-slate-400">
            OBSERVACIÓN
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-2xl bg-[#070b14]/95 border border-cyan-500/40 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* CRT Scanline overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-[#050811]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-mono font-bold tracking-wider text-cyan-200">
                BITÁCORA Y PERFIL // SISTEMA LUNAR HIGHFIELD
              </h2>
              <p className="text-xs font-mono text-cyan-600">
                Memoria episódica persistente, perfiles dinámicos y telemetría
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-950/60 rounded-lg border border-transparent hover:border-cyan-500/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 pt-3 border-b border-cyan-900/40 bg-[#03060c] gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-cyan-950/90 text-cyan-200 border-t-2 border-cyan-400 shadow-inner'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            NOTAS Y RESÚMENES ({journal.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-cyan-950/90 text-cyan-200 border-t-2 border-cyan-400 shadow-inner'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            PERFIL DINÁMICO
          </button>
          <button
            onClick={() => setActiveTab('discoveries')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'discoveries'
                ? 'bg-cyan-950/90 text-cyan-200 border-t-2 border-cyan-400 shadow-inner'
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
          >
            DESCUBRIMIENTOS ({discoveries.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#060a14]/70">
          {/* TAB 1: FIELD JOURNAL */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#081020]/90 border border-cyan-900/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-cyan-500 font-bold uppercase mr-1">Filtrar:</span>
                  <button
                    onClick={() => setJournalFilter('all')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      journalFilter === 'all'
                        ? 'bg-cyan-500 text-black'
                        : 'bg-black/40 text-cyan-400 hover:bg-cyan-950/60'
                    }`}
                  >
                    Todo ({journal.length})
                  </button>
                  <button
                    onClick={() => setJournalFilter('session_summary')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      journalFilter === 'session_summary'
                        ? 'bg-purple-500 text-black'
                        : 'bg-black/40 text-purple-400 hover:bg-purple-950/60'
                    }`}
                  >
                    📡 Resúmenes ({journal.filter((j) => j.category === 'session_summary').length})
                  </button>
                  <button
                    onClick={() => setJournalFilter('dialogue')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      journalFilter === 'dialogue'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-black/40 text-cyan-400 hover:bg-cyan-950/60'
                    }`}
                  >
                    💬 Diálogos
                  </button>
                </div>

                <button
                  onClick={handleManualSummarize}
                  disabled={isSummarizing}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border border-purple-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)] cursor-pointer disabled:opacity-50"
                  title="Sintetizar la sesión actual en una entrada resumida"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Sintetizando...' : 'Resumir Sesión Actual'}</span>
                </button>
              </div>

              {summaryMessage && (
                <div className="p-3 bg-purple-950/70 border border-purple-500/50 rounded-lg text-xs text-purple-200 animate-fadeIn flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{summaryMessage}</span>
                </div>
              )}

              {filteredJournal.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No hay entradas con el filtro seleccionado.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJournal.map((entry: JournalEntry) => {
                    const isSummary = entry.category === 'session_summary';
                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isSummary
                            ? 'bg-[#100a20]/90 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-[#081020]/80 border-cyan-900/40 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(entry.category)}
                            <span className={`text-xs font-mono font-bold ${isSummary ? 'text-purple-200' : 'text-cyan-300'}`}>
                              {entry.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.dateStr}
                          </span>
                        </div>
                        <p className={`text-xs font-mono leading-relaxed ${isSummary ? 'text-purple-100' : 'text-slate-300'}`}>
                          {entry.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISITOR PROFILE & PERSISTENT CONTINUITY */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Quick Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-[#081020]/90 border border-cyan-900/50">
                  <div className="text-[10px] font-mono text-cyan-500 mb-1 font-bold">TOTAL DE VISITAS</div>
                  <div className="text-2xl font-mono font-bold text-cyan-200">{visitor.visitCount}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#081020]/90 border border-cyan-900/50">
                  <div className="text-[10px] font-mono text-cyan-500 mb-1 font-bold">NIVEL DE VÍNCULO</div>
                  <div className="text-base font-mono font-bold text-amber-300 flex items-center gap-1 mt-1">
                    {'★'.repeat(visitor.bondLevel)}{'☆'.repeat(5 - visitor.bondLevel)}
                    <span className="text-xs text-white/50 ml-1">({visitor.bondLevel}/5)</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#081020]/90 border border-cyan-900/50">
                  <div className="text-[10px] font-mono text-cyan-500 mb-1 font-bold">CANAL CONTINUO</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-2">
                    <Shield className="w-4 h-4" />
                    MEMORIA PERSISTENTE
                  </div>
                </div>
              </div>

              {/* Editable Profile Information */}
              <div className="p-4 rounded-lg bg-[#081020]/90 border border-cyan-900/50 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-200">IDENTIDAD Y CONTEXTO DEL VISITANTE</span>
                  </div>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Perfil</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-100 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Guardar Cambios</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-cyan-500 block mb-1">
                        Nombre o Alias del Visitante:
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ej. Alex, Explorador Terrestre..."
                        className="w-full bg-[#040810] border border-cyan-500/40 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-cyan-500 block mb-1">
                        Contexto, Estudios o Profesión:
                      </label>
                      <input
                        type="text"
                        value={editContext}
                        onChange={(e) => setEditContext(e.target.value)}
                        placeholder="Ej. Estudiante de física, desarrollador, entusiasta de la astronomía..."
                        className="w-full bg-[#040810] border border-cyan-500/40 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-cyan-500 uppercase font-bold block">Nombre / Alias:</span>
                      <span className="text-cyan-100 font-bold">
                        {visitor.userName || <span className="text-slate-500 italic">No especificado (Highfield te llamará 'viajero')</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-cyan-500 uppercase font-bold block">Contexto / Ocupación:</span>
                      <span className="text-cyan-100">
                        {visitor.userContext || <span className="text-slate-500 italic">No especificado aún</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Likes and Preferences */}
              <div className="p-4 rounded-lg bg-[#081020]/90 border border-cyan-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold text-pink-300">GUSTOS Y PREFERENCIAS</span>
                  <span className="text-[10px] text-slate-500">(Mencionados en el chat o añadidos manualmente)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {visitor.userLikes.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No hay gustos registrados aún.</span>
                  )}
                  {visitor.userLikes.map((like) => (
                    <span
                      key={like}
                      className="px-2.5 py-1 rounded-full text-xs bg-pink-950/50 border border-pink-500/40 text-pink-200 flex items-center gap-1.5"
                    >
                      <span>{like}</span>
                      <button
                        onClick={() => handleRemoveLike(like)}
                        className="text-pink-400 hover:text-white cursor-pointer"
                        title="Eliminar gusto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddLike} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newLikeInput}
                    onChange={(e) => setNewLikeInput(e.target.value)}
                    placeholder="Añadir gusto (ej. café negro, música lo-fi, sci-fi)..."
                    className="flex-1 bg-[#040810] border border-pink-500/30 rounded px-2.5 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-400"
                  />
                  <button
                    type="submit"
                    className="bg-pink-950/80 hover:bg-pink-900 text-pink-200 border border-pink-500/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir</span>
                  </button>
                </form>
              </div>

              {/* Cosmic Interests */}
              <div className="p-4 rounded-lg bg-[#081020]/90 border border-cyan-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">INTERESES CÓSMICOS Y CIENTÍFICOS</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {visitor.userInterests.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No hay intereses registrados aún.</span>
                  )}
                  {visitor.userInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-full text-xs bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 flex items-center gap-1.5"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="text-cyan-400 hover:text-white cursor-pointer"
                        title="Eliminar interés"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddInterest} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    placeholder="Añadir interés (ej. agujeros negros, relatividad, exoplanetas)..."
                    className="flex-1 bg-[#040810] border border-cyan-500/30 rounded px-2.5 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir</span>
                  </button>
                </form>
              </div>

              {/* Episodic Memories List */}
              <div className="p-4 rounded-lg bg-[#081020]/90 border border-cyan-900/50 space-y-2">
                <div className="text-xs font-bold text-cyan-300 mb-2">
                  RECUERDOS EPISÓDICOS APRENDIDOS POR HIGHFIELD EN DIÁLOGO:
                </div>
                {visitor.learnedFacts.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">
                    Aún no se han registrado recuerdos específicos. Habla con Highfield para compartir ideas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {visitor.learnedFacts.map((fact, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-mono text-slate-300 flex items-center justify-between gap-2 p-2 bg-black/30 rounded border border-cyan-900/30"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-cyan-400">▹</span>
                          <span>{fact}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFact(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Olvidar este recuerdo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVERIES */}
          {activeTab === 'discoveries' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discoveries.map((disc: LunarDiscovery) => (
                <div
                  key={disc.id}
                  className="p-4 rounded-lg bg-[#081020]/80 border border-cyan-900/40 hover:border-cyan-500/40 flex flex-col justify-between"
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-900/40 bg-[#050811] flex justify-between items-center text-[10px] font-mono text-cyan-600">
          <span>HIGHFIELD OS v0.3 // PERSISTENT COGNITIVE CONTINUITY ENGAGED</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded text-xs transition-colors cursor-pointer"
          >
            CERRAR TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
