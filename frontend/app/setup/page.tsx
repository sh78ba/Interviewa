"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Server, Laptop, Cpu, ExternalLink, RefreshCw, 
  BookOpen, Terminal, Key, Play, Info, CheckCircle2, Wifi, Copy, Check, Layers
} from "lucide-react";

export default function SetupGuide() {
  const pathname = usePathname();
  // Tabs: 'overview' | 'backend' | 'env' | 'colab' | 'frontend'
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Copied feedback states
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
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
              <BookOpen size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} /> Setup Guide
            </span>
            <h1 className="section-title" style={{ fontSize: 22, marginTop: 8 }}>
              Getting started with <span>your local instance</span>.
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
              Set up the FastAPI backend, configure database connections, run the optional Colab GPU proxy, 
              and spin up the Next.js studio.
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

          {/* Tabbed Instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Tabs Selector */}
            <div style={{ 
              display: "flex", 
              gap: 4, 
              borderBottom: "1px solid var(--line)", 
              paddingBottom: 0,
              overflowX: "auto"
            }}>
              {[
                { key: "overview", label: "Overview", icon: <Info size={12} /> },
                { key: "backend", label: "1. Backend", icon: <Server size={12} /> },
                { key: "env", label: "2. Env Config", icon: <Key size={12} /> },
                { key: "colab", label: "3. Colab GPU", icon: <Cpu size={12} /> },
                { key: "frontend", label: "4. Frontend", icon: <Laptop size={12} /> }
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "8px 12px",
                      fontSize: 11,
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
            <div className="surface-strong" style={{ padding: "16px 20px", borderRadius: 8 }}>
              
              {/* PANEL: Overview */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      Architecture & Flow
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      Interviewa is a self-hostable full-stack application built to run on your local infrastructure.
                      It splits responsibilities into three logical blocks:
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 4 }}>
                    {[
                      {
                        title: "FastAPI Backend (Port 8000)",
                        desc: "Handles interview sessions, database storage, report compilation, and connects to ChromaDB or Redis.",
                        icon: <Server size={14} />
                      },
                      {
                        title: "Next.js Frontend (Port 3000)",
                        desc: "Implements the distraction-free interview studio workspace, text editor for coding, and dashboard reporting.",
                        icon: <Laptop size={14} />
                      },
                      {
                        title: "AI Inference Service (Colab/Local)",
                        desc: "Whisper speech-to-text pipeline, text-to-speech engine, and LLM evaluators. Runs on free T4 GPU Colab notebook.",
                        icon: <Cpu size={14} />
                      }
                    ].map((comp, idx) => (
                      <div key={idx} style={{ padding: 10, borderRadius: 6, display: "flex", gap: 10, background: "rgba(0,0,0,0.015)", border: "1px solid var(--line)" }}>
                        <div style={{ background: "rgba(0,0,0,0.02)", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          {comp.icon}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-strong)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
                            {comp.title}
                          </h4>
                          <p style={{ fontSize: 10, color: "var(--text)", lineHeight: 1.4, marginTop: 1 }}>
                            {comp.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setActiveTab("backend")} className="button-primary" style={{ padding: "6px 12px", fontSize: 11, display: "flex", gap: 4 }}>
                      Start Step 1 <Play size={10} fill="white" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Backend Setup */}
              {activeTab === "backend" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      1. Backend Installation
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      The backend runs on Python. Set up a virtual environment, install dependencies, and run with Uvicorn.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>1</span>
                      Activate Virtual Environment
                    </h4>
                    <TerminalBlock code={codeBlocks.backendVenv} id="venv" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>2</span>
                      Install Python Dependencies
                    </h4>
                    <TerminalBlock code={codeBlocks.backendDeps} id="deps" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>3</span>
                      Launch FastAPI Server
                    </h4>
                    <TerminalBlock code={codeBlocks.backendStart} id="start" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("overview")} className="button-secondary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("env")} className="button-primary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Next: Env Config
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Environment Variables */}
              {activeTab === "env" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      2. Environment Configuration
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      Create a `.env` in the `backend/` directory by copying `backend/.env.example`.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
                      Environment Variables Template (.env)
                    </h4>
                    <TerminalBlock code={codeBlocks.envTemplate} id="env" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
                      Variables
                    </h4>
                    <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--line)" }}>
                            <th style={{ padding: "6px 8px", fontWeight: 700 }}>Variable</th>
                            <th style={{ padding: "6px 8px", fontWeight: 700 }}>Description</th>
                            <th style={{ padding: "6px 8px", fontWeight: 700 }}>Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "var(--text-strong)" }}>ai_service_url</td>
                            <td style={{ padding: "6px 8px" }}>Ngrok URL from Colab</td>
                            <td style={{ padding: "6px 8px", color: "var(--muted)" }}>Required</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "var(--text-strong)" }}>database_url</td>
                            <td style={{ padding: "6px 8px" }}>Session database url</td>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>sqlite:///...</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "var(--text-strong)" }}>redis_url</td>
                            <td style={{ padding: "6px 8px" }}>Redis Cache address</td>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>redis://...</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "var(--text-strong)" }}>groq_api_key</td>
                            <td style={{ padding: "6px 8px" }}>Groq API key for evaluation fallback</td>
                            <td style={{ padding: "6px 8px", color: "var(--muted)" }}>Optional</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("backend")} className="button-secondary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("colab")} className="button-primary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Next: Colab GPU
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Colab GPU Proxy */}
              {activeTab === "colab" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      3. Colab AI GPU Proxy
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      Whisper speech and LLM generation require a GPU. Run the free Colab notebook and map the proxy URL to your local setup.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      {
                        title: "Open the Colab Notebook",
                        desc: "Upload 'Inverviewa.ipynb' from the project root directory to Google Colab, and select a GPU runtime (T4 GPU).",
                        link: "https://colab.research.google.com/github/sh78ba/mockmate/blob/main/Inverviewa.ipynb"
                      },
                      {
                        title: "Execute Cells",
                        desc: "Run the cells to fetch models and initiate the Ngrok tunnel proxy.",
                        link: null
                      },
                      {
                        title: "Copy the endpoint URL & Save",
                        desc: "Copy the generated AI_SERVICE_URL ngrok link, and save it in backend/.env under ai_service_url.",
                        link: null
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 8 }}>
                        <span style={{ 
                          display: "inline-flex", 
                          width: 18, 
                          height: 18, 
                          borderRadius: "50%", 
                          border: "1px solid #111", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontSize: 10, 
                          fontWeight: 700,
                          flexShrink: 0,
                          background: "white"
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)" }}>{step.title}</div>
                          <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{step.desc}</p>
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, color: "var(--text-strong)", textDecoration: "underline" }}>
                              Open Colab <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("env")} className="button-secondary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Back
                    </button>
                    <button onClick={() => setActiveTab("frontend")} className="button-primary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Next: Frontend Setup
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL: Frontend Setup */}
              {activeTab === "frontend" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: "var(--text-strong)" }}>
                      4. Frontend Installation
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, marginTop: 4 }}>
                      The client interface runs on Next.js. Install dependencies and start the dev server.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>1</span>
                      Install Node Modules
                    </h4>
                    <TerminalBlock code={codeBlocks.frontendDeps} id="npm-install" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", border: "1px solid #111", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>2</span>
                      Start Dev Server
                    </h4>
                    <TerminalBlock code={codeBlocks.frontendStart} id="npm-dev" onCopy={copyToClipboard} copiedBlock={copiedBlock} />
                  </div>

                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setActiveTab("colab")} className="button-secondary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Back
                    </button>
                    <Link href="/dashboard" className="button-primary" style={{ padding: "6px 12px", fontSize: 11 }}>
                      Finish & Go to Dashboard <Play size={10} fill="white" />
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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
            background: "#ffffff",
            margin: 0
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
