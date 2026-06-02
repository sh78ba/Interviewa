"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Laptop, Server, Layers, Settings, BrainCircuit, 
  User, Shield, Award, Award as StaffIcon,
  CheckCircle, FileText, Briefcase, Upload, AlertCircle, Play
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
      <main className="page-container" style={{ paddingTop: 32 }}>
        <section className="hero-section" style={{ alignItems: "start" }}>
          {/* Side Info Cards */}
          <div
            className="surface"
            style={{ padding: 28, position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 20, borderRadius: 8 }}
          >
            <div>
              <span className="page-kicker">Interview setup</span>
              <h1
                className="page-title"
                style={{ fontSize: "clamp(26px, 3.5vw, 38px)", marginTop: 10 }}
              >
                Build the round you actually <span>want to practice</span>.
              </h1>
              <p
                className="page-subtitle"
                style={{ fontSize: 14, marginTop: 10, lineHeight: 1.6 }}
              >
                Choose target role, experience level, and round focus. Provide optional 
                background specs to calibrate the AI model's questioning.
              </p>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              {[
                {
                  title: "Role-Aware Questions",
                  body: "The AI agent generates questions matching actual industry standards for Frontend, ML, backend and DevOps.",
                  icon: <Briefcase size={14} color="#111" />
                },
                {
                  title: "Configurable Segments",
                  body: "Target single or multiple rounds—from coding syntax reviews to high-level system design.",
                  icon: <Settings size={14} color="#111" />
                },
                {
                  title: "Resume Calibration",
                  body: "Uploading a resume instructs the interviewer to probe details of your real-world experience.",
                  icon: <FileText size={14} color="#111" />
                },
              ].map((itemData) => (
                <div
                  key={itemData.title}
                  className="surface-strong card-hover"
                  style={{ padding: 14, display: "flex", gap: 12, borderRadius: 6 }}
                >
                  <div style={{ marginTop: 2 }}>{itemData.icon}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
                      {itemData.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.4 }}>
                      {itemData.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="surface" style={{ padding: 28, borderRadius: 8 }}>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}
              >
                CREATE A NEW SESSION
              </div>
              <h2 className="section-title">New interview</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Target Role */}
              <div>
                <label className="field-label">Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => setRole(r.key)}
                        className="surface-strong"
                        style={{
                          padding: "10px 8px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={16} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="field-label">Experience level</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                  {LEVELS.map((l) => {
                    const Icon = l.icon;
                    const active = level === l.key;
                    return (
                      <button
                        key={l.key}
                        onClick={() => setLevel(l.key)}
                        className="surface-strong"
                        style={{
                          padding: "10px 8px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={14} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rounds */}
              <div>
                <label className="field-label">Rounds</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ROUNDS.map((r) => {
                    const active = selectedRounds.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        onClick={() => toggleRound(r.key)}
                        className={active ? "chip chip-active" : "chip"}
                        style={{
                          padding: "8px 14px",
                          fontSize: 12,
                          borderRadius: 4,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                        }}
                      >
                        {active && <CheckCircle size={12} color="white" />}
                        <span style={{ fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resume File Upload */}
              <div>
                <label className="field-label">
                  Resume{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <div 
                  className="surface-strong"
                  style={{ 
                    border: "1px dashed var(--line)", 
                    borderRadius: 6, 
                    padding: 16, 
                    textAlign: "center",
                    position: "relative",
                    background: "rgba(0, 0, 0, 0.01)",
                    transition: "all 0.15s ease"
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: "50%", 
                      background: "rgba(0,0,0,0.02)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "#111"
                    }}>
                      <Upload size={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)" }}>
                        {resume ? resume.name : "Click or drag PDF file here"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="field-label">
                  Job description{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  placeholder="Paste the job description here..."
                  className="textarea"
                  style={{ fontSize: 13, lineHeight: 1.6 }}
                />
              </div>

              {error && (
                <div style={{ 
                  display: "flex", 
                  gap: 8, 
                  alignItems: "center", 
                  color: "var(--text-strong)", 
                  background: "var(--bg-soft)",
                  border: "1px solid var(--accent-strong)",
                  padding: "10px 14px",
                  borderRadius: 6
                }}>
                  <AlertCircle size={14} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="button-primary"
                style={{ width: "100%", padding: "12px 18px", fontSize: 14 }}
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
