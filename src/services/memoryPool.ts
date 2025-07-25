class MemoryPool {
  private bufferSize: number;
  private pool: Buffer[] = [];
  private inUse: Set<Buffer> = new Set();
  private maxPoolSize: number;

  constructor(bufferSize: number = 1024 * 1024, poolSize: number = 50) {
    this.bufferSize = bufferSize;
    this.maxPoolSize = poolSize;
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(Buffer.allocUnsafe(bufferSize));
    }
  }

  acquire(): Buffer {
    let buffer: Buffer;
    if (this.pool.length > 0) {
      buffer = this.pool.pop()!;
    } else {
      buffer = Buffer.allocUnsafe(this.bufferSize);
    }
    this.inUse.add(buffer);
    return buffer;
  }

  release(buffer: Buffer): void {
    if (this.inUse.has(buffer)) {
      this.inUse.delete(buffer);
      if (this.pool.length < this.maxPoolSize) {
        buffer.fill(0);
        this.pool.push(buffer);
      }
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      bufferSize: this.bufferSize,
    };
  }
}

const memoryPool = new MemoryPool();
export default memoryPool;
