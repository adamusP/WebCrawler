CREATE TYPE "Periodicity" AS ENUM ('MINUTE', 'HOUR', 'DAY');

CREATE TYPE "ExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "WebsiteRecord" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "boundaryRegexp" TEXT NOT NULL,
  "periodicity" "Periodicity" NOT NULL,
  "label" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "tags" TEXT[] NOT NULL,
  "lastCrawledAt" TIMESTAMP(3),
  "lastStatus" "ExecutionStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebsiteRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Execution" (
  "id" TEXT NOT NULL,
  "websiteRecordId" TEXT NOT NULL,
  "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "pagesCrawled" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawledPage" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "websiteRecordId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "crawlTime" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrawledPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawledLink" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "websiteRecordId" TEXT NOT NULL,
  "fromUrl" TEXT NOT NULL,
  "toUrl" TEXT NOT NULL,
  "matchesBoundary" BOOLEAN NOT NULL,
  "wasCrawled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CrawledLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrawledPage_executionId_url_key" ON "CrawledPage"("executionId", "url");
CREATE UNIQUE INDEX "CrawledLink_executionId_fromUrl_toUrl_key" ON "CrawledLink"("executionId", "fromUrl", "toUrl");

ALTER TABLE "Execution"
  ADD CONSTRAINT "Execution_websiteRecordId_fkey"
  FOREIGN KEY ("websiteRecordId") REFERENCES "WebsiteRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawledPage"
  ADD CONSTRAINT "CrawledPage_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawledPage"
  ADD CONSTRAINT "CrawledPage_websiteRecordId_fkey"
  FOREIGN KEY ("websiteRecordId") REFERENCES "WebsiteRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawledLink"
  ADD CONSTRAINT "CrawledLink_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawledLink"
  ADD CONSTRAINT "CrawledLink_websiteRecordId_fkey"
  FOREIGN KEY ("websiteRecordId") REFERENCES "WebsiteRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
