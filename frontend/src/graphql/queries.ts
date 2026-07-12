import { gql, TypedDocumentNode } from "@apollo/client";
import { NodeGraphql } from "./graphql";

interface GetGraphNodesData {
  nodes: NodeGraphql[];
}

interface GetGraphNodesVariables {
  webPages: string[] | null;
}

export const GET_GRAPH_NODES: TypedDocumentNode<GetGraphNodesData, GetGraphNodesVariables> = gql`
  query GetGraphNodes($webPages: [ID!]) {
    nodes(webPages: $webPages) {
      url
      title
      crawlTime
      owner {
        identifier
        label
      }
      links {
        url
        title
      }
    }
  }
`;
