import { Queue } from "bullmq";
import { CrawlJobData } from "./crawlJobData.js";

const crawlQueue = new Queue("crawl", {
  connection: { host: "redis", port: 6379 },
});

export async function enqueueUrlForCrawling(url: string, regex: string): Promise<boolean> {
  const jobData: CrawlJobData = { url, regex };

  await crawlQueue.add("crawl-url", jobData);

  return true;
}

export async function closeCrawlQueue(): Promise<void> {
  await crawlQueue.close();
}
