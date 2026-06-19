import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage } from "../api/faqApi";
import "./ChatWidget.css";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: "Hello! I am your CrowdFAQ AI Assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue("");
    
    // Add user message
    const userMessage = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Build history for the API
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await sendChatMessage(userText, chatHistory);
      
      setMessages((prev) => [
        ...prev,
        { role: "model", text: res.data.response, citations: res.data.citations }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Sorry, I encountered an error: ${err.message}. Please try again.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseResponseWithCitations = (text, citations = []) => {
    // Regular expression to match [FAQ ID: <some_id>]
    const regex = /\[FAQ ID:\s*([a-zA-Z0-9_-]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Push text before the match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      
      const faqId = match[1];
      parts.push(
        <Link key={matchIndex} to={`/questions/${faqId}`} className="chat-citation-link" onClick={() => setIsOpen(false)}>
          [Source FAQ]
        </Link>
      );
      
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="chat-widget-container">
      {/* Floating Chat Button */}
      <button 
        className={`chat-widget-bubble ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with AI Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-title">
              <span className="chat-pulse-dot"></span>
              <h4>AI FAQ Assistant</h4>
            </div>
            <span className="chat-header-subtitle">RAG-powered support</span>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-msg-bubble ${msg.role}`}>
                <div className="chat-msg-text">
                  {msg.role === "model" ? parseResponseWithCitations(msg.text, msg.citations) : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg-bubble model loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User inputs */}
          <div className="chat-footer">
            {!user ? (
              <div className="chat-auth-prompt">
                <span>Please <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link> to chat with AI.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" disabled={!inputValue.trim() || loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
