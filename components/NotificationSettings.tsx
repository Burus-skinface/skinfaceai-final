import React, { useState, useEffect } from 'react';
import {
  areNotificationsSupported,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleAllNotifications,
  clearAllScheduled,
  sendTestNotification,
  NotificationPreferences,
} from '../utils/notifications';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [permission, setPermission] = useState<NotificationPermission>(
    areNotificationsSupported() ? Notification.permission : 'denied'
  );

  useEffect(() => {
    setPrefs(getNotificationPreferences());
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      const newPrefs = { ...prefs, enabled: true };
      setPrefs(newPrefs);
      saveNotificationPreferences(newPrefs);
      scheduleAllNotifications(newPrefs);
    }
  };

  const updatePref = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    saveNotificationPreferences(newPrefs);
    if (newPrefs.enabled) {
      scheduleAllNotifications(newPrefs);
    }
  };

  const handleToggleEnabled = () => {
    const newEnabled = !prefs.enabled;
    updatePref('enabled', newEnabled);
    if (!newEnabled) clearAllScheduled();
  };

  if (!areNotificationsSupported()) {
    return (
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-gray-400 text-sm text-center">
          Notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-green-500' : 'bg-gray-600'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  const TimeRow = ({ label, emoji, time, onTimeChange }: { label: string; emoji: string; time: string; onTimeChange: (t: string) => void }) => (
    <div className="flex items-center justify-between py-3 border-t border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-gray-300 font-medium">{label}</span>
      </div>
      <input
        type="time"
        value={time}
        onChange={(e) => onTimeChange(e.target.value)}
        className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-purple-500 w-24 text-center"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Reminders</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white text-sm">✕</button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Enable/Disable */}
          {permission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all text-sm"
            >
              Enable Notifications
            </button>
          ) : (
            <>
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Daily Reminders</p>
                  <p className="text-xs text-gray-500">3 notifications per day</p>
                </div>
                <ToggleSwitch on={prefs.enabled} onToggle={handleToggleEnabled} />
              </div>

              {/* 3 Time Pickers */}
              {prefs.enabled && (
                <div className="bg-black/30 rounded-2xl p-4">
                  <TimeRow
                    emoji="☀️"
                    label="Morning Routine"
                    time={prefs.morningRoutineTime}
                    onTimeChange={(t) => updatePref('morningRoutineTime', t)}
                  />
                  <TimeRow
                    emoji="📸"
                    label="Scan Reminder"
                    time={prefs.scanReminderTime}
                    onTimeChange={(t) => updatePref('scanReminderTime', t)}
                  />
                  <TimeRow
                    emoji="🌙"
                    label="Evening Routine"
                    time={prefs.eveningRoutineTime}
                    onTimeChange={(t) => updatePref('eveningRoutineTime', t)}
                  />
                </div>
              )}

              {/* Extra Toggles */}
              <div className="bg-black/30 rounded-2xl px-4 py-1">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Streak Warnings</p>
                    <p className="text-[11px] text-gray-500">Alert if you miss a day</p>
                  </div>
                  <ToggleSwitch on={prefs.streakReminder} onToggle={() => updatePref('streakReminder', !prefs.streakReminder)} />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-white/5">
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Report Ready</p>
                    <p className="text-[11px] text-gray-500">When analysis is complete</p>
                  </div>
                  <ToggleSwitch on={prefs.reportReady} onToggle={() => updatePref('reportReady', !prefs.reportReady)} />
                </div>
              </div>

              {/* Test */}
              <button
                onClick={sendTestNotification}
                className="w-full py-2.5 bg-white/5 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors border border-white/10"
              >
                Send Test Notification
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
