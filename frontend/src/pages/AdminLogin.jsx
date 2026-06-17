import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // We need to fetch user profile details to check role.
        // Wait, AuthContext sets the user state. Let's inspect the loaded user details.
        const token = localStorage.getItem("crowdfaq-token");
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const profile = await res.json();
          if (profile.user && profile.user.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            setError("Access denied. Admin role required.");
            // Log out invalid session
            localStorage.clear();
            sessionStorage.clear();
          }
        } else {
          setError("Failed to verify user profile.");
        }
      } else {
        setError(result.error || "Invalid login credentials.");
      }
    } catch (err) {
      setError("An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
      background: "#0f172a", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden"
    }}>
      {/* Background glow effects */}
      <div style={{
        position: "absolute", width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)",
        top: "-100px", left: "-100px", zIndex: 0
      }}></div>
      <div style={{
        position: "absolute", width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0) 70%)",
        bottom: "-100px", right: "-100px", zIndex: 0
      }}></div>

      <div style={{
        width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "20px",
        background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        zIndex: 10, textAlign: "center", boxSizing: "border-box"
      }}>
        {/* Branding header */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#ffffff",
            width: "36px", height: "36px", borderRadius: "8px", display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px"
          }}>Q</div>
          <span style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em", fontFamily: "var(--font-heading)" }}>CrowdFAQ Admin</span>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>Portal Sign In</h2>
        <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "28px" }}>Please verify your administrator access credentials.</p>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", padding: "12px", borderRadius: "8px", fontSize: "13px",
            fontWeight: "600", marginBottom: "20px", textAlign: "left"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px", textAlign: "left" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@crowdfaq.com"
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(15,23,42,0.6)", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(15,23,42,0.6)", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "14px", borderRadius: "8px", border: "none",
              background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#ffffff",
              fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)", marginTop: "10px"
            }}
          >
            {isLoading ? "Verifying Credentials..." : "Authenticate Access"}
          </button>
        </form>

        <div style={{ marginTop: "24px", fontSize: "13px", color: "#64748b" }}>
          <a href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>← Return to Homepage</a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
