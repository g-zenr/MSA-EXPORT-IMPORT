import {
  Transform,
  TransformCallback,
  TransformOptions,
  pipeline,
} from "stream";
import { promisify } from "util";

export const pipelineAsync = promisify(pipeline);

export class BatchTransform<T> extends Transform {
  private batchSize: number;
  private batch: T[] = [];

  constructor(batchSize: number = 1000, options: TransformOptions = {}) {
    super({ objectMode: true, ...options });
    this.batchSize = batchSize;
  }

  _transform(chunk: T, _encoding: BufferEncoding, callback: TransformCallback) {
    this.batch.push(chunk);
    if (this.batch.length >= this.batchSize) {
      this.push(this.batch);
      this.batch = [];
    }
    callback();
  }

  _flush(callback: TransformCallback) {
    if (this.batch.length > 0) {
      this.push(this.batch);
    }
    callback();
  }
}

export class ThrottleTransform<T> extends Transform {
  private rateLimit: number;
  private count: number = 0;
  private startTime: number = Date.now();

  constructor(rateLimit: number = 1000, options: TransformOptions = {}) {
    super({ objectMode: true, ...options });
    this.rateLimit = rateLimit;
  }

  _transform(chunk: T, _encoding: BufferEncoding, callback: TransformCallback) {
    this.count++;
    const elapsed = Date.now() - this.startTime;
    const expectedTime = (this.count / this.rateLimit) * 1000;
    if (expectedTime > elapsed) {
      const delay = expectedTime - elapsed;
      setTimeout(() => {
        this.push(chunk);
        callback();
      }, delay);
    } else {
      this.push(chunk);
      callback();
    }
  }
}
