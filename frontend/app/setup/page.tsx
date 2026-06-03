"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  CheckCircle2, Circle, Copy, Check, Server, Laptop, 
  Database, Cpu, ExternalLink, RefreshCw, BookOpen, 
  Terminal, Key, AlertCircle, Wifi, Play, HelpCircle, Info
} from "lucide-react";

export default function SetupGuide() {
  // Tabs: 'overview' | 'backend' | 'env' | 'colab' | 'frontend'
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Prerequisites checklist state
  const [prereqs, setPrereqs] = useState({
    python: false,
    node: false,
    redis: false,
    colab: false,
    env: false
  });

  // Copied feedback states
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  // Health check test state
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [healthError, setHealthError] = useState<string>("");

  const togglePrereq = (key: keyof typeof prereqs) => {
    setPrereqs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const testBackendConnection = async () => {
    setHealthStatus("testing");
    setHealthError("");
    try {
      const res = await api.get("/health");
      if (res.data && res.data.status === "ok") {
        setHealthStatus("success");
      } else {
        setHealthStatus("failed");
        setHealthError("Backend responded but in an unexpected format.");
      }
    } catch (err: any) {
      setHealthStatus("failed");
      setHealthError(err.message || "Failed to reach the backend API server. Make sure uvicorn is running.");
    }
  };

  const codeBlocks = {
    backendVenv: `cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate`,
    backendDeps: `pip install -r requirements.txt`,
    backendStart: `uvicorn main:app --reload --port 8000`,
    envTemplate: `ai_service_url=https://your-colab-url.ngrok-free.app
database_url=sqlite:///./interviewa.db
redis_url=redis://localhost:6379/0
groq_api_key=gsk_your_key_here
chroma_host=localhost
chroma_port=8000`,
    frontendDeps: `cd frontend
npm install`,
    frontendStart: `npm run dev`
  };

  return (
    <>
      <Navbar />
      <main className="page-container" style={{ paddingTop: 32 }}>
        {/* Header HUD */}
        <div className="surface" style={{ padding: 28, marginBottom: 20, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="page-kicker">
              <BookOpen size={13} style={{ marginRight: 4 }} /> Installation & Setup Guide
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: "clamp(26px, 3.5vw, 38px)", marginTop: 10 }}>
            Getting started with <span>your local instance</span>.
          </h1>
          <p className="page-subtitle" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Set up the FastAPI backend, configure database connections, run the optional Colab GPU proxy, 
            and spin up the Next.js studio.
          </p>
        </div>

        <section className="hero-section" style={{ alignItems: "start", gap: 24 }}>
          
          {/* Left Column: Diagnostics & Prerequisites */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 96 }}>
            
            {/* Prerequisites Checklist */}
            <div className="surface" style={{ padding: 24, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                  Setup Checklist
                </h3>
                <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                  {Object.values(prereqs).filter(Boolean).length} of {Object.keys(prereqs).length} done
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "python" as const, label: "Python 3.11+ installed" },
                  { key: "node" as const, label: "Node.js 18+ & npm installed" },
                  { key: "env" as const, label: "Created backend/.env file" },
                  { key: "colab" as const, label: "AI Service running (Colab or Local)" },
                  { key: "redis" as const, label: "Redis server configured (optional)" }
                ].map((item) => {
                  const checked = prereqs[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => togglePrereq(item.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: checked ? "var(--bg-soft)" : "transparent",
                        border: "1px solid " + (checked ? "var(--line)" : "transparent"),
                        transition: "all 150ms ease"
                      }}
                    >
                      {checked ? (
                        <CheckCircle2 size={16} color="#111" />
                      ) : (
                        <Circle size={16} color="var(--muted)" />
                      )}
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: checked ? 600 : 500,
                        color: checked ? "var(--text-strong)" : "var(--text)",
                        textDecoration: checked ? "line-through" : "none",
                        opacity: checked ? 0.75 : 1
                      }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Health Connection Diagnostic */}
            <div className="surface" style={{ padding: 24, borderRadius: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)", marginBottom: 10 }}>
                Live Connection Test
              </h3>
              <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginBottom: 14 }}>
                Verify if your local React frontend can establish a connection to the uvicorn FastAPI backend server (port 8000).
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {healthStatus === "idle" && (
                  <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                    Not tested yet
                  </div>
                )}
                {healthStatus === "testing" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text)" }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Pinging http://localhost:8000/health...</span>
                  </div>
                )}
                {healthStatus === "success" && (
                  <div style={{ 
                    display: "flex", 
                    gap: 8, 
                    alignItems: "center", 
                    background: "rgba(0,0,0,0.01)", 
                    border: "1px solid #111", 
                    color: "var(--text-strong)", 
                    padding: "8px 12px", 
                    borderRadius: 4 
                  }}>
                    <Wifi size={14} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>API Connected (Status: OK)</span>
                  </div>
                )}
                {healthStatus === "failed" && (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    gap: 4, 
                    background: "var(--bg-soft)", 
                    border: "1px solid var(--line)", 
                    padding: "10px 12px", 
                    borderRadius: 4 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-strong)", fontWeight: 700, fontSize: 11 }}>
                      <AlertCircle size={14} />
                      <span>API Offline / Unreachable</span>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>
                      {healthError}
                    </span>
                  </div>
                )}

                <button
                  onClick={testBackendConnection}
                  disabled={healthStatus === "testing"}
                  className="button-secondary"
                  style={{ width: "100%", padding: "8px 12px", fontSize: 12, display: "flex", gap: 6 }}
                >
                  <RefreshCw size={12} className={healthStatus === "testing" ? "animate-spin" : ""} />
                  Test connection
                </button>
              </div>
            </div>

            {/* Architecture Flow SVG */}
            <div className="surface" style={{ padding: 24, borderRadius: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)", marginBottom: 12 }}>
                System Architecture
              </h3>
              <div style={{ display: "flex", justifyContent: "center", background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 6, padding: 12 }}>
                <svg width="100%" height="240" viewBox="0 0 300 240" style={{ maxWidth: 260 }}>
                  {/* Next.js Box */}
                  <rect x="100" y="10" width="100" height="35" rx="4" fill="white" stroke="#111" strokeWidth="1" />
                  <text x="150" y="32" fontFamily="sans-serif" fontSize="10" fontWeight="bold" textAnchor="middle">Next.js UI</text>
                  <text x="150" y="42" fontFamily="monospace" fontSize="8" fill="#737373" textAnchor="middle">localhost:3000</text>

                  {/* Flow Arrow: Next.js -> FastAPI */}
                  <path d="M150 45 L150 80" fill="none" stroke="#111" strokeWidth="1" markerEnd="url(#arrow)" />
                  <text x="155" y="65" fontFamily="sans-serif" fontSize="8" fill="#737373">REST / HTTP</text>

                  {/* FastAPI Box */}
                  <rect x="100" y="80" width="100" height="45" rx="4" fill="white" stroke="#111" strokeWidth="1" />
                  <text x="150" y="98" fontFamily="sans-serif" fontSize="10" fontWeight="bold" textAnchor="middle">FastAPI Server</text>
                  <text x="150" y="108" fontFamily="monospace" fontSize="8" fill="#737373" textAnchor="middle">localhost:8000</text>
                  <text x="150" y="118" fontFamily="sans-serif" fontSize="8" fill="#737373" textAnchor="middle">(Uvicorn App)</text>

                  {/* Flow Arrow: FastAPI -> SQLite */}
                  <path d="M100 102 L45 102 L45 150" fill="none" stroke="#111" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrow)" />
                  
                  {/* SQLite Box */}
                  <rect x="10" y="150" width="70" height="35" rx="4" fill="white" stroke="#d1d1d1" strokeWidth="1" />
                  <text x="45" y="172" fontFamily="sans-serif" fontSize="9" fontWeight="bold" textAnchor="middle">SQLite DB</text>
                  <text x="45" y="181" fontFamily="monospace" fontSize="7" fill="#737373" textAnchor="middle">interviewa.db</text>

                  {/* Flow Arrow: FastAPI -> Redis */}
                  <path d="M200 102 L255 102 L255 150" fill="none" stroke="#111" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrow)" />

                  {/* Redis Box */}
                  <rect x="220" y="150" width="70" height="35" rx="4" fill="white" stroke="#d1d1d1" strokeWidth="1" />
                  <text x="255" y="172" fontFamily="sans-serif" fontSize="9" fontWeight="bold" textAnchor="middle">Redis Cache</text>
                  <text x="255" y="181" fontFamily="monospace" fontSize="7" fill="#737373" textAnchor="middle">Session store</text>

                  {/* Flow Arrow: FastAPI -> Colab GPU proxy */}
                  <path d="M150 125 L150 200" fill="none" stroke="#111" strokeWidth="1" markerEnd="url(#arrow)" />
                  <text x="155" y="145" fontFamily="sans-serif" fontSize="8" fill="#737373">Proxy Tunnel</text>

                  {/* Colab Box */}
                  <rect x="85" y="200" width="130" height="35" rx="4" fill="white" stroke="#111" strokeWidth="1" />
                  <text x="150" y="215" fontFamily="sans-serif" fontSize="9" fontWeight="bold" textAnchor="middle">Google Colab Runtime</text>
                  <text x="150" y="225" fontFamily="sans-serif" fontSize="7" fill="#737373" textAnchor="middle">Whisper Speech + LLM (GPU)</text>

                  {/* Marker definitions for arrows */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 10 5 L 0 8 z" fill="#111" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
            
          </div>

          {/* Right Column: Tabbed Instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Tabs Selector */}
            <div style={{ 
              display: "flex", 
              gap: 4, 
              borderBottom: "1px solid var(--line)", 
              paddingBottom: 0,
              overflowX: "auto"
            }}>
              {[
                { key: "overview", label: "Overview", icon: <Info size={13} /> },
                { key: "backend", label: "1. Backend", icon: <Server size={13} /> },
                { key: "env", label: "2. Environment Config", icon: <Key size={13} /> },
                { key: "colab", label: "3. Colab AI GPU", icon: <Cpu size={13} /> },
                { key: "frontend", label: "4. Frontend", icon: <Laptop size={13} /> }
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      borderBottom: active ? "2px solid #111" : "2px solid transparent",
                      color: active ? "var(--text-strong)" : "var(--muted)",
                      background: "transparent",
                      borderRadius: 0,
                      whiteSpace: "nowrap",
                      fontFamily: active ? "'Lora', Georgia, serif" : "inherit",
                      fontStyle: active ? "italic" : "normal"
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div className="surface" style={{ padding: 28, borderRadius: 8 }}>
              
              {/* PANEL: Overview */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      Architecture & Flow
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 8 }}>
                      Interviewa is a self-hostable full-stack application built to run on your local infrastructure.
                      It splits responsibilities into three logical blocks:
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 8 }}>
                    {[
                      {
                        title: "FastAPI Backend (Port 8000)",
                        desc: "Handles interview sessions, database storage, candidate report compilation, voice file handling, and connects to ChromaDB or Redis.",
                        icon: <Server size={16} />
                      },
                      {
                        title: "Next.js Frontend (Port 3000)",
                        desc: "Implements the distraction-free interview studio workspace, text editor for coding rounds, voice visualizer, and dashboard reporting.",
                        icon: <Laptop size={16} />
                      },
                      {
                        title: "AI Inference Service (Colab/Local)",
                        desc: "Whisper speech-to-text pipeline, text-to-speech engine, and the LLM evaluators. Recommended to run on a Google Colab GPU notebook.",
                        icon: <Cpu size={16} />
                      }
                    ].map((comp, idx) => (
                      <div key={idx} className="surface-strong" style={{ padding: 14, borderRadius: 6, display: "flex", gap: 12 }}>
                        <div style={{ background: "rgba(0,0,0,0.02)", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          {comp.icon}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
                            {comp.title}
                          </h4>
                          <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.4, marginTop: 2 }}>
                            {comp.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "var(--bg-soft)", border: "1px solid var(--line)", padding: 14, borderRadius: 6, marginTop: 8 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Info size={14} /> Quick-Start Checklist
                    </h4>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      To set everything up, follow tabs 1 through 4 in order. You'll run the backend server first, 
                      configure the variables inside `.env`, connect your AI service, and then start this React web interface.
                    </p>
                  </div>
                  
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setActiveTab("backend")} className="button-primary" style={{ fontSize: 12, display: "flex", gap: 6 }}>
                      Start Step 1 <Play size={12} fill="white" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Backend Setup */}
              {activeTab === "backend" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      1. Backend Installation
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 6 }}>
                      The backend runs on Python. Set up a virtual environment to manage dependencies, install requirements, and run with Uvicorn.
                    </p>
                  </div>

                  {/* Step 1.1 */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>1</span>
                      Create and Activate Virtual Environment
                    </h4>
                    <TerminalBlock code={codeBlocks.backendVenv} id="venv" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  {/* Step 1.2 */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>2</span>
                      Install Python Dependencies
                    </h4>
                    <TerminalBlock code={codeBlocks.backendDeps} id="deps" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  {/* Step 1.3 */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>3</span>
                      Launch FastAPI Server
                    </h4>
                    <TerminalBlock code={codeBlocks.backendStart} id="start" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
                      Note: On first startup, the database initialize command runs automatically, creating a local SQLite file in the backend root directory.
                    </p>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("overview")} className="button-secondary" style={{ fontSize: 12 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("env")} className="button-primary" style={{ fontSize: 12 }}>
                      Next: Env Config
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Environment Variables */}
              {activeTab === "env" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      2. Environment Configuration
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 6 }}>
                      Create a file named `.env` in the `backend/` directory by copying `backend/.env.example`.
                    </p>
                  </div>

                  {/* Copy template */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}>
                      Environment Variables Template (.env)
                    </h4>
                    <TerminalBlock code={codeBlocks.envTemplate} id="env" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  {/* Documentation table */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}>
                      Variable Descriptions
                    </h4>
                    <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--line)" }}>
                            <th style={{ padding: "8px 10px", fontWeight: 700 }}>Variable</th>
                            <th style={{ padding: "8px 10px", fontWeight: 700 }}>Description</th>
                            <th style={{ padding: "8px 10px", fontWeight: 700 }}>Default / Option</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--text-strong)" }}>ai_service_url</td>
                            <td style={{ padding: "8px 10px" }}>URL pointing to the Whisper transcription and LLM inference pipeline.</td>
                            <td style={{ padding: "8px 10px", color: "var(--muted)" }}>Ngrok URL from Google Colab</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--text-strong)" }}>database_url</td>
                            <td style={{ padding: "8px 10px" }}>SQLAlchemy connection string for saving interview sessions and reports.</td>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>sqlite:///./interviewa.db</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--text-strong)" }}>redis_url</td>
                            <td style={{ padding: "8px 10px" }}>Redis address used to store session states and caching.</td>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>redis://localhost:6379/0</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--text-strong)" }}>groq_api_key</td>
                            <td style={{ padding: "8px 10px" }}>Optional Groq API key used as fallback for LLM evaluation.</td>
                            <td style={{ padding: "8px 10px", color: "var(--muted)" }}>Optional</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--text-strong)" }}>chroma_host / port</td>
                            <td style={{ padding: "8px 10px" }}>Address for Chroma Vector DB. Used to parse and fetch details from resumes.</td>
                            <td style={{ padding: "8px 10px", color: "var(--muted)" }}>Optional (will skip gracefully)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("backend")} className="button-secondary" style={{ fontSize: 12 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("colab")} className="button-primary" style={{ fontSize: 12 }}>
                      Next: Colab AI GPU
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Colab GPU Proxy */}
              {activeTab === "colab" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                        3. Colab AI GPU Runtime Proxy
                      </h2>
                      <span style={{ background: "var(--bg-soft)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase" }}>
                        Highly Recommended
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 6 }}>
                      Evaluating coding responses and transcribing voice records with Whisper is computationally heavy.
                      The project includes a Google Colab notebook that hosts these pipelines on a free T4 GPU and tunnels it to your local environment.
                    </p>
                  </div>

                  {/* Flow list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      {
                        title: "Open the Colab Notebook (Inverviewa.ipynb)",
                        desc: "Locate the 'Inverviewa.ipynb' file in the root folder of your project and upload it to Colab, or open the online repository version directly using the link below. Ensure you select a GPU runtime (Runtime -> Change runtime type -> T4 GPU).",
                        link: "https://colab.research.google.com/github/sh78ba/mockmate/blob/main/Inverviewa.ipynb"
                      },
                      {
                        title: "Execute the proxy cells",
                        desc: "Run all cells in the notebook. This fetches the Whisper speech pipeline and starts an Ngrok/localtunnel proxy forwarding backend requests.",
                        link: null
                      },
                      {
                        title: "Copy the endpoint URL",
                        desc: "Once running, the final cells output a line looking like AI_SERVICE_URL=https://xxxx.ngrok-free.app (or similar proxy URL). Copy this URL.",
                        link: null
                      },
                      {
                        title: "Save in backend/.env",
                        desc: "Paste that copied URL as the ai_service_url value inside your backend/.env file, then start/restart your backend server.",
                        link: null
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12 }}>
                        <span style={{ 
                          display: "inline-flex", 
                          width: 22, 
                          height: 22, 
                          borderRadius: "50%", 
                          border: "1px solid #111", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontSize: 11, 
                          fontWeight: 700,
                          flexShrink: 0,
                          background: "white",
                          color: "#111"
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)" }}>
                            {step.title}
                          </div>
                          <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.4, marginTop: 2 }}>
                            {step.desc}
                          </p>
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "var(--text-strong)", marginTop: 4, textDecoration: "underline" }}>
                              Open Google Colab <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("env")} className="button-secondary" style={{ fontSize: 12 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("frontend")} className="button-primary" style={{ fontSize: 12 }}>
                      Next: Frontend Setup
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Frontend Setup */}
              {activeTab === "frontend" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      4. Frontend Installation
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 6 }}>
                      The client interface is built with React and Next.js. Install dependencies and start the development server.
                    </p>
                  </div>

                  {/* Step 4.1 */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>1</span>
                      Install Node Modules
                    </h4>
                    <TerminalBlock code={codeBlocks.frontendDeps} id="npm-install" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  {/* Step 4.2 */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>2</span>
                      Start Dev Server
                    </h4>
                    <TerminalBlock code={codeBlocks.frontendStart} id="npm-dev" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
                      This starts the dev node server, hosting the page at <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit", fontWeight: 700 }}>http://localhost:3000</a>.
                    </p>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("colab")} className="button-secondary" style={{ fontSize: 12 }}>
                      Back
                    </button>
                    <Link href="/dashboard" className="button-primary" style={{ fontSize: 12 }}>
                      Finish & Go to Dashboard <Play size={12} fill="white" />
                    </Link>
                  </div>
                </div>
              )}

            </div>

          </div>

        </section>
      </main>
    </>
  );
}

// Sub-component: Code block styled like terminal with a Copy button
function TerminalBlock({ code, id, onCopy, copiedBlock }: { code: string, id: string, onCopy: (text: string, id: string) => void, copiedBlock: string | null }) {
  const copied = copiedBlock === id;
  return (
    <div className="ide-wrapper" style={{ marginTop: 6 }}>
      <div className="ide-header" style={{ padding: "6px 12px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Terminal size={12} color="var(--muted)" />
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)" }}>terminal</span>
        </div>
        <button
          onClick={() => onCopy(code, id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: copied ? "var(--text-strong)" : "var(--muted)",
            fontWeight: 700,
            background: "transparent",
            padding: "2px 6px",
            borderRadius: 3,
            border: "1px solid " + (copied ? "#111" : "transparent")
          }}
        >
          {copied ? (
            <>
              <Check size={10} color="#111" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="ide-editor">
        <pre
          style={{
            flex: 1,
            padding: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--text-strong)",
            overflowX: "auto",
            background: "#ffffff"
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
