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
//import { useAuth } from "../context/AuthContext";
//import { Link } from "react-router-dom";
import AnalyticsTab from "../components/profile/AnalyticsTab";

function Profile() {
  const [activeTab, setActiveTab] = useState("Overview");

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

          {activeTab !== "Overview" && activeTab !== "Analytics" && (
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