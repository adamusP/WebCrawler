import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_GRAPH_NODES } from "../../graphql/queries";
import { GraphView } from "./Graphview";
import { transformGraphqlToCytoscape, GraphViewMode } from "../../utils/graphTransform";
import styles from "./GraphContainer.module.css";
import { WebEntryFormData } from "../WebEntries/WebEntryModal";

interface GraphContainerProps {
  selectedWebPages: string[];
  isLiveMode: boolean;
  onLiveModeChange: (isLive: boolean) => void;
  onOpenModal: (
    initialData: Partial<WebEntryFormData>,
    isEdit: boolean,
    websiteId?: string,
    autoExecuteAndLive?: boolean
  ) => void;
}

const DEFAULT_POLL_INTERVAL = 5000;

export const GraphContainer: React.FC<GraphContainerProps> = ({
  selectedWebPages,
  isLiveMode,
  onLiveModeChange,
  onOpenModal,
}) => {
  const [viewMode, setViewMode] = useState<GraphViewMode>("website");

  const callInterval = isLiveMode ? DEFAULT_POLL_INTERVAL : 0;
  const { loading, error, data, refetch } = useQuery(GET_GRAPH_NODES, {
    variables: {
      webPages: selectedWebPages.length > 0 ? selectedWebPages : null,
    },
    pollInterval: callInterval,
    fetchPolicy: "network-only",
  });

  const handleLiveModeToggle = async (enableLive: boolean) => {
    onLiveModeChange(enableLive);
    if (enableLive) {
      try {
        await refetch();
      } catch (err) {
        console.error("Failed to refetch graph data on live mode activation:", err);
      }
    }
  };

  const transformedElements = useMemo(() => {
    const rawNodes = data?.nodes ?? [];
    return transformGraphqlToCytoscape(rawNodes, viewMode);
  }, [data, viewMode]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
        <h4>GraphQL Graph Data Status</h4>
        <p>
          Received <strong>{data?.nodes?.length || 0}</strong> main pages.
        </p>

        <div className={styles.viewModeContainer}>
          <button
            type="button"
            className={`${styles.modeButton} ${viewMode === "website" ? styles.activeMode : ""}`}
            onClick={() => setViewMode("website")}
          >
            Website View
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${viewMode === "domain" ? styles.activeMode : ""}`}
            onClick={() => setViewMode("domain")}
          >
            Domain View
          </button>
        </div>
        <div className={styles.viewModeContainer}>
          <button
            type="button"
            className={`${styles.modeButton} ${isLiveMode ? styles.activeMode : ""}`}
            onClick={() => handleLiveModeToggle(true)}
          >
            Live Mode
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${!isLiveMode ? styles.activeMode : ""}`}
            onClick={() => handleLiveModeToggle(false)}
          >
            Static Mode
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: "500px" }}>
        <GraphView elements={transformedElements} onOpenModal={onOpenModal} />
      </div>
    </div>
  );
};
