import { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import exportRoutes from "../../src/routes/export";

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

export { handler };
