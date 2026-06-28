"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Award, Check, AlertCircle, TrendingUp, LayoutDashboard, 
  RotateCcw, FileText, CheckCircle, BookOpen, ChevronRight, MessageSquare, Briefcase, User 
} from "lucide-react";

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
            "Unable to generate or retrieve the mock interview report at this moment.",
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
        <main className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid var(--line)",
                borderTopColor: "var(--accent-strong)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p className="muted" style={{ fontSize: 13, fontWeight: 500 }}>Generating report...</p>
          </div>
        </main>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
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
              padding: 28,
              borderColor: "var(--line)",
              background: "var(--bg-soft)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderRadius: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-strong)" }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>Report Unavailable</h3>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {error}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => window.location.reload()}
                className="button-primary"
              >
                <RotateCcw size={14} /> Retry Analysis
              </button>
              <Link
                href="/dashboard"
                className="button-secondary"
                style={{ textDecoration: "none" }}
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );

  const rec = report?.report?.recommendation;
  const recColor: Record<string, string> = {
    strong_yes: "#111111",
    yes: "#111111",
    maybe: "#737373",
    no: "#737373",
  };
  const recLabel: Record<string, string> = {
    strong_yes: "Strong Hire",
    yes: "Hire",
    maybe: "Neutral / Pass",
    no: "No Hire",
  };
  const recBg: Record<string, string> = {
    strong_yes: "#f5f5f5",
    yes: "#f5f5f5",
    maybe: "#fafafa",
    no: "#ffffff",
  };

  const finalScore = Math.round(report?.report?.overall_score || 0);

  return (
    <>
      <Navbar />
      <main className="page-container" style={{ paddingTop: 32 }}>
        {/* Header HUD */}
        <section className="surface" style={{ padding: 24, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderRadius: 8 }}>
          <div>
            <span className="page-kicker">Completed interview</span>
            <h1
              className="page-title"
              style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: 8 }}
            >
              Interview <span>report</span>
            </h1>
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text)" }}>
                <User size={13} color="var(--muted)" />
                <span>{report?.candidate || "Candidate"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text)" }}>
                <Briefcase size={13} color="var(--muted)" />
                <span style={{ textTransform: "capitalize", fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{report?.role} — {report?.level}</span>
              </div>
            </div>
          </div>
          <Link href="/dashboard" className="button-secondary">
            <LayoutDashboard size={13} /> Dashboard
          </Link>
        </section>

        {/* Highlight Score Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 16 }} className="grid-2">
          {/* Circular Score visualizer */}
          <div
            className="surface"
            style={{ 
              padding: 24, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              borderRadius: 8
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p className="muted" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                OVERALL EVALUATION
              </p>

              {/* Radial gradient border score holder */}
              <div style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: `conic-gradient(#111111 ${finalScore * 3.6}deg, var(--line) 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{
                  width: 102,
                  height: 102,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 500,
                      lineHeight: 1,
                      color: "var(--text-strong)",
                      fontFamily: "'Lora', Georgia, serif",
                      fontStyle: "italic"
                    }}
                  >
                    {finalScore}
                  </div>
                  <div className="muted" style={{ fontSize: 10, fontWeight: 600 }}>
                    out of 100
                  </div>
                </div>
              </div>

              {rec && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    padding: "4px 10px",
                    borderRadius: 3,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    background: recBg[rec] || "#ffffff",
                    color: recColor[rec] || "var(--text)",
                    border: `1px solid var(--line)`,
                    fontFamily: "'Lora', Georgia, serif",
                    fontStyle: "italic"
                  }}
                >
                  {recLabel[rec] || rec.replace("_", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Scores by round */}
          <div className="surface" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <TrendingUp size={14} color="#111" />
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Scores by Round
              </h3>
            </div>
            {report?.report?.scores_by_round &&
              Object.keys(report.report.scores_by_round).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(report.report.scores_by_round).map(
                    ([round, score]: any) => (
                      <div key={round}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{ fontSize: 12, textTransform: "capitalize", fontWeight: 600, color: "var(--text-strong)" }}
                          >
                            {round.replace("_", " ")}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)" }}>
                            {Math.round(score)}%
                          </span>
                        </div>
                        <div
                          style={{
                            background: "rgba(0,0,0,0.03)",
                            borderRadius: 2,
                            height: 4,
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              background: "#111111",
                              height: "100%",
                              width: `${score}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 12 }}>No round scores recorded.</p>
              )}
          </div>
        </div>

        {/* Strengths & weaknesses */}
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="surface" style={{ padding: 20, borderLeft: "2px solid #111111", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--text-strong)" }}>
              <Check size={14} strokeWidth={3} />
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Strengths
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(report?.report?.strengths || []).map((s: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--text)",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start"
                  }}
                >
                  <span style={{ color: "#111111", fontWeight: 700 }}>•</span>
                  <span>{s}</span>
                </p>
              ))}
              {(report?.report?.strengths || []).length === 0 && (
                <p className="muted" style={{ fontSize: 12 }}>No specific strengths highlighted.</p>
              )}
            </div>
          </div>

          <div className="surface" style={{ padding: 20, borderLeft: "2px solid var(--line)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--text-strong)" }}>
              <AlertCircle size={14} />
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                To Improve
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(report?.report?.weaknesses || []).map((w: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--text)",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start"
                  }}
                >
                  <span style={{ color: "var(--muted)", fontWeight: 700 }}>•</span>
                  <span>{w}</span>
                </p>
              ))}
              {(report?.report?.weaknesses || []).length === 0 && (
                <p className="muted" style={{ fontSize: 12 }}>No major improvement areas detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {report?.report?.summary && (
          <div className="surface" style={{ padding: 20, marginBottom: 20, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <BookOpen size={14} color="#111" />
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Summary
              </h3>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>
              {report.report.summary}
            </p>
          </div>
        )}

        {/* Detailed answers */}
        {report?.detailed_answers?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <FileText size={14} color="#111" />
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Answer Breakdown
              </h3>
            </div>
            
            <div className="stack" style={{ gap: 12 }}>
              {report.detailed_answers.map((a: any, i: number) => (
                <div
                  key={i}
                  className="surface"
                  style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, borderRadius: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--line)",
                      paddingBottom: 8
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "'Lora', Georgia, serif",
                        fontStyle: "italic"
                      }}
                    >
                      Round: {a.round.replace("_", " ")}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#111",
                        background: "var(--bg-soft)",
                        padding: "2px 8px",
                        borderRadius: 3,
                        border: "1px solid var(--line)"
                      }}
                    >
                      Score: {a.score}/10
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>QUESTION</div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: "var(--text-strong)"
                      }}
                    >
                      {a.question}
                    </p>
                  </div>

                  <div style={{ background: "var(--bg-soft)", padding: 12, borderRadius: 4, border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>YOUR RESPONSE</div>
                    <p
                      style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text)" }}
                    >
                      {a.answer}
                    </p>
                  </div>

                  {a.feedback && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <MessageSquare size={13} color="#111" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 1 }}>ASSESSMENT</div>
                        <p
                          style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text)" }}
                        >
                          {a.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Toolbar actions */}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
