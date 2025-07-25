import { Request, Response, NextFunction } from "express";
import { pipeline, Readable, Transform, TransformCallback } from "stream";
import { promisify } from "util";
import csv from "csv-parser";
import config from "../config/config";
import Saga from "../utils/saga";
import { logger } from "../utils/logger";

const pipelineAsync = promisify(pipeline);

class ImportController {
  public importFromCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const saga = new Saga();
    let results: Record<string, any>[] = [];
    let errors: { row: number; error: string }[] = [];
    let rowCount = 0;
    let columns: string[] = [];
    let logId: string | null = null;
    let duration = 0;
    const startTime = performance.now();
    try {
      // Step 1: Parse CSV
      saga.addStep(
        async () => {
          if (!req.file) {
            throw new Error("No CSV file provided");
          }
          results = [];
          errors = [];
          rowCount = 0;
          const batchProcessor = new Transform({
            objectMode: true,
            highWaterMark: config.streamHighWaterMark,
            transform(
              chunk: any,
              _encoding: BufferEncoding,
              callback: TransformCallback
            ) {
              try {
                rowCount++;
                const cleanedData: Record<string, any> = {};
                for (const key in chunk) {
                  const cleanKey = key.trim();
                  cleanedData[cleanKey] = chunk[key];
                }
                results.push(cleanedData);
                callback();
              } catch (error: any) {
                errors.push({ row: rowCount, error: error.message });
                callback();
              }
            },
          });
          const bufferStream = new Readable({
            read() {},
          });
          bufferStream.push(req.file.buffer);
          bufferStream.push(null);
          await pipelineAsync(
            bufferStream,
            csv({
              skipEmptyLines: true,
              skipLinesWithError: true,
              maxRowBytes: 1024 * 1024,
              headers: true,
              renameHeaders: true,
              strict: false,
            } as any),
            batchProcessor
          );
          columns = results.length > 0 ? Object.keys(results[0]) : [];
          duration = performance.now() - startTime;
        },
        async () => {
          // Compensation: clear results
          results = [];
          errors = [];
          rowCount = 0;
          columns = [];
        }
      );
      // Step 2: Log import
      saga.addStep(
        async () => {
          logId = `import-csv-${Date.now()}`;
          logger.info(`CSV import started: ${logId}`);
        },
        async () => {
          if (logId) logger.warn(`CSV import log reverted: ${logId}`);
        }
      );
      // Step 3: Send response
      saga.addStep(
        async () => {
          const response = {
            data: results,
            metadata: {
              rowCount,
              columns,
              errors,
              filename: req.file ? req.file.originalname : undefined,
              processingTime: `${duration.toFixed(2)}ms`,
              throughput: `${
                rowCount && duration
                  ? Math.round(rowCount / (duration / 1000))
                  : 0
              } records/sec`,
            },
          };
          res.json(response);
        },
        async () => {
          logger.warn(
            "CSV import response compensation: cannot unsend response"
          );
        }
      );
      await saga.execute();
    } catch (error) {
      logger.error("[importFromCsv][Saga] error: %O", error);
      next(error);
    }
  };
}

const importController = new ImportController();
export default importController;
