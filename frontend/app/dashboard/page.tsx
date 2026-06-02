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
      <main className="page-container" style={{ paddingTop: 32 }}>
        {/* Workspace HUD */}
        <section className="surface" style={{ padding: 28, marginBottom: 20, borderRadius: 8 }}>
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
              <span className="page-kicker">Workspace overview</span>
              <h1
                className="page-title"
                style={{ fontSize: "clamp(26px, 3.5vw, 38px)", marginTop: 10 }}
              >
                Keep track of every mock <span>interview in one place</span>.
              </h1>
              <p
                className="page-subtitle"
                style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}
              >
                Review active sessions, inspect evaluation reports, or clear out previous runs.
              </p>
            </div>

            <Link href="/interview/new" className="button-primary" style={{ padding: "10px 16px" }}>
              <Plus size={14} /> New interview
            </Link>
          </div>

          <div className="stat-grid" style={{ marginTop: 24 }}>
            {[
              { label: "Total sessions", value: interviews.length.toString(), icon: <Layers size={16} color="#777" /> },
              { label: "In progress", value: activeCount.toString(), icon: <Clock size={16} color="#777" /> },
              { label: "Completed", value: completedCount.toString(), icon: <CheckCircle size={16} color="#777" /> },
              { label: "Pending", value: pendingCount.toString(), icon: <HelpCircle size={16} color="#777" /> },
            ].map((stat) => (
              <div key={stat.label} className="surface-strong stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderRadius: 6, border: "1px solid var(--line)" }}>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label" style={{ fontSize: 11, fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.02)", padding: 6, borderRadius: 4 }}>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
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
            <span style={{ marginLeft: 10, color: "var(--muted)", fontSize: 13 }}>Loading...</span>
          </div>
        ) : error ? (
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid var(--accent-strong)",
              background: "var(--bg-soft)",
              borderRadius: 6,
              color: "var(--text-strong)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : interviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              borderRadius: 8
            }}
            className="surface"
          >
            <Sparkles size={28} color="#777" style={{ marginBottom: 12, opacity: 0.8 }} />
            <p style={{ fontSize: 14, color: "var(--text-strong)", fontWeight: 700, marginBottom: 4 }}>
              No interviews yet
            </p>
            <p className="muted" style={{ fontSize: 12, marginBottom: 18, maxWidth: "360px", margin: "0 auto 18px auto" }}>
              Configure your targeted role and experience level, upload a PDF resume, and start practicing.
            </p>
            <Link href="/interview/new" className="button-primary">
              Start your first interview
            </Link>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="surface card-hover"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  borderRadius: 8
                }}
              >
                <div style={{ flex: 1, minWidth: "220px" }}>
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
                        fontWeight: 700,
                        fontSize: 15,
                        textTransform: "capitalize",
                        letterSpacing: "-0.01em",
                        color: "var(--text-strong)"
                      }}
                    >
                      {iv.role} — {iv.level}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "3px 8px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text)" }}>
                      <Layers size={12} color="var(--muted)" />
                      <span style={{ textTransform: "capitalize", fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{iv.rounds.join(" · ").replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
                      <Calendar size={12} />
                      <span>{new Date(iv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {iv.status !== "completed" && (
                    <Link
                      href={`/interview/${iv.id}`}
                      className="button-primary"
                      style={{
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Play size={12} fill="currentColor" /> Continue
                    </Link>
                  )}
                  {iv.status === "completed" && (
                    <Link
                      href={`/interview/${iv.id}/report`}
                      className="button-secondary"
                      style={{
                        padding: "6px 12px",
                        fontSize: 12,
                        display: "flex",
                        gap: 4
                      }}
                    >
                      <FileText size={12} /> Report <ChevronRight size={12} />
                    </Link>
                  )}
                  <button
                    onClick={() => void deleteInterview(iv.id)}
                    disabled={deletingId === iv.id}
                    className="button-danger"
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <Trash2 size={12} />
                    <span>{deletingId === iv.id ? "..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginated Toolbar */}
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
                opacity: page <= 1 ? 0.4 : 1,
                padding: "6px 12px",
                fontSize: 12
              }}
            >
              Previous
            </button>

            <p className="muted" style={{ fontSize: 12, fontWeight: 600, fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>
              Page {page} of {totalPages}
            </p>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="button-secondary"
              style={{
                opacity: page >= totalPages ? 0.4 : 1,
                padding: "6px 12px",
                fontSize: 12
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
