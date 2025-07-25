"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBenchmark = runBenchmark;
const autocannon_1 = __importDefault(require("autocannon"));
const app_1 = __importDefault(require("../src/app"));
async function runBenchmark() {
    const server = app_1.default.listen(3001);
    console.log("🚀 Starting performance benchmark...\n");
    const testData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 50) + 18,
        city: ["New York", "Los Angeles", "Chicago", "Houston"][Math.floor(Math.random() * 4)],
    }));
    const testPayload = JSON.stringify({ data: testData });
    // CSV Export Benchmark
    console.log("📊 CSV Export Benchmark (10k records):");
    const csvResult = await (0, autocannon_1.default)({
        url: "http://localhost:3001/api/v1/export/csv",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: testPayload,
        connections: 10,
        duration: 30,
        pipelining: 1,
    });
    console.log(`Requests/sec: ${csvResult.requests.mean}`);
    console.log(`Latency: ${csvResult.latency.mean}ms\n`);
    // PDF Export Benchmark
    console.log("📄 PDF Export Benchmark (10k records):");
    const pdfResult = await (0, autocannon_1.default)({
        url: "http://localhost:3001/api/v1/export/pdf",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: testPayload,
        connections: 5,
        duration: 30,
        pipelining: 1,
    });
    console.log(`Requests/sec: ${pdfResult.requests.mean}`);
    console.log(`Latency: ${pdfResult.latency.mean}ms\n`);
    // Image Export Benchmark
    console.log("🖼️ Image Export Benchmark (10k records):");
    const imageResult = await (0, autocannon_1.default)({
        url: "http://localhost:3001/api/v1/export/image",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: testPayload,
        connections: 5,
        duration: 30,
        pipelining: 1,
    });
    console.log(`Requests/sec: ${imageResult.requests.mean}`);
    console.log(`Latency: ${imageResult.latency.mean}ms\n`);
    server.close();
    console.log("✅ Benchmark complete!");
}
if (require.main === module) {
    runBenchmark().catch(console.error);
}
