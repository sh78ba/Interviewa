"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken, isLoggedIn } from "@/lib/store";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <nav
      style={{
        borderBottom: "1px solid #eeeeee",
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "#ffffff",
        zIndex: 100,
      }}
    >
      <Link
        href="/dashboard"
        style={{
          fontWeight: 600,
          fontSize: 18,
          color: "#111",
          textDecoration: "none",
        }}
      >
        MockMate
      </Link>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 14, color: "#555", textDecoration: "none" }}
        >
          Dashboard
        </Link>
        <button
          onClick={logout}
          style={{
            fontSize: 14,
            color: "#555",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
