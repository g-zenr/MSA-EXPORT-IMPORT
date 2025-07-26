const serverless = require("serverless-http");
const express = require("express");

// Import the compiled performance utility
const performance = require("../../dist/utils/performance");

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

exports.handler = handler;
