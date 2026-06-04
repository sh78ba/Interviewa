"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  CheckCircle2, Circle, BookOpen, Wifi, Layers
} from "lucide-react";

export default function SetupChecklist() {
  const pathname = usePathname();

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
        <div className="surface" style={{ width: "100%", maxWidth: 1120, padding: "24px", borderRadius: 12 }}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <span className="page-kicker" style={{ fontSize: 11, padding: "2px 6px" }}>
              <CheckCircle2 size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} /> Setup Guide
            </span>
            <h1 className="section-title" style={{ fontSize: 22, marginTop: 8 }}>
              Checklist & <span>Prerequisites</span>.
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
              Mark off your setup checkpoints to ensure your environment is ready to start a practice round.
            </p>
          </div>

          {/* Sub-navigation Tabs */}
          <div style={{ 
            display: "flex", 
            gap: 8, 
            borderBottom: "1px solid var(--line)", 
            paddingBottom: 0,
            marginBottom: 20
          }}>
            {[
              { path: "/setup", label: "1. Instructions", icon: <BookOpen size={12} /> },
              { path: "/setup/checklist", label: "2. Setup Checklist", icon: <CheckCircle2 size={12} /> },
              { path: "/setup/connection-test", label: "3. Connection Test", icon: <Wifi size={12} /> },
              { path: "/setup/architecture", label: "4. Architecture", icon: <Layers size={12} /> }
            ].map((tab) => {
              const active = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    borderBottom: active ? "2px solid #111" : "2px solid transparent",
                    color: active ? "var(--text-strong)" : "var(--muted)",
                    textDecoration: "none",
                    fontFamily: active ? "'Lora', Georgia, serif" : "inherit",
                    fontStyle: active ? "italic" : "normal"
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Checklist Panel */}
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
          
        </div>
      </main>
    </>
  );
}
