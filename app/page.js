// File: app/page.js
"use client";

import { useState } from "react";

export default function HomePage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Set default dates to the previous month for user convenience
  const getPreviousMonthRange = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const lastDayOfPreviousMonth = new Date(
      firstDayOfCurrentMonth.getTime() - 1
    );
    const firstDayOfPreviousMonth = new Date(
      lastDayOfPreviousMonth.getFullYear(),
      lastDayOfPreviousMonth.getMonth(),
      1
    );
    return {
      from: firstDayOfPreviousMonth.toISOString().split("T")[0],
      to: lastDayOfPreviousMonth.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getPreviousMonthRange());

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/process-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: dateRange.from,
          toDate: dateRange.to,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Emaar Sales Reporter</h1>
        <p style={styles.subtitle}>
          Select a date range to fetch the Linga report and format it for Emaar.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.dateContainer}>
            <div>
              <label htmlFor="from" style={styles.label}>
                Sales From
              </label>
              <input
                type="date"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label htmlFor="to" style={styles.label}>
                Sales To
              </label>
              <input
                type="date"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? "Fetching & Processing..." : "Generate Report"}
          </button>
        </form>

        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
          </div>
        )}
        {result && (
          <div style={styles.resultBox}>
            <h2 style={styles.resultTitle}>✅ Generated Emaar Payload</h2>
            <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(result, null, 2))
              }
              style={styles.copyButton}
            >
              Copy JSON
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Basic CSS-in-JS for styling
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "sans-serif",
    padding: "20px",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "600px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    textAlign: "center",
    margin: "0 0 10px",
  },
  subtitle: {
    fontSize: "16px",
    textAlign: "center",
    color: "#666",
    marginTop: "0",
    marginBottom: "30px",
  },
  dateContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background-color 0.2s",
  },
  errorBox: {
    marginTop: "20px",
    background: "#ffebee",
    color: "#c62828",
    padding: "15px",
    borderRadius: "4px",
    textAlign: "center",
  },
  resultBox: {
    marginTop: "30px",
    background: "#f9f9f9",
    border: "1px solid #eee",
    borderRadius: "4px",
    padding: "20px",
  },
  resultTitle: { marginTop: "0", fontSize: "18px", color: "#333" },
  pre: {
    background: "#2d2d2d",
    color: "#f8f8f2",
    padding: "15px",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    maxHeight: "400px",
    overflowY: "auto",
  },
  copyButton: {
    display: "block",
    width: "100px",
    margin: "15px 0 0 auto",
    background: "#22a55a",
    color: "white",
    border: "none",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
