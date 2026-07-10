import React from "react";
import styles from "./WebEntryModal.module.css";

interface WebEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  //on save
}

export default function WebEntryModal({ isOpen, onClose }: WebEntryModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Create Website Record</h3>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button className={styles.saveButton}>Save Record</button>
        </div>
      </div>
    </div>
  );
}
