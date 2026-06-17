import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";

function HelpCenter() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const docSections = {
    general: {
      title: "Getting Started & Core Portal",
      items: [
        {
          q: "Account Creation & Registration",
          a: "To create an account, go to the Sign Up page. Fill in your name, email address, and a secure password (minimum 6 characters). After clicking 'Get Started Free', you will be logged in automatically and redirected to the main dashboard."
        },
        {
          q: "Login Process",
          a: "If you already have an account, navigate to the Sign In page. Provide your registered email address and password. You can also sign in instantly using the 'Continue with Google' button for single-sign-on (SSO) integration."
        },
        {
          q: "Dashboard Usage",
          a: "The dashboard is your central knowledge workspace. It displays community analytics (total questions, answers, reputation points), your activity heatmaps, a line graph of query trends, and lists of trending questions. You can toggle the sidebar width using the hamburger menu in the top header."
        },
        {
          q: "Theme Switching (Light & Dark Mode)",
          a: "You can toggle the application between Light and Dark mode at any time. Simply click the Sun/Moon icon in the top header bar. The landing page and app pages adjust their colors, contrast, and graphics instantly to maximize visibility."
        }
      ]
    },
    features: {
      title: "User Features & Questions",
      items: [
        {
          q: "FAQ Search",
          a: "Use the search bar in the topbar or on the Questions page. Enter keywords related to your topic. The system will search across question titles, descriptions, and hashtags, showing match results in real-time."
        },
        {
          q: "Asking a Question",
          a: "Click the '+ Ask Question' button in the topbar or dashboard widget. Fill in the title, select a category (e.g. Programming, Career, AI), provide details, and add tags. Once submitted, community members and our AI assistant can answer it."
        },
        {
          q: "Profile Management",
          a: "Access your profile page by clicking your avatar dropdown in the top header and choosing 'My Profile'. Here, you can view your personal details, total contributions, answer count, and reputation score."
        },
        {
          q: "Password Reset",
          a: "To change your password, navigate to your Profile page. Under security options, input your current password, type your new desired password, and confirm it to update your authentication credentials."
        }
      ]
    },
    ai: {
      title: "AI Assistant & Documents",
      items: [
        {
          q: "AI Assistant Usage",
          a: "We have an embeddable AI Assistant widget. In the bottom-right corner of the dashboard, you will find a floating AI bubble. Click it to open a conversational drawer where you can ask questions. The AI replies using RAG (Retrieval-Augmented Generation) based on uploaded files."
        },
        {
          q: "Document Upload & Indexing",
          a: "Administrators can upload training files (PDF, DOCX, TXT, MD) in the Admin Portal. Once uploaded, the backend service automatically parses the file text, chunks it, generates vector indexes, and stores it in the database for the AI assistant's context."
        },
        {
          q: "File Upload Process",
          a: "When uploading a training document, you can monitor its status ('pending', 'processed', 'failed') in the admin dashboard table. You can also reprocess documents if there are database syncing updates."
        }
      ]
    },
    troubleshooting: {
      title: "Troubleshooting & Support",
      items: [
        {
          q: "Troubleshooting Guide",
          a: "1. Access Denied: If you are an administrator, ensure you are logging in through the separate /admin/login portal.\n2. Invisible Buttons: Switch your theme using the top toggle to reset the color contrast.\n3. Session Expired: If the dashboard doesn't load notifications, click the header profile icon and sign out, then sign back in."
        },
        {
          q: "Contact Support Information",
          a: "For advanced support, security reviews, or technical inquiries, contact our system administration team at support@crowdfaq.com or open a ticket in the community portal."
        }
      ]
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        <main className="content" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>Help Center</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Detailed documentation, user manuals, and system guides for the CrowdFAQ platform.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "40px", alignItems: "start" }}>
            {/* Help Navigation */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.keys(docSections).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: activeTab === key ? "var(--bg-cta)" : "transparent",
                    color: activeTab === key ? "var(--text-white)" : "var(--text-secondary)",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {docSections[key].title}
                </button>
              ))}
            </div>

            {/* Help Content */}
            <div style={{ background: "var(--bg-white)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "32px", boxShadow: "var(--shadow-card)", flex: 1 }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", fontFamily: "var(--font-heading)" }}>
                {docSections[activeTab].title}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {docSections[activeTab].items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "750", color: "var(--text-primary)" }}>
                      🔹 {item.q}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-line", paddingLeft: "18px" }}>
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default HelpCenter;
