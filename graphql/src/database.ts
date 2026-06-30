import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type Periodicity = "MINUTE" | "HOUR" | "DAY" | "NONE";

export type WebsiteRecord = {
  id: string;
  url: string;
  boundaryRegexp: string;
  periodicity: Periodicity;
  label: string;
  active: boolean;
  tags: string[];
  lastCrawledAt: string | null;
  lastStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LatestExecutionRow = {
  id: string;
  websiteRecordId: string;
  createdAt: Date;
};

export async function getLatestExecutions(websiteIds: string[]): Promise<LatestExecutionRow[]> {
  if (!websiteIds || !websiteIds.length) {
    const result = await pool.query<LatestExecutionRow>(
      `
      SELECT DISTINCT ON ("websiteRecordId")
        "id",
        "websiteRecordId",
        "createdAt"
      FROM "Execution"
      WHERE "status" = 'SUCCEEDED'
      ORDER BY "websiteRecordId", "createdAt" DESC
      `
    );

    return result.rows;
  }

  const result = await pool.query<LatestExecutionRow>(
    `
    SELECT DISTINCT ON ("websiteRecordId")
      "id",
      "websiteRecordId",
      "createdAt"
    FROM "Execution"
    WHERE "websiteRecordId" = ANY($1) AND "status" = 'SUCCEEDED'
    ORDER BY "websiteRecordId", "createdAt" DESC
    `,
    [websiteIds]
  );

  return result.rows;
}

export async function listWebsiteRecords(): Promise<WebsiteRecord[]> {
  const result = await pool.query<WebsiteRecord>(
    `
      SELECT
        "id",
        "url",
        "boundaryRegexp",
        "label",
        "periodicity",
        "active",
        "tags"
      FROM "WebsiteRecord"
      ORDER BY "createdAt" DESC
    `
  );

  return result.rows;
}

export type CrawledPageRow = {
  url: string;
  title: string | null;
  crawlTime: Date;
  websiteRecordId: string;
};

export async function listCrawledPages(executionIds?: string[]): Promise<CrawledPageRow[]> {
  if (!executionIds || !executionIds.length) return [];

  const result = await pool.query<CrawledPageRow>(
    `
    SELECT DISTINCT ON ("url")
      "url",
      "title",
      "crawlTime",
      "websiteRecordId"
    FROM "CrawledPage"
    WHERE "executionId" = ANY($1)
    ORDER BY "url", "crawlTime" DESC
    `,
    [executionIds]
  );

  return result.rows;
}

export type CrawledLinkRow = {
  websiteRecordId: string;
  fromUrl: string;
  toUrl: string;
  matchesBoundary: boolean;
  wasCrawled: boolean;
};

export async function listCrawledLinks(executionIds?: string[]): Promise<CrawledLinkRow[]> {
  if (!executionIds || !executionIds.length) return [];

  const result = await pool.query<CrawledLinkRow>(
    `
      SELECT DISTINCT
        "websiteRecordId",
        "fromUrl",
        "toUrl",
        "matchesBoundary",
        "wasCrawled"
      FROM "CrawledLink"
      WHERE "executionId" = ANY($1)
      `,
    [executionIds]
  );

  return result.rows;
}
