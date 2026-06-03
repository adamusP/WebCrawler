import express from "express";
import { parseLinks } from "./parseLinks.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crawler" });
});

app.post("/crawl", (req, res) => {
  res.status(501).json({
    message: "Crawler execution skeleton",
    requestedUrl: req.body?.url ?? null
  });
});

app.post("/parse-links", (req, res) => {
  const html = String(req.body?.html ?? "");
  const baseUrl = String(req.body?.baseUrl ?? "http://localhost");

  res.json({ links: parseLinks(html, baseUrl) });
});

app.listen(port, () => {
  console.log(`Crawler service listening on port ${port}`);
});
