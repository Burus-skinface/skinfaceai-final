import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Lightweight, self-contained toast system.
 *
 * Why this exists: the app previously leaned on `alert(...)` for transient
 * status (purchase results, save failures, etc.). Native dialogs break the
 * design language, block the main thread, and on iOS/Android via Capacitor
 * they create awkward UX. This provider gives us a centralized, accessible,
 * cancellable toast surface that uses the project's design tokens.
 */

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastInput {
    title?: string;
    message: string;
    variant?: ToastVariant;
    durationMs?: number; // 0 = sticky
    action?: ToastAction;
}

interface ToastRecord extends Required<Pick<ToastInput, 'message'>> {
    id: number;
    title?: string;
    variant: ToastVariant;
    durationMs: number;
    action?: ToastAction;
}

interface ToastContextValue {
    show: (input: ToastInput) => number;
    success: (message: string, opts?: Omit<ToastInput, 'message' | 'variant'>) => number;
    error: (message: string, opts?: Omit<ToastInput, 'message' | 'variant'>) => number;
    info: (message: string, opts?: Omit<ToastInput, 'message' | 'variant'>) => number;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const idRef = useRef(0);
    const timeouts = useRef(new Map<number, ReturnType<typeof setTimeout>>());

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const handle = timeouts.current.get(id);
        if (handle) {
            clearTimeout(handle);
            timeouts.current.delete(id);
        }
    }, []);

    const show = useCallback((input: ToastInput) => {
        const id = ++idRef.current;
        const record: ToastRecord = {
            id,
            title: input.title,
            message: input.message,
            variant: input.variant ?? 'info',
            durationMs: input.durationMs ?? DEFAULT_DURATION,
            action: input.action,
        };
        setToasts(prev => [...prev.slice(-3), record]); // cap to 4 visible
        if (record.durationMs > 0) {
            const handle = setTimeout(() => dismiss(id), record.durationMs);
            timeouts.current.set(id, handle);
        }
        return id;
    }, [dismiss]);

    useEffect(() => {
        return () => {
            timeouts.current.forEach(handle => clearTimeout(handle));
            timeouts.current.clear();
        };
    }, []);

    const value = useMemo<ToastContextValue>(() => ({
        show,
        dismiss,
        success: (message, opts) => show({ ...opts, message, variant: 'success' }),
        error: (message, opts) => show({ ...opts, message, variant: 'error' }),
        info: (message, opts) => show({ ...opts, message, variant: 'info' }),
    }), [show, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
};

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Soft-fallback: if a toast call fires outside the provider (e.g. during
        // hot-reload or in a story), log to console rather than crashing the app.
        return {
            show: ({ message }) => { console.warn('[toast/no-provider]', message); return 0; },
            success: (message) => { console.warn('[toast/no-provider]', 'success:', message); return 0; },
            error: (message) => { console.error('[toast/no-provider]', 'error:', message); return 0; },
            info: (message) => { console.info('[toast/no-provider]', 'info:', message); return 0; },
            dismiss: () => {},
        };
    }
    return ctx;
}

const variantStyles: Record<ToastVariant, { ring: string; icon: React.ReactNode; iconBg: string; titleColor: string }> = {
    success: {
        ring: 'border-emerald-200',
        iconBg: 'bg-emerald-50',
        titleColor: 'text-emerald-900',
        icon: (
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
    error: {
        ring: 'border-red-200',
        iconBg: 'bg-red-50',
        titleColor: 'text-red-900',
        icon: (
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        ),
    },
    info: {
        ring: 'border-purple-200',
        iconBg: 'bg-purple-50',
        titleColor: 'text-purple-900',
        icon: (
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
};

const ToastViewport: React.FC<{ toasts: ToastRecord[]; dismiss: (id: number) => void }> = ({ toasts, dismiss }) => {
    if (toasts.length === 0) return null;
    return (
        <div
            aria-live="polite"
            className="fixed inset-x-0 bottom-24 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none"
        >
            {toasts.map(t => {
                const styles = variantStyles[t.variant];
                return (
                    <div
                        key={t.id}
                        role={t.variant === 'error' ? 'alert' : 'status'}
                        className={`pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border ${styles.ring} px-4 py-3 flex items-start gap-3 animate-in slide-in-from-bottom-2 fade-in duration-150`}
                    >
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            {t.title && (
                                <p className={`text-[13px] font-bold ${styles.titleColor} leading-tight mb-0.5`}>{t.title}</p>
                            )}
                            <p className="text-[13px] text-[#1D1D1F] leading-snug break-words">{t.message}</p>
                            {t.action && (
                                <button
                                    type="button"
                                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                                    className="mt-2 inline-flex text-[12px] font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                                >
                                    {t.action.label}
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss notification"
                            className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
