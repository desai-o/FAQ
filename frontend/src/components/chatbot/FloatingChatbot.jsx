// Floating AI chatbot - a polished SaaS-style assistant that lives on every page.
// Maintains session, handles typing animation, loading, errors, reconnects.

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL, APP_NAME } from "../../config";

const STORAGE_KEY = "crowdfaq_chat_history";
const SESSION_KEY = "crowdfaq_chat_session";

function generateId() {
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

function getInitialMessages() {
  return [
    {
      id: generateId(),
      role: "assistant",
      text: `Hi! I'm the ${APP_NAME} assistant. Ask me anything about the platform, popular topics, or how to get started.`,
      ts: Date.now(),
    },
  ];
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveHistory(messages) {
  try {
    const trimmed = messages.slice(-100); // cap to 100 msgs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

function ensureSession() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    try { localStorage.setItem(SESSION_KEY, sid); } catch { /* ignore */ }
  }
  return sid;
}

const QUICK_PROMPTS = [
  "What is CrowdFAQ?",
  "How do I ask a question?",
  "Show trending topics",
  "How does the Chrome extension work?",
];

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(getInitialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const bodyRef = useRef(null);
  const sessionId = useRef(ensureSession());

  // Restore history
  useEffect(() => {
    const stored = loadHistory();
    if (stored && Array.isArray(stored) && stored.length) {
      setMessages(stored);
    }
  }, []);

  // Persist history
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: generateId(), role: "user", text: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setError(null);
    setIsTyping(true);

    try {
      // Try the backend first; gracefully degrade if unavailable.
      let reply = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, sessionId: sessionId.current }),
          signal: AbortSignal.timeout(12000),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || data.message || data.text;
        }
      } catch { /* network failure - fall through to local reply */ }

      if (!reply) {
        reply = generateLocalReply(trimmed);
      }

      setMessages((m) => [
        ...m,
        { id: generateId(), role: "assistant", text: reply, ts: Date.now() },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          text: "Sorry, I'm having trouble reaching the server right now. Please try again in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleClear() {
    setMessages(getInitialMessages());
  }

  return (
    <>
      <button
        type="button"
        className={`chatbot-fab ${isOpen ? "chatbot-fab-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && <span className="chatbot-fab-dot" aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="CrowdFAQ assistant">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div className="chatbot-title">{APP_NAME} Assistant</div>
                <div className="chatbot-status">
                  <span className="chatbot-status-dot" />
                  Online
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-icon-btn" onClick={handleClear} aria-label="Clear conversation" title="Clear conversation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button className="chatbot-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close chatbot" title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-msg chatbot-msg-${m.role}`}>
                <div className="chatbot-bubble">{m.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-msg chatbot-msg-assistant">
                <div className="chatbot-bubble chatbot-typing">
                  <span /> <span /> <span />
                </div>
              </div>
            )}
            {error && (
              <div className="chatbot-error">
                {error}
                <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="chatbot-quick">
              {QUICK_PROMPTS.map((q) => (
                <button key={q} className="chatbot-quick-btn" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              aria-label="Type your message"
            />
            <button type="submit" className="chatbot-send" disabled={!input.trim() || isTyping} aria-label="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function generateLocalReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! How can I help you explore CrowdFAQ today?";
  }
  if (lower.includes("extension") || lower.includes("chrome") || lower.includes("firefox")) {
    return "Our browser extensions let you ask questions and surface answers without leaving the page you're on. Scroll down to the extensions section on the homepage to grab the Chrome and Firefox builds.";
  }
  if (lower.includes("ask") && lower.includes("question")) {
    return "To ask a question, head to the Questions page and click 'Ask a question' in the top right. Add a clear title, a detailed description, and choose a category.";
  }
  if (lower.includes("trending") || lower.includes("popular")) {
    return "Trending questions show up at the top of the Questions page. They're ranked by recent upvotes, answers, and engagement.";
  }
  if (lower.includes("contributor") || lower.includes("leaderboard")) {
    return "Top contributors are featured on the Contributors page. The more you answer, the higher your reputation climbs.";
  }
  if (lower.includes("bookmark")) {
    return "You can bookmark any question from its detail page. Your bookmarks live at /bookmarks for quick access.";
  }
  if (lower.includes("login") || lower.includes("sign in") || lower.includes("signup")) {
    return "Click 'Sign in' at the top right of the homepage. You can sign in with email or with Google in one click.";
  }
  if (lower.includes("profile")) {
    return "Once you're signed in, click your avatar in the top right to access your profile, edit your details, and manage your account.";
  }
  return "Great question! I'll keep learning to serve you better. In the meantime, browse the Questions page or check the trending topics for inspiration.";
}
