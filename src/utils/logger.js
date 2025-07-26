"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const loggerTransports = [new winston_1.transports.Console()];
// Only add file transports if not running in serverless (Vercel)
if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
    loggerTransports.push(new winston_1.transports.File({ filename: "logs/error.log", level: "error" }), new winston_1.transports.File({ filename: "logs/combined.log" }));
}
exports.logger = (0, winston_1.createLogger)({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
    transports: loggerTransports,
    exitOnError: false,
});
exports.default = exports.logger;
