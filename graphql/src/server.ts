import { ApolloServer } from "@apollo/server";
import type { NodeGraphql, WebPageGraphql } from "./graphql.js";
import { GraphqlTypeDefs } from "./graphql.js";
import { GraphBuilder } from "./graphbuilder.js";
import express from "express";
import cors from "cors";
import { expressMiddleware } from "@as-integrations/express5";

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

const app = express();
const server = new ApolloServer({ typeDefs: GraphqlTypeDefs, resolvers });
const port = Number(process.env.PORT ?? 4000);

await server.start();
app.use("/graphql", cors<cors.CorsRequest>(), express.json(), expressMiddleware(server));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "graphql" });
});

await new Promise<void>((resolve, reject) => {
  app
    .listen(port, () => {
      resolve();
    })
    .on("error", reject);
});

console.log(`GraphQL API listening on port ${port}`);
