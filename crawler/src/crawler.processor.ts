import type { Job } from "bullmq";
import { DelayedError } from "bullmq";
import { parseLinks, parseTitle } from "./parseLinks.js";
import { CrawlJobData } from "./crawlJobData.js";
import { enqueueUrlForCrawling, scheduleNext } from "./enqueueCrawl.js";
import {
  completeExecutionIfIdle,
  finishCrawlUrl,
  markCrawlUrlRunning,
  saveCrawlResult,
  createExecutionForWebsiteRecordQueued,
  markExecutionRunning,
} from "./database.js";
import { redis } from "./redis.js";
import { getDomain } from "tldts";

const BASE_DELAY_MS = 1000;

async function tryAcquireDomain(domain: string): Promise<boolean> {
  const key = `domain-lock:${domain}`;
  const delay = Math.ceil(BASE_DELAY_MS + Math.random() * 200); // jitter to avoid collisions

  try {
    const result = await redis.set(key, "1", "PX", delay, "NX");
    return result === "OK";
  } catch (error) {
    console.error(`Error acquiring lock for domain ${domain}:`, error);
    return false;
  }
}

export default async function crawlUrl(job: Job<CrawlJobData>, token?: string): Promise<void> {
  const { url, regex, websiteRecordId, executionId, nextDelay } = job.data;
  if (!websiteRecordId || !executionId) {
    console.error(`Missing persistence identifiers for crawl job: ${url}`);
    return;
  }

  const urlObj = new URL(url);
  const currentUrl = urlObj.toString(); // Normalize URL for comparison
  const domain = getDomain(url) ?? urlObj.hostname;

  console.log(
    `Starting crawl for ${currentUrl} with regex: ${regex}, websiteRecordId: ${websiteRecordId}, executionId: ${executionId}`
  );
  if (!(await tryAcquireDomain(domain))) {
    console.log(
      `Domain ${domain} is currently locked. Re-enqueueing ${currentUrl} for later crawling.`
    );
    await job.moveToDelayed(Date.now() + Math.ceil(BASE_DELAY_MS + Math.random() * 200), token);
    throw new DelayedError();
  }

  try {
    await markExecutionRunning(executionId);
    await markCrawlUrlRunning(executionId, currentUrl);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      await finishCrawlUrl({
        executionId,
        url: currentUrl,
        status: "FAILED",
        error: `${response.status} ${response.statusText}`,
      });
      await completeExecutionIfIdle(executionId);
      return;
    }

    const html = await response.text();
    const baseUrl = currentUrl;
    const allLinks = parseLinks(html, baseUrl);
    const title = parseTitle(html);

    let linkPattern: RegExp | null = null;
    try {
      linkPattern = regex ? new RegExp(regex) : null;
    } catch (error) {
      console.error(`Invalid regex for ${url}: ${regex}`, error);
      await finishCrawlUrl({
        executionId,
        url: currentUrl,
        status: "FAILED",
        error: "Invalid boundary regexp",
      });
      await completeExecutionIfIdle(executionId);
      return;
    }

    const matchingLinks = (
      linkPattern ? allLinks.filter((link) => linkPattern.test(link)) : allLinks
    ).filter((link) => link !== currentUrl);
    const matchingLinkSet = new Set(matchingLinks);

    await saveCrawlResult({
      executionId,
      websiteRecordId,
      url: currentUrl,
      title,
      crawlTime: new Date(),
      links: allLinks.map((link) => ({
        toUrl: link,
        matchesBoundary: matchingLinkSet.has(link),
      })),
    });

    console.log(`Crawled ${url} and found links:`, allLinks, `Matching links:`, matchingLinks);

    await Promise.all(
      matchingLinks.map((link) =>
        enqueueUrlForCrawling({ url: link, regex, websiteRecordId, executionId }, null)
      )
    );

    await finishCrawlUrl({ executionId, url: currentUrl, status: "CRAWLED" });
    await completeExecutionIfIdle(executionId);
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    await finishCrawlUrl({
      executionId,
      url: currentUrl,
      status: "FAILED",
      error: error instanceof Error ? error.message : String(error),
    });
    await completeExecutionIfIdle(executionId);
  } finally {
    if (nextDelay > 0) {
      console.log(`Re-enqueueing ${websiteRecordId}:${url} for crawling after ${nextDelay} ms`);
      const execution = await createExecutionForWebsiteRecordQueued(websiteRecordId);
      if (!execution) {
        console.error(
          `Failed to create scheduled execution for website record: ${websiteRecordId}`
        );
      } else {
        await scheduleNext({
          url,
          regex,
          websiteRecordId,
          executionId: execution.executionId,
          nextDelay,
        });
      }
    }
  }
}
