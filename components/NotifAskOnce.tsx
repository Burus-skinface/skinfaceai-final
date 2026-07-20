/**
 * Soft prompt: ask once to enable local notifications after first results.
 */
import React, { useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleAllNotifications,
  requestNotificationPermission,
} from '../utils/notifications';
import { trackEvent } from '../utils/analytics';
import { localized } from '../localization';

const ASKED_KEY = 'skinface_notif_asked_v1';

export const NotifAskOnce: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ASKED_KEY) === '1') return;
      const prefs = getNotificationPreferences();
      if (prefs.enabled) {
        localStorage.setItem(ASKED_KEY, '1');
        return;
      }
      const t = window.setTimeout(() => {
        setOpen(true);
        trackEvent('notif_prompt_shown');
      }, 1200);
      return () => clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(ASKED_KEY, '1');
    setOpen(false);
  };

  const enable = async () => {
    localStorage.setItem(ASKED_KEY, '1');
    const granted = await requestNotificationPermission();
    if (granted) {
      const prefs = { ...getNotificationPreferences(), enabled: true };
      saveNotificationPreferences(prefs);
      await scheduleAllNotifications(prefs);
      trackEvent('notif_enabled');
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-[90] px-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl bg-[#1d1d1f] text-white p-4 shadow-xl border border-white/10">
        <p className="text-sm font-semibold mb-1">
          {localized('Stay on your glow streak', 'Glow serini koru')}
        </p>
        <p className="text-xs text-white/70 mb-3">
          {localized(
            'Turn on gentle reminders for your daily scan. You can change this anytime in settings.',
            'Günlük tarama için nazik hatırlatmalar aç. İstediğin zaman ayarlardan değiştirebilirsin.'
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 py-2 rounded-full text-xs font-bold bg-white/10"
          >
            {localized('Not now', 'Şimdi değil')}
          </button>
          <button
            type="button"
            onClick={enable}
            className="flex-1 py-2 rounded-full text-xs font-bold bg-white text-black"
          >
            {localized('Enable', 'Aç')}
          </button>
        </div>
      </div>
    </div>
  );
};
