import { Worker } from "bullmq";

const concurrencyPerWorker = Number(process.env.CONCURRENCY_PER_WORKER ?? "8");

const worker = new Worker(
  "crawl",
  new URL("./crawler.processor.js", import.meta.url).pathname,
  {
    connection: { host: "redis", port: 6379 },
    concurrency: concurrencyPerWorker,
    useWorkerThreads: true,
  }
);
