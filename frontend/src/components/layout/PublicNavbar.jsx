import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../config";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    function onClick(e) {
      if (!e.target.closest(".nav-user")) setUserOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="public-nav">
      <div className="public-nav-inner">
        <Link to="/" className="public-nav-brand">
          <span className="public-nav-mark">💡</span>
          <span className="public-nav-text">{APP_NAME}</span>
        </Link>

        <nav className={`public-nav-links ${menuOpen ? "open" : ""}`} aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/questions" className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Questions
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Categories
          </NavLink>
          <NavLink to="/contributors" className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Contributors
          </NavLink>
        </nav>

        <div className="public-nav-actions">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="public-nav-icon" aria-label="Profile" title="Profile">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
              <div className="nav-user">
                <button className="public-nav-avatar" onClick={(e) => { e.stopPropagation(); setUserOpen((v) => !v); }} aria-label="Account menu">
                  {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || "U"}
                </button>
                {userOpen && (
                  <div className="nav-user-menu">
                    <div className="nav-user-info">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <Link to="/profile" onClick={() => setUserOpen(false)}>Profile</Link>
                    <Link to="/bookmarks" onClick={() => setUserOpen(false)}>Bookmarks</Link>
                    <button onClick={() => { logout(); setUserOpen(false); navigate("/"); }}>Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="public-nav-link public-nav-text-link">Sign in</Link>
              <Link to="/signup" className="public-nav-cta">Get started</Link>
            </>
          )}
          <button className="public-nav-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}