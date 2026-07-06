import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileTabs from "../components/profile/ProfileTabs";
import RecentContent from "../components/profile/RecentContent";
import TopFAQ from "../components/profile/TopFAQ";
import ProfileBadges from "../components/profile/ProfileBadges";
import Analytics from "../components/profile/Analytics";
import RecentActivity from "../components/profile/RecentActivity";
import QuickLinks from "../components/profile/QuickLinks";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import AnalyticsTab from "../components/profile/AnalyticsTab";
import AnswersTab from "../components/profile/AnswersTab";
import NotificationPreferences from "../components/profile/NotificationPreferences";

// Storage key for persisting the selected tab across page refreshes.
// Kept local to Profile so it can't collide with anything else.
const PROFILE_TAB_STORAGE_KEY = "profileActiveTab";

function Profile() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Restore the user's tab from sessionStorage first so that a hard
    // refresh keeps them where they were. Falls back to navigation
    // state (used by Links that open Profile on a specific tab) and
    // finally to the default "Overview" tab.
    try {
      const stored = sessionStorage.getItem(PROFILE_TAB_STORAGE_KEY);
      if (stored) return stored;
    } catch (_) {
      // sessionStorage may be unavailable (private mode, SSR, etc.) —
      // fall through to the navigation/default logic.
    }
    return location.state?.activeTab || "Overview";
  });

    useEffect(() => {
  if (location.state?.activeTab) {
    setActiveTab(location.state.activeTab);
  }
}, [location.state]);

  // Mirror the current tab into sessionStorage on every change so that
  // a refresh always rehydrates from the same key on mount. Writes are
  // wrapped in try/catch because sessionStorage can throw (e.g. storage
  // quota, disabled cookies in some sandboxed contexts).
  useEffect(() => {
    try {
      sessionStorage.setItem(PROFILE_TAB_STORAGE_KEY, activeTab);
    } catch (_) {
      // best-effort; refreshing will just fall back to Overview
    }
  }, [activeTab]);

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="main-wrapper">
          <Topbar />
          <main className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <span className="auth-spinner"></span>
          </main>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Sidebar />
        <div className="main-wrapper">
          <Topbar />
          <main className="content">
            <div className="auth-card" style={{ margin: "100px auto", textAlign: "center" }}>
              <div className="auth-header">
                <div className="auth-logo">
                  <div className="auth-logo-icon">Q</div>
                  <span>CrowdFAQ</span>
                </div>
                <h3>Authentication Required</h3>
                <p className="auth-subtitle" style={{ margin: "10px 0 0" }}>
                  Please sign in or register to view your profile and contributions.
                </p>
              </div>
              <Link to="/login" className="auth-submit-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                Sign In
              </Link>
              <div className="auth-switch">
                Don't have an account? 
                <Link to="/signup" className="auth-switch-link">Sign Up</Link>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="content">

          <ProfileHeader />
          <ProfileStats />
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "Overview" && (
            <div className="overview-layout">
              <div className="overview-top-row">
                <RecentContent />
                <div className="overview-right-column">
                  <TopFAQ />
                  <ProfileBadges />
                </div>
              </div>
              <div className="overview-bottom-row">
                <Analytics />
                <RecentActivity />
                <QuickLinks />
              </div>
            </div>
          )}

          {activeTab === "Analytics" && <AnalyticsTab />}
          {activeTab === "Answers" && <AnswersTab />}
          {activeTab === "Account Settings" && <NotificationPreferences />}

          {activeTab !== "Overview" && activeTab !== "Analytics" && activeTab !== "Answers" && activeTab !== "Account Settings" && (
            <div className="profile-card">
              <h2>{activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </div>
          )}  

        </main>
      </div>
    </>
  );
}

export default Profile;