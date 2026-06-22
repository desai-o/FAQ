import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LogoutModal from "../components/LogoutModal";

const articles = [
  {
    title: "Getting Started",
    desc: "Learn how to create an account, set up your profile, and navigate CrowdFAQ.",
    icon: "Rocket",
    content: "Create an account by clicking Sign Up. Fill in your name, email, and password. Once registered, you can edit your profile, upload an avatar, and start exploring the dashboard. Use the sidebar to navigate between sections.",
  },
  {
    title: "Dashboard Guide",
    desc: "Understand your dashboard, stats, activity graphs, and community heatmap.",
    icon: "LayoutDashboard",
    content: "The dashboard shows key metrics at a glance — total questions, answers, contributors, and weekly activity. The activity graph tracks daily engagement and the community heatmap shows which topics are trending.",
  },
  {
    title: "Authentication",
    desc: "Manage login, password reset, and account security settings.",
    icon: "Shield",
    content: "Use your email and password to sign in. If you forget your password, click 'Forgot Password' on the login page to receive a reset link. You can update your password from the Account Settings section of your profile.",
  },
  {
    title: "FAQ Management",
    desc: "Create, edit, and manage frequently asked questions effectively.",
    icon: "HelpCircle",
    content: "Navigate to Questions to browse all FAQs. Use the Ask Question button to submit a new question. You can edit or delete your own questions, and bookmark useful ones for quick access.",
  },
  {
    title: "User Roles",
    desc: "Learn about admin, moderator, and contributor roles and permissions.",
    icon: "Users",
    content: "CrowdFAQ has three roles: Contributors can ask and answer questions. Moderators can edit, delete, and flag content. Admins have full access — they manage users, categories, and system settings.",
  },
  {
    title: "Notifications",
    desc: "Configure notification preferences and stay updated with community activity.",
    icon: "Bell",
    content: "Click the bell icon in the top bar to view your notifications. You can filter by unread, all, or type. Mark notifications as read by clicking them, or clear all with the 'Mark all read' button.",
  },
  {
    title: "Troubleshooting",
    desc: "Fix common issues like login problems, missing content, or display errors.",
    icon: "Wrench",
    content: "If you encounter login issues, try clearing your browser cache and cookies. For missing content, ensure you are signed in and check your internet connection. If display issues persist, try switching themes or refreshing the page.",
  },
  {
    title: "Contact Support",
    desc: "Reach out to our support team for help with any platform issues.",
    icon: "MessageSquare",
    content: "Our support team is available to help. Click the Contact Support button below to open a ticket. We aim to respond within 24 hours. For urgent issues, mention 'URGENT' in your message subject.",
  },
];

const IconMap = {
  Rocket: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 15v5"/><path d="M15 12h5"/><path d="M19.17 7.66c-.39-.9-1.08-1.59-1.83-1.83"/><path d="M16.5 4.5A6 6 0 0 0 6 10.5c0 3.5 1.5 6.5 4 8.5"/></svg>,
  LayoutDashboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Shield: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  HelpCircle: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Wrench: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  MessageSquare: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

function HelpCenter() {
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Sidebar onLogout={() => setShowLogout(true)} />
      <div className="main-wrapper">
        <Topbar openModal={() => {}} onLogout={() => setShowLogout(true)} />
        <div className="content help-center-content">
          <div className="help-center-header">
            <h1>Help Center</h1>
            <p>Find documentation, guides, and support for CrowdFAQ.</p>
          </div>

          <div className="help-center-search">
            <span className="help-center-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text" placeholder="Search documentation..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="help-center-grid">
            {filtered.map((article, i) => (
              <div key={i} className={`help-card${expanded === i ? " expanded" : ""}`} onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="help-card-icon">{IconMap[article.icon]}</div>
                <h3>{article.title}</h3>
                <p className="help-card-desc">{article.desc}</p>
                {expanded === i && (
                  <div className="help-card-body">
                    <p>{article.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="help-center-empty">
              No results found for "{search}".
            </p>
          )}

          <div className="help-center-cta">
            <h3>Still need help?</h3>
            <p>Our support team is ready to assist you.</p>
            <button className="help-center-contact-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact Support
            </button>
          </div>
        </div>
      </div>
      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

export default HelpCenter;
