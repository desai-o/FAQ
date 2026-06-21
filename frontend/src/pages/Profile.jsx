import { useState } from "react";
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
import { Link } from "react-router-dom";
import AnalyticsTab from "../components/profile/AnalyticsTab";
import NotificationPreferences from "../components/profile/NotificationPreferences";
import "../components/profile/BadgesTabLayout.css";
import ReputationProgress from "../components/profile/ReputationProgress";
import BadgeGrid from "../components/profile/BadgeGrid";
import NextAchievementCard from "../components/profile/NextAchievementCard";
import MilestoneTimeline from "../components/profile/MilestoneTimeline";
import NextBadgeCard from "../components/profile/NextBadgeCard";

function Profile() {
  const [activeTab, setActiveTab] = useState("Overview");
  const { user, loading } = useAuth();

  // Single source of truth for reputation — mock value for now.
  // Once a backend is wired up, replace this with the real value
  // (e.g. from `user.reputation`), and every component below will
  // automatically reflect it since they all read from this one constant.
  const reputation = 320;

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

          {activeTab === "Badges" && (
            <div className="badges-tab-layout">
              <div className="badges-top-row">
                <div className="badges-left-col">
                  <BadgeGrid />
                </div>
                <div className="badges-right-col">
                  <ReputationProgress reputation={reputation} />
                  <NextAchievementCard />
                  <NextBadgeCard />
                </div>
              </div>
              <MilestoneTimeline reputation={reputation} />
            </div>
          )}

          {activeTab === "Account Settings" && <NotificationPreferences />}

          {activeTab !== "Overview" &&
            activeTab !== "Analytics" &&
            activeTab !== "Badges" &&
            activeTab !== "Account Settings" && (
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