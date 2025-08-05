import { createLogger, format, transports, transport } from "winston";

const loggerTransports: transport[] = [new transports.Console()];

// Only add file transports if not running in serverless environments
if (
  process.env.VERCEL !== "1" &&
  process.env.NODE_ENV !== "production" &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME
) {
  loggerTransports.push(
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  );
}

export const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: loggerTransports,
  exitOnError: false,
});

export default logger;
