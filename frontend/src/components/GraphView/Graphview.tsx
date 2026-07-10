import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

interface GraphViewProps {
  elements: cytoscape.ElementDefinition[];
}

export const GraphView: React.FC<GraphViewProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

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
      layout: {
        name: "grid",
        rows: 2,
      },
    });

    return () => {
      cy.destroy();
    };
  }, [elements]);

  return (
    <div style={{ padding: "10px", height: "100%" }}>
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
    </div>
  );
};
