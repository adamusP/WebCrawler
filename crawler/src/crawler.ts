import {parseLinks} from "./parseLinks.js";

export function enqueueUrlForCrawling(url: string) : boolean {
    const baseUrl = new URL(url).origin;
    
    crawlUrl(url);
    
    return true;
}

async function crawlUrl(url: string) : Promise<void> {
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
