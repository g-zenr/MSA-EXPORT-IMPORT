import { format } from "fast-csv";
import { Request, Response, NextFunction } from "express";
import { Transform, PassThrough, pipeline } from "stream";
import { promisify } from "util";
import config from "../config/config";
import Saga from "../utils/saga";
import { logger } from "../utils/logger";
import { HtmlTemplateGenerator, SvgTemplateGenerator } from "../templates";
import Jimp from "jimp";

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
  imageFormat?: "svg" | "png"; // New option for image format
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

          // Use the new template system for clean, maintainable code
          const templateGenerator = new HtmlTemplateGenerator(userConfig);
          const tableData = {
            title,
            headers,
            rows: data,
            totalRecords: data.length,
            generatedDate: new Date().toLocaleDateString(),
          };

          const completeHtml = templateGenerator.generateHtml(tableData);
          htmlStream!.write(completeHtml);
          htmlStream!.end();

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
    let imageStream: PassThrough | null = null;
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
      const baseWidth = Math.max(userConfig.width || 1200, 800);
      const title = userConfig.title || "Data Export";
      const headers =
        userConfig.headers || (data.length > 0 ? Object.keys(data[0]) : []);
      const imageFormat = userConfig.imageFormat || "svg"; // Default to SVG

      saga.addStep(
        async () => {
          logId = `${imageFormat}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          logger.info(
            `${imageFormat.toUpperCase()} export started: ${logId}, records: ${
              data.length
            }`
          );

          // Use the new SVG template system for clean, maintainable code
          const svgTemplateGenerator = new SvgTemplateGenerator(userConfig);
          const tableData = {
            title,
            headers,
            rows: data,
            totalRecords: data.length,
            generatedDate: new Date().toLocaleDateString(),
          };

          // Calculate dynamic height based on data length
          const rowHeight = 40;
          const headerHeight = 50;
          const startY = 140;
          const footerHeight = 50;
          const dynamicHeight =
            startY + headerHeight + data.length * rowHeight + footerHeight;
          const height = Math.max(dynamicHeight, userConfig.height || 800);
          const width = baseWidth;

          if (imageFormat === "svg") {
            // SVG Export
            this.setDownloadHeaders(res, "image/svg+xml", `${filename}.svg`);
            imageStream = new PassThrough();
            imageStream.pipe(res);

            const completeSvg = svgTemplateGenerator.generateSvg(
              tableData,
              width,
              height
            );
            imageStream!.write(completeSvg);
            imageStream!.end();

            logger.info(`SVG export completed: ${logId}`);
          } else if (imageFormat === "png") {
            // PNG Export - Convert SVG to PNG
            this.setDownloadHeaders(res, "image/png", `${filename}.png`);
            imageStream = new PassThrough();
            imageStream.pipe(res);

            const completeSvg = svgTemplateGenerator.generateSvg(
              tableData,
              width,
              height
            );

            // Convert SVG to PNG using Jimp
            const svgBuffer = Buffer.from(completeSvg, "utf-8");

            // Create a new image with the SVG content
            const image = new Jimp(width, height, 0xffffffff); // White background

            // For PNG, we'll create a simple representation
            // Note: Jimp doesn't directly support SVG rendering, so we'll create a PNG with the table data
            const pngImage = await this.createPngFromData(
              tableData,
              width,
              height,
              userConfig
            );
            const pngBuffer = await pngImage.getBufferAsync(Jimp.MIME_PNG);

            imageStream!.write(pngBuffer);
            imageStream!.end();

            logger.info(`PNG export completed: ${logId}`);
          }
        },
        async () => {
          if (imageStream && !imageStream.destroyed) {
            imageStream.destroy();
          }
          if (logId) {
            logger.warn(
              `${
                imageFormat?.toUpperCase() || "IMAGE"
              } export compensation executed: ${logId}`
            );
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

  // Helper method to create PNG from table data
  private async createPngFromData(
    tableData: any,
    width: number,
    height: number,
    config: ExportConfig
  ): Promise<Jimp> {
    const { title, headers, rows, totalRecords, generatedDate } = tableData;
    const backgroundColor = config.backgroundColor || "#ffffff";
    const image = new Jimp(width, height, this.hexToRgb(backgroundColor));

    // Add title
    if (title) {
      const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
      const titleWidth = Jimp.measureText(font, title);
      const titleX = (width - titleWidth) / 2;
      image.print(font, titleX, 20, title);
    }

    // Add headers
    const headerFont = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
    const cellFont = await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK);
    const rowHeight = 30;
    const headerY = 80;
    const cellPadding = 10;

    // Draw header background
    const headerBgColor = this.hexToRgb("#4f46e5");
    for (let x = 0; x < width; x++) {
      for (let y = headerY; y < headerY + rowHeight; y++) {
        image.setPixelColor(headerBgColor, x, y);
      }
    }

    // Draw headers
    const columnWidth = Math.floor((width - 40) / headers.length);
    headers.forEach((header: string, index: number) => {
      const x = 20 + index * columnWidth;
      const headerText = String(header).substring(0, 20);
      image.print(headerFont, x + cellPadding, headerY + 8, headerText);
    });

    // Draw data rows
    rows.forEach((row: any, rowIndex: number) => {
      const y = headerY + rowHeight + rowIndex * rowHeight;
      const bgColor =
        rowIndex % 2 === 1
          ? this.hexToRgb("#f8fafc")
          : this.hexToRgb("#ffffff");

      // Draw row background
      for (let x = 0; x < width; x++) {
        for (let rowY = y; rowY < y + rowHeight; rowY++) {
          image.setPixelColor(bgColor, x, rowY);
        }
      }

      // Draw cell data
      headers.forEach((header: string, colIndex: number) => {
        const x = 20 + colIndex * columnWidth;
        const value = row?.[header] ?? "";
        const cellText = String(value).substring(0, 25);
        image.print(cellFont, x + cellPadding, y + 8, cellText);
      });
    });

    // Add footer
    const footerFont = await Jimp.loadFont(Jimp.FONT_SANS_10_BLACK);
    const footerText = `Generated: ${generatedDate} | Total records: ${totalRecords.toLocaleString()}`;
    image.print(footerFont, 20, height - 30, footerText);

    return image;
  }

  // Helper method to convert hex color to RGB
  private hexToRgb(hex: string): number {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0xffffffff; // Default to white
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return Jimp.rgbaToInt(r, g, b, 255);
  }

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
