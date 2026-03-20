
import React, { useState, useEffect } from 'react';
import {
    areNotificationsSupported,
    getNotificationHistory,
    getUnreadCount,
    markAllAsRead,
    NotificationHistoryItem,
    getNotificationPreferences,
} from '../utils/notifications';

interface GlobalAppHeaderProps {
    user: any;
    onLogout?: () => void;
    onShowNotificationSettings?: () => void;
}

const GlobalAppHeader: React.FC<GlobalAppHeaderProps> = ({ user, onLogout, onShowNotificationSettings }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);

    // Refresh unread count periodically
    useEffect(() => {
        const update = () => {
            setUnreadCount(getUnreadCount());
            setHistory(getNotificationHistory().slice(0, 10));
        };
        update();
        const interval = setInterval(update, 30000); // every 30s
        return () => clearInterval(interval);
    }, []);

    const handleBellClick = () => {
        if (showNotifPanel) {
            setShowNotifPanel(false);
        } else {
            setShowUserMenu(false);
            setHistory(getNotificationHistory().slice(0, 10));
            setShowNotifPanel(true);
            // Mark all as read when opening
            markAllAsRead();
            setUnreadCount(0);
        }
    };

    const prefs = getNotificationPreferences();
    const notifEnabled = prefs.enabled && areNotificationsSupported();

    const formatTimeAgo = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-3 pb-1.5 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.04] transition-all duration-300">
            <div className="w-full max-w-lg mx-auto flex items-center justify-between">
                {/* Wordmark only — no logo icon */}
                <div className="text-[15px] font-black tracking-tight">
                    <span className="text-white/90">SKINFACE</span>
                    <span className="text-white/30">.</span>
                    <span className="text-purple-400/80 text-[13px] font-extrabold">ai</span>
                </div>

                {/* Right: Bell + Avatar */}
                <div className="flex items-center gap-2">
                    {/* Notification Bell */}
                    <button
                        onClick={handleBellClick}
                        className="relative p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                            <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#09090b]"></div>
                        )}
                    </button>

                    {/* User Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifPanel(false); }}
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 text-white font-bold text-[11px]"
                        >
                            {user?.email ? user.email[0].toUpperCase() : 'U'}
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-10 w-52 bg-[#1C1C1E] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-3.5 py-3 border-b border-white/5">
                                    <p className="text-[13px] font-semibold text-white truncate">{user?.email || 'Guest'}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{user?.app_metadata?.provider || 'Email'}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                                        className="w-full px-3.5 py-2 text-left text-[13px] text-gray-400 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Panel Dropdown */}
            {showNotifPanel && (
                <div className="absolute right-4 top-16 w-80 max-h-[70vh] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                        <button
                            onClick={() => { setShowNotifPanel(false); onShowNotificationSettings?.(); }}
                            className="text-[10px] font-bold text-purple-400 uppercase tracking-wider hover:text-purple-300 transition-colors"
                        >
                            Settings
                        </button>
                    </div>

                    {!notifEnabled ? (
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">Enable notifications for daily reminders</p>
                            <button
                                onClick={() => { setShowNotifPanel(false); onShowNotificationSettings?.(); }}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-500 transition-colors"
                            >
                                Enable Notifications
                            </button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-600 mt-1">You'll receive 3 daily reminders</p>
                        </div>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className={`px-4 py-3 border-b border-white/5 last:border-b-0 ${!item.read ? 'bg-purple-500/5' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-white">{item.title}</p>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule Info */}
                    {notifEnabled && (
                        <div className="p-3 bg-white/[0.02] border-t border-white/5">
                            <p className="text-[10px] text-gray-500 text-center font-medium">
                                ☀️ {prefs.morningRoutineTime} &nbsp;·&nbsp; 📸 {prefs.scanReminderTime} &nbsp;·&nbsp; 🌙 {prefs.eveningRoutineTime}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Click-outside overlay */}
            {(showNotifPanel || showUserMenu) && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => { setShowNotifPanel(false); setShowUserMenu(false); }}
                />
            )}
        </div>
    );
};

export default GlobalAppHeader;
