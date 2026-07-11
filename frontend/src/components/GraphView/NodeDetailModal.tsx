import React, { useEffect, useRef, useState } from "react";
import styles from "./NodeDetailModal.module.css";

export interface SelectedNodeData {
  id: string;
  label: string;
  title: string | null;
  crawlTime: string | null;
  owner: Array<{ identifier: string; label: string }>;
  isBoundary: boolean;
}

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: SelectedNodeData | null;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ isOpen, onClose, nodeData }) => {
  if (!isOpen || !nodeData) return null;
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const handleStartExecution = async (websiteRecordId: string) => {
    setTriggeringId(websiteRecordId);
    try {
      const response = await fetch(
        `http://localhost:3000/api/websites/${websiteRecordId}/executions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`Server responded with error status: ${response.status}`);
      } else {
        console.log(`Execution started successfully for website: ${websiteRecordId}`);
      }
    } catch (error) {
      console.error("Failed to start execution:", error);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Node detail: {nodeData.title || ""}</h2>

        <p>
          <strong>URL:</strong>{" "}
          <a href={nodeData.id} target="_blank" rel="noreferrer">
            {nodeData.id}
          </a>
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {nodeData.isBoundary ? (
            <span className={styles.badgeBoundary}>Boundary</span>
          ) : (
            <span className={styles.badgeCrawled}>Crawled</span>
          )}
        </p>

        {!nodeData.isBoundary && (
          <p>
            <strong>Crawl Time:</strong> {nodeData.crawlTime ?? "N/A"}
          </p>
        )}

        {!nodeData.isBoundary && (
          <div className={styles.ownersSection}>
            <h3>Belongs to Website Records:</h3>
            {nodeData.owner.length === 0 ? (
              <p>No owners found for this node.</p>
            ) : (
              <div className={styles.ownersGrid}>
                {nodeData.owner.map((wp) => (
                  <div key={wp.identifier} className={styles.ownerCard}>
                    <div className={styles.ownerInfo}>
                      <strong>{wp.label}</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.startButton}
                      onClick={() => handleStartExecution(wp.identifier)}
                      disabled={triggeringId !== null}
                    >
                      {triggeringId === wp.identifier ? "Starting..." : "Run Now"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {nodeData.isBoundary && (
          <div className={styles.boundarySection}>
            <h3>Create Website Record</h3>
          </div>
        )}
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
