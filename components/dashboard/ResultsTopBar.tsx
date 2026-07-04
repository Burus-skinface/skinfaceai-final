import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';
import {
  areNotificationsSupported,
  getNotificationHistory,
  getNotificationPreferences,
  getUnreadCount,
  markAllAsRead,
  type NotificationHistoryItem,
} from '../../utils/notifications';
import { dash } from './dashboardTokens';
import { ShareIcon } from '../icons/ShareIcon';

interface ResultsTopBarProps {
  userName?: string;
  user?: { email?: string; app_metadata?: { provider?: string } } | null;
  onShowNotificationSettings?: () => void;
  onLogout?: () => void;
  onShare?: () => void;
  isSharing?: boolean;
}

const ResultsTopBar: React.FC<ResultsTopBarProps> = ({
  userName,
  user,
  onShowNotificationSettings,
  onLogout,
  onShare,
  isSharing,
}) => {
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);

  useEffect(() => {
    const update = () => {
      setUnreadCount(getUnreadCount());
      setHistory(getNotificationHistory().slice(0, 10));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return localized('Good morning', 'Günaydın');
    if (h < 18) return localized('Good afternoon', 'İyi günler');
    return localized('Good evening', 'İyi akşamlar');
  })();

  const displayName = userName?.trim() || localized('Sofia', 'Sofia');
  const prefs = getNotificationPreferences();
  const notifEnabled = prefs.enabled && areNotificationsSupported();

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return localized('Just now', 'Az önce');
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const closePanels = () => {
    setShowNotifPanel(false);
    setShowSettingsMenu(false);
  };

  const handleBellClick = () => {
    if (showNotifPanel) {
      setShowNotifPanel(false);
    } else {
      setShowSettingsMenu(false);
      setHistory(getNotificationHistory().slice(0, 10));
      setShowNotifPanel(true);
      markAllAsRead();
      setUnreadCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shrink-0" style={{ backgroundColor: dash.bg }}>
      <div
        className="w-full max-w-lg mx-auto px-4 flex flex-col justify-end relative"
        style={{
          minHeight: dash.topBarMinH,
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: 12,
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 pb-0.5">
            <p className="text-[15px] leading-snug font-normal" style={{ color: dash.textMuted }}>
              {greeting},
            </p>
            <h1
              className="text-[32px] leading-[1.08] font-bold tracking-[-0.02em] truncate flex items-center gap-2"
              style={{ color: dash.text }}
            >
              <span>{displayName}</span>
              <span className="material-symbols-outlined text-[28px] select-none bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent" data-icon="face_retouching_natural">
                face_retouching_natural
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0 pb-1 relative">
            <button
              type="button"
              onClick={handleBellClick}
              aria-label={localized('Notifications', 'Bildirimler')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                showNotifPanel ? 'bg-black/[0.06]' : 'hover:bg-black/[0.04]'
              }`}
              style={{ color: dash.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#fbf9f9]" />
              )}
            </button>

            {onShare && (
              <button
                type="button"
                onClick={onShare}
                disabled={isSharing}
                aria-label={localized('Share score card', 'Skor kartını paylaş')}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/[0.04] active:scale-95 disabled:opacity-50"
                style={{ color: dash.textSecondary }}
              >
                {isSharing ? (
                  <div className="w-4 h-4 border-2 border-[#777681] border-t-[#2e2f72] rounded-full animate-spin" />
                ) : (
                  <ShareIcon className="w-5 h-5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowNotifPanel(false);
                setShowSettingsMenu((v) => !v);
              }}
              aria-label={localized('Settings', 'Ayarlar')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                showSettingsMenu ? 'bg-black/[0.06]' : 'hover:bg-black/[0.04]'
              }`}
              style={{ color: dash.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-black/[0.06] rounded-2xl shadow-xl z-50 overflow-hidden">
                {user?.email && (
                  <div className="px-3.5 py-2.5 border-b border-black/[0.05] bg-[#fbf9f9]">
                    <p className="text-[12px] font-semibold text-[#1b1c1c] truncate">{user.email}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closePanels();
                    onShowNotificationSettings?.();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] text-[#464650] hover:bg-black/[0.03]"
                >
                  {localized('Notification settings', 'Bildirim ayarları')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closePanels();
                    onLogout?.();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] text-[#464650] hover:bg-black/[0.03] border-t border-black/[0.05]"
                >
                  {localized('Log out', 'Çıkış yap')}
                </button>
              </div>
            )}
          </div>
        </div>

        {showNotifPanel && (
          <div className="absolute right-4 top-[calc(100%-8px)] w-[min(320px,calc(100vw-2rem))] max-h-[60vh] bg-white border border-black/[0.06] rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-3.5 border-b border-black/[0.05] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1b1c1c]">
                {localized('Notifications', 'Bildirimler')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowNotifPanel(false);
                  onShowNotificationSettings?.();
                }}
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: dash.brand }}
              >
                {localized('Settings', 'Ayarlar')}
              </button>
            </div>
            {!notifEnabled ? (
              <div className="p-5 text-center">
                <p className="text-sm text-[#464650] mb-3">
                  {localized('Enable daily reminders', 'Günlük hatırlatıcıları aç')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifPanel(false);
                    onShowNotificationSettings?.();
                  }}
                  className="px-4 py-2 text-white text-sm font-semibold rounded-xl"
                  style={{ backgroundColor: dash.brand }}
                >
                  {localized('Enable', 'Aç')}
                </button>
              </div>
            ) : history.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#777681]">
                {localized('No notifications yet', 'Henüz bildirim yok')}
              </p>
            ) : (
              <div className="max-h-[45vh] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`px-3.5 py-2.5 border-b border-black/[0.04] last:border-0 ${
                      !item.read ? 'bg-[#e1e0ff]/30' : ''
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#1b1c1c]">{item.title}</p>
                      <span className="text-[10px] text-[#777681] shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777681] mt-0.5">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(showNotifPanel || showSettingsMenu) &&
        typeof document !== 'undefined' &&
        createPortal(
          <button
            type="button"
            className="fixed inset-0 z-[35] cursor-default"
            aria-label={localized('Close', 'Kapat')}
            onClick={closePanels}
          />,
          document.body
        )}
    </header>
  );
};

export default ResultsTopBar;
