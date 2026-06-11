"use client";
import { useState } from "react";
import { 
  CheckCircle2, Circle
} from "lucide-react";

export default function SetupChecklist() {

  // Prerequisites checklist state
  const [prereqs, setPrereqs] = useState({
    python: false,
    node: false,
    env: false,
    colab: false,
    redis: false
  });

  const togglePrereq = (key: keyof typeof prereqs) => {
    setPrereqs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistItems = [
    { 
      key: "python" as const, 
      label: "Python 3.11+ installed", 
      desc: "Required to compile and run the backend FastAPI API server locally." 
    },
    { 
      key: "node" as const, 
      label: "Node.js 18+ & npm installed", 
      desc: "Needed to download node packages and boot the Next.js development server." 
    },
    { 
      key: "env" as const, 
      label: "backend/.env file created", 
      desc: "Verify that backend/.env exists and is filled out using backend/.env.example." 
    },
    { 
      key: "colab" as const, 
      label: "AI GPU Service running", 
      desc: "Make sure Whisper, TTS, and the LLM endpoint are active (on Colab or locally)." 
    },
    { 
      key: "redis" as const, 
      label: "Redis server configured (optional)", 
      desc: "Optional cache layer to manage session state. Can be skipped gracefully." 
    }
  ];

  return (
    <div className="surface-strong" style={{ padding: "16px 20px", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>
          Installation Status
        </h3>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
          {Object.values(prereqs).filter(Boolean).length} of {Object.keys(prereqs).length} completed
        </span>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {checklistItems.map((item) => {
          const checked = prereqs[item.key];
          return (
            <button
              key={item.key}
              onClick={() => togglePrereq(item.key)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                textAlign: "left",
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                background: checked ? "var(--bg-soft)" : "var(--panel)",
                border: "1px solid " + (checked ? "#111" : "var(--line)"),
                boxShadow: "var(--shadow)",
                transition: "all 150ms ease"
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {checked ? (
                  <CheckCircle2 size={16} color="#111" />
                ) : (
                  <Circle size={16} color="var(--muted)" />
                )}
              </div>
              <div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: checked ? 700 : 600,
                  color: "var(--text-strong)",
                  textDecoration: checked ? "line-through" : "none",
                  opacity: checked ? 0.75 : 1
                }}>
                  {item.label}
                </div>
                <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
