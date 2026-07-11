"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Plus, Calendar, Clock, CheckCircle, HelpCircle, 
  Trash2, Play, FileText, ChevronRight, AlertCircle, Sparkles, Layers 
} from "lucide-react";

interface Interview {
  id: string;
  role: string;
  level: string;
  company?: string;
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
  completed: "#111111",
  in_progress: "#737373",
  pending: "#a3a3a3",
};

const statusBg: Record<string, string> = {
  completed: "#f5f5f5",
  in_progress: "#fafafa",
  pending: "#ffffff",
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
      "Delete this interview? This will permanently remove the interview session.",
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
      <main style={{ 
        minHeight: "calc(100vh - 72px)", 
        display: "flex", 
        alignItems: "flex-start", 
        justifyContent: "center", 
        padding: "40px 16px",
        background: "var(--bg-soft)",
        boxSizing: "border-box"
      }}>
        <div className="surface" style={{ width: "100%", maxWidth: 1120, padding: "20px 24px", borderRadius: 12 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
              borderBottom: "1px solid var(--line)",
              paddingBottom: 16,
              marginBottom: 16
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <span className="page-kicker">Workspace overview</span>
              <h1
                className="page-title"
                style={{ fontSize: "24px", marginTop: 10, lineHeight: 1.25 }}
              >
                Keep track of every mock <span>interview in one place</span>.
              </h1>
              <p
                style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}
              >
                Review active sessions, inspect evaluation reports, or clear out previous runs.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link href="/interview/new" className="button-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                <Plus size={14} /> New interview
              </Link>
              <Link href="/interview/tech-stack" className="button-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                <Sparkles size={14} /> Tech Stack Deep Dive
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stat-grid-responsive" style={{ marginBottom: 20 }}>
            {[
              { label: "Total sessions", value: interviews.length.toString(), icon: <Layers size={14} color="#777" /> },
              { label: "In progress", value: activeCount.toString(), icon: <Clock size={14} color="#777" /> },
              { label: "Completed", value: completedCount.toString(), icon: <CheckCircle size={14} color="#777" /> },
              { label: "Pending", value: pendingCount.toString(), icon: <HelpCircle size={14} color="#777" /> },
            ].map((stat) => (
              <div key={stat.label} className="surface-strong" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 6, border: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{stat.label}</div>
                  <div className="stat-value" style={{ fontSize: 24, marginTop: 2 }}>{stat.value}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.02)", padding: 4, borderRadius: 4 }}>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ minHeight: "180px" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid var(--line)",
                    borderTopColor: "var(--accent-strong)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ marginLeft: 10, color: "var(--muted)", fontSize: 12 }}>Loading...</span>
              </div>
            ) : error ? (
              <div
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--accent-strong)",
                  background: "var(--bg-soft)",
                  borderRadius: 6,
                  color: "var(--text-strong)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16
                }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            ) : interviews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  borderRadius: 8
                }}
                className="surface"
              >
                <Sparkles size={24} color="#777" style={{ marginBottom: 8, opacity: 0.8 }} />
                <p style={{ fontSize: 13, color: "var(--text-strong)", fontWeight: 700, marginBottom: 2 }}>
                  No interviews yet
                </p>
                <p className="muted" style={{ fontSize: 11, marginBottom: 12, maxWidth: "320px", margin: "0 auto 12px auto" }}>
                  Configure your targeted role and experience level, upload a PDF resume, and start practicing.
                </p>
                <Link href="/interview/new" className="button-primary" style={{ padding: "6px 12px", fontSize: 11 }}>
                  Start your first interview
                </Link>
              </div>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="surface card-hover"
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                      borderRadius: 8
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            textTransform: "capitalize",
                            letterSpacing: "-0.01em",
                            color: "var(--text-strong)"
                          }}
                        >
                          {iv.company ? `${iv.company.charAt(0).toUpperCase() + iv.company.slice(1)} • ` : ""}{iv.role} — {iv.level}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: statusBg[iv.status] || "#ffffff",
                            color: statusColor[iv.status] || "var(--text)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            border: `1px solid var(--line)`
                          }}
                        >
                          {iv.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text)" }}>
                          <Layers size={11} color="var(--muted)" />
                          <span style={{ textTransform: "capitalize", fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{iv.rounds.join(" · ").replace(/_/g, " ")}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                          <Calendar size={11} />
                          <span>{new Date(iv.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operations */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {iv.status !== "completed" && (
                        <Link
                          href={`/interview/${iv.id}`}
                          className="button-primary"
                          style={{
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <Play size={11} fill="currentColor" /> Continue
                        </Link>
                      )}
                      {iv.status === "completed" && (
                        <Link
                          href={`/interview/${iv.id}/report`}
                          className="button-secondary"
                          style={{
                            padding: "5px 10px",
                            fontSize: 11,
                            display: "flex",
                            gap: 4
                          }}
                        >
                          <FileText size={11} /> Report <ChevronRight size={11} />
                        </Link>
                      )}
                      <button
                        onClick={() => void deleteInterview(iv.id)}
                        disabled={deletingId === iv.id}
                        className="button-danger"
                        style={{
                          padding: "5px 8px",
                          fontSize: 11,
                          display: "flex",
                          gap: 4,
                        }}
                      >
                        <Trash2 size={11} />
                        <span>{deletingId === iv.id ? "..." : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paginated Toolbar */}
          {!loading && !error && totalPages > 1 && (
            <div
              style={{
                marginTop: 16,
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
                  opacity: page <= 1 ? 0.4 : 1,
                  padding: "5px 10px",
                  fontSize: 11
                }}
              >
                Previous
              </button>

              <p className="muted" style={{ fontSize: 11, fontWeight: 600, fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>
                Page {page} of {totalPages}
              </p>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="button-secondary"
                style={{
                  opacity: page >= totalPages ? 0.4 : 1,
                  padding: "5px 10px",
                  fontSize: 11
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .stat-grid-responsive {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) {
          .stat-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 420px) {
          .stat-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
