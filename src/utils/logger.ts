import { createLogger, format, transports, transport } from "winston";

const loggerTransports: transport[] = [new transports.Console()];

// Only add file transports if not running in serverless environments
const isServerless =
  process.env.VERCEL === "1" ||
  process.env.NETLIFY === "true" ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NODE_ENV === "production";

if (!isServerless) {
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
