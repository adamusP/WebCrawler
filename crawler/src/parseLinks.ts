import * as cheerio from "cheerio";

export function parseLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    try {
      const url = new URL(href, baseUrl);
      // Only consider HTTP and HTTPS links.
      if (!["http:", "https:"].includes(url.protocol)) return;

      links.add(url.toString());
    } catch {
      // Ignore invalid href values during parsing.
    }
  });

  return [...links];
}
