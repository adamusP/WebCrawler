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
      links.add(new URL(href, baseUrl).toString());
    } catch {
      // Ignore invalid href values during parsing.
    }
  });

  return [...links];
}
