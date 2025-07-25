import { format } from "fast-csv";
import PDFDocument from "pdfkit";
import Jimp from "jimp";
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
          // Compensation: clear buffer
          buffer = null;
        }
      );
      // Step 2: Log export
      saga.addStep(
        async () => {
          logId = `export-${Date.now()}`;
          logger.info(`CSV export started: ${logId}`);
        },
        async () => {
          if (logId) logger.warn(`CSV export log reverted: ${logId}`);
        }
      );
      // Step 3: Send response
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("CSV buffer not generated");
          const filename =
            typeof userConfig.filename === "string"
              ? userConfig.filename
              : "export";
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=\"${filename}.csv\"`
          );
          res.send(buffer);
        },
        async () => {
          // Compensation: cannot unsend response, but could log
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
      // Step 1: Generate PDF buffer
      saga.addStep(
        async () => {
          buffer = await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({
              size: userConfig.pageSize || "A4",
              margin: userConfig.margin || 50,
              bufferPages: true,
              autoFirstPage: false,
            });
            const buffers: Buffer[] = [];
            doc.on("data", (chunk: Buffer) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (error: Error) => reject(error));
            doc.addPage();
            const title = userConfig.title || "Data Export";
            doc.fontSize(20).text(title, { align: "center" });
            doc.moveDown();
            if (data.length === 0) {
              doc.fontSize(12).text("No data available");
            } else {
              const headers = userConfig.headers || Object.keys(data[0]);
              const columnWidth =
                (doc.page.width - 2 * doc.page.margins.left) / headers.length;
              let yPosition = doc.y;
              const rowHeight = 20;
              const maxRowsPerPage = Math.floor(
                (doc.page.height - doc.y - 50) / rowHeight
              );
              doc.fontSize(12).fillColor("black");
              headers.forEach((header: string, index: number) => {
                doc.text(
                  String(header),
                  doc.page.margins.left + index * columnWidth,
                  yPosition,
                  {
                    width: columnWidth - 5,
                    align: "left",
                    ellipsis: true,
                  }
                );
              });
              yPosition += rowHeight;
              for (let i = 0; i < data.length; i++) {
                if (i % maxRowsPerPage === 0 && i > 0) {
                  doc.addPage();
                  yPosition = doc.y;
                }
                const row = data[i];
                headers.forEach((header: string, colIndex: number) => {
                  const value =
                    row && row[header] !== undefined ? String(row[header]) : "";
                  doc.text(
                    value,
                    doc.page.margins.left + colIndex * columnWidth,
                    yPosition,
                    {
                      width: columnWidth - 5,
                      align: "left",
                      ellipsis: true,
                    }
                  );
                });
                yPosition += rowHeight;
              }
            }
            doc.end();
          });
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
      // Step 3: Send response
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("PDF buffer not generated");
          const filename = userConfig.filename || "export";
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=\"${filename}.pdf\"`
          );
          res.send(buffer);
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
      // Step 1: Generate image buffer
      saga.addStep(
        async () => {
          buffer = await (async () => {
            const width = userConfig.width || 800;
            const height = userConfig.height || 600;
            const backgroundColor = userConfig.backgroundColor || "#ffffff";
            const title = userConfig.title || "Data Export";
            const headers =
              userConfig.headers ||
              (data.length > 0 ? Object.keys(data[0]) : []);
            const rowHeight = 30;
            const startY = 60;
            const columnWidth = (width - 40) / (headers.length || 1);
            const maxVisibleRows = Math.floor(
              (height - startY - 30) / rowHeight
            );
            const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
            const fontBold = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
            const image = new Jimp(width, height, backgroundColor);
            image.print(
              fontBold,
              0,
              10,
              {
                text: title,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_TOP,
              },
              width,
              40
            );
            headers.forEach((header: string, index: number) => {
              image.print(
                font,
                20 + index * columnWidth,
                startY,
                String(header).substring(0, 12),
                columnWidth - 5
              );
            });
            const visibleData = data.slice(0, maxVisibleRows);
            visibleData.forEach((row: any, rowIndex: number) => {
              headers.forEach((header: string, colIndex: number) => {
                const value =
                  row && row[header] !== undefined
                    ? String(row[header]).substring(0, 15)
                    : "";
                image.print(
                  font,
                  20 + colIndex * columnWidth,
                  startY + (rowIndex + 1) * rowHeight,
                  value,
                  columnWidth - 5
                );
              });
            });
            image.print(
              font,
              0,
              height - 25,
              {
                text: `Showing ${Math.min(maxVisibleRows, data.length)} of ${
                  data.length
                } records`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
                alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
              },
              width - 25,
              20
            );
            const format = (userConfig.format || "png").toLowerCase();
            const quality = Math.round((userConfig.quality || 0.8) * 100);
            let buf: Buffer;
            if (format === "jpg" || format === "jpeg") {
              buf = await image.quality(quality).getBufferAsync(Jimp.MIME_JPEG);
            } else {
              buf = await image.getBufferAsync(Jimp.MIME_PNG);
            }
            return buf;
          })();
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
      // Step 3: Send response
      saga.addStep(
        async () => {
          if (!buffer) throw new Error("Image buffer not generated");
          const format = (userConfig.format || "png").toLowerCase();
          const filename = userConfig.filename || "export";
          res.setHeader("Content-Type", `image/${format}`);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=\"${filename}.${format}\"`
          );
          res.send(buffer);
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
