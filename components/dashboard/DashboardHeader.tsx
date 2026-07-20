import React from 'react';
import { getLocale, localized } from '../../localization';
import { ShareIcon } from '../icons/ShareIcon';

interface DashboardHeaderProps {
    scanDate: string;
    userName?: string;
    onNewScan?: () => void;
    onShare?: () => void;
    isSharing?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    scanDate,
    userName,
    onNewScan,
    onShare,
    isSharing,
}) => {
    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return localized('Good morning', 'Günaydın');
        if (h < 18) return localized('Good afternoon', 'İyi günler');
        return localized('Good evening', 'İyi akşamlar');
    })();

    const displayName =
        userName?.trim() ||
        localized('there', 'sen');

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const time = d.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
            return isToday
                ? `${localized('Today', 'Bugün')} · ${time}`
                : d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }) + ` · ${time}`;
        } catch {
            return scanDate;
        }
    };

    return (
        <header className="w-full -mx-4 px-4 pt-2 pb-4 mb-2 bg-[#fbf9f9]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-[#777681] font-medium">{greeting},</p>
                    <h1 className="text-[26px] font-extrabold text-[#1b1c1c] tracking-tight leading-tight truncate">
                        {displayName}
                    </h1>
                    <p className="text-[12px] text-[#777681] mt-1">{formatDate(scanDate)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {onNewScan && (
                        <button
                            type="button"
                            onClick={onNewScan}
                            className="px-3 py-2 rounded-xl bg-[#e1e0ff] text-[#2e2f72] text-[11px] font-bold uppercase tracking-wide active:scale-95 transition-transform"
                        >
                            {localized('Scan', 'Tara')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onShare}
                        disabled={isSharing}
                        className="p-2.5 rounded-xl bg-white border border-black/[0.06] shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                        aria-label={localized('Share', 'Paylaş')}
                    >
                        {isSharing ? (
                            <div className="w-4 h-4 border-2 border-[#777681] border-t-[#2e2f72] rounded-full animate-spin" />
                        ) : (
                            <ShareIcon className="w-4 h-4 text-[#464650]" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
