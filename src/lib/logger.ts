/**
 * Centralized logging utility for QRBag
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
const minLogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLogLevel];
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, context, data } = entry;
  const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${context ? `[${context}] ` : ''}`;
  
  if (data) {
    return `${prefix}${message} ${JSON.stringify(data)}`;
  }
  return `${prefix}${message}`;
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    context,
    data,
  };

  const formatted = formatLog(entry);

  // Use appropriate console method
  switch (level) {
    case 'debug':
      console.log(formatted);
      break;
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Logger instance with context
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    log('debug', message, this.context, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    log('info', message, this.context, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    log('warn', message, this.context, data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { ...data, error: error.message, stack: error.stack }
      : { ...data, error };
    log('error', message, this.context, errorData);
  }
}

/**
 * Create a logger with a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Global logger methods (without context)
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, undefined, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, undefined, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, undefined, data),
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    const errorData = error instanceof Error 
      ? { ...data, error: error.message, stack: error.stack }
      : { ...data, error };
    log('error', message, undefined, errorData);
  },
};

// Export default logger
export default logger;
