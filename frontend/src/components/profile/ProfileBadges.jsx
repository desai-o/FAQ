// ---------------------------------------------------------------------------
// ProfileBadges — Pass 1 wiring
// ---------------------------------------------------------------------------
// Replaces the hardcoded badge list with the logged-in user's actual
// badges where available, or an honest empty state when badge data is not
// yet present.
//
// Why empty state: a direct read of every relevant data source confirms
// there is no badge data path in the existing frontend state.
//   - AuthContext.user exposes {name, email, avatar, createdAt,
//     questionsCount, answersCount, reputation} (consumed by ProfileHeader
//     and ProfileStats). No `badges` field.
//   - FAQContext exposes {questions, contributors, categories}. No
//     `badges` field.
//   - There is no backend Badge model and no /api/badges endpoint to
//     call, and the instructions forbid creating one.
// Inventing a curated list of fake badges would directly violate the
// "do not invent badges" rule. The card therefore renders a graceful
// empty state instead.
//
// Card chrome (title "Badges", "View all" button, surrounding card
// classes, animations, spacing) is preserved exactly so the section
// keeps its place in the layout. When real badge data is wired in later,
// the empty-state block can be swapped for a list of `.badge-icon-item`
// elements using the same class names already defined in the original
// implementation, with no further CSS work required.
// ---------------------------------------------------------------------------

function ProfileBadges() {
  return (
    <div className="badges-card profile-card">
      <div className="card-header-row">
        <h3>Badges</h3>
        <button className="view-all-btn">View all</button>
      </div>
      <div
        className="badges-empty"
        style={{
          padding: "20px 16px",
          textAlign: "center",
          color: "var(--text-secondary, #64748b)",
          fontSize: "14px",
          lineHeight: 1.5
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            color: "var(--text-primary, #1e293b)"
          }}
        >
          No badges yet
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
          Badges will appear here as you contribute to the community.
        </p>
      </div>
    </div>
  );
}

export default ProfileBadges;