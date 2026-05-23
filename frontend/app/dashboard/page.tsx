"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { isLoggedIn } from "@/lib/store";

interface Interview {
  id: string;
  role: string;
  level: string;
  status: string;
  rounds: string[];
  created_at: string;
}

const statusColor: Record<string, string> = {
  completed: "#16a34a",
  in_progress: "#ca8a04",
  pending: "#6b7280",
};

export default function Dashboard() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    api.get("/api/interview/").then((r) => {
      setInterviews(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
              Your interviews
            </h1>
            <p style={{ color: "#777", fontSize: 14 }}>
              Practice makes perfect
            </p>
          </div>
          <Link
            href="/interview/new"
            style={{
              background: "#111",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            + New interview
          </Link>
        </div>

        {loading ? (
          <p style={{ color: "#777", fontSize: 14 }}>Loading...</p>
        ) : interviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              border: "1px dashed #ddd",
              borderRadius: 12,
            }}
          >
            <p style={{ color: "#777", fontSize: 15, marginBottom: 20 }}>
              No interviews yet
            </p>
            <Link
              href="/interview/new"
              style={{
                background: "#111",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Start your first interview
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interviews.map((iv) => (
              <div
                key={iv.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 15,
                        textTransform: "capitalize",
                      }}
                    >
                      {iv.role} — {iv.level}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "#f5f5f5",
                        color: statusColor[iv.status],
                        fontWeight: 500,
                      }}
                    >
                      {iv.status.replace("_", " ")}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#777" }}>
                    {iv.rounds.join(" · ")} ·{" "}
                    {new Date(iv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {iv.status !== "completed" && (
                    <Link
                      href={`/interview/${iv.id}`}
                      style={{
                        border: "1px solid #ddd",
                        color: "#111",
                        padding: "8px 16px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                      }}
                    >
                      Continue
                    </Link>
                  )}
                  {iv.status === "completed" && (
                    <Link
                      href={`/interview/${iv.id}/report`}
                      style={{
                        background: "#111",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                      }}
                    >
                      View report
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
