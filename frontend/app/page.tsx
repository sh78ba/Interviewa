import Link from "next/link";
import { ArrowRight, Brain, Code, Cpu, MessageSquare, Award, CheckCircle2, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="page-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <section className="hero-section" style={{ padding: "32px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span className="page-kicker">
            AI interview practice, but calmer
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="page-title">
              Rehearse like a <span>real candidate</span>, not a demo.
            </h1>
            <p className="page-subtitle">
              Interviewa simulates technical, design, and cultural rounds with grounded feedback, 
              objective scoring rubrics, and clean summaries. Designed to feel like a high-end 
              editorial testing environment.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/interview/new" className="button-primary" style={{ padding: "12px 24px" }}>
              Get started <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="button-secondary" style={{ padding: "12px 24px" }}>
              Go to Dashboard
            </Link>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {[
              { label: "DSA & Coding", icon: <Code size={13} /> },
              { label: "System Design", icon: <Cpu size={13} /> },
              { label: "Behavioral & HR", icon: <MessageSquare size={13} /> },
              { label: "Resume Review", icon: <Award size={13} /> }
            ].map(
              (item) => (
                <span key={item.label} className="chip" style={{ display: "flex", gap: 6, borderRadius: 4 }}>
                  {item.icon}
                  <span style={{ fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>{item.label}</span>
                </span>
              ),
            )}
          </div>
        </div>

        {/* Clean Paper Report Mockup */}
        <div className="surface" style={{ padding: 24, border: "1px solid #d1d1d1", borderRadius: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="surface-strong" style={{ padding: 20, borderLeft: "2px solid #111111", background: "var(--bg-soft)", borderRadius: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  EVALUATION REPORT
                </span>
                <span style={{ fontSize: 10, border: "1px solid #111", padding: "1px 6px", borderRadius: 3, fontWeight: 700, fontStyle: "italic", fontFamily: "'Lora', Georgia, serif" }}>Complete</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 2,
                  fontSize: 48,
                  fontWeight: 650,
                  letterSpacing: "-0.04em",
                  color: "var(--text-strong)",
                  fontFamily: "'Lora', Georgia, serif",
                  fontStyle: "italic",
                  lineHeight: 1
                }}
              >
                78
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--muted)",
                    fontWeight: 500,
                    fontStyle: "normal"
                  }}
                >
                  /100
                </span>
              </div>
              <p
                style={{
                  marginTop: 10,
                  color: "var(--text)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Candidate demonstrated strong problem-solving skills and structured code layout. 
                Focus on reducing time complexity of the secondary pass.
              </p>
            </div>

            <div className="grid-2">
              {[
                {
                  title: "Direct Feedback",
                  desc: "Clean points, no generic fluff. Every response is assessed against technical rubrics.",
                  icon: <CheckCircle2 size={16} color="#111" />
                },
                {
                  title: "Studio Interface",
                  desc: "An immersive, distraction-free voice and code editor environment.",
                  icon: <ChevronRight size={16} color="#111" />
                }
              ].map(({ title, desc, icon }) => (
                <div
                  key={title}
                  className="surface-strong card-hover"
                  style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, borderRadius: 6 }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: "var(--text-strong)" }}
                  >
                    {icon}
                    <span style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>{title}</span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text)",
                      lineHeight: 1.5,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
