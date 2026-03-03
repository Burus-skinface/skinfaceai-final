type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
    id: string;
    timestamp: number;
    module: string;
    message: string;
    level: LogLevel;
    data?: any;
}

type LogListener = (entry: LogEntry) => void;

class DebugLogger {
    private listeners: LogListener[] = [];
    private logs: LogEntry[] = [];
    private maxLogs = 100;

    subscribe(listener: LogListener) {
        this.listeners.push(listener);
        // Replay existing logs
        this.logs.forEach(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    log(module: string, message: string, data?: any, level: LogLevel = 'info') {
        const entry: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            module,
            message,
            level,
            data
        };

        console.log(`[${module}] ${message}`, data || '');

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.listeners.forEach(l => l(entry));
    }

    info(module: string, message: string, data?: any) {
        this.log(module, message, data, 'info');
    }

    warn(module: string, message: string, data?: any) {
        this.log(module, message, data, 'warn');
    }

    error(module: string, message: string, data?: any) {
        this.log(module, message, data, 'error');
    }

    success(module: string, message: string, data?: any) {
        this.log(module, message, data, 'success');
    }

    clear() {
        this.logs = [];
    }
}

export const debugLog = new DebugLogger();
