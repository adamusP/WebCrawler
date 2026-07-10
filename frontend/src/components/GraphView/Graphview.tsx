import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_GRAPH_NODES } from "../../graphql/queries";

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

  const rawNodes = data?.nodes ?? [];

  return (
    <div>
      <h2>Web Crawler Graph Data</h2>
    </div>
  );
};
