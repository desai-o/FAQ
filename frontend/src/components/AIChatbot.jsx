import { useState, useRef, useEffect } from "react";

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I am your CrowdFAQ AI Assistant. Ask me anything based on our knowledge documents." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("crowdfaq-token");
  if (!token || window.location.pathname.startsWith("/admin")) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question: userText })
      });

      if (response.ok) {
        const data = await response.json();
        let aiResponse = data.answer;
        if (data.sources && data.sources.length > 0) {
          aiResponse += `\n\n*(Sources: ${data.sources.join(", ")})*`;
        }
        setMessages(prev => [...prev, { role: "ai", text: aiResponse }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Sorry, I encountered an issue retrieving that answer." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Failed to connect to the AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: "30px", right: "30px", width: "60px", height: "60px",
          borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)",
          border: "none", color: "#ffffff", fontSize: "24px", cursor: "pointer", zIndex: 1000,
          boxShadow: "0 10px 25px rgba(99,102,241,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", transition: "transform 0.2s",
          animation: "chatbot-pulse 2s infinite"
        }}
        title="AI Assistant"
        aria-label="Open AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "30px", right: "30px", width: "360px", height: "500px",
      borderRadius: "16px", background: "var(--bg-white)", border: "1px solid var(--border)",
      boxShadow: "var(--shadow-modal)", zIndex: 1000, display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: "var(--font-body)", backdropFilter: "blur(12px)"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", background: "linear-gradient(135deg, #6366f1, #a855f7)",
        color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🤖</span>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>CrowdFAQ Assistant</h4>
            <span style={{ fontSize: "10px", opacity: 0.8 }}>Knowledge Grounded</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: "none", border: "none", color: "#ffffff", fontSize: "20px", cursor: "pointer" }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%", padding: "10px 14px", borderRadius: "12px",
            background: m.role === "user" ? "var(--bg-cta)" : "var(--bg-page)",
            color: m.role === "user" ? "var(--text-white)" : "var(--text-primary)",
            fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap",
            border: m.role === "ai" ? "1px solid var(--border)" : "none"
          }}>
            {m.text}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "12px", background: "var(--bg-page)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "12px" }}>
            AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)",
            background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "13px", outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#ffffff",
            fontWeight: "600", fontSize: "13px", cursor: inputValue.trim() ? "pointer" : "not-allowed"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AIChatbot;
