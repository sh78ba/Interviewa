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

        <div className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="https://github.com/sh78ba/Interviewa"
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary"
            style={{ 
              textDecoration: "none", 
              display: "flex", 
              gap: 6, 
              padding: "6px 12px", 
              fontSize: 12,
              borderRadius: 4,
              whiteSpace: "nowrap"
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="14" 
              height="14" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
            GitHub
          </a>
          <Link
            href="/setup"
            className="button-secondary"
            style={{ 
              textDecoration: "none", 
              display: "flex", 
              gap: 6, 
              padding: "6px 12px", 
              fontSize: 12,
              borderRadius: 4,
              whiteSpace: "nowrap"
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
              borderRadius: 4,
              whiteSpace: "nowrap"
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
