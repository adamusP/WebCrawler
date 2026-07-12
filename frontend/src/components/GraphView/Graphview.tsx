import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
import { NodeDetailModal, SelectedNodeData } from "./NodeDetailModal";
import { WebEntryFormData } from "../WebEntries/WebEntryModal";
import styles from "./GraphView.module.css";
import { cytoscapeStyles } from "./GraphStyles";

interface GraphViewProps {
  elements: cytoscape.ElementDefinition[];
  onOpenModal: (
    initialData: Partial<WebEntryFormData>,
    isEdit: boolean,
    websiteId?: string,
    autoExecuteAndLive?: boolean
  ) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ elements, onOpenModal }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [layoutType, setLayoutType] = useState<string>("dagre");

  const getLayoutConfig = (type: string) => {
    const basePadding = 30;

    switch (type) {
      case "grid":
        return {
          name: "grid",
          fit: true,
          padding: basePadding,
        };
      case "concentric":
        return {
          name: "concentric",
          fit: true,
          padding: basePadding,
        };
      case "fcose":
        return {
          name: "fcose",
          quality: "proof",
          randomize: true,
          animate: false,
          nodeSeparation: 150,
          idealEdgeLength: 200,
          nodeRepulsion: 10000,
          fit: true,
          padding: basePadding,
        };
      case "dagre":
      default:
        return {
          name: "dagre",
          rankDir: "LR",
          nodeSep: 60,
          rankSep: 100,
          fit: true,
          padding: basePadding,
        };
    }
  };

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    cytoscape.use(dagre);
    cytoscape.use(fcose);

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: cytoscapeStyles,
      layout: { name: "null" },
    });

    cyRef.current = cy;

    cy.on("layoutstart", () => {
      setIsLoading(true);
    });

    cy.on("layoutstop", () => {
      setIsLoading(false);
    });

    cy.on("dblclick", "node", (event) => {
      const clickedNode = event.target;
      const nodeData = clickedNode.data();

      setSelectedNode({
        id: nodeData.id,
        label: nodeData.label,
        title: nodeData.title,
        crawlTime: nodeData.crawlTime,
        owner: nodeData.owner,
        isBoundary: nodeData.isBoundary,
      });

      setIsModalOpen(true);
    });

    const instanceLayout = cy.layout(getLayoutConfig(layoutType) as any);
    instanceLayout.run();

    return () => {
      if (cyRef.current) {
        cyRef.current.removeAllListeners();
        cyRef.current.destroy();
      }
    };
  }, [elements]);

  useEffect(() => {
    if (cyRef.current) {
      const newLayout = cyRef.current.layout(getLayoutConfig(layoutType) as any);
      newLayout.run();
    }
  }, [layoutType]);

  return (
    <div className={styles.graphViewContainer}>
      <div className={styles.layoutControls}>
        <label htmlFor="layoutSelect">View Mode:</label>
        <select
          id="layoutSelect"
          className={styles.layoutSelect}
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
        >
          <option value="dagre">Dagre Tree</option>
          <option value="grid">Grid</option>
          <option value="fcose">Fcose</option>
          <option value="concentric">Concentric</option>
        </select>
      </div>

      <div className={styles.graphWrapper}>
        {isLoading && <div className={styles.loadingOverlay}>Rendering {layoutType} layout...</div>}
        <div ref={containerRef} className={styles.cyContainer} />
      </div>

      {isModalOpen && selectedNode && (
        <NodeDetailModal
          isOpen={isModalOpen}
          nodeData={selectedNode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNode(null);
          }}
          onOpenModal={onOpenModal}
        />
      )}
    </div>
  );
};
