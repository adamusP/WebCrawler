import { Worker } from "bullmq";
import { parentPort, threadId } from "worker_threads";

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

async function shutdown(): Promise<void> {
  console.log(`Crawler worker shutting down pid=${process.pid} threadId=${threadId}`);
  await worker.close();
  parentPort?.close();
}

parentPort?.on("message", (message) => {
  if (message?.type !== "shutdown") {
    return;
  }

  void shutdown().catch((error) => {
    console.error("Crawler worker shutdown failed", error);
    process.exit(1);
  });
});
