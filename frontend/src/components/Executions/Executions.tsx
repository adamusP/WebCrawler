import React, { useEffect, useState } from "react";
import { Execution, ExecutionDTO, mapExecution } from "../../components/types/execution";
import styles from "./Executions.module.css";

interface ExecutionsListProps {
  websiteId?: string;
  onClearFilter: () => void;
}

export default function ExecutionsList({ websiteId, onClearFilter }: ExecutionsListProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchExecutions = async () => {
    setIsLoading(true);
    try {
      const url = websiteId
        ? `http://localhost:3000/api/websites/${websiteId}/executions`
        : "http://localhost:3000/api/executions";

      const response = await fetch(url);
      const data: ExecutionDTO[] = await response.json();

      setExecutions(data.map(mapExecution));
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
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
        await fetchExecutions();
      } else {
        console.error("Server responded with an error when starting execution");
      }
    } catch (error) {
      console.error("Failed to start execution:", error);
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading) return <div>Loading executions...</div>;

  return (
    <div className={styles.container}>
      <h2>{websiteId ? "Website Executions" : "All Executions"}</h2>
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
          <button type="button" onClick={onClearFilter} className={styles.clearFilterButton}>
            Show all executions
          </button>
        </>
      )}
      {executions.length === 0 ? (
        <p>No records found</p>
      ) : (
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
                <td>{ex.websiteRecordLabel}</td>
                <td>
                  <span className={styles[ex.status.toLowerCase()]}>{ex.status}</span>
                </td>
                <td>{ex.startedAt ? ex.startedAt.toLocaleString() : "Not started yet"}</td>
                <td>{ex.endedAt ? ex.endedAt.toLocaleString() : "Did not end yet"}</td>
                <td>{ex.pagesCrawled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
