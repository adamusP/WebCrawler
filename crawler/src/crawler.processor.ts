import type { Job } from "bullmq";
import { parseLinks } from "./parseLinks.js";
import { CrawlJobData } from "./crawlJobData.js";
import { enqueueUrlForCrawling } from "./enqueueCrawl.js";

export default async function crawlUrl(job: Job<CrawlJobData>): Promise<void> {
  const { url, regex } = job.data;
  const currentUrl = new URL(url).toString(); // Normalize URL for comparison

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return;
    }

    const html = await response.text();
    const baseUrl = new URL(url).origin;
    const allLinks = parseLinks(html, baseUrl);

    let linkPattern: RegExp | null = null;
    try {
      linkPattern = regex ? new RegExp(regex) : null;
    } catch (error) {
      console.error(`Invalid regex for ${url}: ${regex}`, error);
      return;
    }

    const matchingLinks = (linkPattern
      ? allLinks.filter((link) => linkPattern.test(link))
      : allLinks
    ).filter((link) => link !== currentUrl);

    console.log(`Crawled ${url} and found links:`, allLinks, `Matching links:`, matchingLinks);

    await Promise.all(
      matchingLinks.map((link) => enqueueUrlForCrawling({ url: link, regex }))
    );
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
  }
}
