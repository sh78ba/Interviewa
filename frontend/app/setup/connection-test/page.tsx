"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Wifi, AlertCircle, RefreshCw, BookOpen, CheckCircle2, Layers
} from "lucide-react";

export default function ConnectionTest() {
  const pathname = usePathname();

  // Health check test state
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [healthError, setHealthError] = useState<string>("");

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

  // AI calibration overrides state
  const [aiServiceUrl, setAiServiceUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_service_url") || "";
    }
    return "";
  });
  const [groqApiKey, setGroqApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("groq_api_key") || "";
    }
    return "";
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      if (aiServiceUrl.trim()) {
        localStorage.setItem("ai_service_url", aiServiceUrl.trim());
      } else {
        localStorage.removeItem("ai_service_url");
      }
      if (groqApiKey.trim()) {
        localStorage.setItem("groq_api_key", groqApiKey.trim());
      } else {
        localStorage.removeItem("groq_api_key");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
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
        <div className="surface" style={{ width: "100%", maxWidth: 1120, padding: "24px", borderRadius: 12 }}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <span className="page-kicker" style={{ fontSize: 11, padding: "2px 6px" }}>
              <Wifi size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} /> Setup Guide
            </span>
            <h1 className="section-title" style={{ fontSize: 22, marginTop: 8 }}>
              Connection & <span>Diagnostics</span>.
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
              Verify if this web application frontend can securely connect to your FastAPI server.
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

          {/* Diagnostic Test & Calibration Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginTop: 16 }}>
            {/* Connection Status Column */}
            <div className="surface-strong" style={{ padding: "20px", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
                  Connection Status
                </h3>
                <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4, marginBottom: 16 }}>
                  Click the button below to send a ping to `http://localhost:8000/health`.
                </p>
                
                <div style={{ marginBottom: 20 }}>
                  {healthStatus === "idle" && (
                    <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                      Not tested yet
                    </div>
                  )}
                  {healthStatus === "testing" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text)" }}>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Pinging local backend API...</span>
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
                </div>
              </div>

              <button
                onClick={testBackendConnection}
                disabled={healthStatus === "testing"}
                className="button-primary"
                style={{ width: "100%", padding: "10px 16px", fontSize: 12, display: "flex", gap: 6, justifyContent: "center" }}
              >
                <RefreshCw size={12} className={healthStatus === "testing" ? "animate-spin" : ""} />
                Test backend endpoint
              </button>
            </div>

            {/* AI Calibration Settings Column */}
            <div className="surface-strong" style={{ padding: "20px", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
                  AI Calibration Settings
                </h3>
                <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4, marginBottom: 16 }}>
                  Set custom endpoints for hosted/demo environments. Leave blank to default to local backend configuration.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="field-label" style={{ fontSize: 11, marginBottom: 4, display: "block" }}>
                      Colab GPU / Ngrok Service URL
                    </label>
                    <input
                      type="text"
                      value={aiServiceUrl}
                      onChange={(e) => setAiServiceUrl(e.target.value)}
                      placeholder="https://xxxx.ngrok-free.app"
                      className="input"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>

                  <div>
                    <label className="field-label" style={{ fontSize: 11, marginBottom: 4, display: "block" }}>
                      Groq API Key <span style={{ color: "var(--muted)", fontWeight: 400 }}>(Optional Fallback)</span>
                    </label>
                    <input
                      type="password"
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="gsk_..."
                      className="input"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>

                  {saveStatus === "saved" && (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      color: "var(--text-strong)", 
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 4
                    }}>
                      <CheckCircle2 size={14} color="#111" />
                      <span>Settings saved successfully!</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="button-primary"
                style={{ width: "100%", padding: "10px 16px", fontSize: 12, display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}
              >
                Save calibration settings
              </button>
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
