import Link from "next/link";

export default function Home() {
  return (
    <main className="page-container" style={{ paddingTop: 20 }}>
      <section className="hero-section">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span className="page-kicker">AI interview practice, but calmer</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h1 className="page-title">
              Interviewa helps you rehearse like a real candidate, not a demo.
            </h1>
            <p className="page-subtitle">
              Practice technical rounds with grounded feedback, real scoring,
              and a report that tells you what to improve next. Built to feel
              more like a product a senior team would ship than a generic
              chatbot wrapper.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/register" className="button-primary">
              Get started
            </Link>
            <Link href="/login" className="button-secondary">
              Login
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["DSA", "System design", "Behavioral", "Resume review"].map(
              (item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="surface" style={{ padding: 24 }}>
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            <div
              className="surface-strong"
              style={{ padding: 20, background: "rgba(255,255,255,0.9)" }}
            >
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}
              >
                Final interview report
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 750,
                  letterSpacing: "-0.05em",
                }}
              >
                78
                <span
                  style={{
                    fontSize: 16,
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  /100
                </span>
              </div>
              <p
                style={{
                  marginTop: 10,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                Clear strengths, sharper weaknesses, and a concrete next-step
                plan.
              </p>
            </div>

            <div className="grid-2">
              {[
                [
                  "Direct feedback",
                  "No filler scores. Answers are scored for relevance first.",
                ],
                [
                  "Studio feel",
                  "Soft surfaces, warm contrast, and deliberate spacing.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="surface-strong card-hover"
                  style={{ padding: 18 }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 650, marginBottom: 8 }}
                  >
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
        </div>
      </section>
    </main>
  );
}
