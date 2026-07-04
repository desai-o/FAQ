import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";
import { fetchUserRecentAnswers } from "../../api/faqApi";

// ---------------------------------------------------------------------------
// RecentActivity — Pass 1 wiring
// ---------------------------------------------------------------------------
// Replaces the hardcoded sample feed with a chronological list derived from
// FAQContext.questions for the logged-in user. No new endpoints, no model
// changes — only existing frontend state is consulted.
//
// Each event corresponds to one of two signals we can verify purely from
// the cache:
//   - "Asked <title>"             when the user authored the question
//   - "Answered <parent title>"   when one of the nested answers was
//                                  authored by the user
//
// The "Earned a badge" sample from the original hardcoded list is NOT
// reproduced — badge state is not carried in FAQContext and synthesizing
// it from arbitrary data would be misleading. The feed shows only events
// the codebase can actually attribute to the current user.
//
// Identifier resolution (q.userId / q.user_id / q.authorId, both sides
// stringified) matches ProfileStats, RecentContent, and TopFAQ so all four
// sections agree on which items belong to the current user.
//
// Pass 2 wiring (this revision):
//   On mount we additionally call GET /api/answers/user/:userId so the
//   "Answered <title>" entries survive a hard refresh. FAQContext only
//   carries questions; the Answer objects are loaded per-question when
//   the user opens a question, so without this fetch the activity feed
//   can only see answers that happen to be nested in the currently cached
//   questions — which is why a freshly posted answer disappears after
//   reload. The local-cache branch is kept so the new answer still shows
//   up instantly while the fetch is in flight.
// ---------------------------------------------------------------------------

const COLORS = {
  asked: "#D97706",
  answered: "#2563EB"
};

function matchUser(item, userId) {
  const qUserId = item.userId || item.user_id || item.authorId;
  if (!qUserId || !userId) return false;
  return String(qUserId) === userId;
}

// Relative-time formatter. Mirrors the rhythm of the original hardcoded
// list ("2 days ago", "1 week ago") and switches to an absolute date
// format ("Feb 15, 2025") once an item is older than a month, so the
// visual style of the timestamps stays consistent with the previous
// design.
function formatTimestamp(iso) {
  const t = new Date(iso || 0).getTime();
  if (!Number.isFinite(t) || t <= 0) return "Just now";
  const diffMs = Date.now() - t;
  if (diffMs < 0) return "Just now";

  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;

  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  if (d < 30) {
    const w = Math.floor(d / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }

  const date = new Date(t);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function RecentActivity() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  // Server-side recent answers for the current user. Fetched once on
  // mount (and whenever the logged-in user changes). This is what makes
  // the "Answered <title>" rows survive a hard refresh: the local FAQ
  // cache never carries the full set of answers for the user, only the
  // answers nested under questions that have been opened.
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setUserAnswers([]);
      return;
    }
    let cancelled = false;
    fetchUserRecentAnswers(String(user.id), 20)
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        setUserAnswers(items);
      })
      .catch(() => {
        if (cancelled) return;
        // Failure is non-fatal: the local-cache branch below still
        // renders whatever is already in FAQContext.
        setUserAnswers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const userId = user.id ? String(user.id) : "";

  const events = [];
  const answeredIds = new Set();

  // Authoritative "Answered" entries from the server. These persist
  // across page refreshes because they're backed by the Answer document
  // in the database, not by transient client cache.
  for (const a of userAnswers || []) {
    const aid = a.id != null ? String(a.id) : null;
    if (aid) answeredIds.add(aid);
    events.push({
      key: aid ? `answered-api-${aid}` : `answered-api-${Math.random()}`,
      text: `Answered "${a.title || "Untitled"}"`,
      time: formatTimestamp(a.createdAt),
      iso: a.createdAt,
      color: COLORS.answered
    });
  }

  for (const q of questions || []) {
    if (matchUser(q, userId)) {
      const ts = q.createdAt || q.updatedAt;
      events.push({
        key: `asked-${q.id}`,
        text: `Asked "${q.title || q.question || "Untitled"}"`,
        time: formatTimestamp(ts),
        iso: ts,
        color: COLORS.asked
      });
    }

    const answers = Array.isArray(q.answers) ? q.answers : [];
    for (const a of answers) {
      const aUserId = a.userId || a.user_id || a.authorId;
      if (!aUserId || String(aUserId) !== userId) continue;

      const aid = a.id != null ? String(a.id) : (a._id != null ? String(a._id) : null);
      // Skip duplicates already provided by the server response — the
      // server entry has the canonical timestamp and parent title.
      if (aid && answeredIds.has(aid)) continue;

      // Prefer the answer's own timestamp; fall back to the parent
      // question if the source didn't carry one (locally-added answers,
      // for example, only get `time: "Just now"`).
      const ts = a.createdAt || a.created_at || q.createdAt || q.updatedAt;

      events.push({
        key: aid ? `answered-local-${aid}` : `answered-local-${q.id}-${Math.random()}`,
        text: `Answered "${q.title || q.question || "Untitled"}"`,
        time: formatTimestamp(ts),
        iso: ts,
        color: COLORS.answered
      });
    }
  }

  // Newest first. Events without a parseable timestamp sink to the bottom
  // (their `iso` produces NaN which sorts as 0).
  events.sort((a, b) => {
    const aT = new Date(a.iso || 0).getTime();
    const bT = new Date(b.iso || 0).getTime();
    return bT - aT;
  });

  return (
    <div className="activity-card profile-card">
      <div className="card-header-row">
        <h3>Recent Activity</h3>
        <button className="view-all-btn">View all</button>
      </div>

      {events.length === 0 ? (
        <div
          className="activity-empty"
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--text-secondary, #64748b)",
            fontSize: "14px",
            lineHeight: 1.5
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
            No activity yet.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
            When you ask a question or post an answer, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="activity-list">
          {events.map((e) => (
            <li key={e.key} className="activity-item">
              <span
                className="activity-dot"
                style={{ background: e.color }}
              />
              <div className="activity-text">
                <p>{e.text}</p>
                <span className="activity-time">{e.time}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentActivity;