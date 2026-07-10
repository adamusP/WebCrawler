export const GraphqlTypeDefs = `#graphql
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

export type WebPageGraphql = {
  identifier: string;
  label: string;
  url: string;
  regexp: string;
  tags: string[];
  active: boolean;
};

export type NodeGraphql = {
  title: string | null;
  url: string;
  crawlTime: string | null;
  links: NodeGraphql[];
  owner: WebPageGraphql[];
};
