import { useState, useRef, useCallback, useEffect } from "react";

export function useRealTimeInterview(
  interviewId: string,
  onReply: (action: string, responseText: string) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !interviewId) return;

    // 1. Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_INTERVIEWA_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");

    // 2. Resolve credentials from localStorage (similar to api.ts)
    let sessionId = "local";
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      sessionId = localStorage.getItem("interviewa_user_session_id") || localStorage.getItem("user_session_id") || "local";
    }

    const aiServiceUrl = localStorage.getItem("interviewa_ai_service_url") || localStorage.getItem("ai_service_url") || "";
    const groqKey = localStorage.getItem("interviewa_groq_api_key") || localStorage.getItem("groq_api_key") || "";

    // 3. Construct WS URL with query params
    const params = new URLSearchParams();
    params.append("user_id", sessionId);
    if (aiServiceUrl) params.append("ai_service_url", aiServiceUrl);
    if (groqKey) params.append("groq_api_key", groqKey);

    const wsUrl = `${wsBaseUrl}/api/interview/ws/${interviewId}?${params.toString()}`;

    // 4. Connect
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log("Real-time WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action) {
          const payload = data.response || data.text || "";
          onReply(data.action, payload);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("Real-time WebSocket disconnected");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [interviewId, onReply]);

  const sendAudioChunk = useCallback((blob: Blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(blob); // Sent as binary (FastAPI receives as bytes)
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    }
  }, []);

  return {
    isConnected,
    sendAudioChunk,
    sendTextMessage
  };
}
