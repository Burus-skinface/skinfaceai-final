import React from 'react';
import { motion } from 'framer-motion';

interface DailyCheckInProps {
    onScan: () => void;
    onSkip: () => void;
    lastScanDate: string;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({ onScan, onSkip, lastScanDate }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-8 relative overflow-hidden text-center shadow-2xl"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <span className="text-3xl">📅</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Daily Check-in</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        You haven't scanned your face today. Consistency is key to tracking your progress!
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onScan}
                            className="w-full h-14 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Scan My Face Today
                        </button>

                        <button
                            onClick={onSkip}
                            className="w-full h-12 text-gray-500 font-medium text-sm hover:text-white transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DailyCheckIn;
