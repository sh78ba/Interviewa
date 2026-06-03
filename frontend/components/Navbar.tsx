"use client";
import Link from "next/link";
import { LayoutDashboard, BookOpen } from "lucide-react";

export default function Navbar() {
  return (
    <div className="nav-shell">
      <nav className="nav-inner">
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <span className="brand-mark">
            I
          </span>
          <div>
            <div
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--text-strong)",
              }}
            >
              Interviewa
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              interview studio
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/setup"
            className="button-secondary"
            style={{ 
              textDecoration: "none", 
              display: "flex", 
              gap: 6, 
              padding: "6px 12px", 
              fontSize: 12,
              borderRadius: 4
            }}
          >
            <BookOpen size={14} />
            Setup Guide
          </Link>
          <Link
            href="/dashboard"
            className="button-secondary"
            style={{ 
              textDecoration: "none", 
              display: "flex", 
              gap: 6, 
              padding: "6px 12px", 
              fontSize: 12,
              borderRadius: 4
            }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </div>
      </nav>
    </div>
  );
}
