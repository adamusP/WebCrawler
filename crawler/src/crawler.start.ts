import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startCrawlerWorkers(): Worker[] {
  const workerCount = Number(process.env.WORKER_COUNT ?? "4");
  const concurrencyPerWorker = Number(process.env.CONCURRENCY_PER_WORKER ?? "8");
  const workers: Worker[] = [];

  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker(path.join(__dirname, "crawler.worker.js"), {
      env: {
        ...process.env,
        CONCURRENCY_PER_WORKER: concurrencyPerWorker.toString(),
      },
    });

    workers.push(worker);
  }

  console.log(`Started ${workerCount} workers with ${concurrencyPerWorker} concurrency each`);

  return workers;
}
