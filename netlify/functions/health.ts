import { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import express from "express";
import performance from "../../src/utils/performance";

const app = express();

// Health check with performance metrics
app.get("/", (req, res) => {
  const metrics = performance.getMetrics();
  res.json({
    status: "OK",
    service: "high-performance-export-import",
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    metrics,
  });
});

const handler = serverless(app);

export { handler };
