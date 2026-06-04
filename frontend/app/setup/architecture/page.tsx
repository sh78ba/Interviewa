"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  BookOpen, CheckCircle2, Wifi, Layers
} from "lucide-react";

export default function SystemArchitecture() {
  const pathname = usePathname();

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
              <Layers size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} /> Setup Guide
            </span>
            <h1 className="section-title" style={{ fontSize: 22, marginTop: 8 }}>
              System <span>Architecture</span>.
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
              Visualize the data flow and communication protocols between components.
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

          {/* System Architecture Flowchart Diagram */}
          <div className="surface-strong" style={{ padding: "16px 20px", borderRadius: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
              Data Flow & Communication
            </h3>
            <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4, marginBottom: 12 }}>
              How requests are routed between your frontend client, local backend database, cache, and the AI service.
            </p>
            <div style={{ display: "flex", justifyContent: "center", background: "white", border: "1px solid var(--line)", borderRadius: 6, padding: 12 }}>
              <svg width="100%" height="240" viewBox="0 0 300 240" style={{ maxWidth: 285 }}>
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
      </main>
    </>
  );
}
