import { randomUUID } from "crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type ManualCrawlExecutionInput = {
  url: string;
  regex: string;
  label?: string;
  periodicity?: Periodicity;
};

export type ManualCrawlExecution = {
  websiteRecordId: string;
  executionId: string;
};

export type ScheduleCrawlUrlInput = {
  executionId: string;
  websiteRecordId: string;
  url: string;
};

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

export type WebsiteRecordInput = {
  url: string;
  boundaryRegexp: string;
  periodicity: Periodicity;
  label: string;
  active?: boolean;
  tags?: string[];
};

export type WebsiteRecordUpdateInput = Partial<WebsiteRecordInput>;

export type ExecutionRecord = {
  id: string;
  websiteRecordId: string;
  websiteRecordLabel: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  pagesCrawled: number;
  createdAt: string;
};

const allowedPeriodicities = new Set<Periodicity>(["MINUTE", "HOUR", "DAY", "NONE"]);

function mapWebsiteRecord(row: Record<string, unknown>): WebsiteRecord {
  return {
    id: String(row.id),
    url: String(row.url),
    boundaryRegexp: String(row.boundaryRegexp),
    periodicity: row.periodicity as Periodicity,
    label: String(row.label),
    active: Boolean(row.active),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    lastCrawledAt: row.lastCrawledAt ? new Date(row.lastCrawledAt as string).toISOString() : null,
    lastStatus: row.lastStatus ? String(row.lastStatus) : null,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  };
}

function mapExecutionRecord(row: Record<string, unknown>): ExecutionRecord {
  return {
    id: String(row.id),
    websiteRecordId: String(row.websiteRecordId),
    websiteRecordLabel: String(row.websiteRecordLabel),
    status: String(row.status),
    startedAt: row.startedAt ? new Date(row.startedAt as string).toISOString() : null,
    endedAt: row.endedAt ? new Date(row.endedAt as string).toISOString() : null,
    pagesCrawled: Number(row.pagesCrawled),
    createdAt: new Date(row.createdAt as string).toISOString(),
  };
}

export function normalizePeriodicity(value: unknown): Periodicity | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toUpperCase();

  return allowedPeriodicities.has(normalized as Periodicity) ? (normalized as Periodicity) : null;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(String).map((tag) => tag.trim()).filter(Boolean);
}

export async function listWebsiteRecords(): Promise<WebsiteRecord[]> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "url",
        "boundaryRegexp",
        "periodicity",
        "label",
        "active",
        "tags",
        "lastCrawledAt",
        "lastStatus",
        "createdAt",
        "updatedAt"
      FROM "WebsiteRecord"
      ORDER BY "createdAt" DESC
    `
  );

  return result.rows.map(mapWebsiteRecord);
}


export async function listWebsitesPaginated({
  url,
  label,
  tags,
  sortBy = "url",
  sortOrder = "asc",
  limit = 10,
  offset = 0,
}: {
  url?: string;
  label?: string;
  tags?: string[];
  sortBy?: "url" | "lastCrawledAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (url) {
    conditions.push(`w."url" ILIKE $${i++}`);
    params.push(`%${url}%`);
  }

  if (label) {
    conditions.push(`w."label" ILIKE $${i++}`);
    params.push(`%${label}%`);
  }

  if (tags && tags.length > 0) {
    conditions.push(`w."tags" && $${i++}`);
    params.push(tags);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const orderField =
    sortBy === "lastCrawledAt"
      ? `e."startedAt"`
      : `w."url"`;

  const result = await pool.query(
    `
    SELECT
      w."id",
      w."url",
      w."boundaryRegexp",
      w."periodicity",
      w."label",
      w."active",
      w."tags",
      w."lastCrawledAt",
      w."lastStatus",
      w."createdAt",
      w."updatedAt",
      e."startedAt" AS "e.lastCrawledAt",
      e."status" AS "e.lastStatus"

    FROM "WebsiteRecord" w

    LEFT JOIN LATERAL (
      SELECT *
      FROM "Execution" e
      WHERE e."websiteRecordId" = w."id" AND e."status" IN ('RUNNING', 'SUCCEEDED', 'FAILED')
      ORDER BY e."startedAt" DESC
      LIMIT 1
    ) e ON true

    ${whereClause}

    ORDER BY ${orderField} ${sortOrder.toUpperCase()}

    LIMIT $${i++}
    OFFSET $${i}
    `,
    [...params, limit, offset]
  );

  return result.rows;
}


export async function getWebsiteRecord(id: string): Promise<WebsiteRecord | null> {
  const result = await pool.query(
    `
      SELECT
        "id",
        "url",
        "boundaryRegexp",
        "periodicity",
        "label",
        "active",
        "tags",
        "lastCrawledAt",
        "lastStatus",
        "createdAt",
        "updatedAt"
      FROM "WebsiteRecord"
      WHERE "id" = $1
    `,
    [id]
  );

  return result.rows[0] ? mapWebsiteRecord(result.rows[0]) : null;
}

export async function createWebsiteRecord(input: WebsiteRecordInput): Promise<WebsiteRecord> {
  const id = randomUUID();
  const now = new Date();
  const result = await pool.query(
    `
      INSERT INTO "WebsiteRecord" (
        "id",
        "url",
        "boundaryRegexp",
        "periodicity",
        "label",
        "active",
        "tags",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING
        "id",
        "url",
        "boundaryRegexp",
        "periodicity",
        "label",
        "active",
        "tags",
        "lastCrawledAt",
        "lastStatus",
        "createdAt",
        "updatedAt"
    `,
    [
      id,
      input.url,
      input.boundaryRegexp,
      input.periodicity,
      input.label,
      input.active ?? true,
      input.tags ?? [],
      now,
    ]
  );

  return mapWebsiteRecord(result.rows[0]);
}

export async function updateWebsiteRecord(
  id: string,
  input: WebsiteRecordUpdateInput
): Promise<WebsiteRecord | null> {
  const existing = await getWebsiteRecord(id);
  if (!existing) {
    return null;
  }

  const result = await pool.query(
    `
      UPDATE "WebsiteRecord"
      SET
        "url" = $2,
        "boundaryRegexp" = $3,
        "periodicity" = $4,
        "label" = $5,
        "active" = $6,
        "tags" = $7,
        "updatedAt" = $8
      WHERE "id" = $1
      RETURNING
        "id",
        "url",
        "boundaryRegexp",
        "periodicity",
        "label",
        "active",
        "tags",
        "lastCrawledAt",
        "lastStatus",
        "createdAt",
        "updatedAt"
    `,
    [
      id,
      input.url ?? existing.url,
      input.boundaryRegexp ?? existing.boundaryRegexp,
      input.periodicity ?? existing.periodicity,
      input.label ?? existing.label,
      input.active ?? existing.active,
      input.tags ?? existing.tags,
      new Date(),
    ]
  );

  return mapWebsiteRecord(result.rows[0]);
}

export async function deleteWebsiteRecord(id: string): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM "WebsiteRecord"
      WHERE "id" = $1
    `,
    [id]
  );

  return result.rowCount === 1;
}

export async function listExecutions(websiteRecordId?: string): Promise<ExecutionRecord[]> {
  const params = websiteRecordId ? [websiteRecordId] : [];
  const result = await pool.query(
    `
      SELECT
        e."id",
        e."websiteRecordId",
        w."label" AS "websiteRecordLabel",
        e."status",
        e."startedAt",
        e."endedAt",
        e."pagesCrawled",
        e."createdAt"
      FROM "Execution" e
      JOIN "WebsiteRecord" w ON w."id" = e."websiteRecordId"
      ${websiteRecordId ? 'WHERE e."websiteRecordId" = $1' : ""}
      ORDER BY e."createdAt" DESC
    `,
    params
  );

  return result.rows.map(mapExecutionRecord);
}

export async function listExecutionsPaginated({
  websiteRecordId,
  limit = 10,
  offset = 0,
}: {
  websiteRecordId?: string;
  limit?: number;
  offset?: number;
}) {
  const result = await pool.query(
    `
    SELECT
      e."id",
      e."websiteRecordId",
      w."label" AS "websiteRecordLabel",
      e."status",
      e."startedAt",
      e."endedAt",
      e."pagesCrawled",
      e."createdAt"
    FROM "Execution" e
    JOIN "WebsiteRecord" w ON w."id" = e."websiteRecordId"
    ${websiteRecordId ? `WHERE e."websiteRecordId" = $1` : ""}
    ORDER BY e."createdAt" DESC
    LIMIT $${websiteRecordId ? 2 : 1}
    OFFSET $${websiteRecordId ? 3 : 2}
    `,
    websiteRecordId
      ? [websiteRecordId, limit, offset]
      : [limit, offset]
  );

  return result.rows;
}


export async function createExecutionForWebsiteRecord(
  websiteRecordId: string
): Promise<{ executionId: string; websiteRecord: WebsiteRecord } | null> {
  const websiteRecord = await getWebsiteRecord(websiteRecordId);
  if (!websiteRecord) {
    return null;
  }

  const executionId = randomUUID();
  const now = new Date();
  await pool.query(
    `
      INSERT INTO "Execution" (
        "id",
        "websiteRecordId",
        "status",
        "createdAt"
      )
      VALUES ($1, $2, 'QUEUED', $3)
    `,
    [executionId, websiteRecordId, now]
  );

  return { executionId, websiteRecord };
}

export async function createManualCrawlExecution(
  input: ManualCrawlExecutionInput
): Promise<ManualCrawlExecution> {
  const websiteRecord = await createWebsiteRecord({
    url: input.url,
    boundaryRegexp: input.regex,
    periodicity: input.periodicity ?? "NONE",
    label: input.label ?? input.url,
    active: true,
    tags: [],
  });
  const execution = await createExecutionForWebsiteRecord(websiteRecord.id);

  if (!execution) {
    throw new Error("Failed to create execution for manual crawl");
  }

  return { websiteRecordId: websiteRecord.id, executionId: execution.executionId };
}

export async function scheduleCrawlUrl(input: ScheduleCrawlUrlInput): Promise<boolean> {
  const result = await pool.query(
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
  );

  return result.rowCount === 1;
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
