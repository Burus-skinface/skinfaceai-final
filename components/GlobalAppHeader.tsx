
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    areNotificationsSupported,
    getNotificationHistory,
    getUnreadCount,
    markAllAsRead,
    NotificationHistoryItem,
    getNotificationPreferences,
} from '../utils/notifications';
import { supabase } from '../services/supabase';
import { deleteCurrentAccount } from '../services/accountDeletion';
import { clearAllScanThumbnails, clearPendingFaceState } from '../utils/pendingScan';
import { clearFreeScanDayMarker } from '../utils/dailyScanLimit';

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

    // Delete Account flow state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const openDeleteModal = () => {
        setShowUserMenu(false);
        setDeleteStep(1);
        setDeleteConfirmText('');
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (isDeleting) return; // never close mid-deletion
        setShowDeleteModal(false);
        setDeleteStep(1);
        setDeleteConfirmText('');
        setDeleteError(null);
    };

    const performDelete = async () => {
        if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            // Full wipe via Edge Function (auth.users + scans + profile + rewards)
            await deleteCurrentAccount();

            try {
                localStorage.removeItem('face_analysis_history');
                localStorage.removeItem('user_demographics');
                localStorage.removeItem('is_premium');
                localStorage.removeItem('facial_analysis_subscription');
                clearAllScanThumbnails();
                clearPendingFaceState();
                clearFreeScanDayMarker();
            } catch (e) {
                console.warn('[DELETE_ACCOUNT] local cleanup warning', e);
            }

            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn('[DELETE_ACCOUNT] signOut warning', e);
            }

            setIsDeleting(false);
            setShowDeleteModal(false);
            onLogout?.();
        } catch (err: any) {
            console.error('[DELETE_ACCOUNT] failed', err);
            setIsDeleting(false);
            setDeleteError(err?.message || 'Delete failed. Please try again or contact support@skinface.ai.');
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1.5 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/[0.06] transition-all duration-300">
            <div className="w-full max-w-lg mx-auto flex items-center justify-between">
                <div className="text-[15px] font-black tracking-tight">
                    <span className="text-[#1D1D1F]">SKINFACE</span>
                    <span className="text-[#1D1D1F]/30">.</span>
                    <span className="text-purple-600 text-[13px] font-extrabold">ai</span>
                </div>

                {/* Right: Bell + Avatar */}
                <div className="flex items-center gap-2">
                    {/* Notification Bell */}
                    <button
                        onClick={handleBellClick}
                        aria-label="Notifications"
                        className={`relative p-1.5 rounded-full transition-colors ${
                            showNotifPanel ? 'bg-black/[0.06] text-[#1D1D1F]' : 'hover:bg-black/[0.04] text-[#48484A]'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                            <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#F5F5F7]"></div>
                        )}
                    </button>

                    {/* User Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifPanel(false); }}
                            aria-label="Account menu"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 text-white font-bold text-[11px]"
                        >
                            {user?.email ? user.email[0].toUpperCase() : 'U'}
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-10 w-52 bg-white border border-black/5 rounded-2xl shadow-xl z-50 overflow-hidden">
                                <div className="px-3.5 py-3 border-b border-black/5 bg-[#F5F5F7]/30">
                                    <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">{user?.email || 'Guest'}</p>
                                    <p className="text-[10px] text-[#86868B] mt-0.5">{user?.app_metadata?.provider || 'Email'}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                                        className="w-full px-3.5 py-2 text-left text-[13px] text-[#48484A] hover:bg-black/5 flex items-center gap-2.5 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Log Out
                                    </button>

                                    <div className="h-px bg-black/5 w-full my-1"></div>

                                    <button
                                        onClick={() => { setShowUserMenu(false); window.location.href = 'mailto:support@skinface.ai'; }}
                                        className="w-full px-3.5 py-2 text-left text-[13px] text-[#48484A] hover:bg-black/5 flex items-center gap-2.5 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact Support
                                    </button>

                                    <div className="h-px bg-black/5 w-full my-1"></div>
                                    <button
                                        onClick={openDeleteModal}
                                        className="w-full px-3.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Panel Dropdown — light surface, dark ink */}
            {showNotifPanel && (
                <div className="absolute right-4 top-16 w-80 max-h-[70vh] bg-white border border-black/5 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 border-b border-black/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#1D1D1F]">Notifications</h3>
                        <button
                            onClick={() => { setShowNotifPanel(false); onShowNotificationSettings?.(); }}
                            className="text-[10px] font-bold text-purple-600 uppercase tracking-wider hover:text-purple-700 transition-colors"
                        >
                            Settings
                        </button>
                    </div>

                    {!notifEnabled ? (
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-sm text-[#48484A] mb-3">Enable notifications for daily reminders</p>
                            <button
                                onClick={() => { setShowNotifPanel(false); onShowNotificationSettings?.(); }}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                            >
                                Enable Notifications
                            </button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-[#48484A]">No notifications yet</p>
                            <p className="text-xs text-[#86868B] mt-1">You'll receive 3 daily reminders</p>
                        </div>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className={`px-4 py-3 border-b border-black/5 last:border-b-0 ${!item.read ? 'bg-purple-500/5' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-[#1D1D1F]">{item.title}</p>
                                        <span className="text-[10px] text-[#86868B] whitespace-nowrap">{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                    <p className="text-xs text-[#48484A] mt-0.5">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule Info */}
                    {notifEnabled && (
                        <div className="p-3 bg-[#F5F5F7]/60 border-t border-black/5">
                            <p className="text-[10px] text-[#86868B] text-center font-medium">
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

            {/* Delete Account Modal — rendered via portal so it isn't trapped by the
                header's fixed/backdrop-filter containing block (which was making the
                modal align to the header rect instead of the full viewport). */}
            {showDeleteModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-account-title"
                    >
                        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h2 id="delete-account-title" className="text-lg font-bold text-[#1D1D1F]">Delete account</h2>
                        </div>

                        {deleteStep === 1 ? (
                            <div className="px-6 pb-6 pt-3">
                                <p className="text-sm text-[#48484A] leading-relaxed">
                                    This permanently removes:
                                </p>
                                <ul className="mt-3 space-y-1.5 text-sm text-[#48484A]">
                                    <li className="flex gap-2">
                                        <span className="text-red-600">•</span>
                                        <span>All your scans (image and derived face state)</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-red-600">•</span>
                                        <span>Your analysis results, recommendations, and trend history</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-red-600">•</span>
                                        <span>Your profile (age range, gender, premium state)</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-red-600">•</span>
                                        <span>Local data on this device</span>
                                    </li>
                                </ul>
                                <p className="mt-3 text-xs text-[#86868B] leading-relaxed">
                                    Your authentication record (email + login metadata) is removed asynchronously.
                                    Need an immediate auth-row purge? Email <a href="mailto:support@skinface.ai" className="text-purple-600 underline">support@skinface.ai</a>.
                                </p>
                                <p className="mt-3 text-sm font-semibold text-[#1D1D1F]">This cannot be undone.</p>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={closeDeleteModal}
                                        className="flex-1 py-3 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-sm hover:bg-black/[0.06] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setDeleteStep(2)}
                                        className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 pb-6 pt-3">
                                <p className="text-sm text-[#48484A] leading-relaxed">
                                    Type <span className="font-mono font-bold text-red-600">DELETE</span> below to confirm. We'll wipe your scans, results, and profile, then sign you out.
                                </p>

                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => { setDeleteConfirmText(e.target.value); if (deleteError) setDeleteError(null); }}
                                    placeholder="Type DELETE to confirm"
                                    autoFocus
                                    disabled={isDeleting}
                                    className="mt-4 w-full px-4 py-3 rounded-2xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] placeholder-[#86868B] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all disabled:opacity-60"
                                />

                                {deleteError && (
                                    <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                                        {deleteError}
                                    </div>
                                )}

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={closeDeleteModal}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-sm hover:bg-black/[0.06] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={performDelete}
                                        disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                                        className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting && (
                                            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        )}
                                        {isDeleting ? 'Deleting…' : 'Delete forever'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default GlobalAppHeader;
