import { Queue } from "bullmq";
import { CrawlJobData } from "./crawlJobData.js";
import { scheduleCrawlUrl } from "./database.js";

const crawlQueue = new Queue("crawl", {
  connection: { host: "redis", port: 6379 },
});

export async function enqueueUrlForCrawling(crawlJobData: CrawlJobData): Promise<boolean> {
  const wasScheduled = await scheduleCrawlUrl({
    executionId: crawlJobData.executionId,
    websiteRecordId: crawlJobData.websiteRecordId,
    url: new URL(crawlJobData.url).toString(),
  });

  if (!wasScheduled) {
    return false;
  }

  await crawlQueue.add("crawl-url", crawlJobData);

  return true;
}

export async function closeCrawlQueue(): Promise<void> {
  await crawlQueue.close();
}
