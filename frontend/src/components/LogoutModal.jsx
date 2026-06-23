import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LogoutModal({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  const handleLogout = () => {
    logout();
    const keys = ["crowdfaq-token", "crowdfaq-user", "crowdfaq-session"];
    keys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    onClose();
    navigate("/login");
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
        <div className="modal-header" style={{ justifyContent: "center", borderBottom: "none", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px" }}>Confirm Logout</h2>
        </div>
        <div className="modal-body" style={{ alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "rgba(239,68,68,0.1)", color: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
            Are you sure you want to logout? You will need to sign in again to access your account.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center", gap: "12px" }}>
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
