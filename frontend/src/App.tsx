import React, { useState } from "react";
import styles from "./App.module.css";
import WebEntriesList from "./components/WebEntries/WebEntries";
import ExecutionsList from "./components/Executions/Executions";

export default function App() {
  const [activeView, setActiveView] = useState<"executions" | "graph">("executions");
  const [activeSelection, setActiveSelection] = useState<string[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  return (
    <div className={styles.appContainer}>
      <aside className={styles.sidebar}>
        <WebEntriesList
          selectedWebsiteId={selectedWebsiteId}
          onSelectWebsite={setSelectedWebsiteId}
          activeSelection={activeSelection}
          onSelectionChange={setActiveSelection}
        />
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.viewSwitcher}>
          <button
            className={activeView === "executions" ? styles.switchBtnActive : styles.switchBtn}
            onClick={() => setActiveView("executions")}
          >
            Executions
          </button>
          <button
            className={activeView === "graph" ? styles.switchBtnActive : styles.switchBtn}
            onClick={() => setActiveView("graph")}
          >
            Graph
          </button>
        </div>

        {activeView === "executions" ? (
          <section className={styles.container}>
            <ExecutionsList
              websiteId={selectedWebsiteId || undefined}
              onClearFilter={() => setSelectedWebsiteId(null)}
            />
          </section>
        ) : (
          <section className={styles.container}>
            <h2>Cytoscape Visualization</h2>
            <div className={styles.placeholderContent}>Cytoscape.js Canvas</div>
          </section>
        )}
      </main>
    </div>
  );
}
