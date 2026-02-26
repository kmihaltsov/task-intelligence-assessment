import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

/** Create a child logger with persistent context fields */
export function createLogger(context: { component: string; [key: string]: unknown }) {
  return logger.child(context);
}

export default logger;
