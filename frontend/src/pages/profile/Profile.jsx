import { useState } from "react";
import Sidebar from "../../shared/components/Sidebar";
import Topbar from "../../shared/components/Topbar";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import RecentContent from "./components/RecentContent";
import TopFAQ from "./components/TopFAQ";
import ProfileBadges from "./components/ProfileBadges";
import Analytics from "./components/Analytics";
import RecentActivity from "./components/RecentActivity";
import QuickLinks from "./components/QuickLinks";
import { useAuth } from "../../shared/context/AuthContext";
import { Link } from "react-router-dom";
import AnalyticsTab from "./components/AnalyticsTab";
import NotificationPreferences from "./components/NotificationPreferences";

function Profile() {
  const [activeTab, setActiveTab] = useState("Overview");
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
          {activeTab === "Account Settings" && <NotificationPreferences />}

          {activeTab !== "Overview" && activeTab !== "Analytics" && activeTab !== "Account Settings" && (
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
