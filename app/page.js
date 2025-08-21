"use client";

import { useState } from "react";

export default function HomePage() {
  // State for the main report generation
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for the API push action
  const [pushStatus, setPushStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });

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

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setPushStatus({ loading: false, success: "", error: "" }); // Reset push status

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
      if (!response.ok)
        throw new Error(data.error || "Failed to generate report");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async (environment) => {
    if (!result) {
      setPushStatus({ ...pushStatus, error: "Generate a report first." });
      return;
    }
    setPushStatus({ loading: true, success: "", error: "" });

    try {
      const response = await fetch("/api/push-to-emaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: result, environment: environment }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || `Failed to push data to ${environment}`
        );

      // **THE FIX: Create a specific success message based on the environment.**
      const successMessage = `Successfully pushed to ${environment.toUpperCase()} environment.`;
      setPushStatus({ loading: false, success: successMessage, error: "" });
    } catch (err) {
      setPushStatus({ loading: false, success: "", error: err.message });
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Emaar Sales Reporter</h1>
        <p style={styles.subtitle}>
          Select a date range to fetch the Linga report and format it for Emaar.
        </p>

        <form onSubmit={handleGenerateReport}>
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
            <h2 style={styles.resultTitle}>✅ Report Generated Successfully</h2>
            <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>

            <div style={styles.pushContainer}>
              <button
                onClick={() => handlePush("dev")}
                disabled={pushStatus.loading}
                style={styles.pushButtonDev}
              >
                {pushStatus.loading ? "Pushing..." : "Push to DEV"}
              </button>
              <button
                onClick={() => handlePush("prod")}
                disabled={pushStatus.loading}
                style={styles.pushButtonProd}
              >
                {pushStatus.loading ? "Pushing..." : "Push to PROD"}
              </button>
            </div>
            {/* The specific success message will now be displayed here */}
            {pushStatus.success && (
              <p style={styles.pushSuccess}>{pushStatus.success}</p>
            )}
            {pushStatus.error && (
              <p style={styles.pushError}>{pushStatus.error}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// --- Styles ---
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
    maxHeight: "300px",
    overflowY: "auto",
  },
  pushContainer: { display: "flex", gap: "10px", marginTop: "20px" },
  pushButtonDev: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "600",
    background: "#ffc107",
    color: "#333",
  },
  pushButtonProd: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "600",
    background: "#dc3545",
    color: "white",
  },
  pushSuccess: {
    color: "green",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: "15px",
  },
  pushError: {
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: "15px",
  },
};
