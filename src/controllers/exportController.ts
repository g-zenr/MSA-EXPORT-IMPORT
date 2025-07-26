import { format } from "fast-csv";
import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import Saga from "../utils/saga";
import { logger } from "../utils/logger";

export type ExportType = "csv" | "pdf" | "image";

class ExportController {
  private sendError(res: Response, message: string, status = 400) {
    res.status(status).json({ error: message });
  }

  public exportToCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const saga = new Saga();
    let buffer: Buffer | null = null;
    let logId: string | null = null;

    try {
      const { data, config: userConfig = {} } = req.body || {};
      if (!Array.isArray(data) || data.length === 0) {
        return this.sendError(res, "Invalid or empty data array");
      }

      // Step 1: Generate CSV buffer
      saga.addStep(
        async () => {
          buffer = await new Promise<Buffer>((resolve, reject) => {
            const csvConfig = {
              headers: userConfig.includeHeader !== false,
              delimiter:
                typeof userConfig.delimiter === "string"
                  ? userConfig.delimiter
                  : ",",
              quote:
                typeof userConfig.quote === "string" ? userConfig.quote : '"',
              escape:
                typeof userConfig.escape === "string" ? userConfig.escape : '"',
              quoteColumns: !!userConfig.quoteColumns,
              quoteHeaders: !!userConfig.quoteHeaders,
              writeHeaders: userConfig.includeHeader !== false,
            };

            const buffers: Buffer[] = [];
            const csvStream = format(csvConfig);

            csvStream.on("data", (chunk: Buffer) => buffers.push(chunk));
            csvStream.on("end", () => resolve(Buffer.concat(buffers)));
            csvStream.on("error", (error: Error) => reject(error));

            for (const row of data) {
              csvStream.write(row);
            }
            csvStream.end();
          });
        },
        async () => {
          buffer = null;
        }
      );

      // Step 2: Log export
      saga.addStep(
        async () => {
          logId = `export-csv-${Date.now()}`;
          logger.info(`CSV export started: ${logId}`);
        },
        async () => {
          if (logId) logger.warn(`CSV export log reverted: ${logId}`);
        }
      );

      // Step 3: Send downloadable response
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("CSV buffer not generated");

          const filename =
            typeof userConfig.filename === "string"
              ? userConfig.filename
              : "export";

          // Set headers for downloadable file
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.csv"`
          );
          res.setHeader("Content-Length", buffer.length.toString());
          res.setHeader("Cache-Control", "no-cache");

          // Send the buffer directly
          res.end(buffer);
        },
        async () => {
          logger.warn("CSV response compensation: cannot unsend response");
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error("[exportToCsv][Saga] error: %O", error);
      next(error);
    }
  };

  public exportToPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const saga = new Saga();
    let buffer: Buffer | null = null;
    let logId: string | null = null;

    try {
      const { data, config: userConfig = {} } = req.body || {};
      if (!Array.isArray(data)) {
        return this.sendError(res, "Invalid or missing data array");
      }

      // Step 1: Generate PDF-like HTML content (lighter approach)
      saga.addStep(
        async () => {
          const title = userConfig.title || "Data Export";
          const headers =
            userConfig.headers || (data.length > 0 ? Object.keys(data[0]) : []);

          let tableRows = "";
          if (data.length === 0) {
            tableRows =
              '<tr><td colspan="100%" style="text-align: center; padding: 20px;">No data available</td></tr>';
          } else {
            tableRows = data
              .map((row) => {
                const cells = headers
                  .map((header: string) => {
                    const value =
                      row && row[header] !== undefined
                        ? String(row[header])
                        : "";
                    return `<td style="padding: 12px; border: 1px solid #ddd; word-wrap: break-word;">${value}</td>`;
                  })
                  .join("");
                return `<tr>${cells}</tr>`;
              })
              .join("");
          }

          const headerRow = headers
            .map(
              (header: string) =>
                `<th style="padding: 12px; border: 1px solid #ddd; background-color: #f8f9fa; font-weight: bold; text-align: left;">${header}</th>`
            )
            .join("");

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>${title}</title>
              <style>
                @page { 
                  size: ${userConfig.pageSize || "A4"}; 
                  margin: ${userConfig.margin || "20mm"}; 
                }
                body { 
                  font-family: 'Arial', sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  line-height: 1.6;
                  color: #333;
                }
                h1 { 
                  text-align: center; 
                  color: #2c3e50; 
                  margin-bottom: 30px;
                  font-size: 24px;
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-top: 20px;
                  font-size: 12px;
                }
                th { 
                  background-color: #f8f9fa !important;
                  -webkit-print-color-adjust: exact;
                }
                th, td { 
                  text-align: left; 
                  word-break: break-word; 
                  max-width: 200px;
                }
                tr:nth-child(even) {
                  background-color: #f9f9f9;
                  -webkit-print-color-adjust: exact;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 10px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <table>
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
              <div class="footer">
                Generated on ${new Date().toLocaleString()} | Total records: ${
            data.length
          }
              </div>
            </body>
            </html>
          `;

          buffer = Buffer.from(htmlContent, "utf8");
        },
        async () => {
          buffer = null;
        }
      );

      // Step 2: Log export
      saga.addStep(
        async () => {
          logId = `export-pdf-${Date.now()}`;
          logger.info(`PDF export started: ${logId}`);
        },
        async () => {
          if (logId) logger.warn(`PDF export log reverted: ${logId}`);
        }
      );

      // Step 3: Send downloadable HTML (can be printed to PDF)
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("PDF buffer not generated");

          const filename = userConfig.filename || "export";

          // Set headers for downloadable HTML file (user can print to PDF)
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.html"`
          );
          res.setHeader("Content-Length", buffer.length.toString());
          res.setHeader("Cache-Control", "no-cache");

          res.end(buffer);
        },
        async () => {
          logger.warn("PDF response compensation: cannot unsend response");
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error("[exportToPdf][Saga] error: %O", error);
      next(error);
    }
  };

  public exportToImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const saga = new Saga();
    let buffer: Buffer | null = null;
    let logId: string | null = null;

    try {
      const { data, config: userConfig = {} } = req.body || {};
      if (!Array.isArray(data)) {
        return this.sendError(res, "Invalid or missing data array");
      }

      // Step 1: Generate SVG image (lightweight and scalable)
      saga.addStep(
        async () => {
          const width = userConfig.width || 800;
          const height = userConfig.height || 600;
          const backgroundColor = userConfig.backgroundColor || "#ffffff";
          const title = userConfig.title || "Data Export";
          const headers =
            userConfig.headers || (data.length > 0 ? Object.keys(data[0]) : []);

          const rowHeight = 30;
          const startY = 80;
          const columnWidth = Math.max(
            120,
            (width - 40) / (headers.length || 1)
          );
          const maxVisibleRows = Math.floor((height - startY - 50) / rowHeight);

          let tableContent = "";

          // Title
          tableContent += `
            <text x="${
              width / 2
            }" y="40" font-family="Arial, sans-serif" font-size="24" 
                  font-weight="bold" text-anchor="middle" fill="#2c3e50">${title}</text>
          `;

          // Header background rectangles
          headers.forEach((header: string, index: number) => {
            tableContent += `
              <rect x="${20 + index * columnWidth}" y="${startY - 25}" 
                    width="${columnWidth - 2}" height="25" 
                    fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
            `;
          });

          // Headers
          headers.forEach((header: string, index: number) => {
            const headerText = String(header).substring(0, 15);
            tableContent += `
              <text x="${25 + index * columnWidth}" y="${startY - 8}" 
                    font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                    fill="#495057">${headerText}</text>
            `;
          });

          // Data rows
          const visibleData = data.slice(0, maxVisibleRows);
          visibleData.forEach((row: any, rowIndex: number) => {
            const yPos = startY + rowIndex * rowHeight;

            // Row background (alternating colors)
            const fillColor = rowIndex % 2 === 0 ? "#ffffff" : "#f8f9fa";
            tableContent += `
              <rect x="20" y="${yPos}" width="${
              headers.length * columnWidth - 2
            }" 
                    height="${rowHeight - 2}" fill="${fillColor}" 
                    stroke="#dee2e6" stroke-width="0.5"/>
            `;

            // Row data
            headers.forEach((header: string, colIndex: number) => {
              const value =
                row && row[header] !== undefined
                  ? String(row[header]).substring(0, 18)
                  : "";
              tableContent += `
                <text x="${25 + colIndex * columnWidth}" y="${yPos + 20}" 
                      font-family="Arial, sans-serif" font-size="12" fill="#495057">${value}</text>
              `;
            });
          });

          // Footer info
          tableContent += `
            <text x="${width - 20}" y="${
            height - 20
          }" font-family="Arial, sans-serif" 
                  font-size="11" text-anchor="end" fill="#6c757d">
              Showing ${Math.min(maxVisibleRows, data.length)} of ${
            data.length
          } records
            </text>
            <text x="20" y="${height - 20}" font-family="Arial, sans-serif" 
                  font-size="11" fill="#6c757d">
              Generated on ${new Date().toLocaleDateString()}
            </text>
          `;

          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="${backgroundColor}"/>
              ${tableContent}
            </svg>
          `;

          buffer = Buffer.from(svgContent, "utf8");
        },
        async () => {
          buffer = null;
        }
      );

      // Step 2: Log export
      saga.addStep(
        async () => {
          logId = `export-image-${Date.now()}`;
          logger.info(`Image export started: ${logId}`);
        },
        async () => {
          if (logId) logger.warn(`Image export log reverted: ${logId}`);
        }
      );

      // Step 3: Send downloadable SVG
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("Image buffer not generated");

          const filename = userConfig.filename || "export";

          // Set headers for downloadable SVG file
          res.setHeader("Content-Type", "image/svg+xml");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.svg"`
          );
          res.setHeader("Content-Length", buffer.length.toString());
          res.setHeader("Cache-Control", "no-cache");

          res.end(buffer);
        },
        async () => {
          logger.warn("Image response compensation: cannot unsend response");
        }
      );

      await saga.execute();
    } catch (error) {
      logger.error("[exportToImage][Saga] error: %O", error);
      next(error);
    }
  };
}

const exportController = new ExportController();
export default exportController;
