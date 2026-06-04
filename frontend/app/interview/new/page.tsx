"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Laptop, Server, Layers, Settings, BrainCircuit, 
  User, Shield, Award, Award as StaffIcon,
  CheckCircle, FileText, Upload, AlertCircle
} from "lucide-react";

const ROLES = [
  { key: "frontend", label: "Frontend", icon: Laptop },
  { key: "backend", label: "Backend", icon: Server },
  { key: "fullstack", label: "Fullstack", icon: Layers },
  { key: "devops", label: "DevOps", icon: Settings },
  { key: "ml", label: "Machine Learning", icon: BrainCircuit },
];

const LEVELS = [
  { key: "junior", label: "Junior", icon: User },
  { key: "mid", label: "Mid-level", icon: Award },
  { key: "senior", label: "Senior", icon: Shield },
  { key: "staff", label: "Staff / Lead", icon: StaffIcon },
];

const ROUNDS = [
  { key: "resume", label: "Resume deep dive" },
  { key: "dsa", label: "DSA & Coding" },
  { key: "system_design", label: "System design" },
  { key: "technical", label: "Technical core" },
  { key: "hr", label: "HR / Behavioral" },
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
      setError("Please select at least one interview round.");
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
      setError(err.response?.data?.detail || "Failed to start the interview session. Please try again.");
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
        <div className="surface" style={{ width: "100%", maxWidth: 1120, padding: "20px 24px", borderRadius: 12 }}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <span className="page-kicker" style={{ fontSize: 11, padding: "2px 6px" }}>Interview setup</span>
            <div
              style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 8, marginBottom: 2 }}
            >
              CREATE A NEW SESSION
            </div>
            <h1 className="section-title" style={{ fontSize: 22 }}>New interview</h1>
            <p
              style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}
            >
              Configure your practice session. Upload a resume or paste a job description to calibrate questions.
            </p>
          </div>

          {/* Setup Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Row 1: Role & Experience Level */}
            <div className="setup-grid">
              {/* Target Role */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => setRole(r.key)}
                        className="surface-strong"
                        style={{
                          padding: "8px 6px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          gridColumn: r.key === "ml" ? "span 2" : "auto",
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={14} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Experience level</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {LEVELS.map((l) => {
                    const Icon = l.icon;
                    const active = level === l.key;
                    return (
                      <button
                        key={l.key}
                        onClick={() => setLevel(l.key)}
                        className="surface-strong"
                        style={{
                          padding: "8px 6px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={12} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rounds */}
            <div>
              <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Rounds</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ROUNDS.map((r) => {
                  const active = selectedRounds.includes(r.key);
                  return (
                    <button
                      key={r.key}
                      onClick={() => toggleRound(r.key)}
                      className={active ? "chip chip-active" : "chip"}
                      style={{
                        padding: "6px 12px",
                        fontSize: 11,
                        borderRadius: 4,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        border: active ? "1px solid #111111" : "1px solid var(--line)",
                      }}
                    >
                      {active && <CheckCircle size={10} color="white" />}
                      <span style={{ fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Resume & Job Description */}
            <div className="setup-grid">
              {/* Resume File Upload */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  Resume{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <div 
                  className="surface-strong"
                  style={{ 
                    border: "1px dashed var(--line)", 
                    borderRadius: 6, 
                    padding: 12, 
                    textAlign: "center",
                    position: "relative",
                    background: "rgba(0, 0, 0, 0.01)",
                    height: "82px",
                    minHeight: "82px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                    style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      width: "100%", 
                      height: "100%", 
                      opacity: 0, 
                      cursor: "pointer",
                      zIndex: 10
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Upload size={14} color="#777" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-strong)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {resume ? resume.name : "Upload resume (PDF)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  Job description{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="textarea"
                  style={{ fontSize: 12, lineHeight: 1.4, padding: "8px 12px", height: "82px", minHeight: "82px", resize: "none" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                display: "flex", 
                gap: 8, 
                alignItems: "center", 
                color: "var(--text-strong)", 
                background: "var(--bg-soft)",
                border: "1px solid var(--accent-strong)",
                padding: "8px 12px",
                borderRadius: 6
              }}>
                <AlertCircle size={14} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="button-primary"
              style={{ width: "100%", padding: "10px 16px", fontSize: 13 }}
            >
              {loading ? "Setting up interview..." : "Start interview"}
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .setup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .setup-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
