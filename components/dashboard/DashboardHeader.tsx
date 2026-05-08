import React from 'react';
import { getLocale, localized } from '../../localization';
import { ShareIcon } from '../icons/ShareIcon';
import { Sparkles } from '../icons/SparklesIcon';

interface DashboardHeaderProps {
    scanDate: string;
    onNewScan?: () => void;
    onShare?: () => void;
    isSharing?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ scanDate, onNewScan, onShare, isSharing }) => {
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const time = d.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
            return isToday
                ? `${localized('Today', 'Bugün')} ${time}`
                : d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }) + ` ${time}`;
        } catch {
            return scanDate;
        }
    };

    return (
        <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onNewScan}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F3E8FF] rounded-xl hover:bg-[#EBDDFF] active:scale-95 transition-all"
                >
                    <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wide">{localized('NEW SCAN', 'YENİ TARAMA')}</span>
                </button>
                <span className="text-[13px] text-[#86868B] font-medium">{formatDate(scanDate)}</span>
            </div>

            <button
                onClick={onShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
                {isSharing ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-[#1D1D1F] rounded-full animate-spin" />
                ) : (
                    <ShareIcon className="w-4 h-4 text-[#48484A]" />
                )}
                <span className="text-[12px] font-bold text-[#48484A]">{localized('Share', 'Paylaş')}</span>
            </button>
        </div>
    );
};

export default DashboardHeader;
