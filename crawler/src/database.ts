import { randomUUID } from "crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const deadlockDetectedCode = "40P01";
const maxDeadlockRetries = 3;

export type CrawledLinkInput = {
  toUrl: string;
  matchesBoundary: boolean;
};

export type SaveCrawlResultInput = {
  executionId: string;
  websiteRecordId: string;
  url: string;
  title: string | null;
  crawlTime: Date;
  links: CrawledLinkInput[];
};

export type ScheduleCrawlUrlInput = {
  executionId: string;
  websiteRecordId: string;
  url: string;
};

export type FinishCrawlUrlInput = {
  executionId: string;
  url: string;
  status: "CRAWLED" | "FAILED" | "SKIPPED";
  error?: string;
};

export async function scheduleCrawlUrl(input: ScheduleCrawlUrlInput): Promise<boolean> {
  const result = await retryDeadlocksWithResult(() =>
    pool.query(
      `
        INSERT INTO "CrawlUrl" (
          "id",
          "executionId",
          "websiteRecordId",
          "url",
          "status"
        )
        VALUES ($1, $2, $3, $4, 'QUEUED')
        ON CONFLICT ("executionId", "url")
        DO NOTHING
      `,
      [randomUUID(), input.executionId, input.websiteRecordId, input.url]
    )
  );

  return result.rowCount === 1;
}

export async function markCrawlUrlRunning(executionId: string, url: string): Promise<void> {
  await retryDeadlocks(() =>
    pool.query(
      `
        UPDATE "CrawlUrl"
        SET
          "status" = 'RUNNING',
          "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP),
          "error" = NULL
        WHERE "executionId" = $1 AND "url" = $2
      `,
      [executionId, url]
    ).then(() => undefined)
  );
}

export async function finishCrawlUrl(input: FinishCrawlUrlInput): Promise<void> {
  await retryDeadlocks(() =>
    pool.query(
      `
        UPDATE "CrawlUrl"
        SET
          "status" = $3,
          "finishedAt" = CURRENT_TIMESTAMP,
          "error" = $4
        WHERE "executionId" = $1 AND "url" = $2
      `,
      [input.executionId, input.url, input.status, input.error ?? null]
    ).then(() => undefined)
  );
}

export async function completeExecutionIfIdle(executionId: string): Promise<boolean> {
  return retryDeadlocksWithResult(async () => {
    const activeResult = await pool.query<{ activeCount: string }>(
      `
        SELECT COUNT(*) AS "activeCount"
        FROM "CrawlUrl"
        WHERE "executionId" = $1 AND "status" IN ('QUEUED', 'RUNNING')
      `,
      [executionId]
    );

    const activeCount = Number(activeResult.rows[0]?.activeCount ?? 0);
    if (activeCount > 0) {
      return false;
    }

    const failedResult = await pool.query<{ failedCount: string }>(
      `
        SELECT COUNT(*) AS "failedCount"
        FROM "CrawlUrl"
        WHERE "executionId" = $1 AND "status" = 'FAILED'
      `,
      [executionId]
    );
    const pageCountResult = await pool.query<{ pageCount: string }>(
      `
        SELECT COUNT(*) AS "pageCount"
        FROM "CrawledPage"
        WHERE "executionId" = $1
      `,
      [executionId]
    );

    const failedCount = Number(failedResult.rows[0]?.failedCount ?? 0);
    const pageCount = Number(pageCountResult.rows[0]?.pageCount ?? 0);
    const finalStatus = failedCount > 0 ? "FAILED" : "SUCCEEDED";

    await pool.query(
      `
        UPDATE "Execution"
        SET
          "status" = $2,
          "endedAt" = COALESCE("endedAt", CURRENT_TIMESTAMP),
          "pagesCrawled" = $3
        WHERE "id" = $1 AND "status" = 'RUNNING'
      `,
      [executionId, finalStatus, pageCount]
    );

    await pool.query(
      `
        UPDATE "WebsiteRecord"
        SET
          "lastCrawledAt" = CURRENT_TIMESTAMP,
          "lastStatus" = $2,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = (
          SELECT "websiteRecordId"
          FROM "Execution"
          WHERE "id" = $1
        )
      `,
      [executionId, finalStatus]
    );

    return true;
  });
}

export async function saveCrawlResult(input: SaveCrawlResultInput): Promise<void> {
  await retryDeadlocks(() => saveCrawledPage(input));
  await retryDeadlocks(() => markUrlAsCrawled(input.executionId, input.url));
  await retryDeadlocks(() => saveCrawledLinks(input));
}

async function saveCrawledPage(input: SaveCrawlResultInput): Promise<void> {
  await pool.query(
    `
      INSERT INTO "CrawledPage" (
        "id",
        "executionId",
        "websiteRecordId",
        "url",
        "title",
        "crawlTime"
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("executionId", "url")
      DO UPDATE SET
        "websiteRecordId" = EXCLUDED."websiteRecordId",
        "title" = EXCLUDED."title",
        "crawlTime" = EXCLUDED."crawlTime"
    `,
    [
      randomUUID(),
      input.executionId,
      input.websiteRecordId,
      input.url,
      input.title,
      input.crawlTime,
    ]
  );
}

async function markUrlAsCrawled(executionId: string, url: string): Promise<void> {
  await pool.query(
    `
      UPDATE "CrawledLink"
      SET "wasCrawled" = true
      WHERE "executionId" = $1 AND "toUrl" = $2
    `,
    [executionId, url]
  );
}

async function saveCrawledLinks(input: SaveCrawlResultInput): Promise<void> {
  if (input.links.length === 0) {
    return;
  }

  const dedupedLinks = [
    ...new Map(input.links.map((link) => [link.toUrl, link])).values(),
  ].sort((left, right) => left.toUrl.localeCompare(right.toUrl));

  await pool.query(
    `
      INSERT INTO "CrawledLink" (
        "id",
        "executionId",
        "websiteRecordId",
        "fromUrl",
        "toUrl",
        "matchesBoundary",
        "wasCrawled"
      )
      SELECT
        unnest($1::text[]),
        $2,
        $3,
        $4,
        unnest($5::text[]),
        unnest($6::boolean[]),
        false
      ON CONFLICT ("executionId", "fromUrl", "toUrl")
      DO NOTHING
    `,
    [
      dedupedLinks.map(() => randomUUID()),
      input.executionId,
      input.websiteRecordId,
      input.url,
      dedupedLinks.map((link) => link.toUrl),
      dedupedLinks.map((link) => link.matchesBoundary),
    ]
  );
}

async function retryDeadlocks(operation: () => Promise<void>): Promise<void> {
  for (let attempt = 0; attempt <= maxDeadlockRetries; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (!isDeadlockError(error) || attempt === maxDeadlockRetries) {
        throw error;
      }

      await delay(50 * (attempt + 1));
    }
  }
}

async function retryDeadlocksWithResult<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= maxDeadlockRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isDeadlockError(error) || attempt === maxDeadlockRetries) {
        throw error;
      }

      await delay(50 * (attempt + 1));
    }
  }

  throw new Error("Deadlock retry loop exhausted unexpectedly");
}

function isDeadlockError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === deadlockDetectedCode
  );
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
