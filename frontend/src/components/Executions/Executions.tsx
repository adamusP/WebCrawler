import React, { useEffect, useState, useCallback } from "react";
import { Execution, ExecutionDTO, mapExecution } from "../../components/types/execution";
import styles from "./Executions.module.css";

interface ExecutionsListProps {
  websiteId?: string;
  onClearFilter: () => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ExecutionsList({ websiteId, onClearFilter }: ExecutionsListProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const fetchExecutions = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const baseUrl = websiteId
          ? `http://localhost:3000/api/websites/${websiteId}/executions`
          : "http://localhost:3000/api/executions";

        const url = new URL(baseUrl);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", itemsPerPage.toString());

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ExecutionDTO[] = await response.json();
        setExecutions(data.map(mapExecution));

        setHasMore(data.length === itemsPerPage);
      } catch (error) {
        console.error("Failed to fetch executions:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [websiteId, itemsPerPage]
  );

  useEffect(() => {
    fetchExecutions(currentPage);
  }, [fetchExecutions, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [websiteId]);

  const handleStartExecution = async () => {
    if (!websiteId) return;

    setIsTriggering(true);
    try {
      const response = await fetch(`http://localhost:3000/api/websites/${websiteId}/executions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await delay(800);
        if (currentPage === 1) {
          await fetchExecutions(1);
        } else {
          setCurrentPage(1);
        }
      } else {
        console.error("Server responded with an error when starting execution");
      }
    } catch (error) {
      console.error("Failed to start execution:", error);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchExecutions(currentPage);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  if (isLoading && executions.length === 0) return <div>Loading executions...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <h2>{websiteId ? "Website Executions" : "All Executions"}</h2>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleManualRefresh}
            disabled={isRefreshing || isTriggering}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>

          {websiteId && (
            <>
              <button
                type="button"
                className={styles.startButton}
                onClick={handleStartExecution}
                disabled={isTriggering}
              >
                {isTriggering ? "Starting..." : "Run Crawler Now"}
              </button>

              <button type="button" className={styles.backButton} onClick={onClearFilter}>
                Back to All
              </button>
            </>
          )}
        </div>
      </div>

      {executions.length === 0 ? (
        <p>No records found</p>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th>Pages</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((ex) => (
                  <tr key={ex.id}>
                    <td className={styles.label} title={ex.websiteRecordLabel}>
                      {ex.websiteRecordLabel}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[ex.status.toLowerCase()]}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td>{ex.startedAt ? ex.startedAt.toLocaleString() : "Not started yet"}</td>
                    <td>{ex.endedAt ? ex.endedAt.toLocaleString() : "Did not end yet"}</td>
                    <td>{ex.pagesCrawled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
            <button
              type="button"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button
              type="button"
              disabled={!hasMore || isLoading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
