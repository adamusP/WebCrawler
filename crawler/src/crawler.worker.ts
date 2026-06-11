import { Worker } from "bullmq";

export function startCrawlerWorkers() {
  const connection = { host: "redis", port: 6379 };

  const workerCount = Number(process.env.WORKER_COUNT ?? "4");
  const concurrencyPerWorker = Number(process.env.CONCURRENCY_PER_WORKER ?? "8");

  const workers: Worker[] = [];

  for (let i = 0; i < workerCount; i++) {
    workers.push(new Worker(
      "crawl",
      new URL("./crawler.processor.js", import.meta.url).pathname,
      {
        connection,
        concurrency: concurrencyPerWorker,
        useWorkerThreads: true,
      }
    ));
  }

  console.log(
    `Started ${workerCount} workers with ${concurrencyPerWorker} concurrency each`,
  );

  return workers;
}
