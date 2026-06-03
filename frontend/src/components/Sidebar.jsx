import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">□</div>
        <span className="logo-text">CrowdFAQ</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-item">
          🏠 Dashboard
        </NavLink>

        <NavLink to="/questions" className="nav-item">
          💬 Questions
        </NavLink>

        <NavLink to="/categories" className="nav-item">
          ☃ Categories
        </NavLink>

        <NavLink to="/contributors" className="nav-item">
          👤 Contributors
        </NavLink>

        <NavLink to="/bookmarks" className="nav-item">
          🔖 Bookmarks
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;