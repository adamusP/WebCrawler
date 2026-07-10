import React, { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_GRAPH_NODES } from "../../graphql/queries";
import { GraphView } from "./Graphview";
import { transformGraphqlToCytoscape } from "../../utils/graphTransform";

interface GraphContainerProps {
  selectedWebPages: string[];
}

export const GraphContainer: React.FC<GraphContainerProps> = ({ selectedWebPages }) => {
  const { loading, error, data } = useQuery(GET_GRAPH_NODES, {
    variables: {
      webPages: selectedWebPages.length > 0 ? selectedWebPages : null,
    },
    pollInterval: 5000,
  });

  const transformedElements = useMemo(() => {
    const rawNodes = data?.nodes ?? [];
    return transformGraphqlToCytoscape(rawNodes);
  }, [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
        <h4>GraphQL Graph Data Status</h4>
        <p>
          Received <strong>{data?.nodes?.length || 0}</strong> main pages.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: "500px" }}>
        <GraphView elements={transformedElements} />
      </div>
    </div>
  );
};
