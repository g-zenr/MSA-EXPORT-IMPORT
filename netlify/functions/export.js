const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// Import the compiled routes
const exportRoutes = require("../../dist/routes/export");

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Export routes
app.use("/", exportRoutes);

const handler = serverless(app);

module.exports = { handler };
