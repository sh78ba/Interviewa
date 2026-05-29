"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

const ROLES = ["frontend", "backend", "fullstack", "devops", "ml"];
const LEVELS = ["junior", "mid", "senior", "staff"];
const ROUNDS = [
  { key: "resume", label: "Resume deep dive" },
  { key: "dsa", label: "DSA" },
  { key: "system_design", label: "System design" },
  { key: "technical", label: "Technical" },
  { key: "hr", label: "HR" },
  { key: "cultural", label: "Cultural fit" },
];

export default function NewInterview() {
  const router = useRouter();
  const [role, setRole] = useState("fullstack");
  const [level, setLevel] = useState("mid");
  const [selectedRounds, setSelectedRounds] = useState(["technical", "hr"]);
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRound = (key: string) => {
    setSelectedRounds((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key],
    );
  };

  const submit = async () => {
    if (selectedRounds.length === 0) {
      setError("Select at least one round");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("role", role);
      form.append("level", level);
      form.append("rounds", selectedRounds.join(","));
      form.append("job_description", jobDescription);
      if (resume) form.append("resume", resume);

      const res = await api.post("/api/interview/start", form);
      router.push(`/interview/${res.data.interview_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start interview");
      setLoading(false);
    }
  };

  const select = (val: string, options: string[], set: (v: string) => void) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => set(o)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            border: val === o ? "2px solid #111" : "1px solid #ddd",
            background: val === o ? "#111" : "#fff",
            color: val === o ? "#fff" : "#333",
            fontWeight: val === o ? 500 : 400,
            textTransform: "capitalize",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="page-container" style={{ paddingTop: 24 }}>
        <section className="hero-section" style={{ alignItems: "start" }}>
          <div
            className="surface"
            style={{ padding: 32, position: "sticky", top: 92 }}
          >
            <span className="page-kicker">Interview setup</span>
            <h1
              className="page-title"
              style={{ fontSize: "clamp(34px, 4vw, 52px)", marginTop: 18 }}
            >
              Build the round you actually want to practice.
            </h1>
            <p
              className="page-subtitle"
              style={{ fontSize: 16, marginTop: 16 }}
            >
              Choose your role, difficulty, and rounds. Add a resume or job
              description if you want the interviewer to be more specific.
            </p>

            <div className="stack" style={{ marginTop: 24 }}>
              {[
                ["Role-aware", "Frontend, backend, fullstack, devops, or ML."],
                [
                  "Round-based",
                  "Mix and match resume, technical, system design, and HR.",
                ],
                [
                  "Interview memory",
                  "Final report is saved after the round ends.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="surface-strong card-hover"
                  style={{ padding: 16 }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 650, marginBottom: 6 }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface" style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}
              >
                Configure your practice session
              </div>
              <h2 className="section-title">New interview</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <label className="field-label">Role</label>
                {select(role, ROLES, setRole)}
              </div>

              <div>
                <label className="field-label">Experience level</label>
                {select(level, LEVELS, setLevel)}
              </div>

              <div>
                <label className="field-label">Rounds</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ROUNDS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => toggleRound(r.key)}
                      className={
                        selectedRounds.includes(r.key)
                          ? "button-primary"
                          : "button-secondary"
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">
                  Resume{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  style={{ fontSize: 13, color: "var(--muted)" }}
                />
              </div>

              <div>
                <label className="field-label">
                  Job description{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  placeholder="Paste the job description here..."
                  className="textarea"
                />
              </div>

              {error && (
                <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="button-primary"
                style={{ width: "100%" }}
              >
                {loading ? "Setting up interview..." : "Start interview"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
