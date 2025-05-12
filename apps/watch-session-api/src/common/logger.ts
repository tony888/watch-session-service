import { env } from "bun";

export interface LoggerOptions {
  service: string;
}

export const createLogger = (options: LoggerOptions) => {
  const isProduction = env.NODE_ENV === "production";
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      if (!isProduction) {
        console.log(
          JSON.stringify({
            level: "INFO",
            service: options.service,
            message,
            ...meta,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      console.error(
        JSON.stringify({
          level: "ERROR",
          service: options.service,
          message,
          ...meta,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      if (!isProduction) {
        console.warn(
          JSON.stringify({
            level: "WARN",
            service: options.service,
            message,
            ...meta,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    },
  };
};
