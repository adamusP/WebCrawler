import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import {
  getLatestExecutions,
  listCrawledLinks,
  listCrawledPages,
  listWebsiteRecords,
} from "./database.js";

type WebPageGraphql = {
  identifier: string;
  label: string;
  url: string;
  regexp: string;
  tags: string[];
  active: boolean;
};

type NodeGraphql = {
  title: string | null;
  url: string;
  crawlTime: string | null;
  links: NodeGraphql[];
  owner: WebPageGraphql[];
};

const typeDefs = `#graphql
  type Query {
    websites: [WebPage!]!
    nodes(webPages: [ID!]): [Node!]!
  }

  type WebPage {
    identifier: ID!
    label: String!
    url: String!
    regexp: String!
    tags: [String!]!
    active: Boolean!
  }

  type Node {
    title: String
    url: String!
    crawlTime: String
    links: [Node!]!
    owner: [WebPage!]!
  }
`;

const resolvers = {
  Query: {
    websites: async () => {
      const records = await listWebsiteRecords();

      return records.map((w) => ({
        identifier: w.id,
        label: w.label,
        url: w.url,
        regexp: w.boundaryRegexp,
        tags: w.tags ?? [],
        active: w.active ?? true,
      }));
    },
    nodes: async (_: any, args: { webPages?: string[] }) => {
      const latestExecutions = await getLatestExecutions(args.webPages ?? []);

      const executionIds = latestExecutions.map((e) => e.id);

      const [pages, links, websites] = await Promise.all([
        listCrawledPages(executionIds),
        listCrawledLinks(executionIds),
        listWebsiteRecords(),
      ]);

      // Map url → node
      const nodeMap = new Map<string, NodeGraphql>();
      const getOrCreateNode = (url: string): NodeGraphql => {
        const existing = nodeMap.get(url);
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
        nodeMap.set(url, node);
        return node;
      };

      for (const p of pages) {
        const node = getOrCreateNode(p.url);
        node.title = p.title;
        node.crawlTime = p.crawlTime?.toISOString() ?? null;
      }

      // Build links
      for (const l of links) {
        const fromNode = getOrCreateNode(l.fromUrl);
        const toNode = getOrCreateNode(l.toUrl);

        if (!fromNode.links.some((link) => link.url === toNode.url)) {
          fromNode.links.push(toNode);
        }
      }

      // Attach owners
      const websiteMap = new Map(
        websites.map((w) => [
          w.id,
          {
            identifier: w.id,
            label: w.label,
            url: w.url,
            regexp: w.boundaryRegexp,
            tags: w.tags ?? [],
            active: w.active ?? true,
          },
        ])
      );

      for (const p of pages) {
        const node = nodeMap.get(p.url);
        const owner = websiteMap.get(p.websiteRecordId);

        if (node && owner) {
          node.owner.push(owner);
        }
      }

      return Array.from(nodeMap.values());
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const port = Number(process.env.PORT ?? 4000);

const { url } = await startStandaloneServer(server, {
  listen: { port },
});

console.log(`GraphQL API listening at ${url}`);
