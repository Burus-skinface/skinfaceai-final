import React, { useEffect, useState, useRef } from 'react';
import { debugLog, LogEntry } from '../utils/debugLog';

export const DebugLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return debugLog.subscribe((entry) => {
            setLogs(prev => [...prev, entry]);
        });
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (logs.length === 0) return null;

    return (
        <div className="absolute top-20 left-4 right-4 h-64 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 overflow-hidden z-[100] font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <span className="text-gray-400 font-bold tracking-wider">DEBUG CONSOLE</span>
                <button
                    onClick={() => debugLog.clear()}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    Clear
                </button>
            </div>

            <div className="h-full overflow-y-auto pb-8 space-y-1">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 break-all">
                        <span className="text-gray-600 min-w-[60px]">
                            {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}
                        </span>
                        <span className={`font-bold min-w-[80px] ${log.module === 'SKIN' ? 'text-pink-400' :
                                log.module === 'PIPELINE' ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                            [{log.module}]
                        </span>
                        <span className={`${log.level === 'error' ? 'text-red-400 font-bold bg-red-900/20 px-1 rounded' :
                                log.level === 'success' ? 'text-green-400' :
                                    log.level === 'warn' ? 'text-yellow-400' :
                                        'text-white/80'
                            }`}>
                            {log.message}
                        </span>
                    </div>
                ))}
                {logs.length > 0 && <div className="h-4" ref={bottomRef} />}
            </div>
        </div>
    );
};
