import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // 1. Resolve User Session ID
      let sessionId = "local";
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        let storedId = localStorage.getItem("user_session_id");
        if (!storedId) {
          storedId = typeof crypto !== "undefined" && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem("user_session_id", storedId);
        }
        sessionId = storedId;
      }
      config.headers["X-User-Session-Id"] = sessionId;

      // 2. Attach dynamic AI service url and Groq API key overrides if present
      const customUrl = localStorage.getItem("ai_service_url");
      const customGroqKey = localStorage.getItem("groq_api_key");

      if (customUrl) {
        config.headers["X-AI-Service-Url"] = customUrl;
      }
      if (customGroqKey) {
        config.headers["X-Groq-API-Key"] = customGroqKey;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;