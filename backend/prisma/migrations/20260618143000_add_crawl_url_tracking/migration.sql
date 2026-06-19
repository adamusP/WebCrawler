CREATE TYPE "CrawlUrlStatus" AS ENUM ('QUEUED', 'RUNNING', 'CRAWLED', 'FAILED', 'SKIPPED');

CREATE TABLE "CrawlUrl" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "websiteRecordId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" "CrawlUrlStatus" NOT NULL DEFAULT 'QUEUED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "error" TEXT,

  CONSTRAINT "CrawlUrl_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrawlUrl_executionId_url_key" ON "CrawlUrl"("executionId", "url");

ALTER TABLE "CrawlUrl"
  ADD CONSTRAINT "CrawlUrl_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawlUrl"
  ADD CONSTRAINT "CrawlUrl_websiteRecordId_fkey"
  FOREIGN KEY ("websiteRecordId") REFERENCES "WebsiteRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
