import { Queue } from "bullmq";
import { CrawlJobData } from "./crawlJobData.js";

const crawlQueue = new Queue("crawl", {
  connection: { host: "redis", port: 6379 },
});

export async function enqueueUrlForCrawling(crawlJobData: CrawlJobData): Promise<boolean> {
  await crawlQueue.add("crawl-url", crawlJobData);

  return true;
}

export async function closeCrawlQueue(): Promise<void> {
  await crawlQueue.close();
}
