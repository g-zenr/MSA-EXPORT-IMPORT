"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    useCluster: process.env.USE_CLUSTER !== "false",
    maxFileSize: process.env.MAX_FILE_SIZE || "100mb",
    batchSize: parseInt(process.env.BATCH_SIZE || "10000"),
    workerPoolSize: parseInt(process.env.WORKER_POOL_SIZE || String(os_1.default.cpus().length)),
    memoryPoolSize: parseInt(process.env.MEMORY_POOL_SIZE || "50"),
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || "10"),
    streamHighWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK || String(64 * 1024)),
    allowedFormats: ["csv", "pdf", "png", "jpg"],
    pdf: {
        defaultFont: "Helvetica",
        pageSize: "A4",
        margin: 50,
        bufferSize: 1024 * 1024,
    },
    image: {
        defaultWidth: 800,
        defaultHeight: 600,
        backgroundColor: "#ffffff",
        quality: 0.8,
    },
    csv: {
        delimiter: ",",
        quote: '"',
        escape: '"',
        encoding: "utf8",
    },
};
exports.default = config;
