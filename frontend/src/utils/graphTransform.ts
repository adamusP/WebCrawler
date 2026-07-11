import cytoscape from "cytoscape";
import { NodeGraphql } from "../graphql/graphql";

export const transformGraphqlToCytoscape = (
  rawNodes: NodeGraphql[]
): cytoscape.ElementDefinition[] => {
  const elements: cytoscape.ElementDefinition[] = [];

  const visitedNodes = new Set<string>();

  for (const node of rawNodes) {
    if (!visitedNodes.has(node.url)) {
      visitedNodes.add(node.url);

      const isBoundaryNode = !node.crawlTime;

      elements.push({
        data: {
          id: node.url,
          label: node.title || node.url,
          title: node.title,
          crawlTime: node.crawlTime,
          owner: node.owner,
          isBoundary: isBoundaryNode,
        },
      });
    }
  }

  for (const node of rawNodes) {
    for (const link of node.links) {
      elements.push({
        data: {
          id: `edge-${node.url}-${link.url}`,
          source: node.url,
          target: link.url,
        },
      });
    }
  }
  return elements;
};
