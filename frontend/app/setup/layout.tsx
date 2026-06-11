"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { BookOpen, CheckCircle2, Wifi, Layers } from "lucide-react";

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Helper to determine active header details dynamically
  const getHeaderDetails = () => {
    switch (pathname) {
      case "/setup/checklist":
        return {
          icon: <CheckCircle2 size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} />,
          title: <>Checklist & <span>Prerequisites</span>.</>,
          subtitle: "Mark off your setup checkpoints to ensure your environment is ready to start a practice round."
        };
      case "/setup/connection-test":
        return {
          icon: <Wifi size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} />,
          title: <>Connection & <span>Diagnostics</span>.</>,
          subtitle: "Verify if this web application frontend can securely connect to your FastAPI server."
        };
      case "/setup/architecture":
        return {
          icon: <Layers size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} />,
          title: <>System <span>Architecture</span>.</>,
          subtitle: "Visualize the data flow and communication protocols between components."
        };
      default:
        return {
          icon: <BookOpen size={11} style={{ marginRight: 4, display: "inline-flex", verticalAlign: "middle" }} />,
          title: <>Getting started with <span>your local instance</span>.</>,
          subtitle: "Set up the FastAPI backend, configure database connections, run the optional Colab GPU proxy, and spin up the Next.js studio."
        };
    }
  };

  const header = getHeaderDetails();

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
              {header.icon} Setup Guide
            </span>
            <h1 className="section-title" style={{ fontSize: 22, marginTop: 8 }}>
              {header.title}
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
              {header.subtitle}
            </p>
          </div>

          {/* Sub-navigation Tabs */}
          <div style={{ 
            display: "flex", 
            gap: 8, 
            borderBottom: "1px solid var(--line)", 
            paddingBottom: 0,
            marginBottom: 20,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none"
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
                    fontStyle: active ? "italic" : "normal",
                    whiteSpace: "nowrap"
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Child Panel Content */}
          {children}
        </div>
      </main>
    </>
  );
}
