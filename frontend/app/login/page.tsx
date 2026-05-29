"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { saveToken } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/api/auth/login", form);
      saveToken(res.data.access_token);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container" style={{ paddingTop: 24 }}>
      <section className="hero-section" style={{ alignItems: "stretch" }}>
        <div
          className="surface"
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span className="page-kicker">Welcome back</span>
            <h1
              className="page-title"
              style={{ fontSize: "clamp(34px, 4vw, 54px)" }}
            >
              Log in and keep the interview rhythm going.
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              Pick up where you left off, review your latest reports, and
              continue practicing without fighting the interface.
            </p>
          </div>

          <div className="grid-2" style={{ marginTop: 28 }}>
            {[
              [
                "Focused rounds",
                "DSA, system design, and behavior in one place.",
              ],
              [
                "Clear scoring",
                "Final scores are shown only after the interview ends.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="surface-strong card-hover"
                style={{ padding: 18 }}
              >
                <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 8 }}>
                  {title}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface" style={{ padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}
            >
              Access your workspace
            </div>
            <h2 className="section-title">Login to continue practicing</h2>
          </div>

          <form onSubmit={submit} className="stack">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="Enter your password"
              />
            </div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="button-primary"
              style={{ width: "100%" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            No account?{" "}
            <Link
              href="/register"
              style={{ color: "var(--accent-strong)", fontWeight: 600 }}
            >
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
