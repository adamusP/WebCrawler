import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./swagger.js";
import { closeCrawlQueue, enqueueUrlForCrawling } from "./enqueueCrawl.js";
import { CrawlJobData } from "./crawlJobData.js";
import {
  closeDatabase,
  createExecutionForWebsiteRecord,
  createManualCrawlExecution,
  createWebsiteRecord,
  deleteWebsiteRecord,
  getWebsiteRecord,
  listExecutions,
  listWebsiteRecords,
  normalizePeriodicity,
  updateWebsiteRecord,
} from "./database.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

type CrawlRequestBody = Pick<CrawlJobData, "url"> &
  Partial<Pick<CrawlJobData, "regex" | "websiteRecordId" | "executionId">> & {
    label?: string;
  };
type WebsiteRecordRequestBody = {
  url?: unknown;
  boundaryRegexp?: unknown;
  periodicity?: unknown;
  label?: unknown;
  active?: unknown;
  tags?: unknown;
};

function parseWebsiteRecordBody(body: WebsiteRecordRequestBody, partial = false) {
  const errors: string[] = [];
  const parsed: {
    url?: string;
    boundaryRegexp?: string;
    periodicity?: ReturnType<typeof normalizePeriodicity>;
    label?: string;
    active?: boolean;
    tags?: string[];
  } = {};

  if (!partial || body.url !== undefined) {
    if (typeof body.url === "string" && body.url.trim()) {
      parsed.url = body.url.trim();
    } else {
      errors.push("url is required and must be a non-empty string");
    }
  }

  if (!partial || body.boundaryRegexp !== undefined) {
    if (typeof body.boundaryRegexp === "string" && body.boundaryRegexp.trim()) {
      parsed.boundaryRegexp = body.boundaryRegexp.trim();
    } else {
      errors.push("boundaryRegexp is required and must be a non-empty string");
    }
  }

  if (!partial || body.periodicity !== undefined) {
    const periodicity = normalizePeriodicity(body.periodicity);
    if (periodicity) {
      parsed.periodicity = periodicity;
    } else {
      errors.push("periodicity must be one of MINUTE, HOUR, DAY");
    }
  }

  if (!partial || body.label !== undefined) {
    if (typeof body.label === "string" && body.label.trim()) {
      parsed.label = body.label.trim();
    } else {
      errors.push("label is required and must be a non-empty string");
    }
  }

  if (body.active !== undefined) {
    if (typeof body.active === "boolean") {
      parsed.active = body.active;
    } else {
      errors.push("active must be a boolean");
    }
  }

  if (body.tags !== undefined) {
    if (Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === "string")) {
      parsed.tags = body.tags.map((tag) => tag.trim()).filter(Boolean);
    } else {
      errors.push("tags must be an array of strings");
    }
  }

  return { errors, parsed };
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/api/websites", async (_req, res) => {
  res.json(await listWebsiteRecords());
});

app.post("/api/websites", async (req: Request<{}, {}, WebsiteRecordRequestBody>, res) => {
  const { errors, parsed } = parseWebsiteRecordBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const websiteRecord = await createWebsiteRecord({
    url: parsed.url!,
    boundaryRegexp: parsed.boundaryRegexp!,
    periodicity: parsed.periodicity!,
    label: parsed.label!,
    active: parsed.active,
    tags: parsed.tags,
  });

  res.status(201).json(websiteRecord);
});

app.get("/api/websites/:id", async (req, res) => {
  const websiteRecord = await getWebsiteRecord(req.params.id);
  if (!websiteRecord) {
    return res.status(404).json({ error: "Website record not found" });
  }

  res.json(websiteRecord);
});

app.patch("/api/websites/:id", async (req: Request<{ id: string }, {}, WebsiteRecordRequestBody>, res) => {
  const { errors, parsed } = parseWebsiteRecordBody(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const websiteRecord = await updateWebsiteRecord(req.params.id, {
    url: parsed.url,
    boundaryRegexp: parsed.boundaryRegexp,
    periodicity: parsed.periodicity ?? undefined,
    label: parsed.label,
    active: parsed.active,
    tags: parsed.tags,
  });
  if (!websiteRecord) {
    return res.status(404).json({ error: "Website record not found" });
  }

  res.json(websiteRecord);
});

app.delete("/api/websites/:id", async (req, res) => {
  const deleted = await deleteWebsiteRecord(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Website record not found" });
  }

  res.status(204).send();
});

app.get("/api/executions", async (req, res) => {
  const websiteRecordId =
    typeof req.query.websiteRecordId === "string" ? req.query.websiteRecordId : undefined;

  res.json(await listExecutions(websiteRecordId));
});

app.get("/api/websites/:id/executions", async (req, res) => {
  const websiteRecord = await getWebsiteRecord(req.params.id);
  if (!websiteRecord) {
    return res.status(404).json({ error: "Website record not found" });
  }

  res.json(await listExecutions(req.params.id));
});

app.post("/api/websites/:id/executions", async (req, res) => {
  const execution = await createExecutionForWebsiteRecord(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: "Website record not found" });
  }

  const crawlJobData: CrawlJobData = {
    url: execution.websiteRecord.url,
    regex: execution.websiteRecord.boundaryRegexp,
    websiteRecordId: execution.websiteRecord.id,
    executionId: execution.executionId,
  };

  await enqueueUrlForCrawling(crawlJobData);

  res.status(202).json({
    message: "Execution started",
    websiteRecordId: execution.websiteRecord.id,
    executionId: execution.executionId,
  });
});

app.post("/crawl", async (req: Request<{}, {}, CrawlRequestBody>, res: Response) => {
  if (!req.body.url) {
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  const regex = req.body.regex ?? "";
  const existingIds =
    req.body.websiteRecordId && req.body.executionId
      ? {
          websiteRecordId: req.body.websiteRecordId,
          executionId: req.body.executionId,
        }
      : null;
  const ids =
    existingIds ??
    (await createManualCrawlExecution({
      url: req.body.url,
      regex,
      label: req.body.label,
    }));

  const crawlJobData: CrawlJobData = {
    url: req.body.url,
    regex,
    websiteRecordId: ids.websiteRecordId,
    executionId: ids.executionId,
  };

  if (!enqueueUrlForCrawling(crawlJobData)) {
    return res.status(500).json({ error: "Failed to enqueue URL for crawling" });
  }

  res.status(202).json({
    message: "URL enqueued for crawling",
    requestedUrl: req.body?.url,
    websiteRecordId: ids.websiteRecordId,
    executionId: ids.executionId,
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
      closeDatabase(),
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
