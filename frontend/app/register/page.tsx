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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          Create account
        </h1>
        <p style={{ color: "#555", marginBottom: 32, fontSize: 14 }}>
          Start practicing interviews today
        </p>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {[
            { label: "Name", value: name, set: setName, type: "text" },
            { label: "Email", value: email, set: setEmail, type: "email" },
            {
              label: "Password",
              value: password,
              set: setPassword,
              type: "password",
            },
          ].map(({ label, value, set, type }) => (
            <div key={label}>
              <label
                style={{
                  fontSize: 13,
                  color: "#444",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          ))}
          {error && <p style={{ color: "#e00", fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#111",
              color: "#fff",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#555",
            textAlign: "center",
          }}
        >
          Have an account?{" "}
          <Link href="/login" style={{ color: "#111", fontWeight: 500 }}>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
