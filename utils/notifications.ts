export interface NotificationPreferences {
  enabled: boolean;
  morningRoutineTime: string;   // "HH:MM" — morning skincare routine
  scanReminderTime: string;     // "HH:MM" — daily face scan
  eveningRoutineTime: string;   // "HH:MM" — evening skincare routine
  streakReminder: boolean;
  reportReady: boolean;
}

const STORAGE_KEY = "notificationPreferences";
const LAST_NOTIF_KEY = "lastNotificationTimes";

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  morningRoutineTime: "08:00",
  scanReminderTime: "14:00",
  eveningRoutineTime: "21:00",
  streakReminder: true,
  reportReady: true,
};

// Track scheduled timeouts
let scheduledTimeouts: Record<string, number> = {};

export function areNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      enabled: !!parsed.enabled,
      morningRoutineTime: parsed.morningRoutineTime ?? DEFAULT_PREFS.morningRoutineTime,
      scanReminderTime: parsed.scanReminderTime ?? DEFAULT_PREFS.scanReminderTime,
      eveningRoutineTime: parsed.eveningRoutineTime ?? DEFAULT_PREFS.eveningRoutineTime,
      streakReminder: parsed.streakReminder ?? true,
      reportReady: parsed.reportReady ?? true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function msUntilNextLocalTime(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map((x) => parseInt(x, 10));
  const now = new Date();
  const next = new Date(now);
  next.setHours(Number.isFinite(hh) ? hh : 8, Number.isFinite(mm) ? mm : 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

function wasAlreadySentToday(key: string): boolean {
  try {
    const raw = localStorage.getItem(LAST_NOTIF_KEY);
    if (!raw) return false;
    const times = JSON.parse(raw) as Record<string, string>;
    const lastDate = times[key];
    if (!lastDate) return false;
    const today = new Date().toDateString();
    return lastDate === today;
  } catch {
    return false;
  }
}

function markAsSentToday(key: string): void {
  try {
    const raw = localStorage.getItem(LAST_NOTIF_KEY);
    const times = raw ? JSON.parse(raw) : {};
    times[key] = new Date().toDateString();
    localStorage.setItem(LAST_NOTIF_KEY, JSON.stringify(times));
  } catch { /* ignore */ }
}

interface NotifConfig {
  key: string;
  title: string;
  body: string;
  icon?: string;
}

const NOTIFICATION_CONFIGS: Record<string, NotifConfig> = {
  morning: {
    key: "morning",
    title: "☀️ Morning Routine",
    body: "Time for your morning skincare routine! Cleanse, tone, moisturize.",
  },
  scan: {
    key: "scan",
    title: "📸 Scan Time",
    body: "Take today's face scan to track your skin progress!",
  },
  evening: {
    key: "evening",
    title: "🌙 Evening Routine",
    body: "Wind down with your evening skincare protocol. Don't skip retinol night!",
  },
};

function sendNotification(config: NotifConfig): void {
  if (!areNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  if (wasAlreadySentToday(config.key)) return;

  try {
    new Notification(config.title, {
      body: config.body,
      badge: "/icons/icon-192.png",
      tag: `skinface-${config.key}`,
    });
    markAsSentToday(config.key);
    // Save to notification history for bell dropdown
    addToNotificationHistory(config);
  } catch (e) {
    console.error("Notification error:", e);
  }
}

// ─── Notification History (for bell dropdown) ───────────────────────
const HISTORY_KEY = "notificationHistory";
const MAX_HISTORY = 20;

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

function addToNotificationHistory(config: NotifConfig): void {
  try {
    const history = getNotificationHistory();
    history.unshift({
      id: `${config.key}-${Date.now()}`,
      title: config.title,
      body: config.body,
      timestamp: Date.now(),
      read: false,
    });
    // Keep only last N
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch { /* ignore */ }
}

export function getNotificationHistory(): NotificationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotificationHistoryItem[];
  } catch {
    return [];
  }
}

export function getUnreadCount(): number {
  return getNotificationHistory().filter((n) => !n.read).length;
}

export function markAllAsRead(): void {
  try {
    const history = getNotificationHistory();
    history.forEach((n) => (n.read = true));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

// ─── Scheduler ──────────────────────────────────────────────────────

function scheduleOne(key: string, time: string, config: NotifConfig): void {
  // Clear existing
  if (scheduledTimeouts[key]) {
    window.clearTimeout(scheduledTimeouts[key]);
    delete scheduledTimeouts[key];
  }

  const delay = msUntilNextLocalTime(time);
  scheduledTimeouts[key] = window.setTimeout(() => {
    sendNotification(config);
    // Re-schedule for next day
    scheduleOne(key, time, config);
  }, delay);
}

/**
 * Schedule all 3 daily notifications. Call this on app start if enabled.
 */
export function scheduleAllNotifications(prefs?: NotificationPreferences): void {
  if (!areNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  const p = prefs ?? getNotificationPreferences();
  if (!p.enabled) return;

  scheduleOne("morning", p.morningRoutineTime, NOTIFICATION_CONFIGS.morning);
  scheduleOne("scan", p.scanReminderTime, NOTIFICATION_CONFIGS.scan);
  scheduleOne("evening", p.eveningRoutineTime, NOTIFICATION_CONFIGS.evening);
}

/** Stop all scheduled notifications */
export function clearAllScheduled(): void {
  Object.values(scheduledTimeouts).forEach((id) => window.clearTimeout(id));
  scheduledTimeouts = {};
}

// Legacy compatibility
export function scheduleDailyReminder(time: string): void {
  const prefs = getNotificationPreferences();
  prefs.scanReminderTime = time;
  scheduleAllNotifications(prefs);
}

export function sendTestNotification(): void {
  if (!areNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  new Notification("✅ SkinFace AI", { body: "Notifications are working! You'll get 3 daily reminders." });
}
