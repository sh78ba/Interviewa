"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await api.get(`/api/interview/${id}/report`);
        if (!active) return;
        setReport(r.data);
      } catch (err: any) {
        if (!active) return;
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load the interview report right now.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReport();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
          <p style={{ color: "#777" }}>Generating report...</p>
        </main>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
          <div
            style={{
              border: "1px solid #f1caca",
              background: "#fff7f7",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Report unavailable
            </p>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
              {error}
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#111",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                style={{
                  border: "1px solid #ddd",
                  color: "#111",
                  padding: "10px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );

  const rec = report?.report?.recommendation;
  const recColor: Record<string, string> = {
    strong_yes: "#16a34a",
    yes: "#16a34a",
    maybe: "#ca8a04",
    no: "#dc2626",
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
            Interview report
          </h1>
          <p style={{ color: "#777", fontSize: 14 }}>
            {report?.candidate} · {report?.role} · {report?.level}
          </p>
        </div>

        {/* Overall score */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 13, color: "#777", marginBottom: 8 }}>
            Overall score
          </p>
          <p style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>
            {Math.round(report?.report?.overall_score || 0)}
          </p>
          <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            out of 100
          </p>
          {rec && (
            <span
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                background: "#f5f5f5",
                color: recColor[rec] || "#555",
              }}
            >
              {rec.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Round scores */}
        {report?.report?.scores_by_round &&
          Object.keys(report.report.scores_by_round).length > 0 && (
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                Scores by round
              </p>
              {Object.entries(report.report.scores_by_round).map(
                ([round, score]: any) => (
                  <div key={round} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{ fontSize: 13, textTransform: "capitalize" }}
                      >
                        {round.replace("_", " ")}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {Math.round(score)}
                      </span>
                    </div>
                    <div
                      style={{
                        background: "#f5f5f5",
                        borderRadius: 4,
                        height: 6,
                      }}
                    >
                      <div
                        style={{
                          background: "#111",
                          height: 6,
                          borderRadius: 4,
                          width: `${score}%`,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

        {/* Strengths & weaknesses */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 20 }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#16a34a",
                marginBottom: 12,
              }}
            >
              Strengths
            </p>
            {(report?.report?.strengths || []).map((s: string, i: number) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  color: "#333",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                · {s}
              </p>
            ))}
          </div>
          <div
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 20 }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#dc2626",
                marginBottom: 12,
              }}
            >
              To improve
            </p>
            {(report?.report?.weaknesses || []).map((w: string, i: number) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  color: "#333",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                · {w}
              </p>
            ))}
          </div>
        </div>

        {/* Summary */}
        {report?.report?.summary && (
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 24,
              marginBottom: 32,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
              Summary
            </p>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7 }}>
              {report.report.summary}
            </p>
          </div>
        )}

        {/* Detailed answers */}
        {report?.detailed_answers?.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
              Answer breakdown
            </p>
            {report.detailed_answers.map((a: any, i: number) => (
              <div
                key={i}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#777",
                      textTransform: "capitalize",
                    }}
                  >
                    {a.round}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        a.score >= 7
                          ? "#16a34a"
                          : a.score >= 5
                            ? "#ca8a04"
                            : "#dc2626",
                    }}
                  >
                    {a.score}/10
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {a.question}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {a.answer}
                </p>
                {a.feedback && (
                  <p style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                    {a.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <Link
            href="/interview/new"
            style={{
              background: "#111",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Practice again
          </Link>
          <Link
            href="/dashboard"
            style={{
              border: "1px solid #ddd",
              color: "#111",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
