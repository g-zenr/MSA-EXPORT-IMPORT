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

// Ultra-fast middleware setup
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression({ level: 6, threshold: 1024 }));

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

const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Optimize server settings
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.maxHeadersCount = 1000;

export default app;
