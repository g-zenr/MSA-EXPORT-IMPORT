import { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import app from "../../src/app";

// Wrap the Express app with serverless-http
const handler = serverless(app);

export { handler };
