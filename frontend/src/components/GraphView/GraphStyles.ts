import cytoscape from "cytoscape";

export const cytoscapeStyles: cytoscape.StylesheetStyle[] = [
  {
    selector: "node",
    style: {
      "background-color": "#0070f3",
      label: "data(label)",
      color: "#333",
      "font-size": 12,
      "text-valign": "center",
      "text-halign": "right",
      "text-margin-x": 8,
      width: 30,
      height: 30,
    },
  },
  {
    selector: "node[?isBoundary]",
    style: {
      "background-color": "#ff4d4f",
      "border-width": 2,
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
];
