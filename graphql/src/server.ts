import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import type { NodeGraphql, WebPageGraphql } from "./graphql.js";
import { GraphqlTypeDefs } from "./graphql.js";
import { GraphBuilder } from "./graphbuilder.js";

import {
  getLatestExecutions,
  listCrawledLinks,
  listCrawledPages,
  listWebsiteRecords,
} from "./database.js";

const resolvers = {
  Query: {
    websites: async (): Promise<WebPageGraphql[]> => {
      const records = await listWebsiteRecords();

      const graphBuilder = new GraphBuilder();
      const websiteMap = graphBuilder.buildWebsiteMap(records).getWebsiteMap();

      return Array.from(websiteMap.values());
    },
    nodes: async (_: any, args: { webPages?: string[] }): Promise<NodeGraphql[]> => {
      const latestExecutions = await getLatestExecutions(args.webPages ?? []);

      const executionIds = latestExecutions.map((e) => e.id);

      const [pages, links, websites] = await Promise.all([
        listCrawledPages(executionIds),
        listCrawledLinks(executionIds),
        listWebsiteRecords(),
      ]);

      const graphBuilder = new GraphBuilder();

      const nodes = graphBuilder
        .buildNodes(pages)
        .buildLinks(links)
        .buildWebsiteMap(websites)
        .attachOwnersToNodes(pages)
        .getNodes();

      return nodes;
    },
  },
};

const server = new ApolloServer({ typeDefs: GraphqlTypeDefs, resolvers });
const port = Number(process.env.PORT ?? 4000);

const { url } = await startStandaloneServer(server, {
  listen: { port },
});

console.log(`GraphQL API listening at ${url}`);
