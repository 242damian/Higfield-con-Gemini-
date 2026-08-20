/**
 * HIGHFIELD - Reminders & Weather Telemetry Modal (Phase 2 Function Calling Integration)
 * Allows the user to view, schedule, and dismiss real-time alarms & reminders,
 * plus search live terrestrial weather and view lunar surface environmental telemetry.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Clock,
  CloudSun,
  Trash2,
  CheckCircle2,
  Plus,
  Compass,
  Wind,
  Droplets,
  Gauge,
  Sparkles,
  Search,
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  X,
  Radio,
} from 'lucide-react';
import { reminderSystem, LunarReminder } from '../engine/ReminderSystem';
import { WeatherToolData } from '../ai/GeminiBridge';
import { soundManager } from '../engine/AudioEngine';

interface RemindersAndWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'reminders' | 'weather';
}

export const RemindersAndWeatherModal: React.FC<RemindersAndWeatherModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'reminders',
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'weather'>(defaultTab);
  const [reminders, setReminders] = useState<LunarReminder[]>(reminderSystem.getReminders());
  const [now, setNow] = useState<number>(Date.now());

  // Reminder Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newMinutes, setNewMinutes] = useState<number>(15);
  const [newCategory, setNewCategory] = useState<LunarReminder['category']>('task');
  const [newPriority, setNewPriority] = useState<LunarReminder['priority']>('medium');

  // Weather State
  const [searchLocation, setSearchLocation] = useState<string>('Madrid');
  const [weatherData, setWeatherData] = useState<WeatherToolData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Sync state & update timer every second for live countdowns
  useEffect(() => {
    const unsub = reminderSystem.subscribe(() => {
      setReminders(reminderSystem.getReminders());
    });

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Fetch initial weather when opening
  useEffect(() => {
    if (isOpen && !weatherData) {
      fetchWeather('Madrid');
    }
  }, [isOpen]);

  const fetchWeather = async (locName: string) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(`/api/highfield/weather?location=${encodeURIComponent(locName)}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      } else {
        setWeatherError('No se pudo obtener el reporte meteorológico.');
      }
    } catch {
      setWeatherError('Error de enlace con los satélites meteorológicos.');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundManager.playInteractChime();
    reminderSystem.addReminder(
      newTitle.trim(),
      newMinutes,
      undefined,
      newCategory,
      newPriority,
      `en ${newMinutes} min`
    );

    setNewTitle('');
    setNewMinutes(15);
  };

  const handleToggleComplete = (id: string) => {
    soundManager.playDialogueBlip(1);
    reminderSystem.toggleComplete(id);
  };

  const handleDeleteReminder = (id: string) => {
    soundManager.playDialogueBlip(0);
    reminderSystem.deleteReminder(id);
  };

  const formatCountdown = (targetTimestamp: number) => {
    const diff = targetTimestamp - now;
    if (diff <= 0) return '¡VENCIDO / ALERTA!';

    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getWeatherIcon = (code?: string) => {
    switch (code) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-cyan-300" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case 'storm':
        return <CloudLightning className="w-8 h-8 text-amber-500" />;
      case 'snow':
        return <Snowflake className="w-8 h-8 text-cyan-100" />;
      case 'moon_vacuum':
        return <Compass className="w-8 h-8 text-[#ff4e00]" />;
      default:
        return <CloudSun className="w-8 h-8 text-amber-300" />;
    }
  };

  const quickCities = [
    'Madrid',
    'Tokio',
    'Bogotá',
    'Buenos Aires',
    'Ciudad de México',
    'Nueva York',
    'Londres',
    'Luna',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="reminders-weather-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-2xl bg-[#06060c] border border-[#1a1a2e] rounded-xs shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] text-[#e0e0e0]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#090914] border-b border-[#141424]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff4e00] animate-pulse" />
                <span className="text-xs uppercase tracking-[0.25em] font-black text-white">
                  MÓDULO DE TELEMETRÍA Y CRONÓMETROS
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-[#ff4e00] p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#141424] bg-[#05050a]">
              <button
                onClick={() => {
                  soundManager.playDialogueBlip(1);
                  setActiveTab('reminders');
                }}
                className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'border-[#ff4e00] text-[#ff4e00] bg-[#ff4e00]/5'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Recordatorios y Alarmas ({reminders.length})</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playDialogueBlip(1);
                  setActiveTab('weather');
                }}
                className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'weather'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5" />
                <span>Clima Terrestre & Lunar</span>
              </button>
            </div>

            {/* Tab 1: Reminders Content */}
            {activeTab === 'reminders' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
                {/* Form to add quick reminder */}
                <form
                  onSubmit={handleCreateReminder}
                  className="bg-[#090914] border border-[#1a1a2e] rounded-xs p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#ff4e00] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Programar Nuevo Aviso Cósmico
                    </span>
                    <span className="text-[10px] text-white/40">También puedes pedirle a Highfield por voz o chat</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej. Revisar telescopio orbital..."
                      className="sm:col-span-2 bg-[#05050a] border border-[#1a1a2e] rounded px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff4e00]"
                    />

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={newMinutes}
                        onChange={(e) => setNewMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-[#05050a] border border-[#1a1a2e] rounded px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#ff4e00]"
                      />
                      <span className="text-xs text-white/50">min</span>

                      <button
                        type="submit"
                        disabled={!newTitle.trim()}
                        className="flex-1 bg-[#ff4e00] hover:bg-[#ff5e1a] disabled:opacity-40 text-white font-bold text-xs py-1.5 px-3 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Agendar</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-white/40">Tipo:</span>
                      {(['task', 'observation', 'cosmic', 'personal'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewCategory(cat)}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            newCategory === cat
                              ? 'bg-[#ff4e00]/20 text-[#ff4e00] border border-[#ff4e00]/40'
                              : 'bg-white/5 text-white/50 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-white/40">Prioridad:</span>
                      {(['low', 'medium', 'high'] as const).map((prio) => (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setNewPriority(prio)}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            newPriority === prio
                              ? prio === 'high'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-white/5 text-white/50 hover:text-white'
                          }`}
                        >
                          {prio}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Reminders List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Cronómetros Activos</span>
                    <span>{reminders.filter((r) => !r.completed).length} pendientes</span>
                  </div>

                  {reminders.length === 0 ? (
                    <div className="text-center py-10 bg-[#05050a] border border-[#141424] rounded-xs p-6 space-y-2">
                      <Bell className="w-8 h-8 text-white/20 mx-auto" />
                      <p className="text-xs text-white/60">No hay recordatorios agendados actualmente.</p>
                      <p className="text-[11px] text-white/40">
                        Pídele a Highfield: <span className="text-[#ff4e00]">&ldquo;Highfield, recuérdame calibrar los sensores en 10 minutos&rdquo;</span>
                      </p>
                    </div>
                  ) : (
                    reminders.map((rem) => {
                      const isOverdue = rem.targetTimestamp <= now;
                      return (
                        <div
                          key={rem.id}
                          className={`p-3 rounded-xs border flex items-center justify-between gap-3 transition-all ${
                            rem.completed
                              ? 'bg-[#05050a] border-[#141424] opacity-50'
                              : isOverdue
                              ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                              : 'bg-[#090916] border-[#1a1a2e] hover:border-[#ff4e00]/40'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleComplete(rem.id)}
                            className="text-white/40 hover:text-green-400 transition-colors cursor-pointer"
                            title={rem.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${rem.completed ? 'text-green-400' : ''}`}
                            />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold truncate ${
                                  rem.completed ? 'line-through text-white/40' : 'text-white'
                                }`}
                              >
                                {rem.title}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                                  rem.priority === 'high'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-white/5 border-white/10 text-white/50'
                                }`}
                              >
                                {rem.category}
                              </span>
                            </div>

                            <div className="text-[10px] text-white/50 flex items-center gap-2 mt-0.5">
                              <span>Hora: {rem.targetTimeFormatted}</span>
                              <span>•</span>
                              <span
                                className={`font-mono font-bold ${
                                  isOverdue && !rem.completed
                                    ? 'text-red-400 animate-pulse'
                                    : 'text-cyan-400'
                                }`}
                              >
                                {rem.completed ? 'Completado' : formatCountdown(rem.targetTimestamp)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="text-white/30 hover:text-red-400 p-1 transition-colors cursor-pointer"
                            title="Eliminar recordatorio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Weather & Telemetry Content */}
            {activeTab === 'weather' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
                {/* Search Bar */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchLocation.trim()) {
                            fetchWeather(searchLocation.trim());
                          }
                        }}
                        placeholder="Buscar ciudad terrestre o 'Luna'..."
                        className="w-full bg-[#05050a] border border-[#1a1a2e] rounded pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <button
                      onClick={() => fetchWeather(searchLocation.trim() || 'Madrid')}
                      disabled={isWeatherLoading}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isWeatherLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Radio className="w-3.5 h-3.5" />
                      )}
                      <span>Escanear</span>
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSearchLocation(city);
                          fetchWeather(city);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                          searchLocation.toLowerCase() === city.toLowerCase()
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {city === 'Luna' ? '🌕 Luna' : city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather Display Card */}
                {weatherData && (
                  <div className="bg-[#090916] border border-[#1a1a2e] rounded-xs p-4 space-y-4 shadow-inner">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-cyan-400 uppercase font-black tracking-widest">
                          {weatherData.isLunar ? 'CUADRANTE LUNAR' : 'REPORTE METEOROLÓGICO TERRESTRE'}
                        </div>
                        <h3 className="text-lg font-black text-white">{weatherData.location}</h3>
                        <p className="text-xs text-white/70 mt-0.5">{weatherData.condition}</p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        {getWeatherIcon(weatherData.conditionCode)}
                        <div>
                          <div className="text-2xl font-black text-white">
                            {weatherData.temperatureC}°C
                          </div>
                          <div className="text-[10px] text-white/50">
                            {weatherData.temperatureF}°F
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sensor Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#141424]">
                      <div className="bg-[#05050a] p-2 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase flex items-center gap-1">
                          <Droplets className="w-2.5 h-2.5 text-cyan-400" />
                          Humedad
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                          {weatherData.humidity}%
                        </div>
                      </div>

                      <div className="bg-[#05050a] p-2 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase flex items-center gap-1">
                          <Wind className="w-2.5 h-2.5 text-blue-400" />
                          Viento
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                          {weatherData.windSpeedKmH} km/h
                        </div>
                      </div>

                      <div className="bg-[#05050a] p-2 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase flex items-center gap-1">
                          <Gauge className="w-2.5 h-2.5 text-amber-400" />
                          Presión
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                          {weatherData.surfacePressureHPa ?? 1013} hPa
                        </div>
                      </div>

                      <div className="bg-[#05050a] p-2 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase flex items-center gap-1">
                          <Compass className="w-2.5 h-2.5 text-[#ff4e00]" />
                          Sensación
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                          {weatherData.apparentTempC}°C
                        </div>
                      </div>
                    </div>

                    {/* Highfield's Cosmic Perspective */}
                    <div className="bg-[#05050a] border-l-2 border-[#ff4e00] p-3 rounded-r text-xs text-white/80 italic leading-relaxed">
                      <div className="text-[9px] text-[#ff4e00] uppercase font-black not-italic mb-1 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Perspectiva Cósmica de Highfield:
                      </div>
                      &ldquo;{weatherData.lunarComparison}&rdquo;
                    </div>
                  </div>
                )}

                {weatherError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded">
                    {weatherError}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-2.5 bg-[#090914] border-t border-[#141424] text-[10px] text-white/40 flex justify-between items-center">
              <span>CANAL DE TELEMETRÍA // GEMINI FUNCTION CALLING V2</span>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-[#ff4e00] uppercase font-bold cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
