import express from "express";
import { startCrawlerWorkers } from "./crawler.start.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crawler" });
});

const workers = startCrawlerWorkers();

const server = app.listen(port, () => {
  console.log(`Crawler service listening on port ${port}`);
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down crawler`);

  try {
    const workerShutdowns = workers.map((worker) => {
      worker.postMessage({ type: "shutdown" });

      return new Promise<void>((resolve, reject) => {
        worker.once("exit", (code) => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(new Error(`Worker exited with code ${code}`));
        });

        worker.once("error", reject);
      });
    });

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
      ...workerShutdowns,
    ]);

    console.log("Crawler shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Crawler shutdown failed", error);
    process.exit(1);
  }
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

