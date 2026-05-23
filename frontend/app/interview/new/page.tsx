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
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          New interview
        </h1>
        <p style={{ color: "#777", fontSize: 14, marginBottom: 40 }}>
          Configure your practice session
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                display: "block",
                marginBottom: 12,
              }}
            >
              Role
            </label>
            {select(role, ROLES, setRole)}
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                display: "block",
                marginBottom: 12,
              }}
            >
              Experience level
            </label>
            {select(level, LEVELS, setLevel)}
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                display: "block",
                marginBottom: 12,
              }}
            >
              Rounds
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ROUNDS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => toggleRound(r.key)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    border: selectedRounds.includes(r.key)
                      ? "2px solid #111"
                      : "1px solid #ddd",
                    background: selectedRounds.includes(r.key)
                      ? "#111"
                      : "#fff",
                    color: selectedRounds.includes(r.key) ? "#fff" : "#333",
                    fontWeight: selectedRounds.includes(r.key) ? 500 : 400,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                display: "block",
                marginBottom: 8,
              }}
            >
              Resume{" "}
              <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
              style={{ fontSize: 13, color: "#555" }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                display: "block",
                marginBottom: 8,
              }}
            >
              Job description{" "}
              <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              placeholder="Paste the job description here..."
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: 8,
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && <p style={{ color: "#e00", fontSize: 13 }}>{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: "#111",
              color: "#fff",
              padding: "14px",
              borderRadius: 8,
              border: "none",
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Setting up interview..." : "Start interview"}
          </button>
        </div>
      </main>
    </>
  );
}
