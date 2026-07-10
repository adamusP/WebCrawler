import React, { useEffect, useState } from "react";
import { Execution, ExecutionDTO, mapExecution } from "../../components/types/execution";
import styles from "./Executions.module.css";

interface ExecutionsListProps {
  websiteId?: string; ///navazt s web listem
}

export default function ExecutionsList({ websiteId }: ExecutionsListProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) return <div>Loading executions...</div>;

  return (
    <div className={styles.container}>
      <h2>{websiteId ? "Website Executions" : "All Executions"}</h2>
      {executions.length === 0 ? (
        <p>No records found</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Label</th>
              <th>Status</th>
              <th>Started</th>
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
                <td>{ex.startedAt.toLocaleString()}</td>
                <td>{ex.pagesCrawled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
