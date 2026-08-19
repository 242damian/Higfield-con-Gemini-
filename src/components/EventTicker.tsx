/**
 * HIGHFIELD - Real-Time Automated Event Ticker (Immersive UI Theme)
 * Displays automated world phenomena telemetry logs, solar flare / asteroid alerts,
 * and background astronomical pulses even when the user is inactive.
 */

import React, { useState, useEffect } from 'react';
import { Radio, AlertTriangle, Sparkles, ChevronUp, ChevronDown, Activity, Play } from 'lucide-react';
import { EventTickerLog } from '../types';
import { eventTickerEngine } from '../engine/EventTickerEngine';

export const EventTicker: React.FC = () => {
  const [logs, setLogs] = useState<EventTickerLog[]>([]);
  const [latestLog, setLatestLog] = useState<EventTickerLog | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [pulseActive, setPulseActive] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = eventTickerEngine.subscribe((updatedLogs, latest) => {
      setLogs(updatedLogs);
      if (latest) {
        setLatestLog(latest);
        setPulseActive(true);
        const timer = setTimeout(() => setPulseActive(false), 2200);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSeverityBadge = (severity: 'info' | 'notice' | 'alert') => {
    switch (severity) {
      case 'alert':
        return 'text-red-400 bg-red-950/60 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'notice':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 'info':
      default:
        return 'text-cyan-400 bg-cyan-950/50 border-cyan-500/40 shadow-[0_0_6px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <div
      id="cosmic-event-ticker-container"
      className="fixed bottom-10 left-3 sm:left-6 z-30 font-mono select-none max-w-sm sm:max-w-md w-full pointer-events-auto transition-all duration-300"
    >
      {/* Main Ticker Ribbon */}
      <div
        className={`bg-[#05050a]/92 backdrop-blur-md border ${
          pulseActive ? 'border-[#ff4e00] shadow-[0_0_20px_rgba(255,78,0,0.3)]' : 'border-cyan-900/60 shadow-[0_0_15px_rgba(0,0,0,0.8)]'
        } rounded p-2 sm:p-2.5 transition-all`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center">
              <Radio
                className={`w-3.5 h-3.5 ${
                  pulseActive ? 'text-[#ff4e00] animate-spin' : 'text-cyan-400 animate-pulse'
                }`}
              />
              {pulseActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-white/50 font-bold">
                <span>EVENT_TICKER</span>
                <span className="text-white/30">•</span>
                <span className="text-[#ff4e00]">{latestLog?.timestamp || '00:00:00'}</span>
                {latestLog && (
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded border font-mono tracking-widest ${getSeverityBadge(
                      latestLog.severity
                    )}`}
                  >
                    {latestLog.category}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-white/90 truncate font-medium mt-0.5">
                {latestLog?.message || 'Escaneando cuadrante lunar en busca de fenómenos cósmicos...'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Trigger Phenomenon */}
            <button
              id="trigger-random-phenomenon-btn"
              onClick={() => eventTickerEngine.triggerPhenomenon()}
              title="Disparar fenómeno cósmico manual"
              className="p-1 hover:bg-white/10 rounded text-cyan-400 hover:text-[#ff4e00] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
            </button>

            {/* Expand / Collapse Log History */}
            <button
              id="toggle-ticker-history-btn"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Ocultar historial' : 'Ver registro completo'}
              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded History Drawer */}
        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <div className="text-[8px] uppercase tracking-widest text-white/40 flex items-center gap-1 font-bold mb-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Historial de Fenómenos y Telemetría</span>
            </div>

            {logs.map(log => (
              <div
                key={log.id}
                className="text-[10px] p-1.5 rounded bg-black/40 border border-white/5 flex items-start gap-1.5 leading-snug"
              >
                <span className="text-white/40 text-[9px] shrink-0 font-mono mt-0.5">{log.timestamp}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[9px]">
                    <span className="font-bold text-white/80 uppercase">{log.title}</span>
                  </div>
                  <div className="text-white/65 text-[10px] truncate">{log.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
