import React, { useState, useMemo } from "react";
import styles from "./WebEntries.module.css";
import { MOCK_DATA } from "../../components/types/website";

const ITEMS_PER_PAGE = 4;

export default function WebEntriesList() {
  const [currentPage, setCurrentPage] = useState(1);
  let items = MOCK_DATA;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;

  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, safeCurrentPage]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Web Entries</h2>

      <div className={styles.list}>
        {paginatedItems.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", textAlign: "center" }}>
            No records found.
          </p>
        ) : (
          paginatedItems.map((item) => {
            return (
              <div key={item.id} className={styles.card}>
                <h4 className={styles.label}>{item.label}</h4>
                <span className={styles.url}>{item.url}</span>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          disabled={safeCurrentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {safeCurrentPage} of {totalPages}
        </span>
        <button
          className={styles.pageButton}
          disabled={safeCurrentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
