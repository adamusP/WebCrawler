import { parseLinks } from "./parseLinks.js";
import { CrawlJobData } from "./crawlJobData.js";

export default async function crawlUrl(job: { data: CrawlJobData }): Promise<void> {
  const { url, regex } = job.data;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return;
    }

    const html = await response.text();
    const baseUrl = new URL(url).origin;
    const links = parseLinks(html, baseUrl);

    console.log(`Crawled ${url} and found links:`, links);
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
  }
}
