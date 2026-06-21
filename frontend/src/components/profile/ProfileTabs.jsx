import { GridIcon, FileIcon, BarChartIcon, MedalIcon, SettingsIcon } from "./ProfileIcons";

// Activity icon (flame / chart)
function ActivityIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

const tabs = [
  { label: "Overview",         Icon: GridIcon      },
  { label: "Activity",         Icon: ActivityIcon  },   // ← NEW
  { label: "My Content",       Icon: FileIcon      },
  { label: "Analytics",        Icon: BarChartIcon  },
  { label: "Badges",           Icon: MedalIcon     },
  { label: "Account Settings", Icon: SettingsIcon  },
];

function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <section className="profile-tabs-container">
      {tabs.map((t) => (
        <button
          key={t.label}
          className={`profile-tab-btn ${activeTab === t.label ? "active" : ""}`}
          onClick={() => setActiveTab(t.label)}
        >
          <t.Icon size={15} />
          {t.label}
        </button>
      ))}
    </section>
  );
}

export default ProfileTabs;