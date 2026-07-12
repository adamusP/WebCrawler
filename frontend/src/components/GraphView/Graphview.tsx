import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "10px" }}>
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "12px" }}>
        <label htmlFor="layoutSelect" style={{ fontWeight: 600, color: "#333" }}>
          View Mode:
        </label>
        <select
          id="layoutSelect"
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d9d9d9",
            backgroundColor: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="dagre">Dagre Tree</option>
          <option value="grid">Grid</option>
          <option value="fcose">Fcose</option>
          <option value="concentric">Concentric</option>
        </select>
      </div>

      <div style={{ position: "relative", flexGrow: 1, minHeight: "500px" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
            Rendering {layoutType} layout...
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
          }}
        />
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
