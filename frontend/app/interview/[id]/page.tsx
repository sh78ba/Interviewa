"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { 
  Volume2, Mic, Play, Square, Award, Clock, ArrowLeft, 
  CheckCircle, Activity, Info, Sparkles, Terminal, ChevronRight, AlertCircle
} from "lucide-react";

interface Question {
  question_id: string;
  question: string;
  round: string;
  difficulty: string;
  topic: string;
  is_coding: boolean;
  question_number: number;
  questions_in_round: number;
  progress: string;
}

interface Feedback {
  score: number;
  feedback: string;
  strengths: string;
  weaknesses: string;
  better_answer: string;
}

type Phase =
  | "loading" // fetching question from backend
  | "ai_speaking" // AI reading the question aloud
  | "listening" // user is speaking
  | "processing" // transcribing + evaluating
  | "feedback" // showing + speaking feedback
  | "done"; // all rounds complete

export default function InterviewRoom() {
  const { id } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [transcript, setTranscript] = useState("");
  const [code, setCode] = useState("// Write your solution here\n");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [statusText, setStatusText] = useState("Loading your interview...");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalizedRef = useRef(false);
  const fetchAndSpeakRef = useRef<(() => Promise<void>) | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
  const processAnswerRef = useRef<(() => Promise<void>) | null>(null);

  // ── Speak text via Colab TTS ─────────────────────────────────────────────
  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post(
          "/api/speech/speak",
          { text },
          { responseType: "blob" },
        );
        const url = URL.createObjectURL(res.data);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play();
      } catch {
        // If TTS fails, just wait 2s and continue
        setTimeout(resolve, 2000);
      }
    });
  }, []);

  // ── Fetch next question then speak it ────────────────────────────────────
  const fetchAndSpeak = useCallback(async () => {
    setPhase("loading");
    setStatusText("Loading next question...");
    setTranscript("");
    setCode("// Write your solution here\n");
    setFeedback(null);
    finalizedRef.current = false;

    try {
      const res = await api.get(`/api/interview/${id}/next`);

      if (res.data.status === "completed") {
        setPhase("done");
        setStatusText("Interview complete!");
        await speak(
          "Great job completing the interview. Your report is ready.",
        );
        return;
      }

      const q: Question = res.data;
      setQuestion(q);
      setPhase("ai_speaking");

      // Build what the AI says
      const intro =
        q.question_number === 1
          ? `Welcome to your ${q.round} round. Let's begin.`
          : `Next question.`;

      const fullText = `${intro} ${q.question}`;
      setStatusText("AI is speaking...");
      await speak(fullText);

      // After speaking, start listening (unless coding question)
      if (!q.is_coding) {
        await startListeningRef.current?.();
      } else {
        setPhase("feedback"); // for coding, wait for manual submit
        setStatusText("Write your solution, then submit");
      }
    } catch {
      setStatusText("Error loading question. Retrying...");
      setTimeout(() => {
        void fetchAndSpeakRef.current?.();
      }, 3000);
    }
  }, [id, speak]);

  // ── Start mic recording ──────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setPhase("listening");
    setStatusText("Listening... speak your answer");
    setTranscript("");
    finalizedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await processAnswerRef.current?.();
      };

      mr.start();
      mediaRef.current = mr;
    } catch {
      setStatusText("Microphone access denied. Please type your answer.");
      setPhase("feedback");
    }
  }, []);

  // ── Stop recording ───────────────────────────────────────────────────────
  // ── Transcribe + evaluate ────────────────────────────────────────────────
  const processAnswer = useCallback(async () => {
    if (!question) return;
    setPhase("processing");
    setStatusText("Transcribing your answer...");

    try {
      // Step 1 — transcribe audio
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const transcribeRes = await api.post("/api/speech/transcribe", form);
      const text = transcribeRes.data.text || "";
      setTranscript(text);

      if (!text.trim()) {
        setStatusText("Didn't catch that. Let's try again.");
        await speak("I didn't catch that. Please try again.");
        await startListeningRef.current?.();
        return;
      }

      // Step 2 — evaluate answer
      setStatusText("Recording your answer...");
      await api.post(`/api/interview/${id}/answer`, {
        question_id: question.question_id,
        answer_text: text,
        code: "",
      });

      // Do not show interim scores. Move to next question.
      setPhase("processing");
      setStatusText("Answer recorded. Moving to next question...");
      await new Promise((r) => setTimeout(r, 1000));
      await fetchAndSpeakRef.current?.();
    } catch {
      setStatusText("Something went wrong. Moving on...");
      await new Promise((r) => setTimeout(r, 2000));
      await fetchAndSpeakRef.current?.();
    }
  }, [question, id, speak]);

  useEffect(() => {
    fetchAndSpeakRef.current = fetchAndSpeak;
    startListeningRef.current = startListening;
    processAnswerRef.current = processAnswer;
  }, [fetchAndSpeak, startListening, processAnswer]);

  // ── Stop listening and finalize the answer ───────────────────────────────
  const stopListening = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setPhase("processing");
    setStatusText("Wrapping up your answer...");

    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
      return;
    }

    void processAnswerRef.current?.();
  }, []);

  // ── Submit coding answer manually ────────────────────────────────────────
  const submitCoding = useCallback(async () => {
    if (!question) return;
    setPhase("processing");
    setStatusText("Evaluating your solution...");

    try {
      await api.post(`/api/interview/${id}/answer`, {
        question_id: question.question_id,
        answer_text: "See code submission",
        code: code,
      });

      // Hide interim scores for coding questions as well
      setPhase("processing");
      setStatusText("Solution recorded. Moving to next question...");
      await new Promise((r) => setTimeout(r, 1000));
      await fetchAndSpeakRef.current?.();
    } catch {
      setStatusText("Error evaluating. Moving on...");
      await new Promise((r) => setTimeout(r, 2000));
      await fetchAndSpeakRef.current?.();
    }
  }, [question, id, code, speak]);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAndSpeak();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      audioRef.current?.pause();
      if (mediaRef.current?.state === "recording") {
        mediaRef.current.stop();
      }
    };
  }, [fetchAndSpeak]);

  // ── Interrupt AI and start answering ─────────────────────────────────────
  const interrupt = () => {
    audioRef.current?.pause();
    void startListeningRef.current?.();
  };

  if (phase === "done")
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          background: "var(--bg)",
          padding: 24
        }}
      >
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: "50%", 
          background: "var(--bg-soft)", 
          border: "1px solid #111111", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "var(--text-strong)",
          fontSize: 32,
          animation: "fadeIn 0.5s ease"
        }}>
          ✓
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-strong)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
          Interview complete
        </h2>
        <p style={{ color: "var(--text)", fontSize: 14, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
          All practice questions have been answered. Your scorecard is ready.
        </p>
        <button
          onClick={() => router.push(`/interview/${id}/report`)}
          className="button-primary"
          style={{ padding: "12px 28px", fontSize: 13, marginTop: 8 }}
        >
          View report <ChevronRight size={16} />
        </button>
      </main>
    );

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HUD Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 14,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            className="chip"
            style={{ fontSize: 10, textTransform: "capitalize", padding: "3px 8px", borderRadius: 3 }}
          >
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>{question?.round.replace("_", " ") || "—"}</span>
          </span>
          {question?.difficulty && (
            <span
              style={{ 
                fontSize: 10, 
                color: "#111", 
                background: "var(--bg-soft)",
                border: "1px solid var(--line)",
                padding: "3px 8px",
                borderRadius: 3,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}
            >
              {question.difficulty}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
          {question?.progress || "—"}
        </span>
      </div>

      {/* AI Interviewer Avatar Panel */}
      <div className="surface" style={{ padding: 20, textAlign: "center", borderRadius: 8 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--bg-soft)",
            border: `1.5px solid ${phase === "ai_speaking" || phase === "listening" ? "#111111" : "var(--line)"}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            marginBottom: 10,
            transition: "all 0.2s ease",
          }}
        >
          {phase === "listening" ? (
            <Mic size={18} color="#111111" />
          ) : phase === "ai_speaking" ? (
            <Volume2 size={18} color="#111111" />
          ) : (
            <Activity size={18} color="var(--muted)" />
          )}
        </div>
        
        <p style={{ fontSize: 13, color: "var(--text-strong)", fontWeight: 700 }}>
          {statusText}
        </p>

        {/* Audio Wave Visualizer Simulation */}
        <div style={{ marginTop: 12 }}>
          <div className="audio-visualizer">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="wave-bar" 
                style={{ 
                  animationPlayState: (phase === "ai_speaking" || phase === "listening") ? "running" : "paused",
                  opacity: (phase === "ai_speaking" || phase === "listening") ? 1 : 0.2,
                  height: (phase === "ai_speaking" || phase === "listening") ? undefined : "4px",
                  background: "#111"
                }} 
              />
            ))}
          </div>
        </div>

        <div style={{ 
          marginTop: 14, 
          display: "flex", 
          gap: 6, 
          alignItems: "center", 
          justifyContent: "center",
          background: "var(--bg-soft)",
          padding: "8px 12px",
          borderRadius: 4,
          border: "1px solid var(--line)"
        }}>
          <Info size={12} color="var(--muted)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 10, color: "var(--muted)", textAlign: "left", lineHeight: 1.4 }}>
            Interim feedback is stored silently. The final scorecard appears upon session completion.
          </p>
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div
          className="surface-strong"
          style={{
            padding: 20,
            borderLeft: "2px solid #111111",
            background: "var(--bg-soft)",
            borderRadius: 6
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Question {question.question_number}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-strong)", fontWeight: 500 }}>
            {question.question}
          </p>
        </div>
      )}

      {/* Audio Transcript (if speech is detected) */}
      {transcript && (
        <div className="surface" style={{ padding: 16, borderRadius: 8 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginBottom: 6,
              fontWeight: 700,
              letterSpacing: "0.04em"
            }}
          >
            SPOKEN TRANSCRIPT
          </div>
          <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
            {transcript}
          </p>
        </div>
      )}

      {/* Live Actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginTop: 6,
        }}
      >
        {/* Interrupt AI speaking */}
        {phase === "ai_speaking" && (
          <button
            onClick={interrupt}
            className="button-secondary"
            style={{ width: "100%", padding: "10px 16px" }}
          >
            Skip — start answering
          </button>
        )}

        {/* Done answering voice */}
        {phase === "listening" && (
          <button
            onClick={stopListening}
            className="button-primary"
            style={{
              width: "100%",
              padding: "12px 18px",
              background: "#111",
              color: "white",
            }}
          >
            <Square size={12} fill="white" /> Done answering
          </button>
        )}

        {/* Submitting Code */}
        {question?.is_coding && phase === "feedback" && !feedback && (
          <button
            onClick={submitCoding}
            className="button-primary"
            style={{ width: "100%", padding: "10px 16px" }}
          >
            Submit solution
          </button>
        )}

        {/* Loading/evaluating spinners */}
        {phase === "processing" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text)",
              fontSize: 12,
              background: "var(--bg-soft)",
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--line)"
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                border: "2px solid var(--line)",
                borderTopColor: "var(--accent-strong)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main
      style={{
        background: "var(--bg-soft)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Immersive Room Header */}
      <div 
        style={{ 
          height: 56, 
          background: "var(--bg)", 
          borderBottom: "1px solid var(--line)",
          display: "flex", 
          alignItems: "center", 
          padding: "0 24px",
          justifyContent: "space-between"
        }}
      >
        <button 
          onClick={() => {
            const leave = window.confirm("Exit the studio? Current answer states will be stored.");
            if (leave) router.push("/dashboard");
          }}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Exit studio
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#111" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-strong)", textTransform: "uppercase" }}>
            Live studio session
          </span>
        </div>
      </div>

      {question?.is_coding ? (
        /* GRID 2 COLUMNS (Question on Left, Code Editor on Right) */
        <div 
          style={{ 
            flex: 1, 
            display: "grid", 
            gridTemplateColumns: "360px 1fr",
            height: "calc(100vh - 56px)"
          }}
          className="studio-split"
        >
          {/* Left panel - scrollable */}
          <div 
            style={{ 
              background: "var(--bg)", 
              borderRight: "1px solid var(--line)",
              padding: 20,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              height: "100%"
            }}
          >
            {sidebarContent}
          </div>

          {/* Right panel - code editor */}
          <div style={{ padding: 20, overflowY: "auto", background: "var(--bg-soft)", height: "100%" }}>
            <div className="ide-wrapper" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="ide-header">
                <div className="ide-tabs">
                  <div className="ide-tab">
                    <Terminal size={12} color="#111" />
                    <span>solution.js</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
                  JavaScript (ES6)
                </div>
              </div>
              <div className="ide-editor" style={{ flex: 1, display: "flex", minHeight: 300 }}>
                <div className="ide-gutter">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="ide-textarea"
                  style={{ height: "100%", minHeight: "100%" }}
                  placeholder="Write your solution code here..."
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CENTER SINGLE COLUMN (Voice or text only) */
        <div 
          style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: "32px 24px"
          }}
        >
          <div className="surface" style={{ width: "100%", maxWidth: 580, padding: 24, borderRadius: 8 }}>
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .studio-split {
            grid-template-columns: 1fr !important;
            height: auto !important;
            overflow: visible !important;
          }
          .studio-split > div {
            height: auto !important;
            overflow: visible !important;
            border-right: none !important;
          }
        }
      `}</style>
    </main>
  );
}
