export interface Logger {
  info: LoggerMethod;
  error: LoggerMethod;
}

interface LoggerMethod {
  (description: string, meta?: { [key: string]: unknown }): void;
}
