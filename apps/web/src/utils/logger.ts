// Simple scoped logger utility

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class ScopedLogger {
  private scope: string;
  private context: LogContext = {};

  constructor(scope: string, context: LogContext = {}) {
    this.scope = scope;
    this.context = context;
  }

  private log(level: LogLevel, message: string, additionalContext?: LogContext) {
    const timestamp = new Date().toISOString();
    const context = {
      ...this.context,
      ...additionalContext,
    };
    
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.scope}]: ${message}`;
    
    if (Object.keys(context).length > 0) {
      console[level](formattedMessage, context);
    } else {
      console[level](formattedMessage);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  logMessage(message: string, context?: LogContext) {
    this.log('log', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  with(context: LogContext): ScopedLogger {
    return new ScopedLogger(this.scope, {
      ...this.context,
      ...context,
    });
  }
}

export function createScopedLogger(scope: string): ScopedLogger {
  return new ScopedLogger(scope);
} 