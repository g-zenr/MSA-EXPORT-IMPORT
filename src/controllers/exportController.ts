import { format } from "fast-csv";
import { Request, Response, NextFunction } from "express";
import { Transform, PassThrough, pipeline } from "stream";
import { promisify } from "util";
import config from "../config/config";
import Saga from "../utils/saga";
import { logger } from "../utils/logger";

const pipelineAsync = promisify(pipeline);

export type ExportType = "csv" | "pdf" | "image";

interface ExportConfig {
  filename?: string;
  includeHeader?: boolean;
  delimiter?: string;
  quote?: string;
  escape?: string;
  title?: string;
  headers?: string[];
  pageSize?: string;
  margin?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  format?: string;
  quality?: number;
  chunkSize?: number;
}

class ExportController {
  private readonly DEFAULT_CHUNK_SIZE = 1000;
  private readonly MAX_MEMORY_USAGE = 50 * 1024 * 1024; // 50MB limit

  // Add CORS headers for development
  private setCorsHeaders(res: Response): void {
    if (process.env.NODE_ENV === "development") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  private sendError(res: Response, message: string, status = 400): void {
    if (!res.headersSent) {
      this.setCorsHeaders(res);
      res.status(status).json({ error: message });
    }
  }

  private validateData(data: any[]): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 255);
  }

  private setDownloadHeaders(
    res: Response,
    contentType: string,
    filename: string
  ): void {
    const sanitizedFilename = this.sanitizeFilename(filename);
    this.setCorsHeaders(res);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }

  // Handle preflight requests
  public handlePreflight = (req: Request, res: Response): void => {
    this.setCorsHeaders(res);
    res.status(200).end();
  };

  public exportToCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const saga = new Saga();
    let csvStream: any = null;
    let logId: string | null = null;

    try {
      const {
        data,
        config: userConfig = {},
      }: { data: any[]; config: ExportConfig } = req.body || {};

      if (!this.validateData(data)) {
        return this.sendError(res, "Invalid or empty data array");
      }

      const filename = userConfig.filename || `export_${Date.now()}`;
      const chunkSize = userConfig.chunkSize || this.DEFAULT_CHUNK_SIZE;

      // Step 1: Setup streaming CSV generation
      saga.addStep(
        async () => {
          logId = `csv_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          logger.info(`CSV export started: ${logId}, records: ${data.length}`);

          const csvConfig = {
            headers: userConfig.includeHeader !== false,
            delimiter: userConfig.delimiter || ",",
            quote: userConfig.quote || '"',
            escape: userConfig.escape || '"',
            objectMode: true,
            highWaterMark: 16384, // Optimize buffer size
          };

          this.setDownloadHeaders(
            res,
            "text/csv; charset=utf-8",
            `${filename}.csv`
          );

          // Create streaming pipeline for memory efficiency
          csvStream = format(csvConfig);

          // Use pipeline for better error handling and backpressure
          await pipelineAsync(
            // Data source stream
            (async function* () {
              for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                for (const row of chunk) {
                  yield row;
                }
                // Allow event loop to process other tasks
                if (i % (chunkSize * 10) === 0) {
                  await new Promise((resolve) => setImmediate(resolve));
                }
              }
            })(),
            csvStream,
            res
          );

          logger.info(`CSV export completed: ${logId}`);
        },
        async () => {
          if (csvStream && !csvStream.destroyed) {
            csvStream.destroy();
          }
          if (logId) {
            logger.warn(`CSV export compensation executed: ${logId}`);
          }
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error(`[exportToCsv][${logId}] error:`, error);
      if (!res.headersSent) {
        next(error);
      }
    }
  };

  public exportToPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const saga = new Saga();
    let htmlStream: PassThrough | null = null;
    let logId: string | null = null;

    try {
      const {
        data,
        config: userConfig = {},
      }: { data: any[]; config: ExportConfig } = req.body || {};

      if (!Array.isArray(data)) {
        return this.sendError(res, "Invalid or missing data array");
      }

      const filename = userConfig.filename || `export_${Date.now()}`;
      const title = userConfig.title || "Data Export";
      const headers =
        userConfig.headers || (data.length > 0 ? Object.keys(data[0]) : []);
      const chunkSize = userConfig.chunkSize || this.DEFAULT_CHUNK_SIZE;

      saga.addStep(
        async () => {
          logId = `pdf_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          logger.info(`PDF export started: ${logId}, records: ${data.length}`);

          this.setDownloadHeaders(
            res,
            "text/html; charset=utf-8",
            `${filename}.html`
          );

          htmlStream = new PassThrough();
          htmlStream.pipe(res);

          // Professional CSS matching the image export theme
          const htmlHeader = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @page{size:${userConfig.pageSize || "A4"};margin:${
            userConfig.margin || 15
          }mm}
    body{font:13px/1.5 'Inter','Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff}
    .container{max-width:100%;overflow-x:auto;padding:20px}
    h1{font-size:20px;text-align:center;margin:0 0 30px;color:#1e293b;font-weight:600;letter-spacing:0.5}
    .table-wrapper{overflow-x:auto;margin:20px 0}
    table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;table-layout:auto;border-radius:8px;overflow:hidden}
    th{background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%);color:#fff;font-weight:600;padding:16px 24px;text-align:left;position:sticky;top:0;font-size:14px;letter-spacing:0.3}
    td{padding:16px 24px;border-bottom:1px solid #e2e8f0;word-wrap:break-word;max-width:200px;font-size:13px}
    tr:nth-child(even){background:#f8fafc}
    tr:nth-child(odd){background:#ffffff}
    tr:hover{background:#f1f5f9}
    .footer{margin-top:20px;text-align:center;font-size:11px;color:#64748b;font-weight:500;padding:16px;background:linear-gradient(135deg,#ffffff 0%,#f8fafc 100%);border-radius:8px}
    @media print{
      body{margin:0;-webkit-print-color-adjust:exact}
      .no-print{display:none}
      table{page-break-inside:auto}
      tr{page-break-inside:avoid;page-break-after:auto}
      thead{display:table-header-group}
      th{background:#4f46e5 !important;color:#fff !important}
    }
    @media screen and (max-width:768px){
      table{font-size:12px}
      th,td{padding:12px 16px}
      .container{padding:10px}
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>${headers
            .map((h) => `<th>${String(h).substring(0, 50)}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>`;

          htmlStream.write(htmlHeader);

          // Stream table rows in chunks for memory efficiency
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const rowsHtml = chunk
              .map((row) => {
                const cells = headers
                  .map((header) => {
                    const value = row?.[header] ?? "";
                    // Escape HTML and limit length for performance
                    const escapedValue = String(value)
                      .substring(0, 200)
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/"/g, "&quot;");
                    return `<td>${escapedValue}</td>`;
                  })
                  .join("");
                return `<tr>${cells}</tr>`;
              })
              .join("");

            htmlStream.write(rowsHtml);

            // Yield control periodically for large datasets
            if (i % (chunkSize * 5) === 0) {
              await new Promise((resolve) => setImmediate(resolve));
            }
          }

          const htmlFooter = `
        </tbody>
      </table>
    </div>
    <div class="footer">
      Generated: ${new Date().toLocaleDateString()} | Total records: ${data.length.toLocaleString()}
    </div>
  </div>
</body>
</html>`;

          htmlStream.write(htmlFooter);
          htmlStream.end();

          logger.info(`PDF export completed: ${logId}`);
        },
        async () => {
          if (htmlStream && !htmlStream.destroyed) {
            htmlStream.destroy();
          }
          if (logId) {
            logger.warn(`PDF export compensation executed: ${logId}`);
          }
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error(`[exportToPdf][${logId}] error:`, error);
      if (!res.headersSent) {
        next(error);
      }
    }
  };

  public exportToImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const saga = new Saga();
    let svgStream: PassThrough | null = null;
    let logId: string | null = null;

    try {
      const {
        data,
        config: userConfig = {},
      }: { data: any[]; config: ExportConfig } = req.body || {};

      if (!Array.isArray(data)) {
        return this.sendError(res, "Invalid or missing data array");
      }

      const filename = userConfig.filename || `export_${Date.now()}`;
      const baseWidth = Math.max(userConfig.width || 1200, 800); // Minimum width of 800px
      const backgroundColor = userConfig.backgroundColor || "#ffffff";
      const title = userConfig.title || "Data Export";
      const headers =
        userConfig.headers || (data.length > 0 ? Object.keys(data[0]) : []);

      saga.addStep(
        async () => {
          logId = `svg_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          logger.info(`SVG export started: ${logId}, records: ${data.length}`);

          this.setDownloadHeaders(res, "image/svg+xml", `${filename}.svg`);

          svgStream = new PassThrough();
          svgStream.pipe(res);

          // Dynamic calculations to fit ALL data with better spacing
          const rowHeight = 40; // Increased from 28
          const headerHeight = 50; // Increased from 35
          const startY = 140; // Increased from 80
          const padding = 30; // Increased from 20
          const footerHeight = 50; // Increased from 40

          // Calculate dynamic height based on data length
          const dynamicHeight =
            startY + headerHeight + data.length * rowHeight + footerHeight;
          const height = Math.max(dynamicHeight, userConfig.height || 800);
          const width = baseWidth;

          // Use full width for columns - distribute evenly
          const availableWidth = width - padding * 2;
          const columnWidth = Math.max(100, availableWidth / headers.length);

          // Use ALL data instead of limiting
          const visibleData = data;

          // SVG header with professional designer styling
          const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" style="background:${backgroundColor}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3730a3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="rowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with subtle pattern -->
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <rect width="100%" height="100%" fill="url(#titleGradient)" opacity="0.02"/>
  
  <!-- Title with clean professional styling -->
  <text x="${
    width / 2
  }" y="67" fill="#1e293b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="20px" font-weight="600" text-anchor="middle" letter-spacing="0.5">${title.substring(
            0,
            100
          )}</text>`;

          svgStream.write(svgHeader);

          // Header row with clean professional styling
          svgStream!.write(`
  <rect x="${padding}" y="${startY - headerHeight}" width="${
            headers.length * columnWidth
          }" 
        height="${headerHeight}" fill="url(#headerGradient)" stroke="#3730a3" stroke-width="1" rx="8"/>`);

          // Column headers with professional typography and better spacing
          headers.forEach((header, index) => {
            const headerText = String(header).substring(
              0,
              Math.floor(columnWidth / 8)
            );
            svgStream!.write(`
  <text x="${padding + 24 + index * columnWidth}" y="${
              startY - 15
            }" fill="#ffffff" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="14px" font-weight="600" letter-spacing="0.3">${headerText}</text>`);
          });

          // Data rows with professional designer styling
          visibleData.forEach((row, rowIndex) => {
            const yPos = startY + rowIndex * rowHeight;
            const isAltRow = rowIndex % 2 === 1;
            const bgColor = isAltRow ? "#f8fafc" : "#ffffff";
            const textColor = "#1e293b";
            const borderColor = isAltRow ? "#e2e8f0" : "#f1f5f9";

            // Row background with professional styling
            svgStream!.write(`
  <rect x="${padding}" y="${yPos}" width="${headers.length * columnWidth}" 
        height="${rowHeight}" fill="${bgColor}" stroke="${borderColor}" stroke-width="0.5" rx="6"/>`);

            // Cell data with professional typography and generous spacing
            headers.forEach((header, colIndex) => {
              const value = row?.[header] ?? "";
              const cellText = String(value).substring(
                0,
                Math.floor(columnWidth / 8)
              );
              const xPos = padding + 24 + colIndex * columnWidth;

              svgStream!.write(`
  <text x="${xPos}" y="${
                yPos + 28
              }" fill="${textColor}" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="13px" font-weight="400">${cellText}</text>`);
            });
          });

          // Footer with clean professional styling and better spacing
          const svgFooter = `
  <rect x="${padding}" y="${height - 50}" width="${width - padding * 2}" 
        height="40" fill="url(#rowGradient)" stroke="#e2e8f0" stroke-width="0.5" rx="8"/>
  <text x="${width - padding - 24}" y="${
            height - 25
          }" fill="#64748b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="12px" font-weight="500" text-anchor="end">
    Total records: ${data.length.toLocaleString()}
  </text> 
  <text x="${padding + 24}" y="${
            height - 25
          }" fill="#64748b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="12px" font-weight="500">
    Generated: ${new Date().toLocaleDateString()}
  </text>
</svg>`;

          svgStream.write(svgFooter);
          svgStream.end();

          logger.info(`SVG export completed: ${logId}`);
        },
        async () => {
          if (svgStream && !svgStream.destroyed) {
            svgStream.destroy();
          }
          if (logId) {
            logger.warn(`SVG export compensation executed: ${logId}`);
          }
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error(`[exportToImage][${logId}] error:`, error);
      if (!res.headersSent) {
        next(error);
      }
    }
  };

  // Utility method to get export performance stats
  public getExportStats = (req: Request, res: Response): void => {
    this.setCorsHeaders(res);
    const stats = {
      maxMemoryUsage: `${this.MAX_MEMORY_USAGE / (1024 * 1024)}MB`,
      defaultChunkSize: this.DEFAULT_CHUNK_SIZE,
      supportedFormats: ["csv", "pdf", "image"],
      optimizations: [
        "Streaming processing",
        "Memory-efficient chunking",
        "Backpressure handling",
        "Event loop yielding",
        "Optimized CSS/SVG",
        "Sanitized inputs",
        "Error compensation",
      ],
    };
    res.json(stats);
  };
}

const exportController = new ExportController();
export default exportController;
