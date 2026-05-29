"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { saveToken } from "@/lib/store";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      saveToken(res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
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
            <span className="page-kicker">Join the practice room</span>
            <h1
              className="page-title"
              style={{ fontSize: "clamp(34px, 4vw, 54px)" }}
            >
              Create an account and build your interview streak.
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              One workspace for mock interviews, final scorecards, and cleaner
              feedback.
            </p>
          </div>

          <div className="stack" style={{ marginTop: 28 }}>
            {[
              "Practice the way real interviews unfold.",
              "Review summaries after the interview ends.",
              "Keep your sessions organized on the dashboard.",
            ].map((item) => (
              <div key={item} className="chip" style={{ width: "fit-content" }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface" style={{ padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}
            >
              Create your account
            </div>
            <h2 className="section-title">Start practicing interviews today</h2>
          </div>

          <form onSubmit={submit} className="stack">
            {[
              {
                label: "Name",
                value: name,
                set: setName,
                type: "text",
                placeholder: "Your name",
              },
              {
                label: "Email",
                value: email,
                set: setEmail,
                type: "email",
                placeholder: "you@company.com",
              },
              {
                label: "Password",
                value: password,
                set: setPassword,
                type: "password",
                placeholder: "Create a password",
              },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="field-label">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required
                  className="input"
                  placeholder={placeholder}
                />
              </div>
            ))}
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="button-primary"
              style={{ width: "100%" }}
            >
              {loading ? "Creating account..." : "Create account"}
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
            Have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--accent-strong)", fontWeight: 600 }}
            >
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
