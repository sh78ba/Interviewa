"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useRealTimeInterview } from "@/hooks/useRealTimeInterview";
import { 
  Volume2, Mic, Play, Square, Award, Clock, ArrowLeft, 
  CheckCircle, Activity, Info, Sparkles, Terminal, ChevronRight, AlertCircle
} from "lucide-react";

interface Question {
  question_id: string;
  question: string;
  round: string;
  round_index: number;
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

const LANGUAGES = [
  { key: "javascript", label: "JavaScript (ES6)", ext: "js", template: "// Write your JavaScript solution here\n" },
  { key: "python", label: "Python (3.x)", ext: "py", template: "# Write your Python solution here\n" },
  { key: "typescript", label: "TypeScript", ext: "ts", template: "// Write your TypeScript solution here\n" },
  { key: "java", label: "Java", ext: "java", template: "// Write your Java solution here\n" },
  { key: "cpp", label: "C++", ext: "cpp", template: "// Write your C++ solution here\n" },
  { key: "go", label: "Go", ext: "go", template: "// Write your Go solution here\n" },
];

function detectLanguage(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(javascript|js)\b/i.test(lower)) {
    return "javascript";
  }
  if (/\bpython\b/i.test(lower)) {
    return "python";
  }
  if (/\b(typescript|ts)\b/i.test(lower)) {
    return "typescript";
  }
  if (/\bjava\b/i.test(lower) && !/\bjavascript\b/i.test(lower)) {
    return "java";
  }
  if (/\b(c\+\+|cpp)\b/i.test(lower)) {
    return "cpp";
  }
  if (/\b(golang|go\s+language)\b/i.test(lower)) {
    return "go";
  }
  return null;
}

type Phase =
  | "loading" // fetching question from backend
  | "ai_speaking" // AI reading the question aloud
  | "listening" // user is speaking
  | "processing" // transcribing + evaluating
  | "feedback" // showing + speaking feedback
  | "round_transition" // showing round transition screen
  | "done"; // all rounds complete

export default function InterviewRoom() {
  const { id } = useParams();
  const router = useRouter();

  const [hasJoined, setHasJoined] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<Question | null>(null);
  const [transcript, setTranscript] = useState("");
  const [chatLog, setChatLog] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [code, setCode] = useState("// Write your solution here\n");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [statusText, setStatusText] = useState("Loading your interview...");

  const currentQuestionRef = useRef<Question | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSpeechIdRef = useRef(0);
  const finalizedRef = useRef(false);
  const fetchAndSpeakRef = useRef<(() => Promise<void>) | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
  const processAnswerRef = useRef<((blob: Blob) => Promise<void>) | null>(null);

  const stopListeningRefForSilence = useRef<(() => void) | null>(null);

  const onRecordingComplete = useCallback((blob: Blob) => {
    void processAnswerRef.current?.(blob);
  }, []);

  const onSilenceDetected = useCallback(() => {
    stopListeningRefForSilence.current?.();
  }, []);

  const onSilenceBroken = useCallback(() => {}, []);

  const { startRecording, stopRecording, forceStop } = useAudioRecorder(
    onRecordingComplete,
    onSilenceDetected,
    onSilenceBroken
  );

  const cancelSpeech = useCallback(() => {
    currentSpeechIdRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Sync ref with current question
  useEffect(() => {
    currentQuestionRef.current = question;
  }, [question]);

  // ── Speak text via Colab TTS ─────────────────────────────────────────────
  const speak = useCallback(async (text: string): Promise<void> => {
    const speechId = ++currentSpeechIdRef.current;
    return new Promise(async (resolve) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const res = await api.post(
          "/api/speech/speak",
          { text },
          { responseType: "blob" },
        );
        
        // Mismatch check: if a newer speech session has started, abort this one
        if (speechId !== currentSpeechIdRef.current) {
          resolve();
          return;
        }

        const url = URL.createObjectURL(res.data);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Autoplay blocked", e);
            resolve();
          });
        }
      } catch {
        // If Colab TTS fails (e.g. server crash), fallback to native browser TTS
        if (speechId === currentSpeechIdRef.current) {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          } else {
            setTimeout(resolve, 2000);
          }
        } else {
          resolve();
        }
      }
    });
  }, []);

  // ── Start the next round ─────────────────────────────────────────────────
  const startNextRound = async () => {
    if (!pendingQuestion) return;
    const q = pendingQuestion;
    setQuestion(q);
    setPendingQuestion(null);
    setPhase("ai_speaking");

    try {
      const intro = `Welcome to your ${q.round.replace(/_/g, " ")} round. Let's begin.`;
      const fullText = `${intro} ${q.question}`;
      setStatusText("AI is speaking...");
      await speak(fullText);

      if (!q.is_coding) {
        await startListeningRef.current?.();
      } else {
        setPhase("feedback");
        setStatusText("Write your solution, then submit");
      }
    } catch {
      setStatusText("Error speaking question. Continuing...");
    }
  };

  // ── Fetch next question then speak it ────────────────────────────────────
  const fetchAndSpeak = useCallback(async () => {
    setPhase("loading");
    setStatusText("Loading next question...");
    setTranscript("");
    setChatLog([]);
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
      const prevQ = currentQuestionRef.current;

      // Detect round transition (skip if first question)
      if (prevQ && q.round_index > prevQ.round_index) {
        setPendingQuestion(q);
        setPhase("round_transition");
        setStatusText(`Round completed. Next up: ${q.round.replace(/_/g, " ")}`);
        return;
      }

      setQuestion(q);
      setPhase("ai_speaking");

      // Build what the AI says
      const intro =
        q.question_number === 1
          ? `Welcome to your ${q.round.replace(/_/g, " ")} round. Let's begin.`
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

    const started = await startRecording();
    if (!started) {
      setStatusText("Microphone access denied. Please type your answer.");
      setPhase("feedback");
    }
  }, [startRecording]);

  const handleWSReply = useCallback(async (action: string, responseOrText: string) => {
    if (action === "transcribed") {
      setTranscript(responseOrText);
      if (responseOrText.trim()) {
        setChatLog(prev => [...prev, {role: "user", text: responseOrText}]);
      }
      setStatusText("Analyzing your response...");
    } else if (action === "reply") {
      setPhase("ai_speaking");
      setStatusText("AI is replying...");
      if (responseOrText) {
        setChatLog(prev => [...prev, {role: "ai", text: responseOrText}]);
      }
      await speak(responseOrText);
      // After AI finishes speaking, resume listening for the same question
      void startListeningRef.current?.();
    } else if (action === "complete") {
      setPhase("processing");
      setStatusText("Answer recorded. Moving to next question...");
      if (responseOrText) {
        setPhase("ai_speaking");
        setChatLog(prev => [...prev, {role: "ai", text: responseOrText}]);
        await speak(responseOrText);
      }
      await fetchAndSpeakRef.current?.();
    }
  }, [speak]);

  const { isConnected, sendAudioChunk } = useRealTimeInterview(id as string, handleWSReply);

  // ── Transcribe + evaluate (Now streams to WebSocket) ───────────────────
  const processAnswer = useCallback(async (blob: Blob) => {
    if (!question) return;
    setPhase("processing");
    setStatusText("Processing your input...");

    // Send audio via WebSocket to the agent
    sendAudioChunk(blob);
  }, [question, sendAudioChunk]);

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

    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    stopListeningRefForSilence.current = stopListening;
  }, [stopListening]);

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

  // ── End interview manually ────────────────────────────────────────────────
  const endInterview = useCallback(async () => {
    cancelSpeech();
    forceStop();
    try {
      await api.post(`/api/interview/${id}/end`);
      setPhase("done");
      setStatusText("Interview complete!");
      await speak(
        "Great job completing the interview. Your report is ready.",
      );
    } catch {
      setPhase("done");
      setStatusText("Interview complete!");
    }
  }, [id, speak, cancelSpeech, forceStop]);

  // ── Listen for Enter key to end the interview ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT"
      ) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        void endInterview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [endInterview]);

  // ── Boot ─────────────────────────────────────────────────────────────────
  // User must click "Join" to start, avoiding Autoplay restrictions
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      forceStop();
    };
  }, [forceStop]);

  // ── Sync language on question load ───────────────────────────────────────
  useEffect(() => {
    if (question && question.is_coding) {
      const detectedLang = detectLanguage(question.question);
      if (detectedLang) {
        setSelectedLanguage(detectedLang);
        const template = LANGUAGES.find((l) => l.key === detectedLang)?.template || "";
        setCode(template);
      } else {
        const currentLang = selectedLanguage || "javascript";
        setSelectedLanguage(currentLang);
        const template = LANGUAGES.find((l) => l.key === currentLang)?.template || "";
        setCode(template);
      }
    }
  }, [question]);

  const handleLanguageChange = (langKey: string) => {
    const defaultTemplate = LANGUAGES.find((l) => l.key === selectedLanguage)?.template || "";
    const cleanCode = code.trim();
    const cleanTemplate = defaultTemplate.trim();

    if (cleanCode && cleanCode !== cleanTemplate) {
      const confirmSwitch = window.confirm(
        "Switching languages will clear your current code. Do you want to proceed?"
      );
      if (!confirmSwitch) return;
    }

    setSelectedLanguage(langKey);
    const newTemplate = LANGUAGES.find((l) => l.key === langKey)?.template || "";
    setCode(newTemplate);
  };

  // ── Interrupt AI and start answering ─────────────────────────────────────
  const interrupt = () => {
    cancelSpeech();
    void startListeningRef.current?.();
  };

  if (!hasJoined) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          padding: 24,
          flexDirection: "column",
          gap: 24
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 500, color: "var(--text-strong)", marginBottom: 8 }}>
            Interview Room
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16, maxWidth: 400 }}>
            Your microphone and speakers will be used during this session.
          </p>
        </div>
        <button
          onClick={() => {
            setHasJoined(true);
            void fetchAndSpeak();
          }}
          style={{
            background: "var(--text-strong)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 8,
            padding: "16px 32px",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            transition: "transform 0.2s ease, opacity 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "none"}
          onMouseDown={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          Join Interview
        </button>
      </main>
    );
  }

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

  if (phase === "round_transition")
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
          background: "var(--bg-soft)",
          padding: 24
        }}
      >
        <div className="surface" style={{ width: "100%", maxWidth: 480, padding: 32, borderRadius: 8, textAlign: "center" }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: "50%", 
            background: "var(--panel-strong)", 
            border: "1px solid var(--line)", 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "var(--text-strong)",
            fontSize: 24,
            marginBottom: 16
          }}>
            🏁
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 650, color: "var(--text-strong)", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", marginBottom: 8 }}>
            Round Completed!
          </h2>
          <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            You have completed the previous round. Take a short breath before entering the next session.
          </p>
          
          <div className="surface-strong" style={{ padding: 16, borderRadius: 6, marginBottom: 24, textAlign: "left", borderLeft: "2px solid #111" }}>
            <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              UPCOMING SESSION
            </span>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", textTransform: "capitalize", marginTop: 4 }}>
              {pendingQuestion?.round.replace(/_/g, " ")} Round
            </h4>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              Topic Focus: {pendingQuestion?.topic || "Technical core"}
            </p>
          </div>

          <button
            onClick={startNextRound}
            className="button-primary"
            style={{ width: "100%", padding: "12px 24px", fontSize: 13, display: "flex", gap: 8, justifyContent: "center" }}
          >
            Start Next Round <ChevronRight size={16} />
          </button>
        </div>
      </main>
    );

  const hudPanel = (
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
      </div>
      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
        {question?.progress || "—"}
      </span>
    </div>
  );

  const avatarPanel = (
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
  );

  const questionPanel = question ? (
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
  ) : null;

  const actionsPanel = (
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
            border: "1px solid var(--line)",
            width: "100%",
            justifyContent: "center"
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
  );

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {hudPanel}
      {avatarPanel}
      {questionPanel}
      {chatLog.length > 0 && (
        <div className="surface" style={{ padding: 16, borderRadius: 8, maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginBottom: 6,
              fontWeight: 700,
              letterSpacing: "0.04em"
            }}
          >
            CONVERSATION
          </div>
          {chatLog.map((log, i) => (
            <div key={i} style={{
              alignSelf: log.role === "user" ? "flex-end" : "flex-start",
              background: log.role === "user" ? "#111" : "var(--bg-soft)",
              color: log.role === "user" ? "#fff" : "var(--text-strong)",
              padding: "8px 12px",
              borderRadius: 8,
              maxWidth: "85%",
              fontSize: 12,
              lineHeight: 1.5,
              border: log.role === "ai" ? "1px solid var(--line)" : "none"
            }}>
              {log.text}
            </div>
          ))}
          {phase === "listening" && (
            <div style={{ alignSelf: "flex-end", fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: -4 }}>
              Listening...
            </div>
          )}
        </div>
      )}
      {actionsPanel}
    </div>
  );

  const largeQuestionPanel = question ? (
    <div
      className="surface"
      style={{
        padding: 24,
        borderLeft: "4px solid #111111",
        borderRadius: 8
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        Question {question.question_number}
      </div>
      <h3 style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-strong)", fontWeight: 550, fontFamily: "'Lora', Georgia, serif", fontStyle: "italic" }}>
        {question.question}
      </h3>
    </div>
  ) : null;

  const transcriptPanel = (
    <div className="surface" style={{ padding: 24, borderRadius: 8, flex: 1, display: "flex", flexDirection: "column", minHeight: 240, maxHeight: 400, overflowY: "auto" }}>
      <div
        style={{
          fontSize: 10,
          color: "var(--muted)",
          marginBottom: 12,
          fontWeight: 700,
          letterSpacing: "0.04em"
        }}
      >
        CONVERSATION
      </div>
      {chatLog.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {chatLog.map((log, idx) => (
            <div key={idx} style={{ 
              alignSelf: log.role === "user" ? "flex-end" : "flex-start",
              background: log.role === "user" ? "#111" : "var(--bg-soft)",
              color: log.role === "user" ? "#fff" : "var(--text-strong)",
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "80%",
              fontSize: 13,
              lineHeight: 1.5,
              border: log.role === "ai" ? "1px solid var(--line)" : "none"
            }}>
              {log.text}
            </div>
          ))}
          {phase === "listening" && (
            <div style={{ alignSelf: "flex-end", fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
              Listening...
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "var(--muted)" }}>
          <Mic size={24} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 12, fontStyle: "italic" }}>
            {phase === "listening" ? "Listening... just speak and pause when you're done." : "Interviewer is speaking..."}
          </span>
        </div>
      )}
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
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: 1120,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button 
              onClick={() => {
                const leave = window.confirm("Exit the studio? Current answer states will be stored.");
                if (leave) router.push("/dashboard");
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer" }}
            >
              <ArrowLeft size={14} /> Exit studio
            </button>

            <button
              onClick={() => {
                const confirmEnd = window.confirm("Are you sure you want to end the interview? Any unanswered questions will receive a score of 0.");
                if (confirmEnd) {
                  void endInterview();
                }
              }}
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                background: "#e11d48",
                color: "white",
                border: "1px solid #e11d48",
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              End Interview
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#111" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-strong)", textTransform: "uppercase" }}>
              Live studio session
            </span>
          </div>
        </div>
      </div>

      {/* Main constrained container matching report page width */}
      <div 
        style={{ 
          width: "100%", 
          maxWidth: 1120, 
          margin: "0 auto", 
          padding: "0 24px", 
          flex: 1, 
          display: "flex", 
          flexDirection: "column" 
        }}
      >

      {question?.is_coding ? (
        /* GRID 2 COLUMNS (Question on Left, Code Editor on Right) */
        <div 
          style={{ 
            flex: 1, 
            display: "grid", 
            gridTemplateColumns: "360px 1fr",
            height: "calc(100vh - 56px)",
            width: "100%"
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
              <div className="ide-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="ide-tabs">
                  <div className="ide-tab">
                    <Terminal size={12} color="#111" />
                    <span>solution.{LANGUAGES.find((l) => l.key === selectedLanguage)?.ext || "js"}</span>
                  </div>
                </div>
                <div>
                  {question && detectLanguage(question.question) ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 10,
                      color: "var(--text-strong)",
                      fontFamily: "monospace",
                      background: "var(--bg-soft)",
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "1px solid var(--line)"
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e11d48" }} />
                      <span>{LANGUAGES.find((l) => l.key === selectedLanguage)?.label} (Required)</span>
                    </div>
                  ) : (
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        background: "var(--bg)",
                        color: "var(--text-strong)",
                        border: "1px solid var(--line)",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.key} value={lang.key}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  )}
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
        /* GRID 2 COLUMNS (Interviewer on Left, Question & Voice Response on Right) */
        <div 
          style={{ 
            flex: 1, 
            display: "grid", 
            gridTemplateColumns: "360px 1fr",
            height: "calc(100vh - 56px)",
            width: "100%"
          }}
          className="studio-split"
        >
          {/* Left panel - interviewer info & controls */}
          <div 
            style={{ 
              background: "var(--bg)", 
              borderRight: "1px solid var(--line)",
              padding: 20,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              height: "100%"
            }}
          >
            {hudPanel}
            {avatarPanel}
            {actionsPanel}
          </div>

          {/* Right panel - Question and live transcript */}
          <div 
            style={{ 
              padding: 20, 
              overflowY: "auto", 
              background: "var(--bg-soft)", 
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {largeQuestionPanel}
            {transcriptPanel}
          </div>
        </div>
      )}
      </div>

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
