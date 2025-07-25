import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import performance from "../utils/performance";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorId = Math.random().toString(36).substr(2, 9);
  logger.error("Error occurred:", {
    errorId,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  let statusCode = 500;
  let message = "Internal server error";
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large";
  } else if (
    err.message &&
    err.message.includes("Only CSV files are allowed")
  ) {
    statusCode = 400;
    message = "Invalid file type. Only CSV files are allowed.";
  } else if (err.message && err.message.includes("Worker timeout")) {
    statusCode = 408;
    message = "Request timeout. Please try with smaller dataset.";
  } else if (
    err.message &&
    err.message.includes("Too many concurrent requests")
  ) {
    statusCode = 429;
    message = "Server busy. Please try again later.";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }
  if (statusCode >= 500) {
    performance.metrics.errors++;
  }
  const response: any = {
    error: message,
    errorId,
    timestamp: new Date().toISOString(),
  };
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.details = err.details || undefined;
  }
  res.status(statusCode).json(response);
};

export default errorHandler;
