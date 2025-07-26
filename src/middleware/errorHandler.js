"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const performance_1 = __importDefault(require("../utils/performance"));
const errorHandler = (err, req, res, next) => {
    const errorId = Math.random().toString(36).substr(2, 9);
    logger_1.default.error("Error occurred:", {
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
    }
    else if (err.message &&
        err.message.includes("Only CSV files are allowed")) {
        statusCode = 400;
        message = "Invalid file type. Only CSV files are allowed.";
    }
    else if (err.message && err.message.includes("Worker timeout")) {
        statusCode = 408;
        message = "Request timeout. Please try with smaller dataset.";
    }
    else if (err.message &&
        err.message.includes("Too many concurrent requests")) {
        statusCode = 429;
        message = "Server busy. Please try again later.";
    }
    else if (err.name === "ValidationError") {
        statusCode = 400;
        message = err.message;
    }
    if (statusCode >= 500) {
        performance_1.default.metrics.errors++;
    }
    const response = {
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
exports.default = errorHandler;
