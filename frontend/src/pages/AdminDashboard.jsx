import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");
  const token = localStorage.getItem("crowdfaq-token");

  // State arrays
  const [users, setUsers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [pendingQueries, setPendingQueries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Search/Filters
  const [userSearch, setUserSearch] = useState("");
  const [faqSearch, setFaqSearch] = useState("");

  // Loading/Errors
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Modals
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUserPw, setResettingUserPw] = useState(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [editingFaq, setEditingFaq] = useState(null);
  const [answeringQuery, setAnsweringQuery] = useState(null);
  const [queryAnswerValue, setQueryAnswerValue] = useState("");

  // Admin profile forms
  const [adminEmail, setAdminEmail] = useState(user?.email || "");
  const [adminPassword, setAdminPassword] = useState("");

  // Document upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch admin API data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch Analytics
      const analRes = await fetch("http://localhost:5000/api/admin/analytics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData);
      }

      // 2. Fetch Users
      const usersRes = await fetch("http://localhost:5000/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data);
      }

      // 3. Fetch FAQs & Queries
      const faqsRes = await fetch("http://localhost:5000/api/admin/faqs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData.faqs);
        setPendingQueries(faqsData.pendingQueries);
      }

      // 4. Fetch Documents
      const docsRes = await fetch("http://localhost:5000/api/admin/documents", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      }
    } catch (err) {
      setErrorMsg("Failed to connect to admin services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Flash helper
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ==========================================
  // HANDLERS: User Management
  // ==========================================
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        })
      });
      if (res.ok) {
        triggerSuccess("User profile updated successfully.");
        setEditingUser(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update user.");
      }
    } catch (err) {
      alert("Failed to edit user.");
    }
  };

  const handleToggleSuspend = async (userId) => {
    if (!confirm("Are you sure you want to change suspension status for this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        triggerSuccess(d.isSuspended ? "User account suspended." : "User account unsuspended.");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to suspend user.");
      }
    } catch (err) {
      alert("Failed to toggle suspension.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerSuccess("User deleted permanently.");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete user.");
      }
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${resettingUserPw.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: resetPwValue })
      });
      if (res.ok) {
        triggerSuccess("User password reset successfully.");
        setResettingUserPw(null);
        setResetPwValue("");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to reset password.");
      }
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  // ==========================================
  // HANDLERS: FAQ & Moderation
  // ==========================================
  const handleEditFaq = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/faqs/${editingFaq._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: editingFaq.question,
          answer: editingFaq.answer,
          keywords: editingFaq.keywords
        })
      });
      if (res.ok) {
        triggerSuccess("FAQ updated successfully.");
        setEditingFaq(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update FAQ.");
      }
    } catch (err) {
      alert("Failed to edit FAQ.");
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/faqs/${faqId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerSuccess("FAQ deleted.");
        fetchData();
      } else {
        alert("Failed to delete FAQ.");
      }
    } catch (err) {
      alert("Failed to delete FAQ.");
    }
  };

  const handleApproveQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/queries/${answeringQuery._id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answer: queryAnswerValue })
      });
      if (res.ok) {
        triggerSuccess("Question approved and answer added to public FAQs.");
        setAnsweringQuery(null);
        setQueryAnswerValue("");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to approve question.");
      }
    } catch (err) {
      alert("Failed to approve query.");
    }
  };

  const handleRejectQuery = async (queryId) => {
    if (!confirm("Are you sure you want to reject this query?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/queries/${queryId}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerSuccess("Question query rejected.");
        fetchData();
      } else {
        alert("Failed to reject question.");
      }
    } catch (err) {
      alert("Failed to reject query.");
    }
  };

  // ==========================================
  // HANDLERS: Document uploads
  // ==========================================
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);

      const res = await fetch("http://localhost:5000/api/admin/documents", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: fd
      });

      if (res.ok) {
        triggerSuccess("Document uploaded and index schedule started.");
        setUploadFile(null);
        // Reset file input element manually
        document.getElementById("doc-file-input").value = "";
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to upload file.");
      }
    } catch (err) {
      alert("Network error during document upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document and remove its indexes from knowledge base?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/documents/${docId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerSuccess("Document removed.");
        fetchData();
      } else {
        alert("Failed to delete document.");
      }
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const handleReprocessDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/documents/${docId}/reprocess`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerSuccess("Reprocessing task scheduled.");
        fetchData();
      } else {
        alert("Failed to trigger reprocess.");
      }
    } catch (err) {
      alert("Failed to reprocess document.");
    }
  };

  // ==========================================
  // HANDLERS: Profile Updates
  // ==========================================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword || undefined
        })
      });
      if (res.ok) {
        triggerSuccess("Admin security details updated.");
        setAdminPassword("");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update profile.");
      }
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  // Filters
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "var(--font-body)" }}>
      
      {/* ── ADMIN SIDEBAR ── */}
      <aside style={{ width: "260px", background: "#0f172a", color: "#ffffff", padding: "24px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#ffffff",
            width: "30px", height: "30px", borderRadius: "6px", display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px"
          }}>Q</div>
          <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.01em", fontFamily: "var(--font-heading)" }}>Admin Center</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "analytics", label: "Analytics & Reports", icon: "📊" },
            { id: "users", label: "User Management", icon: "👥" },
            { id: "faqs", label: "FAQ Moderation", icon: "📋" },
            { id: "docs", label: "Document Training", icon: "🤖" },
            { id: "profile", label: "Admin Profile", icon: "⚙️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                borderRadius: "8px", border: "none",
                background: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                fontWeight: "600", fontSize: "14px", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
            borderRadius: "8px", border: "none", background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171", fontWeight: "600", fontSize: "14px", cursor: "pointer",
            textAlign: "left", transition: "all 0.2s"
          }}
        >
          <span>🚪</span>
          Sign Out
        </button>
      </aside>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Top Header */}
        <header style={{
          height: "68px", background: "#ffffff", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", fontFamily: "var(--font-heading)" }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Admin Profile:</span>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", background: "#6366f1",
              color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "700", fontSize: "14px"
            }}>A</div>
          </div>
        </header>

        {/* Dash Workspace */}
        <main style={{ flex: 1, padding: "40px", overflowY: "auto", boxSizing: "border-box" }}>
          
          {/* Flash message banners */}
          {successMsg && (
            <div style={{
              background: "#d1fae5", border: "1px solid #10b981", color: "#065f46",
              padding: "16px 24px", borderRadius: "12px", fontSize: "14px",
              fontWeight: "600", marginBottom: "30px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
            }}>
              ✅ {successMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
              <h3>Loading panel metrics...</h3>
            </div>
          ) : (
            <>
              {/* ==========================================
                  TAB PANEL: Analytics
                  ========================================== */}
              {activeTab === "analytics" && analytics && (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  {/* Summary Metric Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
                    {[
                      { val: analytics.stats.totalUsers, label: "Total Registered Users", color: "#6366f1", icon: "👥" },
                      { val: analytics.stats.activeUsers, label: "Active Users (Unsuspended)", color: "#10b981", icon: "🟢" },
                      { val: analytics.stats.faqsCount, label: "Public FAQ Threads", color: "#f59e0b", icon: "📋" },
                      { val: analytics.stats.queriesCount, label: "Total AI/User Queries", color: "#ec4899", icon: "💬" },
                      { val: analytics.stats.documentsCount, label: "RAG Docs Indexed", color: "#8b5cf6", icon: "🤖" }
                    ].map((stat, idx) => (
                      <div key={idx} style={{
                        background: "#ffffff", padding: "24px", borderRadius: "16px",
                        border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                        display: "flex", alignItems: "center", gap: "20px"
                      }}>
                        <span style={{ fontSize: "32px" }}>{stat.icon}</span>
                        <div>
                          <h4 style={{ fontSize: "28px", fontWeight: "800", color: stat.color, margin: 0 }}>{stat.val}</h4>
                          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: "600" }}>{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Graph visualization */}
                  <div style={{
                    background: "#ffffff", padding: "32px", borderRadius: "16px",
                    border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
                  }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "20px", fontFamily: "var(--font-heading)" }}>AI Query & Resolve Volumes (Weekly)</h3>
                    <div style={{ height: "320px", position: "relative" }}>
                      <Line
                        data={{
                          labels: analytics.timelineData.map(d => d.date),
                          datasets: [
                            {
                              label: "AI Queries Submitted",
                              data: analytics.timelineData.map(d => d.queries),
                              borderColor: "#6366f1",
                              backgroundColor: "rgba(99,102,241,0.1)",
                              tension: 0.3
                            },
                            {
                              label: "Resolved FAQs",
                              data: analytics.timelineData.map(d => d.resolved),
                              borderColor: "#10b981",
                              backgroundColor: "rgba(16,185,129,0.1)",
                              tension: 0.3
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: "bottom" } }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB PANEL: Users
                  ========================================== */}
              {activeTab === "users" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        width: "320px", padding: "10px 16px", borderRadius: "8px",
                        border: "1px solid #cbd5e1", outline: "none", fontSize: "14px"
                      }}
                    />
                  </div>

                  {/* Users Table */}
                  <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "16px 24px" }}>Name</th>
                          <th style={{ padding: "16px 24px" }}>Email</th>
                          <th style={{ padding: "16px 24px" }}>Role</th>
                          <th style={{ padding: "16px 24px" }}>Status</th>
                          <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 24px", fontWeight: "600" }}>{u.name}</td>
                            <td style={{ padding: "16px 24px", color: "#64748b" }}>{u.email}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{
                                padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                                background: u.role === "admin" ? "#e0e7ff" : "#f1f5f9",
                                color: u.role === "admin" ? "#4f46e5" : "#475569"
                              }}>{u.role.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                fontSize: "13px", fontWeight: "600",
                                color: u.isSuspended ? "#ef4444" : "#10b981"
                              }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: u.isSuspended ? "#ef4444" : "#10b981" }}></span>
                                {u.isSuspended ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button onClick={() => setEditingUser(u)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Edit">✏️</button>
                                <button onClick={() => setResettingUserPw(u)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Reset Password">🔑</button>
                                <button onClick={() => handleToggleSuspend(u.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Toggle Suspension">🛡️</button>
                                <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB PANEL: FAQ Moderation
                  ========================================== */}
              {activeTab === "faqs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  
                  {/* Pending queries container */}
                  {pendingQueries.length > 0 && (
                    <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "16px", padding: "28px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#b45309", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        ⚠️ Pending Community Questions ({pendingQueries.length})
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {pendingQueries.map((q) => (
                          <div key={q._id} style={{
                            background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.15)",
                            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "30px"
                          }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{q.question}</h4>
                              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Submitted at: {new Date(q.createdAt).toLocaleString()}</p>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                onClick={() => { setAnsweringQuery(q); setQueryAnswerValue(q.answer || ""); }}
                                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#f59e0b", color: "#ffffff", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}
                              >
                                Answer & Approve
                              </button>
                              <button
                                onClick={() => handleRejectQuery(q._id)}
                                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "transparent", color: "#64748b", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Public FAQ List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Search published FAQs..."
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        style={{
                          width: "320px", padding: "10px 16px", borderRadius: "8px",
                          border: "1px solid #cbd5e1", outline: "none", fontSize: "14px"
                        }}
                      />
                    </div>

                    <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "16px 24px", width: "40%" }}>Question</th>
                            <th style={{ padding: "16px 24px", width: "45%" }}>Answer</th>
                            <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFaqs.map((f) => (
                            <tr key={f._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "16px 24px", fontWeight: "600", lineHeight: 1.4 }}>{f.question}</td>
                              <td style={{ padding: "16px 24px", color: "#64748b", lineHeight: 1.4 }}>
                                {f.answer.length > 150 ? f.answer.substring(0, 150) + "..." : f.answer}
                              </td>
                              <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                  <button onClick={() => setEditingFaq(f)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Edit">✏️</button>
                                  <button onClick={() => handleDeleteFaq(f._id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Delete">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB PANEL: Document Training (RAG)
                  ========================================== */}
              {activeTab === "docs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  
                  {/* File Upload Zone */}
                  <div style={{
                    background: "#ffffff", padding: "32px", borderRadius: "16px",
                    border: "2px dashed #cbd5e1", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "16px", textAlign: "center"
                  }}>
                    <span style={{ fontSize: "40px" }}>📂</span>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700" }}>Upload Knowledge Base Documents</h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Upload training materials. Supports PDF, DOCX, TXT, and Markdown (.md).</p>
                    </div>

                    <form onSubmit={handleUploadDocument} style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
                      <input
                        id="doc-file-input"
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        style={{ fontSize: "13px" }}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isUploading || !uploadFile}
                        style={{
                          padding: "10px 20px", borderRadius: "8px", border: "none",
                          background: "#6366f1", color: "#ffffff", fontWeight: "600",
                          fontSize: "13px", cursor: uploadFile ? "pointer" : "not-allowed",
                          transition: "all 0.2s"
                        }}
                      >
                        {isUploading ? "Uploading & Chunking..." : "Upload File"}
                      </button>
                    </form>
                  </div>

                  {/* Documents List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "750", margin: 0 }}>Active Knowledge Sources</h3>
                    <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "16px 24px" }}>Filename</th>
                            <th style={{ padding: "16px 24px" }}>Type</th>
                            <th style={{ padding: "16px 24px" }}>Chunks</th>
                            <th style={{ padding: "16px 24px" }}>Status</th>
                            <th style={{ padding: "16px 24px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No knowledge documents uploaded yet.</td>
                            </tr>
                          ) : (
                            documents.map((doc) => (
                              <tr key={doc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 24px", fontWeight: "600" }}>{doc.filename}</td>
                                <td style={{ padding: "16px 24px", textTransform: "uppercase", fontSize: "12px", fontWeight: "600" }}>{doc.filetype}</td>
                                <td style={{ padding: "16px 24px" }}>{doc.chunkCount}</td>
                                <td style={{ padding: "16px 24px" }}>
                                  <span style={{
                                    padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                                    background: doc.status === "processed" ? "#d1fae5" : doc.status === "failed" ? "#fee2e2" : "#fef3c7",
                                    color: doc.status === "processed" ? "#065f46" : doc.status === "failed" ? "#991b1b" : "#92400e"
                                  }}>{doc.status.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                    <button onClick={() => handleReprocessDocument(doc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Reprocess Document">🔄</button>
                                    <a
                                      href={`http://localhost:5000/api/admin/documents/${doc.id}/download`}
                                      download
                                      style={{ textDecoration: "none", fontSize: "14px" }}
                                      title="Download"
                                    >
                                      📥
                                    </a>
                                    <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }} title="Delete">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB PANEL: Profile
                  ========================================== */}
              {activeTab === "profile" && (
                <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", maxWidth: "550px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "20px", fontFamily: "var(--font-heading)" }}>Admin Profile Configuration</h3>
                  
                  <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Admin Email Address</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        style={{
                          width: "100%", padding: "11px 16px", borderRadius: "8px",
                          border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box"
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Change Admin Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Type new secure password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        style={{
                          width: "100%", padding: "11px 16px", borderRadius: "8px",
                          border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: "12px 24px", borderRadius: "8px", border: "none",
                        background: "#6366f1", color: "#ffffff", fontWeight: "600",
                        fontSize: "14px", cursor: "pointer", transition: "all 0.2s", alignSelf: "flex-start"
                      }}
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==========================================
          MODALS / DIALOGS
          ========================================== */}

      {/* Modal: Edit User Details */}
      {editingUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", width: "400px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "20px" }}>Edit User Details</h3>
            <form onSubmit={handleEditUser} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Authorization Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#6366f1", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset User Password */}
      {resettingUserPw && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", width: "400px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "8px" }}>Reset User Password</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Setting password for user: <strong>{resettingUserPw.name}</strong></p>
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>New Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={resetPwValue}
                  onChange={(e) => setResetPwValue(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => { setResettingUserPw(null); setResetPwValue(""); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit FAQ */}
      {editingFaq && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", width: "500px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "20px" }}>Edit Published FAQ</h3>
            <form onSubmit={handleEditFaq} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Question Title</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Answer</label>
                <textarea
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  style={{ width: "100%", height: "120px", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setEditingFaq(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#6366f1", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Answer and Approve Query */}
      {answeringQuery && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", width: "500px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "8px" }}>Approve & Answer Question</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Question: <em>"{answeringQuery.question}"</em></p>
            <form onSubmit={handleApproveQuery} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Provide Official Answer</label>
                <textarea
                  placeholder="Provide detailed, verified answer..."
                  value={queryAnswerValue}
                  onChange={(e) => setQueryAnswerValue(e.target.value)}
                  style={{ width: "100%", height: "120px", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => { setAnsweringQuery(null); setQueryAnswerValue(""); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#10b981", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>Publish FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
