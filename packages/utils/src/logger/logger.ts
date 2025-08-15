export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string, level?: LogLevel) {
    this.context = context;
    this.level = level ?? this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatMessage(level: string, message: string, meta?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(baseLog);
    }

    // Pretty print for development
    const color = this.getColor(level);
    return `${color}[${timestamp}] [${level}] [${this.context}] ${message}${this.resetColor()} ${
      meta ? '\n' + JSON.stringify(meta, null, 2) : ''
    }`;
  }

  private getColor(level: string): string {
    if (process.env.NODE_ENV === 'production') return '';
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // Red
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'INFO': return '\x1b[36m';  // Cyan
      case 'DEBUG': return '\x1b[37m'; // White
      default: return '';
    }
  }

  private resetColor(): string {
    return process.env.NODE_ENV === 'production' ? '' : '\x1b[0m';
  }

  error(message: string, error?: Error | unknown, meta?: LogContext): void {
    if (this.level >= LogLevel.ERROR) {
      const errorMeta = error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        ...meta
      } : meta;
      console.error(this.formatMessage('ERROR', message, errorMeta));
    }
  }

  warn(message: string, meta?: LogContext): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: LogContext): void {
    if (this.level >= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message: string, meta?: LogContext): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  // Create child logger with additional context
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.level);
  }
}