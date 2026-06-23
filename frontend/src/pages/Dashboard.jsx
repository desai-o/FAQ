import { useState } from "react";
import TrendingQuestions from "../components/TrendingQuestions";
import StatsGrid from "../components/StatsGrid";
import CommunityHeatmap from "../components/CommunityHeatmap";
import ActivityGraph from "../components/ActivityGraph";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import LogoutModal from "../components/LogoutModal";
import { useFAQ } from "../context/FAQContext";

function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { categories } = useFAQ();

  return (
    <>
      <Sidebar onLogout={() => setShowLogout(true)} />

      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} onLogout={() => setShowLogout(true)} />

        <main className="content">
          <section className="hero">
            <h1>
              Crowd-Sourced
              <br />
              <span className="hero-accent">Knowledge Hub</span>
            </h1>
            <p>Ask questions, discover answers, and learn from your community.</p>
          </section>

          <StatsGrid />

          <ActivityGraph />

          <CommunityHeatmap />

          <div className="dashboard-grid">
            <div className="dashboard-main">
              <TrendingQuestions />
            </div>

            <div className="right-sidebar">
              <div className="cta-card">
                <h3>Have a Question?</h3>
                <p>Don't hesitate to ask! Our community of experts is ready to help you find the answers you need.</p>
                <button className="cta-ask-btn" onClick={() => setShowModal(true)}>+ Ask a Question</button>
              </div>

              <div className="categories-widget">
                <h4 className="widget-title">Categories</h4>
                <ul className="cat-list">
                  {categories.map((cat) => (
                    <li key={cat.name}>
                      <span className={`cat-dot ${cat.color}`}></span>
                      {cat.name}
                      <span className="cat-count">{cat.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="dashboard-footer-premium">
        <div className="dashboard-footer-premium-grid">
          <div className="dashboard-footer-premium-col brand">
            <div className="dashboard-footer-premium-logo">
              <div className="sidebar-logo-badge" style={{ width: "20px", height: "20px", fontSize: "11px", borderRadius: "4px" }}>Q</div>
              <span>CrowdFAQ</span>
            </div>
            <p className="dashboard-footer-premium-desc">
              CrowdFAQ brings communities together to co-create knowledge, solve questions instantly with AI, and scale support through human collaboration — all in one platform.
            </p>
          </div>
          <div className="dashboard-footer-premium-col">
            <h4>Navigate</h4>
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/questions">Questions</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/contributors">Contributors</a></li>
            </ul>
          </div>
          <div className="dashboard-footer-premium-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="/help">Help Center</a></li>
              <li><a href="/bookmarks">Bookmarks</a></li>
              <li><a href="/subscription">Subscription</a></li>
            </ul>
          </div>
          <div className="dashboard-footer-premium-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@crowdfaq.com">hello@crowdfaq.com</a></li>
              <li><a href="https://github.com/desai-o/FAQ" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="dashboard-footer-premium-bottom">
          &copy; {new Date().getFullYear()} CrowdFAQ. All rights reserved.
        </div>
      </footer>

      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

export default Dashboard;