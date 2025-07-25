import os from "os";
import dotenv from "dotenv";
dotenv.config();

interface PDFConfig {
  defaultFont: string;
  pageSize: string;
  margin: number;
  bufferSize: number;
}

interface ImageConfig {
  defaultWidth: number;
  defaultHeight: number;
  backgroundColor: string;
  quality: number;
}

interface CSVConfig {
  delimiter: string;
  quote: string;
  escape: string;
  encoding: string;
}

interface AppConfig {
  port: number | string;
  nodeEnv: string;
  useCluster: boolean;
  maxFileSize: string;
  batchSize: number;
  workerPoolSize: number;
  memoryPoolSize: number;
  maxConcurrentJobs: number;
  streamHighWaterMark: number;
  allowedFormats: string[];
  pdf: PDFConfig;
  image: ImageConfig;
  csv: CSVConfig;
}

const config: AppConfig = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  useCluster: process.env.USE_CLUSTER !== "false",
  maxFileSize: process.env.MAX_FILE_SIZE || "100mb",
  batchSize: parseInt(process.env.BATCH_SIZE || "10000"),
  workerPoolSize: parseInt(
    process.env.WORKER_POOL_SIZE || String(os.cpus().length)
  ),
  memoryPoolSize: parseInt(process.env.MEMORY_POOL_SIZE || "50"),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || "10"),
  streamHighWaterMark: parseInt(
    process.env.STREAM_HIGH_WATER_MARK || String(64 * 1024)
  ),
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

export default config;
