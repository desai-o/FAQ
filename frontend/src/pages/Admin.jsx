import { useEffect, useState } from "react";
import {
  fetchAdminOverview,
  fetchPendingQueries,
  fetchModerationQueue,
  fetchModerationExplanation,
  actOnModeration,
  fetchKnowledgeGaps
} from "../api/faqApi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [pendingQueries, setPendingQueries] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [knowledgeGaps, setKnowledgeGaps] = useState({ failedSearches: [], unansweredQueries: [], staleFAQs: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function loadAdminData() {
    setLoading(true);
    setError("");
    try {
      const overviewResponse = await fetchAdminOverview();
      const pendingResponse = await fetchPendingQueries();
      const modQueueResponse = await fetchModerationQueue();
      const gapsResponse = await fetchKnowledgeGaps();

      setOverview(overviewResponse.data);
      setPendingQueries(pendingResponse.data || []);
      setModerationQueue(modQueueResponse.data || []);
      setKnowledgeGaps(gapsResponse.data || { failedSearches: [], unansweredQueries: [], staleFAQs: [] });
    } catch (err) {
      setError(err.message || "Failed to load admin console data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleModeration = async (id, action) => {
    try {
      await actOnModeration(id, { action, note: `Action taken: ${action}` });
      setModerationQueue((prev) => prev.filter((r) => (r._id || r.id) !== id));
      // Reload stats
      const oResponse = await fetchAdminOverview();
      setOverview(oResponse.data);
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  };

  const handleFetchExplanation = async (id) => {
    try {
      const res = await fetchModerationExplanation(id);
      if (res?.data) {
        setExplanations((prev) => ({
          ...prev,
          [id]: {
            reason: res.data.reason || "No explicit reason stored.",
            confidence: res.data.confidence,
            categories: res.data.categories || []
          }
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load explanation.");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        
        <main className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h1 style={{ margin: 0 }}>Admin Console</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
                Manage governance, analyze content quality, and monitor search insights.
              </p>
            </div>
            <button 
              onClick={loadAdminData} 
              style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Refresh Console
            </button>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", marginBottom: "20px", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Console Sub-Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "16px", marginBottom: "24px" }}>
            {["Overview", "Moderation Queue", "Knowledge Gaps"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  fontSize: "14.5px",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab ? "2.5px solid var(--primary-color, #3b82f6)" : "2.5px solid transparent",
                  color: activeTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tab}
                {tab === "Moderation Queue" && moderationQueue.length > 0 && (
                  <span style={{ marginLeft: "8px", padding: "2px 6px", borderRadius: "10px", backgroundColor: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: "bold" }}>
                    {moderationQueue.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <span className="auth-spinner"></span>
              <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === "Overview" && (
                <div>
                  {overview && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                      <div className="stat-card" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Registered Users</span>
                        <h2 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700 }}>{overview.users}</h2>
                      </div>
                      <div className="stat-card" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>FAQs Published</span>
                        <h2 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700 }}>{overview.faqs}</h2>
                      </div>
                      <div className="stat-card" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Queries</span>
                        <h2 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700 }}>{overview.queries}</h2>
                      </div>
                      <div className="stat-card" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Answers</span>
                        <h2 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700 }}>{overview.answers}</h2>
                      </div>
                    </div>
                  )}

                  <section>
                    <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Pending Queries Review Queue</h2>
                    {pendingQueries.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No pending queries awaiting review.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {pendingQueries.map((query) => (
                          <article key={query._id || query.id} className="question-card" style={{ padding: "16px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                            <h3 style={{ margin: "0 0 8px" }}>{query.question}</h3>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>{query.description}</p>
                            <div style={{ marginTop: "12px", display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                              <span>Category: <strong>{query.category || "General"}</strong></span>
                              <span>•</span>
                              <span>Author: {query.author || "Community Member"}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* Tab 2: Moderation Queue */}
              {activeTab === "Moderation Queue" && (
                <section>
                  <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Flagged Content Queue</h2>
                  {moderationQueue.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      🎉 Moderation queue is clear! All flagged content has been reviewed.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {moderationQueue.map((rec) => {
                        const recId = rec._id || rec.id;
                        const exp = explanations[recId];
                        return (
                          <article key={recId} style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                              <div>
                                <span style={{ padding: "2px 8px", borderRadius: "4px", backgroundColor: rec.status === "escalated" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)", color: rec.status === "escalated" ? "#f59e0b" : "#ef4444", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                                  {rec.status}
                                </span>
                                <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                  Type: <strong>{rec.targetType || rec.contentType}</strong>
                                </span>
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                Flagged on: {new Date(rec.createdAt || rec.created_at).toLocaleString()}
                              </div>
                            </div>

                            <blockquote style={{ margin: "4px 0", padding: "10px 14px", borderLeft: "4px solid var(--border)", backgroundColor: "rgba(0,0,0,0.08)", borderRadius: "0 6px 6px 0", fontStyle: "italic", fontSize: "13.5px" }}>
                              "{rec.contentSnippet || "Snippet unavailable."}"
                            </blockquote>

                            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                              <strong>Trigger reason:</strong> {rec.reason || "Automated heuristics flagging."}
                            </div>

                            {rec.categories && rec.categories.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {rec.categories.map((c) => (
                                  <span key={c} style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* AI Explanation detail block */}
                            {exp ? (
                              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(13, 148, 136, 0.05)", border: "1px solid rgba(13, 148, 136, 0.15)", fontSize: "13px" }}>
                                <strong style={{ color: "#0d9488" }}>🤖 Gemini AI Explanation:</strong>
                                <p style={{ margin: "4px 0 0", color: "var(--text-primary)", lineHeight: "1.4" }}>{exp.reason}</p>
                                <div style={{ marginTop: "6px", fontSize: "11px", color: "#0d9488" }}>
                                  Confidence Score: {Math.round(exp.confidence * 100)}%
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleFetchExplanation(recId)}
                                style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: "12px", borderRadius: "6px", backgroundColor: "transparent", border: "1px dashed #0d9488", color: "#0d9488", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(13,148,136,0.05)"; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                              >
                                ✨ Fetch AI Explanation
                              </button>
                            )}

                            {/* Review Actions */}
                            <div style={{ display: "flex", gap: "10px", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                              <button 
                                onClick={() => handleModeration(recId, "approve")}
                                style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#10b981", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                              >
                                Approve Content
                              </button>
                              <button 
                                onClick={() => handleModeration(recId, "reject")}
                                style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#ef4444", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                              >
                                Reject & Remove
                              </button>
                              <button 
                                onClick={() => handleModeration(recId, "escalate")}
                                style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "var(--surface-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)", fontWeight: 600, cursor: "pointer" }}
                              >
                                Escalate
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* Tab 3: Knowledge Gaps */}
              {activeTab === "Knowledge Gaps" && (
                <div>
                  <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Knowledge Gap Analyzer</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 24px" }}>
                    Identify gaps in the content library based on zero-result user searches, unanswered active questions, and outdated stale records.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                    {/* Failed Searches Column */}
                    <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#ef4444" }}>🔍</span>
                        Failed Search Keywords
                      </h3>
                      {knowledgeGaps.failedSearches.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }}>No zero-result searches logged.</p>
                      ) : (
                        <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {knowledgeGaps.failedSearches.map((item, idx) => (
                            <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.1)", fontSize: "13.5px" }}>
                              <span style={{ fontWeight: 600 }}>"{item.query}"</span>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Searched {item.count} times</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Unanswered Queries Column */}
                    <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#f59e0b" }}>❓</span>
                        Unanswered Questions
                      </h3>
                      {knowledgeGaps.unansweredQueries.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }}>All pending questions have answers!</p>
                      ) : (
                        <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {knowledgeGaps.unansweredQueries.map((item) => (
                            <li key={item._id || item.id} style={{ padding: "8px 10px", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.1)", fontSize: "13px" }}>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{item.question}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                Asked by {item.author || "User"} • {item.category || "General"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Stale Content Column */}
                    <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#3b82f6" }}>⏳</span>
                        Stale FAQs (Needs Update)
                      </h3>
                      {knowledgeGaps.staleFAQs.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }}>No stale FAQ alerts at this time.</p>
                      ) : (
                        <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {knowledgeGaps.staleFAQs.map((item) => (
                            <li key={item._id || item.id} style={{ padding: "8px 10px", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.1)", fontSize: "13px" }}>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{item.question}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                Decay Score: {item.staleScore || item.stale_score || 0} • Category: {item.category || "General"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
