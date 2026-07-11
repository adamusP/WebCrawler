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

        <p>
          <strong>Crawl Time:</strong> {nodeData.crawlTime ?? "N/A"}
        </p>

        <div className={styles.ownersSection}>
          <h3>Owners:</h3>
          {nodeData.owner.length === 0 ? (
            <p>No owners</p>
          ) : (
            <div className={styles.ownersGrid}>
              {nodeData.owner.map((wp) => (
                <div key={wp.identifier} className={styles.ownerCard}>
                  <strong>{wp.label}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
