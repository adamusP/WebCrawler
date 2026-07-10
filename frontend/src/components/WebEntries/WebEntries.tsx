import React, { useState, useMemo, useEffect } from "react";
import styles from "./WebEntries.module.css";
import { WebsiteRecord, WebsiteRecordDTO, mapWebsiteRecord } from "../../components/types/website";
import WebEntryModal, { WebEntryFormData } from "./WebEntryModal";

const ITEMS_PER_PAGE = 4;

interface WebEntriesListProps {
  selectedWebsiteId: string | null;
  onSelectWebsite: (id: string | null) => void;
  activeSelection: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function WebEntriesList({
  selectedWebsiteId,
  onSelectWebsite,
  activeSelection,
  onSelectionChange,
}: WebEntriesListProps) {
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"url" | "lastCrawledAt">("url");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingWebsite, setEditingWebsite] = useState<WebsiteRecord | null>(null);

  const fetchWebsites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3000/api/websites");

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data: WebsiteRecordDTO[] = await response.json();

      const mappedData = data.map(mapWebsiteRecord);

      setWebsites(mappedData);
      setError(null);
    } catch (err) {
      console.error("Server Error:", err);
      setError("Failed to fetch data from the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

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

      const isEdit = !!editingWebsite;
      const url = isEdit
        ? `http://localhost:3000/api/websites/${editingWebsite.id}`
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

      setIsModalOpen(false);
      setEditingWebsite(null);
      fetchWebsites();
    } catch (err) {
      console.error("Failed to save the record:", err);
      alert("Failed to save the record. Please check the console for more details.");
    }
  };

  const handleDeleteWebsite = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete "${label}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/websites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete the record.");

      fetchWebsites();
    } catch (err) {
      console.error("Failed to delete the record:", err);
      alert("Failed to save the record. Please check the console for more details.");
    }
  };

  const openEditModal = (item: WebsiteRecord) => {
    setEditingWebsite(item);
    setIsModalOpen(true);
  };

  const modalInitialData = useMemo(() => {
    if (!editingWebsite) return null;
    return {
      label: editingWebsite.label,
      url: editingWebsite.url,
      boundaryRegexp: editingWebsite.boundaryRegexp,
      periodicity: editingWebsite.periodicity as "MINUTE" | "HOUR" | "DAY" | "NONE",
      active: editingWebsite.active,
      tagsString: editingWebsite.tags.join(", "),
    };
  }, [editingWebsite]);

  const resultItems = useMemo(() => {
    let items = websites;

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
  }, [websites, searchQuery, sortBy]);

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

  const toggleSelection = (id: string) => {
    if (activeSelection.includes(id)) {
      onSelectionChange(activeSelection.filter((item) => item !== id));
    } else {
      onSelectionChange([...activeSelection, id]);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Web Entries</h2>
      <button
        type="button"
        className={styles.addButton}
        onClick={() => {
          setEditingWebsite(null);
          setIsModalOpen(true);
        }}
      >
        <span>+ Add New Record</span>
      </button>

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
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "#dc2626" }}>{error}</p>
        ) : paginatedItems.length === 0 ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>No records found.</p>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.card} ${selectedWebsiteId === item.id ? styles.active : ""}`}
              onClick={() => onSelectWebsite(item.id)}
            >
              <input
                type="checkbox"
                checked={activeSelection.includes(item.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelection(item.id);
                }}
              />

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.label}>{item.label}</h4>
                  <div className={styles.cardHeaderRight}>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.lastStatus)}`}>
                      {item.lastStatus || "UNTESTED"}
                    </span>

                    <button
                      type="button"
                      title="Edit Record"
                      onClick={() => openEditModal(item)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                    >
                      E
                    </button>

                    <button
                      type="button"
                      title="Delete Record"
                      onClick={() => handleDeleteWebsite(item.id, item.label)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      D
                    </button>
                  </div>
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
          ))
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
      {isModalOpen && (
        <WebEntryModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingWebsite(null);
          }}
          onSave={handleSaveWebsite}
          initialData={modalInitialData}
        />
      )}
    </div>
  );
}
