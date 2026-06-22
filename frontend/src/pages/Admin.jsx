import { useEffect, useState } from "react";
import {
  fetchAdminOverview,
  fetchPendingQueries,
  fetchModerationQueue,
  fetchModerationExplanation,
  actOnModeration,
  fetchKnowledgeGaps,
  previewFaqImport,
  confirmFaqImport,
  downloadFaqExport
} from "../api/faqApi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import LogoutModal from "../components/LogoutModal";

function Admin() {
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [pendingQueries, setPendingQueries] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [knowledgeGaps, setKnowledgeGaps] = useState({ failedSearches: [], unansweredQueries: [], staleFAQs: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportMode, setExportMode] = useState("raw");
  const [importFileName, setImportFileName] = useState("");
  const [importFileContent, setImportFileContent] = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");

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

  const handleExport = async () => {
    setError("");
    try {
      const blob = await downloadFaqExport(exportFormat, exportMode);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `faqs.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed.");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportPreview([]);
    setImportStatus("");
    setImportError("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setImportFileContent(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewImport = async () => {
    if (!importFileName || !importFileContent) {
      setImportError("Please select a PDF, DOCX, or TXT document to preview.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportPreview([]);
    setImportStatus("");

    try {
      const response = await previewFaqImport(importFileName, importFileContent);
      setImportPreview(response.data || []);
      if (!response.data || response.data.length === 0) {
        setImportStatus("No candidate FAQs were generated from this document.");
      }
    } catch (err) {
      setImportError(err.message || "Preview failed.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview.length) {
      setImportError("No preview items available for import confirmation.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportStatus("");

    try {
      const response = await confirmFaqImport(importPreview.map((item) => ({
        question: item.question,
        answer: item.answer,
        category: item.category,
        tags: item.tags
      })));

      setImportStatus(`Imported ${response.data.imported.length} FAQ(s) successfully.`);
      setImportPreview([]);
      setImportFileName("");
      setImportFileContent("");
    } catch (err) {
      setImportError(err.message || "Import confirmation failed.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <>
      <Sidebar onLogout={() => setShowLogout(true)} />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} onLogout={() => setShowLogout(true)} />
        
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
            {["Overview", "Import / Export", "Moderation Queue", "Knowledge Gaps"].map((tab) => (
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

              {/* Tab 2: Import / Export */}
              {activeTab === "Import / Export" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                    <section style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Export FAQs</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
                          Format
                          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="markdown">Markdown</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">DOCX</option>
                          </select>
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
                          Mode
                          <select value={exportMode} onChange={(e) => setExportMode(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <option value="raw">Raw</option>
                            <option value="ai">AI-formatted (PDF/DOCX only)</option>
                          </select>
                        </label>
                        <button onClick={handleExport} style={{ padding: "12px 18px", borderRadius: "8px", backgroundColor: "var(--primary-color, #3b82f6)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                          Download Export
                        </button>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                          AI mode is only available for PDF and DOCX exports. JSON, CSV, and Markdown will always download raw exports.
                        </p>
                      </div>
                    </section>

                    <section style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Import Document Preview</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
                        <button onClick={handlePreviewImport} style={{ padding: "12px 18px", borderRadius: "8px", backgroundColor: "var(--primary-color, #3b82f6)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                          Preview Document Import
                        </button>
                        {importLoading && <p style={{ margin: 0, color: "var(--text-secondary)" }}>Processing preview…</p>}
                        {importStatus && <p style={{ margin: 0, color: "var(--text-secondary)" }}>{importStatus}</p>}
                        {importError && <p style={{ margin: 0, color: "#ef4444" }}>{importError}</p>}
                      </div>
                    </section>
                  </div>

                  {importPreview.length > 0 && (
                    <section style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ margin: 0, fontSize: "18px" }}>Previewed FAQ Candidates</h2>
                        <button onClick={handleConfirmImport} style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#10b981", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                          Confirm Import
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: "14px" }}>
                        {importPreview.map((item) => (
                          <article key={item.id} style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#fff", border: "1px solid var(--border)" }}>
                            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "12px" }}>
                              <strong>{item.question}</strong>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.category || "General"}</span>
                            </div>
                            <p style={{ margin: 0, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{item.answer}</p>
                            {item.tags && item.tags.length > 0 && (
                              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {item.tags.map((tag) => (
                                  <span key={tag} style={{ padding: "4px 8px", borderRadius: "999px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", fontSize: "12px" }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.validationErrors && item.validationErrors.length > 0 && (
                              <div style={{ marginTop: "10px", color: "#b91c1c", fontSize: "13px" }}>
                                <strong>Validation issues:</strong>
                                <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                                  {item.validationErrors.map((err, index) => (
                                    <li key={index}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.duplicateScores && item.duplicateScores.length > 0 && (
                              <div style={{ marginTop: "10px", color: "#6b7280", fontSize: "13px" }}>
                                <strong>Potential duplicates:</strong>
                                <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                                  {item.duplicateScores.slice(0, 3).map((dup) => (
                                    <li key={dup.id}>{dup.question} ({Math.round(dup.similarity * 100)}%)</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
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
      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

export default Admin;
