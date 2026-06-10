import express from "express";
import { enqueueUrlForCrawling } from "./crawler.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crawler" });
});

app.post("/crawl", (req, res) => {
  if (!req.body?.url) {
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  if (!enqueueUrlForCrawling(req.body.url)) {
    return res.status(500).json({ error: "Failed to enqueue URL for crawling" });
  }

  res.status(202).json({
    message: "URL enqueued for crawling",
    requestedUrl: req.body?.url,
  });
});

app.listen(port, () => {
  console.log(`Crawler service listening on port ${port}`);
});
