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
        <main className="page-container">
          <div className="surface" style={{ padding: 28 }}>
            <p className="muted">Generating report...</p>
          </div>
        </main>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <main className="page-container">
          <div
            className="surface"
            style={{
              padding: 24,
              borderColor: "rgba(185, 28, 28, 0.14)",
              background: "rgba(255, 247, 247, 0.9)",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 650, marginBottom: 8 }}>
              Report unavailable
            </p>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {error}
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                className="button-primary"
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                className="button-secondary"
                style={{ textDecoration: "none" }}
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
      <main className="page-container">
        <section className="surface" style={{ padding: 28, marginBottom: 20 }}>
          <span className="page-kicker">Completed interview</span>
          <h1
            className="page-title"
            style={{ fontSize: "clamp(30px, 4vw, 48px)", marginTop: 14 }}
          >
            Interview report
          </h1>
          <p className="page-subtitle" style={{ fontSize: 16, marginTop: 10 }}>
            {report?.candidate} · {report?.role} · {report?.level}
          </p>
        </section>

        {/* Overall score */}
        <div
          className="surface"
          style={{ padding: 32, textAlign: "center", marginBottom: 20 }}
        >
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
            Overall score
          </p>
          <p
            style={{
              fontSize: 72,
              fontWeight: 760,
              lineHeight: 1,
              letterSpacing: "-0.06em",
            }}
          >
            {Math.round(report?.report?.overall_score || 0)}
          </p>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
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
                background: "rgba(17,24,39,0.05)",
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
            <div className="surface" style={{ padding: 24, marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 650, marginBottom: 16 }}>
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
                      <span style={{ fontSize: 13, fontWeight: 650 }}>
                        {Math.round(score)}
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(17,24,39,0.08)",
                        borderRadius: 999,
                        height: 8,
                      }}
                    >
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                          height: 6,
                          borderRadius: 999,
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
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="surface" style={{ padding: 20 }}>
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
          <div className="surface" style={{ padding: 20 }}>
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
          <div className="surface" style={{ padding: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 650, marginBottom: 12 }}>
              Summary
            </p>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.8 }}>
              {report.report.summary}
            </p>
          </div>
        )}

        {/* Detailed answers */}
        {report?.detailed_answers?.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 650, marginBottom: 16 }}>
              Answer breakdown
            </p>
            {report.detailed_answers.map((a: any, i: number) => (
              <div
                key={i}
                className="surface"
                style={{ padding: 20, marginBottom: 12 }}
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
                      fontWeight: 650,
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
                  className="muted"
                  style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 8 }}
                >
                  {a.answer}
                </p>
                {a.feedback && (
                  <p
                    className="muted"
                    style={{ fontSize: 12, lineHeight: 1.5 }}
                  >
                    {a.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <Link href="/interview/new" className="button-primary">
            Practice again
          </Link>
          <Link href="/dashboard" className="button-secondary">
            Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
