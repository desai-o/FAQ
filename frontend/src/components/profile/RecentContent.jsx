// ---------------------------------------------------------------------------
// RecentContent — Pass 1 wiring (View All → internal scroll)
// ---------------------------------------------------------------------------
// Replaces the hardcoded sample list with the logged-in user's actual
// questions from FAQContext.questions, filtered by the canonical user.id
// returned by /api/auth/me. The identifier resolution (q.userId / q.user_id
// / q.authorId, stringified on both sides) is identical to what
// ProfileStats uses, so the two sections stay in agreement.
//
// Ordering: FAQContext.questions is already sorted newest-first by
// `mergeQuestionLists`; we re-sort defensively in case the data came from a
// source that bypassed the merger (cache-only, etc.).
//
// Empty state: when the user has no items in the cache the table is replaced
// with a clean inline-styled message. The card chrome (title only — the
// "View all" button has been removed in favor of an internal scrollable
// list) is preserved exactly.
// ---------------------------------------------------------------------------
import { FileIcon, EyeIcon, ThumbsUpIcon } from "./ProfileIcons";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";

// Compact number formatter for the views column (1240 -> "1.2K"). Matches
// the format used by the original hardcoded sample data so the column
// width and styling stay identical for any non-zero value.
function formatViews(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v >= 1000) {
    const rounded = (v / 1000).toFixed(1).replace(/\.0$/, "");
    return `${rounded}K`;
  }
  return String(v);
}

// Maps the backend's status field onto the two CSS classes the existing
// markup already understands (status-published / status-draft):
//   - resolved / approved / published   -> "Published"
//   - everything else (pending, needs_review, ...)  -> "Draft"
function deriveStatus(question) {
  const s = String(question.status || "").toLowerCase();
  if (s === "resolved" || s === "approved" || s === "published") {
    return "Published";
  }
  return "Draft";
}

function RecentContent() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  if (!user) return null;

  const userId = user.id ? String(user.id) : "";

  // Filter authored items by the same identifier resolution used in
  // ProfileStats, so a question in the cache authored by another user is
  // not surfaced in this section.
  const myContent = (questions || [])
    .filter((q) => {
      const qUserId = q.userId || q.user_id || q.authorId;
      if (!qUserId || !userId) return false;
      return String(qUserId) === userId;
    })
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bDate - aDate;
    });

  return (
    <div className="recent-content-card profile-card">
      <div className="card-header-row">
        <h3>Recent Content</h3>
      </div>

      {myContent.length === 0 ? (
        <div
          className="recent-content-empty"
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--text-secondary, #64748b)",
            fontSize: "14px",
            lineHeight: 1.5
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
            You haven't asked any questions yet.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
            Once you submit a question, it will appear here with its current status.
          </p>
        </div>
      ) : (
        // Internal scroll container — replaces the previous "View all" link.
        // Fixed max height lets users browse all their recent questions
        // inside the card. `overflowY: "auto"` only shows the scrollbar
        // when content exceeds the cap, so cards with few items render
        // identically to before. `scrollbarWidth: "thin"` keeps the rail
        // unobtrusive across browsers.
        <div
          className="recent-content-scroll"
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            scrollbarWidth: "thin"
          }}
        >
          <table className="content-table">
            <tbody>
              {myContent.map((item) => {
                const displayTitle = item.title || item.question || "Untitled";
                const status = deriveStatus(item);
                const views = formatViews(item.views);
                const votes = Number(item.votes);
                const hasVotes = Number.isFinite(votes);

                return (
                  <tr key={item.id} className="content-table-row">
                    <td className="content-table-icon">
                      <FileIcon size={14} color="#cbd5e1" />
                    </td>
                    <td className="content-table-title">
                      {displayTitle}
                      <span
                        className={`content-status ${
                          status === "Published" ? "status-published" : "status-draft"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="content-table-stat">
                      {views !== null ? (
                        <span className="stat-with-icon">
                          <EyeIcon size={12} color="#94a3b8" /> {views}
                        </span>
                      ) : (
                        <span className="stat-empty">—</span>
                      )}
                    </td>
                    <td className="content-table-stat">
                      {hasVotes ? (
                        <span className="stat-with-icon">
                          <ThumbsUpIcon size={12} color="#94a3b8" /> {votes}
                        </span>
                      ) : (
                        <span className="stat-empty">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentContent;