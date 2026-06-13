import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./swagger.js";
import { closeCrawlQueue, enqueueUrlForCrawling } from "./enqueueCrawl.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/api/websites", (_req, res) => {
  res.json([]);
});

app.post("/api/websites", (_req, res) => {
  res.status(501).json({ message: "Website creation endpoint skeleton" });
});

app.get("/api/executions", (_req, res) => {
  res.json([]);
});

app.post("/api/websites/:id/executions", (req, res) => {
  res.status(501).json({
    message: "Manual execution endpoint skeleton",
    websiteRecordId: req.params.id
  });
});

app.post("/crawl", (req, res) => {
  if (!req.body?.url) {
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  if (!enqueueUrlForCrawling(req.body.url, "")) {
    return res.status(500).json({ error: "Failed to enqueue URL for crawling" });
  }

  res.status(202).json({
    message: "URL enqueued for crawling",
    requestedUrl: req.body?.url,
  });
});

const server = app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down backend`);

  try {
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
      closeCrawlQueue(),
    ]);

    console.log("Backend shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Backend shutdown failed", error);
    process.exit(1);
  }
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
