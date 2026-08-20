/**
 * HIGHFIELD - Lunar Reminder & Chronometric Alert System
 * Persists scheduled reminders, alarms, and observational tasks in localStorage.
 * Monitors deadlines every second, triggers procedural audio chimes on completion,
 * and notifies subscribers across UI components.
 */

import { soundManager } from './AudioEngine';

export interface LunarReminder {
  id: string;
  title: string;
  targetTimestamp: number; // ms timestamp
  targetTimeFormatted: string; // "14:30" or "2026-03-24 14:30"
  relativeDesc: string; // "en 10 minutos", "a las 19:00"
  category: 'task' | 'observation' | 'cosmic' | 'personal' | 'habit';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number;
  notified: boolean;
}

const STORAGE_KEY_REMINDERS = 'highfield_reminders_v2';

class ReminderEngine {
  private reminders: LunarReminder[] = [];
  private listeners: Set<() => void> = new Set();
  private checkInterval: number | null = null;
  private activeAlarm: LunarReminder | null = null;

  constructor() {
    this.reminders = this.loadReminders();
    this.startTicker();
  }

  private loadReminders(): LunarReminder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore
    }
    return [
      {
        id: 'rem_welcome_01',
        title: 'Contemplar la Tierra desde la cresta este',
        targetTimestamp: Date.now() + 1000 * 60 * 45, // 45 mins from now
        targetTimeFormatted: new Date(Date.now() + 1000 * 60 * 45).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        relativeDesc: 'en 45 minutos',
        category: 'observation',
        priority: 'medium',
        completed: false,
        createdAt: Date.now(),
        notified: false,
      },
    ];
  }

  private saveReminders() {
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(this.reminders));
    } catch {
      // Ignore
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startTicker() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = window.setInterval(() => {
      this.checkDueReminders();
    }, 1000);
  }

  private checkDueReminders() {
    const now = Date.now();
    let hasChanges = false;

    for (const rem of this.reminders) {
      if (!rem.completed && !rem.notified && rem.targetTimestamp <= now) {
        rem.notified = true;
        hasChanges = true;
        this.activeAlarm = rem;
        soundManager.playBeaconIntercept();

        // Browser notification if granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`⏰ Highfield: Recordatorio Cósmico`, {
              body: rem.title,
              icon: '/favicon.ico',
            });
          } catch {
            // Ignore
          }
        }
      }
    }

    if (hasChanges) {
      this.saveReminders();
    }
  }

  public getActiveAlarm(): LunarReminder | null {
    return this.activeAlarm;
  }

  public dismissAlarm() {
    this.activeAlarm = null;
    this.notifyListeners();
  }

  public getReminders(): LunarReminder[] {
    return [...this.reminders].sort((a, b) => a.targetTimestamp - b.targetTimestamp);
  }

  public getActiveCount(): number {
    return this.reminders.filter((r) => !r.completed).length;
  }

  public addReminder(
    title: string,
    minutesFromNow?: number,
    exactDateStr?: string,
    category: LunarReminder['category'] = 'task',
    priority: LunarReminder['priority'] = 'medium',
    relativeDesc?: string
  ): LunarReminder {
    const now = Date.now();
    let targetTimestamp = now + 15 * 60 * 1000; // default 15 mins

    if (typeof minutesFromNow === 'number' && minutesFromNow > 0) {
      targetTimestamp = now + minutesFromNow * 60 * 1000;
    } else if (exactDateStr) {
      const parsed = new Date(exactDateStr).getTime();
      if (!isNaN(parsed) && parsed > now - 1000 * 60 * 60 * 24) {
        targetTimestamp = parsed;
      }
    }

    const targetDate = new Date(targetTimestamp);
    const targetFormatted = targetDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let desc = relativeDesc;
    if (!desc) {
      const diffMins = Math.round((targetTimestamp - now) / (60 * 1000));
      if (diffMins <= 60) {
        desc = `en ${diffMins} minutos`;
      } else if (diffMins < 1440) {
        desc = `a las ${targetFormatted}`;
      } else {
        desc = `para el ${targetDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} a las ${targetFormatted}`;
      }
    }

    const newReminder: LunarReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      targetTimestamp,
      targetTimeFormatted: targetFormatted,
      relativeDesc: desc,
      category,
      priority,
      completed: false,
      createdAt: now,
      notified: false,
    };

    this.reminders.unshift(newReminder);
    this.saveReminders();
    soundManager.playInteractChime();
    return newReminder;
  }

  public toggleComplete(id: string): boolean {
    const rem = this.reminders.find((r) => r.id === id);
    if (rem) {
      rem.completed = !rem.completed;
      this.saveReminders();
      soundManager.playDialogueBlip(1);
      return rem.completed;
    }
    return false;
  }

  public deleteReminder(id: string) {
    this.reminders = this.reminders.filter((r) => r.id !== id);
    if (this.activeAlarm?.id === id) {
      this.activeAlarm = null;
    }
    this.saveReminders();
    soundManager.playDialogueBlip(0);
  }

  public requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export const reminderSystem = new ReminderEngine();
