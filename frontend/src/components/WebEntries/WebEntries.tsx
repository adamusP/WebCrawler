import React, { useState, useMemo } from "react";
import styles from "./WebEntries.module.css";
import { WebsiteRecord, MOCK_DATA } from "../../components/types/website";

const ITEMS_PER_PAGE = 4;

export default function WebEntriesList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"url" | "lastCrawledAt">("url");

  const resultItems = useMemo(() => {
    let items = MOCK_DATA;

    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const matchesUrl = item.url.toLowerCase().includes(lowerCaseQuery);
        const matchesLabel = item.label.toLowerCase().includes(lowerCaseQuery);
        const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery));
        return matchesUrl || matchesLabel || matchesTags;
      });
    }
    return [...items].sort((a, b) => {
      if (sortBy === "url") {
        return a.url.localeCompare(b.url);
      } else {
        const timeA = a.lastCrawledAt ? a.lastCrawledAt.getTime() : 0;
        const timeB = b.lastCrawledAt ? b.lastCrawledAt.getTime() : 0;

        return timeB - timeA;
      }
    });
  }, [searchQuery, sortBy]);

  const totalPages = Math.ceil(resultItems.length / ITEMS_PER_PAGE) || 1;

  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return resultItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [resultItems, safeCurrentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "url" | "lastCrawledAt");
    setCurrentPage(1);
  };

  const getStatusClass = (status: WebsiteRecord["lastStatus"]) => {
    switch (status) {
      case "SUCCEEDED":
        return styles.statusSuccess;
      case "FAILED":
        return styles.statusFailed;
      case "RUNNING":
        return styles.statusRunning;
      default:
        return styles.statusNone;
    }
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
        <select value={sortBy} onChange={handleSortChange} className={styles.sortSelect}>
          <option value="url">Sort by URL</option>
          <option value="lastCrawledAt">Sort by Last Crawled</option>
        </select>
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
                <input type="checkbox" style={{ marginTop: "0.4rem", cursor: "pointer" }} />

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.label}>{item.label}</h4>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.lastStatus)}`}>
                      {item.lastStatus || "UNTESTED"}
                    </span>
                  </div>

                  <a href={item.url} target="_blank" rel="noreferrer" className={styles.url}>
                    {item.url}
                  </a>

                  {item.tags.length > 0 && (
                    <div className={styles.tags}>
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span>Period: {item.periodicity}</span>
                    <span>
                      {item.lastCrawledAt ? item.lastCrawledAt.toLocaleString() : "Never crawled"}
                    </span>
                  </div>
                </div>
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
