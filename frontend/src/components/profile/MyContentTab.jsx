import { useState } from "react";
import { FileIcon, MessageCircleIcon } from "./ProfileIcons";
import MyContent from "./MyContent";
import AnswersTab from "./AnswersTab";

// ---------------------------------------------------------------------------
// MyContentTab — UI shell only
// ---------------------------------------------------------------------------
// Provides two subtabs inside the existing top-level "My Content" page:
//   - "My FAQs Created"  (default)
//   - "My Answers"
//
// Reuses the same `.profile-tabs-container` / `.profile-tab-btn` classes
// that the top-level ProfileTabs component uses, so the subtab row blends
// in visually without introducing any new styles.
//
// No data is wired up yet — both panes render simple placeholder copy.
// This is purely a structural change to the UI; no API, query, route, or
// other component has been moved or modified.
// ---------------------------------------------------------------------------

const SUBTABS = [
  { key: "My FAQs Created", label: "My FAQs Created", Icon: FileIcon },
  { key: "My Answers",      label: "My Answers",      Icon: MessageCircleIcon },
];

function MyContentTab() {
  const [activeSubTab, setActiveSubTab] = useState("My FAQs Created");

  return (
    <div className="profile-card">
      {/* Subtab row — same classes as the top-level ProfileTabs. */}
      <div
        className="profile-tabs-container"
        role="tablist"
        aria-label="My content subtabs"
        style={{ marginBottom: "16px" }}
      >
        {SUBTABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeSubTab === key}
            className={`profile-tab-btn ${activeSubTab === key ? "active" : ""}`}
            onClick={() => setActiveSubTab(key)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Pane: "My FAQs Created" reuses the existing MyContent view. */}
      {activeSubTab === "My FAQs Created" && (
        <div className="my-content-pane">
          <MyContent />
        </div>
      )}

      {/* Pane: "My Answers" reuses the existing AnswersTab view. */}
      {activeSubTab === "My Answers" && (
        <div className="my-content-pane">
          <AnswersTab />
        </div>
      )}
    </div>
  );
}

export default MyContentTab;
