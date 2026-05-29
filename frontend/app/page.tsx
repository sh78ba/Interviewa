import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Interviewa
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "#555",
          marginBottom: 48,
          textAlign: "center",
          maxWidth: 480,
        }}
      >
        Practice real technical interviews with AI. DSA, System Design, HR — all
        in one place.
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        <Link
          href="/register"
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          style={{
            border: "1px solid #ddd",
            color: "#111",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 15,
          }}
        >
          Login
        </Link>
      </div>
    </main>
  );
}
