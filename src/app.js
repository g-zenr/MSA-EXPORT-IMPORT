"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const config_1 = __importDefault(require("./config/config"));
const logger_1 = __importDefault(require("./utils/logger"));
const performance_1 = __importDefault(require("./utils/performance"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const export_1 = __importDefault(require("./routes/export"));
const import_1 = __importDefault(require("./routes/import"));
const app = (0, express_1.default)();
// Ultra-fast middleware setup
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, compression_1.default)({ level: 6, threshold: 1024 }));
// Optimized body parsing
app.use(express_1.default.json({
    limit: "100mb",
    type: ["application/json", "text/plain"],
    verify: (req, res, buf) => {
        // @ts-ignore
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 50000,
}));
// Performance monitoring
app.use(performance_1.default.middleware);
// Routes
app.use("/api/v1/export", export_1.default);
app.use("/api/v1/import", import_1.default);
// Health check with performance metrics
app.get("/health", (req, res) => {
    const metrics = performance_1.default.getMetrics();
    res.json({
        status: "OK",
        service: "high-performance-export-import",
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        metrics,
    });
});
// Error handling
app.use(errorHandler_1.default);
exports.default = app;
// Only start the server if not running in a serverless environment
if (require.main === module) {
    const PORT = config_1.default.port || 3000;
    const server = app.listen(PORT, () => {
        logger_1.default.info(`Server running on port ${PORT}`);
    });
    // Optimize server settings
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.maxHeadersCount = 1000;
}
