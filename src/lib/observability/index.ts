/**
 * Observability - Structured logging and metrics
 *
 * All logs are JSON-formatted for agent queryability.
 */

import pino from "pino";

const rootLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(component: string) {
  return rootLogger.child({ component });
}

export const log = rootLogger;
