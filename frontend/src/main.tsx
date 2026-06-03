import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql";

function App() {
  return (
    <main className="app-shell">
      <section className="toolbar">
        <h1>WebCrawler</h1>
        <div className="status">
          <span>REST: {apiUrl}</span>
          <span>GraphQL: {graphqlUrl}</span>
        </div>
      </section>

      <section className="layout">
        <aside className="panel">
          <h2>Website Records</h2>
          <p>CRUD operations placeholder.</p>
        </aside>

        <section className="graph-surface" aria-label="Crawl graph visualization">
          <span>Cytoscape.js graph placeholder</span>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
