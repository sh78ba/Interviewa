"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { ArrowRight, Code, Terminal, Brain, Upload } from "lucide-react";

const ROLES = [
  { key: "frontend", label: "Frontend Developer" },
  { key: "backend", label: "Backend Developer" },
  { key: "fullstack", label: "Fullstack Developer" },
  { key: "devops", label: "DevOps Engineer" },
  { key: "ml", label: "Machine Learning Engineer" },
  { key: "other", label: "Other / Custom" },
];

export default function TechStackInterview() {
  const router = useRouter();
  const [roleType, setRoleType] = useState("frontend");
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [techStack, setTechStack] = useState("React, Next.js, TypeScript, TailwindCSS");
  const [questionCount, setQuestionCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (questionCount < 5 || questionCount > 15) {
      setError("Number of questions must be between 5 and 15.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      const actualRole = roleType === "other" ? customRole : ROLES.find(r => r.key === roleType)?.label || "Software Engineer";
      form.append("role", actualRole);
      form.append("level", level);
      // Generate rounds string like "extra_tech:5"
      form.append("rounds", `extra_tech:${questionCount}`);
      // Passing techStack as the job_description provides the context to the LLM
      form.append("job_description", `Tech Stack: ${techStack}`);
      form.append("company", ""); // No specific company

      const res = await api.post("/api/interview/start", form);
      router.push(`/interview/${res.data.interview_id}`);
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to start the interview session. Please try again.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d: any) => `${d.loc ? d.loc.join(".") : "error"}: ${d.msg}`).join("; ");
        } else {
          errMsg = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errMsg);
      setLoading(false);
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
        <div className="surface" style={{ width: "100%", maxWidth: 800, padding: "32px", borderRadius: 12 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <span className="page-kicker" style={{ fontSize: 11, padding: "2px 6px" }}>Tech Stack Deep Dive</span>
            <h1 className="section-title" style={{ fontSize: 24, marginTop: 8 }}>Focus on your core technologies</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
              Enter the languages, frameworks, and libraries you want to be tested on. We will generate highly technical questions tailored specifically to these tools.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 8, display: "block" }}>Role Title</label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                  className="input"
                  style={{
                    fontSize: 13,
                    padding: "10px 12px",
                    width: "100%",
                    background: "var(--panel-strong)",
                    color: "var(--text-strong)",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    boxSizing: "border-box",
                    WebkitAppearance: "none",
                    marginBottom: roleType === "other" ? 8 : 0
                  }}
                >
                  {ROLES.map(r => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
                {roleType === "other" && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter custom role"
                    className="input"
                    style={{
                      fontSize: 13,
                      padding: "10px 12px",
                      width: "100%",
                      background: "var(--panel-strong)",
                      color: "var(--text-strong)",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      boxSizing: "border-box"
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 8, display: "block" }}>Seniority Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="input"
                  style={{
                    fontSize: 13,
                    padding: "10px 12px",
                    width: "100%",
                    background: "var(--panel-strong)",
                    color: "var(--text-strong)",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    boxSizing: "border-box",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior</option>
                  <option value="staff">Staff / Lead</option>
                </select>
              </div>
            </div>

            <div>
              <label className="field-label" style={{ fontSize: 12, marginBottom: 8, display: "block", fontWeight: 600 }}>Target Tech Stack</label>
              <textarea
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="List your languages, frameworks, and libraries here... (e.g. React, Node.js, PostgreSQL, Docker)"
                className="input"
                style={{
                  fontSize: 13,
                  padding: "12px",
                  width: "100%",
                  minHeight: "100px",
                  background: "var(--panel-strong)",
                  color: "var(--text-strong)",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  resize: "vertical",
                  fontFamily: "var(--font-mono)",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 8, display: "block" }}>Number of Questions</label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  value={questionCount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setQuestionCount("" as any);
                      return;
                    }
                    let val = parseInt(raw);
                    if (isNaN(val)) return;
                    if (val > 15) val = 15;
                    setQuestionCount(val);
                  }}
                  onBlur={() => {
                    if (!questionCount || (questionCount as any) < 5) {
                      setQuestionCount(5);
                    }
                  }}
                  className="input"
                  style={{
                    fontSize: 13,
                    padding: "10px 12px",
                    width: "100%",
                    background: "var(--panel-strong)",
                    color: "var(--text-strong)",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ flex: 1 }} />
            </div>

            {error && (
              <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", borderLeft: "3px solid #ef4444", borderRadius: 4, fontSize: 12, color: "#ef4444" }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                onClick={handleStart}
                disabled={loading || !techStack.trim()}
                className="button-primary"
                style={{ width: "100%", padding: "14px", fontSize: 14, display: "flex", justifyContent: "center", gap: 8 }}
              >
                {loading ? "Preparing Interview..." : "Start Deep Dive"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
