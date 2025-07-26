"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const util_1 = require("util");
const csv_parser_1 = __importDefault(require("csv-parser"));
const config_1 = __importDefault(require("../config/config"));
const saga_1 = __importDefault(require("../utils/saga"));
const logger_1 = require("../utils/logger");
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
class ImportController {
    constructor() {
        this.importFromCsv = async (req, res, next) => {
            const saga = new saga_1.default();
            let results = [];
            let errors = [];
            let rowCount = 0;
            let columns = [];
            let logId = null;
            let duration = 0;
            const startTime = performance.now();
            try {
                // Step 1: Parse CSV
                saga.addStep(async () => {
                    if (!req.file) {
                        throw new Error("No CSV file provided");
                    }
                    results = [];
                    errors = [];
                    rowCount = 0;
                    const batchProcessor = new stream_1.Transform({
                        objectMode: true,
                        highWaterMark: config_1.default.streamHighWaterMark,
                        transform(chunk, _encoding, callback) {
                            try {
                                rowCount++;
                                const cleanedData = {};
                                for (const key in chunk) {
                                    const cleanKey = key.trim();
                                    cleanedData[cleanKey] = chunk[key];
                                }
                                results.push(cleanedData);
                                callback();
                            }
                            catch (error) {
                                errors.push({ row: rowCount, error: error.message });
                                callback();
                            }
                        },
                    });
                    const bufferStream = new stream_1.Readable({
                        read() { },
                    });
                    bufferStream.push(req.file.buffer);
                    bufferStream.push(null);
                    await pipelineAsync(bufferStream, (0, csv_parser_1.default)({
                        skipEmptyLines: true,
                        skipLinesWithError: true,
                        maxRowBytes: 1024 * 1024,
                        headers: true,
                        renameHeaders: true,
                        strict: false,
                    }), batchProcessor);
                    columns = results.length > 0 ? Object.keys(results[0]) : [];
                    duration = performance.now() - startTime;
                }, async () => {
                    // Compensation: clear results
                    results = [];
                    errors = [];
                    rowCount = 0;
                    columns = [];
                });
                // Step 2: Log import
                saga.addStep(async () => {
                    logId = `import-csv-${Date.now()}`;
                    logger_1.logger.info(`CSV import started: ${logId}`);
                }, async () => {
                    if (logId)
                        logger_1.logger.warn(`CSV import log reverted: ${logId}`);
                });
                // Step 3: Send response
                saga.addStep(async () => {
                    const response = {
                        data: results,
                        metadata: {
                            rowCount,
                            columns,
                            errors,
                            filename: req.file ? req.file.originalname : undefined,
                            processingTime: `${duration.toFixed(2)}ms`,
                            throughput: `${rowCount && duration
                                ? Math.round(rowCount / (duration / 1000))
                                : 0} records/sec`,
                        },
                    };
                    res.json(response);
                }, async () => {
                    logger_1.logger.warn("CSV import response compensation: cannot unsend response");
                });
                await saga.execute();
            }
            catch (error) {
                logger_1.logger.error("[importFromCsv][Saga] error: %O", error);
                next(error);
            }
        };
    }
}
const importController = new ImportController();
exports.default = importController;
