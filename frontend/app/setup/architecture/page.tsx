"use client";

export default function SystemArchitecture() {

  return (
    <div className="surface-strong" style={{ padding: "16px 20px", borderRadius: 8 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
        Data Flow & Communication
      </h3>
      <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4, marginBottom: 12 }}>
        How requests are routed between your frontend client, local backend database, cache, vector search database (ChromaDB), and various AI or scraping services.
      </p>
      <div style={{ display: "flex", justifyContent: "center", background: "white", border: "1px solid var(--line)", borderRadius: 6, padding: 16 }}>
        <svg width="100%" height="380" viewBox="0 0 600 380" style={{ maxWidth: "100%", height: "auto" }}>
          <defs>
            {/* Soft Drop Shadow */}
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>

            {/* Gradients for UI/Backend/DBs/External */}
            <linearGradient id="ui-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>

            <linearGradient id="backend-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>

            <linearGradient id="db-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>

            <linearGradient id="ext-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Arrow head */}
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#737373" />
            </marker>
          </defs>

          {/* Connectors (Lines) */}
          {/* Next.js -> FastAPI */}
          <line x1="300" y1="65" x2="300" y2="105" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="306" y="85" fontFamily="system-ui, sans-serif" fontSize="8" fill="#737373" fontWeight="600">REST / HTTP</text>

          {/* FastAPI -> SQLite */}
          <line x1="210" y1="120" x2="150" y2="120" stroke="#a3a3a3" strokeWidth="1.2" strokeDasharray="3,3" markerEnd="url(#arrow)" />
          
          {/* FastAPI -> Redis */}
          <path d="M 210 135 H 180 V 192 H 150" fill="none" stroke="#a3a3a3" strokeWidth="1.2" strokeDasharray="3,3" markerEnd="url(#arrow)" />

          {/* FastAPI -> ChromaDB */}
          <line x1="390" y1="128" x2="450" y2="128" stroke="#a3a3a3" strokeWidth="1.2" strokeDasharray="3,3" markerEnd="url(#arrow)" />

          {/* FastAPI -> Colab GPU */}
          <path d="M 240 155 L 140 270" fill="none" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="145" y="210" fontFamily="system-ui, sans-serif" fontSize="7" fill="#737373" transform="rotate(-48 145 210)">Tunnel Proxy</text>

          {/* FastAPI -> Groq API */}
          <line x1="300" y1="155" x2="300" y2="270" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="306" y="215" fontFamily="system-ui, sans-serif" fontSize="7" fill="#737373">HTTPS API</text>

          {/* FastAPI -> DuckDuckGo */}
          <path d="M 360 155 L 460 270" fill="none" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="415" y="210" fontFamily="system-ui, sans-serif" fontSize="7" fill="#737373" transform="rotate(48 415 210)">Search Query</text>


          {/* Components (Boxes) */}

          {/* Next.js Frontend Box */}
          <rect x="220" y="20" width="160" height="45" rx="6" fill="url(#ui-grad)" filter="url(#shadow)" />
          <text x="300" y="38" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">Next.js UI Frontend</text>
          <text x="300" y="50" fontFamily="monospace" fontSize="8" fill="#cbd5e1" textAnchor="middle">localhost:3000</text>

          {/* FastAPI Server Box */}
          <rect x="210" y="105" width="180" height="50" rx="6" fill="url(#backend-grad)" filter="url(#shadow)" />
          <text x="300" y="124" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">FastAPI Server Backend</text>
          <text x="300" y="136" fontFamily="monospace" fontSize="8" fill="#ccfbf1" textAnchor="middle">localhost:8000 (Uvicorn)</text>
          <text x="300" y="146" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#a5f3fc" textAnchor="middle">Main Gateway & Agent Logic</text>

          {/* SQLite DB Box */}
          <rect x="30" y="98" width="120" height="45" rx="6" fill="url(#db-grad)" filter="url(#shadow)" />
          <text x="90" y="117" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">SQLite Database</text>
          <text x="90" y="129" fontFamily="monospace" fontSize="8" fill="#e0e7ff" textAnchor="middle">interviewa.db</text>
          <text x="90" y="138" fontFamily="system-ui, sans-serif" fontSize="7" fill="#c7d2fe" textAnchor="middle">Sessions & Round Records</text>

          {/* Redis Cache Box */}
          <rect x="30" y="165" width="120" height="45" rx="6" fill="url(#db-grad)" filter="url(#shadow)" />
          <text x="90" y="184" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">Redis Cache</text>
          <text x="90" y="196" fontFamily="monospace" fontSize="8" fill="#e0e7ff" textAnchor="middle">Cache Store</text>
          <text x="90" y="205" fontFamily="system-ui, sans-serif" fontSize="7" fill="#c7d2fe" textAnchor="middle">Temporary Session Data</text>

          {/* ChromaDB Box */}
          <rect x="450" y="105" width="120" height="45" rx="6" fill="url(#db-grad)" filter="url(#shadow)" />
          <text x="510" y="124" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">Chroma Vector DB</text>
          <text x="510" y="136" fontFamily="monospace" fontSize="8" fill="#e0e7ff" textAnchor="middle">localhost:8001</text>
          <text x="510" y="145" fontFamily="system-ui, sans-serif" fontSize="7" fill="#c7d2fe" textAnchor="middle">Resume Context RAG</text>

          {/* Google Colab Runtime Box */}
          <rect x="30" y="270" width="160" height="50" rx="6" fill="url(#ext-grad)" filter="url(#shadow)" />
          <text x="110" y="289" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">Google Colab Runtime</text>
          <text x="110" y="301" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#fef3c7" textAnchor="middle">Whisper Speech + LLM (GPU)</text>
          <text x="110" y="311" fontFamily="system-ui, sans-serif" fontSize="7" fill="#fde68a" textAnchor="middle">Primary Audio/Generate</text>

          {/* Groq Cloud API Box */}
          <rect x="220" y="270" width="160" height="50" rx="6" fill="url(#ext-grad)" filter="url(#shadow)" />
          <text x="300" y="289" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">Groq Cloud API</text>
          <text x="300" y="301" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#fef3c7" textAnchor="middle">High-speed Inference (Llama-3)</text>
          <text x="300" y="311" fontFamily="system-ui, sans-serif" fontSize="7" fill="#fde68a" textAnchor="middle">Evaluation & Fallback LLM</text>

          {/* DuckDuckGo Web Search Box */}
          <rect x="410" y="270" width="160" height="50" rx="6" fill="url(#ext-grad)" filter="url(#shadow)" />
          <text x="490" y="289" fontFamily="system-ui, sans-serif" fontSize="9.5" fontWeight="bold" fill="white" textAnchor="middle">DuckDuckGo Web</text>
          <text x="490" y="301" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#fef3c7" textAnchor="middle">Web Search API / Scraper</text>
          <text x="490" y="311" fontFamily="system-ui, sans-serif" fontSize="7" fill="#fde68a" textAnchor="middle">Dynamic Interview Loops</text>

        </svg>
      </div>
    </div>
  );
}
