import React, { useState, useMemo } from "react";
import styles from "./WebEntries.module.css";
import { MOCK_DATA } from "../../components/types/website";

const ITEMS_PER_PAGE = 4;

export default function WebEntriesList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const items = MOCK_DATA;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const lowerCaseQuery = searchQuery.toLowerCase();

    return items.filter((item) => {
      const matchesUrl = item.url.toLowerCase().includes(lowerCaseQuery);
      const matchesLabel = item.label.toLowerCase().includes(lowerCaseQuery);
      const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery));

      return matchesUrl || matchesLabel || matchesTags;
    });
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, safeCurrentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Web Entries</h2>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Filter by URL, Label, or Tag..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>

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
