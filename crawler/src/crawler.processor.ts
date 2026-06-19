import type { Job } from "bullmq";
import { parseLinks, parseTitle } from "./parseLinks.js";
import { CrawlJobData } from "./crawlJobData.js";
import { enqueueUrlForCrawling } from "./enqueueCrawl.js";
import {
  completeExecutionIfIdle,
  finishCrawlUrl,
  markCrawlUrlRunning,
  saveCrawlResult,
} from "./database.js";

export default async function crawlUrl(job: Job<CrawlJobData>): Promise<void> {
  const { url, regex, websiteRecordId, executionId } = job.data;
  if (!websiteRecordId || !executionId) {
    console.error(`Missing persistence identifiers for crawl job: ${url}`);
    return;
  }

  const currentUrl = new URL(url).toString(); // Normalize URL for comparison

  try {
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

    const matchingLinks = (linkPattern
      ? allLinks.filter((link) => linkPattern.test(link))
      : allLinks
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
        enqueueUrlForCrawling({ url: link, regex, websiteRecordId, executionId })
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
  }
}
