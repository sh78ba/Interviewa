"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

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
      setStatusText("Evaluating your answer...");
      const evalRes = await api.post(`/api/interview/${id}/answer`, {
        question_id: question.question_id,
        answer_text: text,
        code: "",
      });

      const fb: Feedback = evalRes.data;
      setFeedback(fb);
      setPhase("feedback");

      // Step 3 — speak feedback
      const score = fb.score;
      const scoreComment =
        score >= 8
          ? "Excellent answer!"
          : score >= 6
            ? "Good answer."
            : score >= 4
              ? "That's partially correct."
              : "Let me give you some guidance.";

      const feedbackSpeech = `${scoreComment} You scored ${score} out of 10. ${fb.feedback}`;
      setStatusText(`Score: ${score}/10 — AI is giving feedback...`);
      await speak(feedbackSpeech);

      // Step 4 — short pause then next question
      setStatusText("Moving to next question in 3 seconds...");
      await new Promise((r) => setTimeout(r, 3000));
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

  // ── Stop recording and finalize the answer ───────────────────────────────
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
      const evalRes = await api.post(`/api/interview/${id}/answer`, {
        question_id: question.question_id,
        answer_text: "See code submission",
        code: code,
      });

      const fb: Feedback = evalRes.data;
      setFeedback(fb);
      setPhase("feedback");

      const feedbackSpeech = `You scored ${fb.score} out of 10. ${fb.feedback}`;
      setStatusText(`Score: ${fb.score}/10`);
      await speak(feedbackSpeech);

      setStatusText("Moving to next question in 3 seconds...");
      await new Promise((r) => setTimeout(r, 3000));
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

  // ── Visuals ───────────────────────────────────────────────────────────────
  const diffColor: Record<string, string> = {
    easy: "#16a34a",
    medium: "#ca8a04",
    hard: "#dc2626",
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
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>Interview complete</h2>
        <p style={{ color: "#777", marginBottom: 16 }}>Your report is ready</p>
        <button
          onClick={() => router.push(`/interview/${id}/report`)}
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            border: "none",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          View report
        </button>
      </main>
    );

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px",
        minHeight: "100vh",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{ fontSize: 13, color: "#777", textTransform: "capitalize" }}
          >
            {question?.round || "—"}
          </span>
          {question?.difficulty && (
            <>
              <span style={{ color: "#ddd" }}>·</span>
              <span
                style={{ fontSize: 13, color: diffColor[question.difficulty] }}
              >
                {question.difficulty}
              </span>
            </>
          )}
          {question?.topic && (
            <>
              <span style={{ color: "#ddd" }}>·</span>
              <span style={{ fontSize: 13, color: "#777" }}>
                {question.topic}
              </span>
            </>
          )}
        </div>
        <span style={{ fontSize: 13, color: "#777" }}>
          {question?.progress || "—"}
        </span>
      </div>

      {/* AI Avatar */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#111",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            marginBottom: 12,
            boxShadow:
              phase === "ai_speaking"
                ? "0 0 0 6px #e5e5e5, 0 0 0 12px #f0f0f0"
                : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          🤖
        </div>
        <p style={{ fontSize: 14, color: "#555", fontWeight: 500 }}>
          {statusText}
        </p>
      </div>

      {/* Question card */}
      {question && (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            borderLeft: "3px solid #111",
          }}
        >
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "#222" }}>
            {question.question}
          </p>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#777",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            YOUR ANSWER
          </p>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
            {transcript}
          </p>
        </div>
      )}

      {/* Code editor */}
      {question?.is_coding && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#f5f5f5",
              padding: "8px 16px",
              fontSize: 12,
              color: "#777",
              borderBottom: "1px solid #eee",
            }}
          >
            Code editor
          </div>
          <MonacoEditor
            height="280px"
            defaultLanguage="python"
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}

      {/* Feedback card */}
      {feedback && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              background: "#f9f9f9",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 14 }}>Feedback</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color:
                  feedback.score >= 7
                    ? "#16a34a"
                    : feedback.score >= 5
                      ? "#ca8a04"
                      : "#dc2626",
              }}
            >
              {feedback.score}/10
            </span>
          </div>
          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
              {feedback.feedback}
            </p>
            {feedback.strengths && (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#16a34a",
                    marginBottom: 4,
                  }}
                >
                  STRENGTHS
                </p>
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
                  {feedback.strengths}
                </p>
              </div>
            )}
            {feedback.weaknesses && (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#dc2626",
                    marginBottom: 4,
                  }}
                >
                  TO IMPROVE
                </p>
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
                  {feedback.weaknesses}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        {/* Interrupt AI */}
        {phase === "ai_speaking" && (
          <button
            onClick={interrupt}
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              color: "#333",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Skip — start answering
          </button>
        )}

        {/* Mic button */}
        {phase === "listening" && (
          <button
            onClick={stopListening}
            style={{
              background: "#e00",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ animation: "pulse 1s infinite" }}>⏹</span> Done
            answering
          </button>
        )}

        {/* Coding submit */}
        {question?.is_coding && phase === "feedback" && !feedback && (
          <button
            onClick={submitCoding}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Submit solution
          </button>
        )}

        {/* Processing indicator */}
        {phase === "processing" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#777",
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: "2px solid #ddd",
                borderTopColor: "#111",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Processing...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </main>
  );
}
