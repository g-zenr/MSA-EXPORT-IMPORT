import serverless from "serverless-http";
import app from "./app";

export const handler = serverless(app, {
  binary: [
    "application/pdf",
    "application/json",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ],
  request: {
    transform: (event: any) => {
      if (event.version === "2.0") {
        return {
          ...event,
          path: event.rawPath,
          query: event.queryStringParameters || {},
          headers: event.headers || {},
          body: event.body,
          method: event.requestContext.http.method,
          url:
            event.rawPath +
            (event.rawQueryString ? "?" + event.rawQueryString : ""),
          ip: event.requestContext.http.sourceIp,
          protocol: event.requestContext.http.protocol,
          hostname: event.headers?.host || "localhost",
        };
      }
      return event;
    },
  },
  response: {
    transform: (response: any) => {
      return {
        statusCode: response.statusCode,
        headers: {
          "Content-Type":
            response.headers["content-type"] || "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          ...response.headers,
        },
        body: response.body,
        isBase64Encoded: response.isBase64Encoded || false,
      };
    },
  },
});
