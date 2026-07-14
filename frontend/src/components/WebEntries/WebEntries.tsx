import React, { useState, useEffect } from "react";
import styles from "./WebEntries.module.css";
import { WebsiteRecord, WebsiteRecordDTO, mapWebsiteRecord } from "../../components/types/website";
import { WebEntryFormData } from "./WebEntryModal";
import { Pencil, Trash2, Globe } from "lucide-react";
interface WebEntriesListProps {
  selectedWebsiteId: string | null;
  onSelectWebsite: (id: string | null) => void;
  activeSelection: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenModal: (
    initialData: Partial<WebEntryFormData>,
    isEdit: boolean,
    websiteId?: string
  ) => void;
  refreshTrigger: number;
}

export default function WebEntriesList({
  selectedWebsiteId,
  onSelectWebsite,
  activeSelection,
  onSelectionChange,
  onOpenModal,
  refreshTrigger,
}: WebEntriesListProps) {
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [filterUrl, setFilterUrl] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterTags, setFilterTags] = useState("");
  const [sortBy, setSortBy] = useState<"url" | "lastCrawledAt">("url");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(4);

  const fetchWebsites = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (filterUrl.trim()) params.append("url", filterUrl.trim());
      if (filterLabel.trim()) params.append("label", filterLabel.trim());
      if (filterTags.trim()) params.append("tags", filterTags.trim());

      const response = await fetch(`http://localhost:3000/api/websites?${params.toString()}`);

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data: WebsiteRecordDTO[] = await response.json();
      const mappedData = data.map(mapWebsiteRecord);

      setWebsites(mappedData);
      setHasMore(data.length === itemsPerPage);
      setError(null);
    } catch (err) {
      console.error("Server Error:", err);
      if (!isBackground) setError("Failed to fetch data.");
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchWebsites();

    const intervalId = setInterval(() => {
      fetchWebsites(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [
    currentPage,
    filterUrl,
    filterLabel,
    filterTags,
    sortBy,
    sortOrder,
    refreshTrigger,
    itemsPerPage,
  ]);

  const handleFilterChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setCurrentPage(1);
    };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "url" | "lastCrawledAt");
    setCurrentPage(1);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as "asc" | "desc");
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
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
      alert("Failed to delete the record. Please check the console for more details.");
    }
  };

  const handleCreateClick = () => {
    onOpenModal({}, false);
  };

  const handleEditClick = (website: WebsiteRecord) => {
    const initialFormData: Partial<WebEntryFormData> = {
      label: website.label,
      url: website.url,
      boundaryRegexp: website.boundaryRegexp,
      periodicity: website.periodicity,
      active: website.active,
      tagsString: website.tags ? website.tags.join(", ") : "",
    };
    onOpenModal(initialFormData, true, website.id);
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
          handleCreateClick();
        }}
      >
        <span>+ Add New Entry</span>
      </button>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Filter by Label..."
          value={filterLabel}
          onChange={handleFilterChange(setFilterLabel)}
          className={styles.searchInput}
        />
        <input
          type="text"
          placeholder="Filter by URL..."
          value={filterUrl}
          onChange={handleFilterChange(setFilterUrl)}
          className={styles.searchInput}
        />
        <input
          type="text"
          placeholder="Filter by Tags..."
          value={filterTags}
          onChange={handleFilterChange(setFilterTags)}
          className={styles.searchInput}
        />

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select value={sortBy} onChange={handleSortChange} className={styles.sortSelect}>
            <option value="url">Sort by URL</option>
            <option value="lastCrawledAt">Sort by Last Crawled</option>
          </select>
          <select value={sortOrder} onChange={handleSortOrderChange} className={styles.sortSelect}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "#dc2626" }}>{error}</p>
        ) : websites.length === 0 ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>No records found.</p>
        ) : (
          websites.map((item) => (
            <div
              key={item.id}
              className={`${styles.card} ${selectedWebsiteId === item.id ? styles.active : ""}`}
              onClick={() => onSelectWebsite(selectedWebsiteId === item.id ? null : item.id)}
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
                  <h4 className={styles.label} title={item.label}>
                    {item.label}
                  </h4>
                  <div className={styles.cardHeaderRight}>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.lastStatus)}`}>
                      {item.lastStatus || "UNTESTED"}
                    </span>

                    <button
                      type="button"
                      title="Edit Record"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(item);
                      }}
                      className={`${styles.actionButton} ${styles.editButton}`}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      title="Delete Record"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWebsite(item.id, item.label);
                      }}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.url}>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <Globe size={16} />
                  </a>
                  <span className={styles.urlText} title={item.url}>
                    {item.url}
                  </span>
                </div>

                {item.tags.length > 0 && (
                  <div className={styles.tags}>
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tag} title={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <span className={!item.active ? styles.inactiveText : ""}>
                    {item.active ? `Period: ${item.periodicity}` : "Inactive"}
                  </span>
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
        <div className={styles.limitSelector}>
          <label htmlFor="itemsPerPage">Per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className={styles.limitSelect}
          >
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
        <button
          className={styles.pageButton}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>Page {currentPage}</span>
        <button
          className={styles.pageButton}
          disabled={!hasMore || websites.length === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
