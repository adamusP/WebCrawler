import { Queue } from "bullmq";
import { CrawlJobData, CrawlJobDataInput } from "./crawlJobData.js";
import { scheduleCrawlUrl } from "./database.js";

const crawlQueue = new Queue("crawl", {
  connection: { host: "redis", port: 6379 },
});

function encodeBase64Url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

export function periodicityToMs(periodicity: string | null): number {
  if (periodicity === null || periodicity === undefined) {
    return -1;
  }

  const normalized = periodicity.toUpperCase();

  switch (normalized) {
    case "MINUTE":
      return 60_000;
    case "HOUR":
      return 3_600_000;
    case "DAY":
      return 86_400_000;
    case "NONE":
      return -1;
    default:
      throw new Error(`Unknown periodicity: ${periodicity}`);
  }
}

export async function enqueueUrlForCrawling(
  crawlJobDataInput: CrawlJobDataInput,
  periodicity: string | null = null
): Promise<boolean> {
  const wasScheduled = await scheduleCrawlUrl({
    executionId: crawlJobDataInput.executionId,
    websiteRecordId: crawlJobDataInput.websiteRecordId,
    url: new URL(crawlJobDataInput.url).toString(),
  });

  if (!wasScheduled) {
    console.debug(
      `Failed to schedule crawl for ${crawlJobDataInput.websiteRecordId}:${crawlJobDataInput.url}:${crawlJobDataInput.executionId}`
    );
    return false;
  }

  const crawlJobData: CrawlJobData = {
    ...crawlJobDataInput,
    nextDelay: periodicityToMs(periodicity),
  };

  await crawlQueue.add("crawl-url", crawlJobData, {
    jobId: `${crawlJobDataInput.websiteRecordId}-${crawlJobDataInput.executionId}-${encodeBase64Url(crawlJobDataInput.url)}`,
    removeOnComplete: true,
    removeOnFail: true,
  });

  return true;
}

export async function scheduleNext(crawlJobData: CrawlJobData): Promise<boolean> {
  const wasScheduled = await scheduleCrawlUrl({
    executionId: crawlJobData.executionId,
    websiteRecordId: crawlJobData.websiteRecordId,
    url: new URL(crawlJobData.url).toString(),
  });

  if (!wasScheduled) {
    console.debug(
      `Failed to schedule next crawl for ${crawlJobData.websiteRecordId}:${crawlJobData.url}:${crawlJobData.executionId}`
    );
    return false;
  }

  await crawlQueue.add("crawl-url", crawlJobData, {
    delay: crawlJobData.nextDelay,
    jobId: `${crawlJobData.websiteRecordId}-${crawlJobData.executionId}-${encodeBase64Url(crawlJobData.url)}`,
    removeOnComplete: true,
    removeOnFail: true,
  });

  return true;
}

export async function closeCrawlQueue(): Promise<void> {
  await crawlQueue.close();
}
