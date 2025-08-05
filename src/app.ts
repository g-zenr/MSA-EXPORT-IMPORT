import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import config from "./config/config";
import logger from "./utils/logger";
import performance from "./utils/performance";
import errorHandler from "./middleware/errorHandler";
import exportRoutes from "./routes/export";
import importRoutes from "./routes/import";

const app: Application = express();

// Trust proxy for API Gateway
app.set("trust proxy", true);

// Ultra-fast middleware setup
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression({ level: 6, threshold: 1024 }));

// CORS middleware for testing - allows all origins
app.use((req: Request, res: Response, next) => {
  // Allow all origins for testing
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.header("Access-Control-Allow-Credentials", "false");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Optimized body parsing
app.use(
  express.json({
    limit: "100mb",
    type: ["application/json", "text/plain"],
    verify: (req: Request, res: Response, buf: Buffer) => {
      // @ts-ignore
      req.rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 50000,
  })
);

// Performance monitoring
app.use(performance.middleware);

// Routes
app.use("/api/v1/export", exportRoutes);
app.use("/api/v1/import", importRoutes);

// Health check with performance metrics
app.get("/health", (req: Request, res: Response) => {
  const metrics = performance.getMetrics();
  res.json({
    status: "OK",
    service: "high-performance-export-import",
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    metrics,
  });
});

// Error handling
app.use(errorHandler);

export default app;

// Only start the server if not running in a serverless environment
if (require.main === module) {
  const PORT = config.port || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Optimize server settings
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxHeadersCount = 1000;
}
