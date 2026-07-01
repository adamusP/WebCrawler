import type { NodeGraphql, WebPageGraphql } from "./graphql.js";
import type { WebsiteRecord, CrawledPageRow, CrawledLinkRow } from "./database.js";

export class GraphBuilder {
  private nodeMap = new Map<string, NodeGraphql>();
  private getOrCreateNode(url: string): NodeGraphql {
    const existing = this.nodeMap.get(url);
    if (existing) {
      return existing;
    }

    const node: NodeGraphql = {
      title: null,
      url,
      crawlTime: null,
      links: [],
      owner: [],
    };
    this.nodeMap.set(url, node);
    return node;
  }

  buildNodes(pages: CrawledPageRow[]) {
    for (const p of pages) {
      const node = this.getOrCreateNode(p.url);
      node.title = p.title;
      node.crawlTime = p.crawlTime?.toISOString() ?? null;
    }

    return this;
  }

  buildLinks(links: CrawledLinkRow[]) {
    for (const l of links) {
      const fromNode = this.getOrCreateNode(l.fromUrl);
      const toNode = this.getOrCreateNode(l.toUrl);

      if (!fromNode.links.some((link) => link.url === toNode.url)) {
        fromNode.links.push(toNode);
      }
    }

    return this;
  }

  private websiteMap = new Map<string, WebPageGraphql>();
  buildWebsiteMap(websites: WebsiteRecord[]) {
    this.websiteMap.clear();

    for (const w of websites) {
      this.websiteMap.set(w.id, {
        identifier: w.id,
        label: w.label,
        url: w.url,
        regexp: w.boundaryRegexp,
        tags: w.tags ?? [],
        active: w.active ?? true,
      } as WebPageGraphql);
    }

    return this;
  }

  attachOwnersToNodes(pages: CrawledPageRow[]) {
    for (const p of pages) {
      const node = this.nodeMap.get(p.url);
      const owner = this.websiteMap.get(p.websiteRecordId);

      if (node && owner) {
        node.owner.push(owner);
      }
    }

    return this;
  }

  getNodes(): NodeGraphql[] {
    return Array.from(this.nodeMap.values());
  }

  getWebsiteMap(): Map<string, WebPageGraphql> {
    return this.websiteMap;
  }
}
