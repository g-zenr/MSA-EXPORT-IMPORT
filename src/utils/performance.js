"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            totalTime: 0,
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errors: 0,
            activeConnections: 0,
        };
        this.middleware = (req, res, next) => {
            const startTime = process.hrtime.bigint();
            this.metrics.activeConnections++;
            res.on("finish", () => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                this.metrics.requests++;
                this.metrics.totalTime += duration;
                this.metrics.averageTime = this.metrics.totalTime / this.metrics.requests;
                this.metrics.minTime = Math.min(this.metrics.minTime, duration);
                this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);
                this.metrics.activeConnections--;
                if (res.statusCode >= 400) {
                    this.metrics.errors++;
                }
            });
            next();
        };
    }
    getMetrics() {
        return {
            ...this.metrics,
            requestsPerSecond: this.metrics.requests / (process.uptime() || 1),
            errorRate: (this.metrics.errors / Math.max(this.metrics.requests, 1)) * 100,
        };
    }
    reset() {
        this.metrics = {
            requests: 0,
            totalTime: 0,
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errors: 0,
            activeConnections: 0,
        };
    }
    now() {
        return Number(process.hrtime.bigint()) / 1000000;
    }
}
const performance = new PerformanceMonitor();
exports.default = performance;
