import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startCrawlerWorkers(): void {
  const workerCount = Number(process.env.WORKER_COUNT ?? "4");
  const concurrencyPerWorker = Number(process.env.CONCURRENCY_PER_WORKER ?? "8");

  for (let i = 0; i < workerCount; i++) {
    new Worker(path.join(__dirname, "crawler.worker.js"), {
      env: {
        ...process.env,
        CONCURRENCY_PER_WORKER: concurrencyPerWorker.toString(),
      },
    });
  }

  console.log(
    `Started ${workerCount} workers with ${concurrencyPerWorker} concurrency each`
  );
}
