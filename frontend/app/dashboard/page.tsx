"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Interview {
  id: string;
  role: string;
  level: string;
  status: string;
  rounds: string[];
  created_at: string;
}

interface InterviewListResponse {
  items: Interview[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const statusColor: Record<string, string> = {
  completed: "#16a34a",
  in_progress: "#ca8a04",
  pending: "#6b7280",
};

export default function Dashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedCount = interviews.filter(
    (iv) => iv.status === "completed",
  ).length;
  const activeCount = interviews.filter(
    (iv) => iv.status === "in_progress",
  ).length;
  const pendingCount = interviews.filter(
    (iv) => iv.status === "pending",
  ).length;

  const loadInterviews = async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");
      const r = await api.get<InterviewListResponse>("/api/interview/", {
        params: { page: nextPage, limit: 5 },
      });
      setInterviews(r.data.items || []);
      setPage(r.data.page || nextPage);
      setTotalPages(r.data.total_pages || 0);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load interviews",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInterviews(page);
  }, [page]);

  const deleteInterview = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this interview? This will remove the interview, answers, questions, and report.",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await api.delete(`/api/interview/${id}`);
      if (interviews.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await loadInterviews(page);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to delete interview",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <section className="surface" style={{ padding: 28, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <span className="page-kicker">Your workspace</span>
              <h1
                className="page-title"
                style={{ fontSize: "clamp(32px, 4vw, 50px)", marginTop: 14 }}
              >
                Keep track of every mock interview in one place.
              </h1>
              <p
                className="page-subtitle"
                style={{ fontSize: 16, marginTop: 12 }}
              >
                Review active sessions, open final reports, or clear out old
                practice runs when you’re done.
              </p>
            </div>

            <Link href="/interview/new" className="button-primary">
              + New interview
            </Link>
          </div>

          <div className="stat-grid" style={{ marginTop: 24 }}>
            {[
              ["Total sessions", interviews.length.toString()],
              ["In progress", activeCount.toString()],
              ["Completed", completedCount.toString()],
              ["Pending", pendingCount.toString()],
            ].map(([label, value]) => (
              <div key={label} className="surface-strong stat-card card-hover">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="muted" style={{ fontSize: 14 }}>
            Loading...
          </p>
        ) : error ? (
          <div
            style={{
              padding: 20,
              border: "1px solid #f1caca",
              background: "#fff7f7",
              borderRadius: 12,
              color: "#8a1f1f",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : interviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "72px 24px",
            }}
            className="surface"
          >
            <p className="muted" style={{ fontSize: 15, marginBottom: 20 }}>
              No interviews yet
            </p>
            <Link href="/interview/new" className="button-primary">
              Start your first interview
            </Link>
          </div>
        ) : (
          <div className="stack">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="surface card-hover"
                style={{
                  padding: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 16,
                        textTransform: "capitalize",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {iv.role} — {iv.level}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "6px 10px",
                        borderRadius: 20,
                        background: "rgba(17,24,39,0.05)",
                        color: statusColor[iv.status],
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {iv.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="muted" style={{ fontSize: 13 }}>
                    {iv.rounds.join(" · ")} ·{" "}
                    {new Date(iv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {iv.status !== "completed" && (
                    <Link
                      href={`/interview/${iv.id}`}
                      className="button-secondary"
                      style={{
                        textDecoration: "none",
                        padding: "10px 14px",
                        fontSize: 13,
                      }}
                    >
                      Continue
                    </Link>
                  )}
                  {iv.status === "completed" && (
                    <Link
                      href={`/interview/${iv.id}/report`}
                      className="button-primary"
                      style={{
                        textDecoration: "none",
                        padding: "10px 14px",
                        fontSize: 13,
                      }}
                    >
                      View report
                    </Link>
                  )}
                  <button
                    onClick={() => void deleteInterview(iv.id)}
                    disabled={deletingId === iv.id}
                    className="button-danger"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      opacity: deletingId === iv.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === iv.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="button-secondary"
              style={{
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>

            <p className="muted" style={{ fontSize: 14 }}>
              Page {page} of {totalPages}
            </p>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="button-secondary"
              style={{
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </>
  );
}
