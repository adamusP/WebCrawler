import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { NodeDetailModal, SelectedNodeData } from "./NodeDetailModal";
import { WebEntryFormData } from "../WebEntries/WebEntryModal";

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

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    cytoscape.use(dagre);
    const layoutConfig = {
      name: "dagre",
      rankDir: "LR",
      nodeSep: 60,
      rankSep: 100,
      fit: true,
      padding: 30,
      // name: "grid",
      // rows: 10,
      // cols: 10,
      // fit: true,
      // padding: 30,
    };

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#0070f3",
            label: "data(label)",
            color: "#333",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "right",
            "text-margin-x": 8,
            width: "30px",
            height: "30px",
          },
        },
        {
          selector: "node[?isBoundary]",
          style: {
            "background-color": "#ff4d4f",
            "border-width": "2px",
            "border-color": "#cf1322",
            shape: "rectangle",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],
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

    const instanceLayout = cy.layout(layoutConfig as any);
    instanceLayout.run();

    return () => {
      if (cyRef.current) {
        cyRef.current.off("layoutstart");
        cyRef.current.off("layoutstop");
        cyRef.current.off("dblclick", "node");
        cyRef.current.destroy();
      }
    };
  }, [elements]);

  return (
    <div style={{ padding: "10px", height: "100%", position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            right: "10px",
            bottom: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            borderRadius: "8px",
            fontWeight: "bold",
            color: "#555",
          }}
        >
          Rendering crawler graph...
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      />

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
