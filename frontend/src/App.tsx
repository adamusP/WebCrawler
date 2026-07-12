import React, { useState } from "react";
import styles from "./App.module.css";
import WebEntriesList from "./components/WebEntries/WebEntries";
import ExecutionsList from "./components/Executions/Executions";
import { GraphContainer } from "./components/GraphView/GraphContainer";
import WebEntryModal, { WebEntryFormData } from "./components/WebEntries/WebEntryModal";

interface WebEntryModalConfig {
  isOpen: boolean;
  isEdit: boolean;
  websiteId?: string;
  initialData: Partial<WebEntryFormData> | null;
  autoExecuteAndLive?: boolean;
}

export default function App() {
  const [activeView, setActiveView] = useState<"executions" | "graph">("executions");
  const [activeSelection, setActiveSelection] = useState<string[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  const [modalConfig, setModalConfig] = useState<WebEntryModalConfig>({
    isOpen: false,
    isEdit: false,
    initialData: null,
    autoExecuteAndLive: false,
  });

  const [websitesRefreshTrigger, setWebsitesRefreshTrigger] = useState<number>(0);

  const openWebEntryModal = (
    initialData: Partial<WebEntryFormData>,
    isEdit: boolean,
    websiteId?: string,
    autoExecuteAndLive?: boolean
  ) => {
    setModalConfig({
      isOpen: true,
      isEdit,
      websiteId,
      autoExecuteAndLive: autoExecuteAndLive ?? false,
      initialData: initialData ? { ...initialData } : null,
    });
  };

  const triggerCrawlerExecution = async (websiteId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/websites/${websiteId}/executions`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to trigger execution");
      }
    } catch (err) {
      console.error("Failed to execute website record:", err);
    }
  };

  const handleSaveWebsite = async (formData: WebEntryFormData) => {
    try {
      const tagsArray = formData.tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const payload = {
        label: formData.label,
        url: formData.url,
        boundaryRegexp: formData.boundaryRegexp,
        periodicity: formData.periodicity,
        active: formData.active,
        tags: tagsArray,
      };

      const isEdit = modalConfig.isEdit;
      const url = isEdit
        ? `http://localhost:3000/api/websites/${modalConfig.websiteId}`
        : "http://localhost:3000/api/websites";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save the record.");
      }

      const savedRecord = await response.json();

      setModalConfig((prev) => ({ ...prev, isOpen: false }));

      setWebsitesRefreshTrigger((prev) => prev + 1);

      if (!isEdit && modalConfig.autoExecuteAndLive && savedRecord?.id) {
        const newId = savedRecord.id;

        setActiveSelection((prev) => (prev.includes(newId) ? prev : [...prev, newId]));

        setIsLiveMode(true);

        await triggerCrawlerExecution(newId);
      }
    } catch (err) {
      console.error("Failed to save the record:", err);
      alert("Failed to save the record. Check console for details.");
    }
  };

  return (
    <div className={styles.appContainer}>
      <aside className={styles.sidebar}>
        <WebEntriesList
          selectedWebsiteId={selectedWebsiteId}
          onSelectWebsite={setSelectedWebsiteId}
          activeSelection={activeSelection}
          onSelectionChange={setActiveSelection}
          onOpenModal={openWebEntryModal}
          refreshTrigger={websitesRefreshTrigger}
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
            <GraphContainer
              selectedWebPages={activeSelection}
              isLiveMode={isLiveMode}
              onLiveModeChange={setIsLiveMode}
              onOpenModal={openWebEntryModal}
            />
          </section>
        )}

        {modalConfig.isOpen && (
          <WebEntryModal
            onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
            onSave={handleSaveWebsite}
            initialData={modalConfig.initialData}
          />
        )}
      </main>
    </div>
  );
}
