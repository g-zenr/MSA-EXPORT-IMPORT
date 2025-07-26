"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_csv_1 = require("fast-csv");
const pdfkit_1 = __importDefault(require("pdfkit"));
const jimp_1 = __importDefault(require("jimp"));
const saga_1 = __importDefault(require("../utils/saga"));
const logger_1 = require("../utils/logger");
class ExportController {
    constructor() {
        this.exportToCsv = async (req, res, next) => {
            const saga = new saga_1.default();
            let buffer = null;
            let logId = null;
            try {
                const { data, config: userConfig = {} } = req.body || {};
                if (!Array.isArray(data) || data.length === 0) {
                    return this.sendError(res, "Invalid or empty data array");
                }
                // Step 1: Generate CSV buffer
                saga.addStep(async () => {
                    buffer = await new Promise((resolve, reject) => {
                        const csvConfig = {
                            headers: userConfig.includeHeader !== false,
                            delimiter: typeof userConfig.delimiter === "string"
                                ? userConfig.delimiter
                                : ",",
                            quote: typeof userConfig.quote === "string" ? userConfig.quote : '"',
                            escape: typeof userConfig.escape === "string" ? userConfig.escape : '"',
                            quoteColumns: !!userConfig.quoteColumns,
                            quoteHeaders: !!userConfig.quoteHeaders,
                            writeHeaders: userConfig.includeHeader !== false,
                        };
                        const buffers = [];
                        const csvStream = (0, fast_csv_1.format)(csvConfig);
                        csvStream.on("data", (chunk) => buffers.push(chunk));
                        csvStream.on("end", () => resolve(Buffer.concat(buffers)));
                        csvStream.on("error", (error) => reject(error));
                        for (const row of data) {
                            csvStream.write(row);
                        }
                        csvStream.end();
                    });
                }, async () => {
                    // Compensation: clear buffer
                    buffer = null;
                });
                // Step 2: Log export
                saga.addStep(async () => {
                    logId = `export-${Date.now()}`;
                    logger_1.logger.info(`CSV export started: ${logId}`);
                }, async () => {
                    if (logId)
                        logger_1.logger.warn(`CSV export log reverted: ${logId}`);
                });
                // Step 3: Send response
                saga.addStep(async () => {
                    if (!buffer)
                        throw new Error("CSV buffer not generated");
                    const filename = typeof userConfig.filename === "string"
                        ? userConfig.filename
                        : "export";
                    res.setHeader("Content-Type", "text/csv");
                    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}.csv\"`);
                    res.send(buffer);
                }, async () => {
                    // Compensation: cannot unsend response, but could log
                    logger_1.logger.warn("CSV response compensation: cannot unsend response");
                });
                await saga.execute();
            }
            catch (error) {
                logger_1.logger.error("[exportToCsv][Saga] error: %O", error);
                next(error);
            }
        };
        this.exportToPdf = async (req, res, next) => {
            const saga = new saga_1.default();
            let buffer = null;
            let logId = null;
            try {
                const { data, config: userConfig = {} } = req.body || {};
                if (!Array.isArray(data)) {
                    return this.sendError(res, "Invalid or missing data array");
                }
                // Step 1: Generate PDF buffer
                saga.addStep(async () => {
                    buffer = await new Promise((resolve, reject) => {
                        const doc = new pdfkit_1.default({
                            size: userConfig.pageSize || "A4",
                            margin: userConfig.margin || 50,
                            bufferPages: true,
                            autoFirstPage: false,
                        });
                        const buffers = [];
                        doc.on("data", (chunk) => buffers.push(chunk));
                        doc.on("end", () => resolve(Buffer.concat(buffers)));
                        doc.on("error", (error) => reject(error));
                        doc.addPage();
                        const title = userConfig.title || "Data Export";
                        doc.fontSize(20).text(title, { align: "center" });
                        doc.moveDown();
                        if (data.length === 0) {
                            doc.fontSize(12).text("No data available");
                        }
                        else {
                            const headers = userConfig.headers || Object.keys(data[0]);
                            const columnWidth = (doc.page.width - 2 * doc.page.margins.left) / headers.length;
                            let yPosition = doc.y;
                            const rowHeight = 20;
                            const maxRowsPerPage = Math.floor((doc.page.height - doc.y - 50) / rowHeight);
                            doc.fontSize(12).fillColor("black");
                            headers.forEach((header, index) => {
                                doc.text(String(header), doc.page.margins.left + index * columnWidth, yPosition, {
                                    width: columnWidth - 5,
                                    align: "left",
                                    ellipsis: true,
                                });
                            });
                            yPosition += rowHeight;
                            for (let i = 0; i < data.length; i++) {
                                if (i % maxRowsPerPage === 0 && i > 0) {
                                    doc.addPage();
                                    yPosition = doc.y;
                                }
                                const row = data[i];
                                headers.forEach((header, colIndex) => {
                                    const value = row && row[header] !== undefined ? String(row[header]) : "";
                                    doc.text(value, doc.page.margins.left + colIndex * columnWidth, yPosition, {
                                        width: columnWidth - 5,
                                        align: "left",
                                        ellipsis: true,
                                    });
                                });
                                yPosition += rowHeight;
                            }
                        }
                        doc.end();
                    });
                }, async () => {
                    buffer = null;
                });
                // Step 2: Log export
                saga.addStep(async () => {
                    logId = `export-pdf-${Date.now()}`;
                    logger_1.logger.info(`PDF export started: ${logId}`);
                }, async () => {
                    if (logId)
                        logger_1.logger.warn(`PDF export log reverted: ${logId}`);
                });
                // Step 3: Send response
                saga.addStep(async () => {
                    if (!buffer)
                        throw new Error("PDF buffer not generated");
                    const filename = userConfig.filename || "export";
                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}.pdf\"`);
                    res.send(buffer);
                }, async () => {
                    logger_1.logger.warn("PDF response compensation: cannot unsend response");
                });
                await saga.execute();
            }
            catch (error) {
                logger_1.logger.error("[exportToPdf][Saga] error: %O", error);
                next(error);
            }
        };
        this.exportToImage = async (req, res, next) => {
            const saga = new saga_1.default();
            let buffer = null;
            let logId = null;
            try {
                const { data, config: userConfig = {} } = req.body || {};
                if (!Array.isArray(data)) {
                    return this.sendError(res, "Invalid or missing data array");
                }
                // Step 1: Generate image buffer
                saga.addStep(async () => {
                    buffer = await (async () => {
                        const width = userConfig.width || 800;
                        const height = userConfig.height || 600;
                        const backgroundColor = userConfig.backgroundColor || "#ffffff";
                        const title = userConfig.title || "Data Export";
                        const headers = userConfig.headers ||
                            (data.length > 0 ? Object.keys(data[0]) : []);
                        const rowHeight = 30;
                        const startY = 60;
                        const columnWidth = (width - 40) / (headers.length || 1);
                        const maxVisibleRows = Math.floor((height - startY - 30) / rowHeight);
                        const font = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_16_BLACK);
                        const fontBold = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_BLACK);
                        const image = new jimp_1.default(width, height, backgroundColor);
                        image.print(fontBold, 0, 10, {
                            text: title,
                            alignmentX: jimp_1.default.HORIZONTAL_ALIGN_CENTER,
                            alignmentY: jimp_1.default.VERTICAL_ALIGN_TOP,
                        }, width, 40);
                        headers.forEach((header, index) => {
                            image.print(font, 20 + index * columnWidth, startY, String(header).substring(0, 12), columnWidth - 5);
                        });
                        const visibleData = data.slice(0, maxVisibleRows);
                        visibleData.forEach((row, rowIndex) => {
                            headers.forEach((header, colIndex) => {
                                const value = row && row[header] !== undefined
                                    ? String(row[header]).substring(0, 15)
                                    : "";
                                image.print(font, 20 + colIndex * columnWidth, startY + (rowIndex + 1) * rowHeight, value, columnWidth - 5);
                            });
                        });
                        image.print(font, 0, height - 25, {
                            text: `Showing ${Math.min(maxVisibleRows, data.length)} of ${data.length} records`,
                            alignmentX: jimp_1.default.HORIZONTAL_ALIGN_RIGHT,
                            alignmentY: jimp_1.default.VERTICAL_ALIGN_BOTTOM,
                        }, width - 25, 20);
                        const format = (userConfig.format || "png").toLowerCase();
                        const quality = Math.round((userConfig.quality || 0.8) * 100);
                        let buf;
                        if (format === "jpg" || format === "jpeg") {
                            buf = await image.quality(quality).getBufferAsync(jimp_1.default.MIME_JPEG);
                        }
                        else {
                            buf = await image.getBufferAsync(jimp_1.default.MIME_PNG);
                        }
                        return buf;
                    })();
                }, async () => {
                    buffer = null;
                });
                // Step 2: Log export
                saga.addStep(async () => {
                    logId = `export-image-${Date.now()}`;
                    logger_1.logger.info(`Image export started: ${logId}`);
                }, async () => {
                    if (logId)
                        logger_1.logger.warn(`Image export log reverted: ${logId}`);
                });
                // Step 3: Send response
                saga.addStep(async () => {
                    if (!buffer)
                        throw new Error("Image buffer not generated");
                    const format = (userConfig.format || "png").toLowerCase();
                    const filename = userConfig.filename || "export";
                    res.setHeader("Content-Type", `image/${format}`);
                    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}.${format}\"`);
                    res.send(buffer);
                }, async () => {
                    logger_1.logger.warn("Image response compensation: cannot unsend response");
                });
                await saga.execute();
            }
            catch (error) {
                logger_1.logger.error("[exportToImage][Saga] error: %O", error);
                next(error);
            }
        };
    }
    sendError(res, message, status = 400) {
        res.status(status).json({ error: message });
    }
}
const exportController = new ExportController();
exports.default = exportController;
