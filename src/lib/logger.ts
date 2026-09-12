type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

export const logger = {
  info(message: string, context?: string, data?: Record<string, unknown>) {
    this._log("INFO", message, context, data);
  },
  warn(message: string, context?: string, data?: Record<string, unknown>) {
    this._log("WARN", message, context, data);
  },
  error(message: string, context?: string, err?: unknown, data?: Record<string, unknown>) {
    const errorDetails = err instanceof Error ? { error: err.message, stack: err.stack } : { error: String(err) };
    this._log("ERROR", message, context, { ...data, ...errorDetails });
  },
  debug(message: string, context?: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      this._log("DEBUG", message, context, data);
    }
  },
  _log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
      ...(data ? { data } : {}),
    };
    if (level === "ERROR") {
      console.error(JSON.stringify(payload));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  },
};
