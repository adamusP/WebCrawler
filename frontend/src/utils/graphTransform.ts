import cytoscape from "cytoscape";
import { NodeGraphql } from "../graphql/graphql";

export const transformGraphqlToCytoscape = (
  rawNodes: NodeGraphql[]
): cytoscape.ElementDefinition[] => {
  const elements: cytoscape.ElementDefinition[] = [];

  const visitedNodes = new Set<string>();

  for (const node of rawNodes) {
    if (!visitedNodes.has(node.url)) {
      console.log("Processing node:", node.url, "with title:", node.title);
      visitedNodes.add(node.url);

      const nodeLabel = node.title || node.url;

      elements.push({
        data: {
          id: node.url,
          label: nodeLabel,
          title: node.title,
          crawlTime: node.crawlTime,
          owner: node.owner,
          isBoundary: false,
        },
      });
    }

    for (const link of node.links) {
      elements.push({
        data: {
          id: `edge-${node.url}-${link.url}`,
          source: node.url,
          target: link.url,
        },
      });

      if (!visitedNodes.has(link.url)) {
        visitedNodes.add(link.url);

        elements.push({
          data: {
            id: link.url,
            label: link.title || link.url,
            title: link.title,
            crawlTime: null,
            owner: [],
            isBoundary: true,
          },
        });
      }
    }
  }

  return elements;
};
