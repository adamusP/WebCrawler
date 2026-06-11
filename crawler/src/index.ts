import express from "express";
import { startCrawlerWorkers } from "./crawler.worker.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crawler" });
});

startCrawlerWorkers();

app.listen(port, () => {
  console.log(`Crawler service listening on port ${port}`);
});

