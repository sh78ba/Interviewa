"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { isLoggedIn } from "@/lib/store";

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
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    void loadInterviews(page);
  }, [page, router]);

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
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
              Your interviews
            </h1>
            <p style={{ color: "#777", fontSize: 14 }}>
              Practice makes perfect
            </p>
          </div>
          <Link
            href="/interview/new"
            style={{
              background: "#111",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            + New interview
          </Link>
        </div>

        {loading ? (
          <p style={{ color: "#777", fontSize: 14 }}>Loading...</p>
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
              padding: "80px 0",
              border: "1px dashed #ddd",
              borderRadius: 12,
            }}
          >
            <p style={{ color: "#777", fontSize: 15, marginBottom: 20 }}>
              No interviews yet
            </p>
            <Link
              href="/interview/new"
              style={{
                background: "#111",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Start your first interview
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interviews.map((iv) => (
              <div
                key={iv.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                        fontSize: 15,
                        textTransform: "capitalize",
                      }}
                    >
                      {iv.role} — {iv.level}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "#f5f5f5",
                        color: statusColor[iv.status],
                        fontWeight: 500,
                      }}
                    >
                      {iv.status.replace("_", " ")}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#777" }}>
                    {iv.rounds.join(" · ")} ·{" "}
                    {new Date(iv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {iv.status !== "completed" && (
                    <Link
                      href={`/interview/${iv.id}`}
                      style={{
                        border: "1px solid #ddd",
                        color: "#111",
                        padding: "8px 16px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                      }}
                    >
                      Continue
                    </Link>
                  )}
                  {iv.status === "completed" && (
                    <Link
                      href={`/interview/${iv.id}/report`}
                      style={{
                        background: "#111",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                      }}
                    >
                      View report
                    </Link>
                  )}
                  <button
                    onClick={() => void deleteInterview(iv.id)}
                    disabled={deletingId === iv.id}
                    style={{
                      border: "1px solid #f1caca",
                      color: "#b91c1c",
                      background: "#fff",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: deletingId === iv.id ? "not-allowed" : "pointer",
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
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>

            <p style={{ fontSize: 14, color: "#777" }}>
              Page {page} of {totalPages}
            </p>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                padding: "10px 16px",
                borderRadius: 8,
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
