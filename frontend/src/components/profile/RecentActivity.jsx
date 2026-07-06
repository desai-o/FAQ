import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNotifications,
  markNotificationsAsRead
} from "../../api/faqApi";

// ---------------------------------------------------------------------------
// RecentActivity — Pass 3 wiring
// ---------------------------------------------------------------------------
// Replaces the previous cache-derived feed ("Asked <title>" / "Answered
// <title>" reconstructed from FAQContext.questions plus
// fetchUserRecentAnswers) with the server-authoritative notifications
// feed:
//   GET  /api/notifications           → list of activity events
//   POST /api/notifications/read      → mark all as read
//
// Each notification carries:
//   eventType   (e.g. "answer_accepted", "follow", "mention", "comment",
//               "bookmark") — drives the colored dot
//   message     — server-rendered activity text, used directly
//   createdAt   — drives the relative timestamp
//   isRead      — drives dot opacity and the "Mark all read" affordance
//
// Loading, empty, and error states are handled inline so the card shell,
// header, and "View all" button stay identical to the previous design.
// ---------------------------------------------------------------------------

// Color for the leading dot, keyed off the server-supplied eventType.
// Unknown / missing eventType falls back to a neutral gray so we never
// paint an undefined color into the DOM.
const EVENT_COLORS = {
  answer_accepted: "#10b981",
  accepted: "#10b981",
  follow: "#2563eb",
  followed: "#2563eb",
  new_answer: "#0ea5e9",
  mention: "#8b5cf6",
  comment: "#8b5cf6",
  bookmark: "#d97706"
};
const DEFAULT_EVENT_COLOR = "#64748b";

function colorForEvent(eventType) {
  if (!eventType) return DEFAULT_EVENT_COLOR;
  return EVENT_COLORS[eventType] || DEFAULT_EVENT_COLOR;
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
  const { user } = useAuth();

  // Notifications fetched from the server. Authoritative — survives hard
  // refresh, includes events the local FAQ cache can never reconstruct
  // (e.g. someone accepted your answer, someone followed you).
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNotifications()
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        setNotifications(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Couldn't load activity. Please try again.");
        setNotifications([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Newest first. Notifications without a parseable timestamp sink to
  // the bottom (their `iso` produces NaN which sorts as 0).
  const events = notifications
    .map((n, idx) => ({
      key: n.id != null ? `notif-${n.id}` : `notif-${idx}`,
      text: n.message || "New activity",
      time: formatTimestamp(n.createdAt),
      iso: n.createdAt,
      color: colorForEvent(n.eventType),
      isRead: !!n.isRead
    }))
    .sort((a, b) => {
      const aT = new Date(a.iso || 0).getTime();
      const bT = new Date(b.iso || 0).getTime();
      return bT - aT;
    });

  const handleMarkAllRead = async () => {
    if (marking || unreadCount === 0) return;
    setMarking(true);
    try {
      await markNotificationsAsRead();
      // Optimistic local update — server endpoint marks all as read.
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="activity-card profile-card">
      <div className="card-header-row">
        <h3>Recent Activity</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {unreadCount > 0 && !loading && !error && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={marking}
              className="mark-read-btn"
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid var(--border, #e2e8f0)",
                background: "var(--surface-secondary, #f8fafc)",
                color: "var(--text-primary, #1e293b)",
                cursor: marking ? "wait" : "pointer",
                opacity: marking ? 0.7 : 1
              }}
            >
              {marking ? "Marking…" : `Mark all read (${unreadCount})`}
            </button>
          )}
          <button className="view-all-btn">View all</button>
        </div>
      </div>

      {loading ? (
        <div
          className="activity-loading"
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "var(--text-secondary, #64748b)",
            fontSize: "13px"
          }}
        >
          Loading activity…
        </div>
      ) : error ? (
        <div
          className="activity-error"
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "#ef4444",
            fontSize: "13px",
            lineHeight: 1.5
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : events.length === 0 ? (
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
                style={{
                  background: e.color,
                  opacity: e.isRead ? 0.5 : 1
                }}
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