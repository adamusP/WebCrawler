import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

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
    websites: () => [],
    nodes: () => []
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
const port = Number(process.env.PORT ?? 4000);

const { url } = await startStandaloneServer(server, {
  listen: { port }
});

console.log(`GraphQL API listening at ${url}`);
