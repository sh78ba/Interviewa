"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="nav-shell">
      <nav className="nav-inner">
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <span className="brand-mark">I</span>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Interviewa
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              interview practice studio
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/dashboard"
            className="button-subtle"
            style={{ textDecoration: "none" }}
          >
            Dashboard
          </Link>
        </div>
      </nav>
    </div>
  );
}
