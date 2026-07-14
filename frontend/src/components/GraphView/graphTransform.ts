import cytoscape from "cytoscape";
import { NodeGraphql } from "../../graphql/graphTypes";

export type GraphViewMode = "website" | "domain";

const getDomainName = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const transformGraphqlToCytoscape = (
  rawNodes: NodeGraphql[],
  viewMode: GraphViewMode = "website"
): cytoscape.ElementDefinition[] => {
  const elements: cytoscape.ElementDefinition[] = [];

  if (viewMode === "website") {
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
        if (node.url === link.url) continue;
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
  }

  if (viewMode === "domain") {
    const domainNodesMap = new Map<string, any>();
    const createdEdges = new Set<string>();

    for (const node of rawNodes) {
      const domain = getDomainName(node.url);
      const isBoundaryNode = !node.crawlTime;

      if (!domainNodesMap.has(domain)) {
        domainNodesMap.set(domain, {
          data: {
            id: domain,
            label: domain,
            owner: node.owner,
            isBoundary: isBoundaryNode,
          },
        });
      } else {
        if (!isBoundaryNode) {
          domainNodesMap.get(domain).data.isBoundary = false;
        }
      }
    }

    for (const node of rawNodes) {
      const sourceDomain = getDomainName(node.url);

      for (const link of node.links) {
        const targetDomain = getDomainName(link.url);

        if (sourceDomain === targetDomain) continue;

        const edgeId = `edge-${sourceDomain}-${targetDomain}`;

        if (!createdEdges.has(edgeId)) {
          createdEdges.add(edgeId);
          elements.push({
            data: {
              id: edgeId,
              source: sourceDomain,
              target: targetDomain,
            },
          });
        }
      }
    }

    return [...Array.from(domainNodesMap.values()), ...elements];
  }

  return [];
};
