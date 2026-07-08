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

// How many events to surface directly in the card. Anything beyond this
// is reachable through the "View all" modal. Mirrors the Badges card so
// the two side-by-side previews share the same visual rhythm.
const PREVIEW_LIMIT = 5;

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
  const [viewAllOpen, setViewAllOpen] = useState(false);

  useEffect(() => {
    // No user → no fetch. The render path early-returns on !user below,
    // so we don't need a synchronous state reset here.
    //
    // `loading` starts at `true` (the initial useState value) and is
    // flipped to `false` inside the .then / .catch callbacks — never
    // synchronously in the effect body — to satisfy the
    // react-hooks/set-state-in-effect rule.
    if (!user) return;

    let cancelled = false;
    fetchNotifications()
      .then((res) => {
        if (cancelled) return;
        setNotifications(Array.isArray(res?.data) ? res.data : []);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Couldn't load activity. Please try again.");
        setNotifications([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Escape-to-close + body-scroll lock for the "View all" modal. Mirrors
  // ProfileBadges so the two cards on the Profile page behave identically.
  // Only attached while the modal is open so the rest of the page keeps
  // its normal scroll and keyboard behaviour.
  useEffect(() => {
    if (!viewAllOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") setViewAllOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [viewAllOpen]);

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

  // Card preview is capped so the rest has a clear home in the modal.
  // Derived here (not memoized) — `events` is rebuilt every render anyway
  // and the slice is O(PREVIEW_LIMIT).
  const previewEvents = events.slice(0, PREVIEW_LIMIT);

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
          {/* The "View all" affordance opens an in-page modal that renders
              the full Recent Activity list. We deliberately do NOT navigate
              to /notifications or reuse the NotificationCenter component —
              the modal is the same data the card shows, just un-truncated. */}
          {!loading && !error && events.length > 0 && (
            <button
              type="button"
              className="view-all-btn"
              onClick={() => setViewAllOpen(true)}
            >
              View all{events.length > PREVIEW_LIMIT ? ` (${events.length})` : ""}
            </button>
          )}
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
          {previewEvents.map((e) => (
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

      {viewAllOpen && (
        <div
          className="modal-overlay active"
          onClick={() => setViewAllOpen(false)}
          role="presentation"
        >
          {/* Stop click propagation so clicks inside the modal don't
              bubble up to the overlay (which would close it). Mirrors
              the structure used by the Badges modal. */}
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-activity-modal-title"
          >
            <div className="modal-header">
              <h2 id="all-activity-modal-title">All Recent Activity</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewAllOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {events.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary, #64748b)",
                    padding: "16px 0",
                    fontSize: "14px"
                  }}
                >
                  You have no activity yet.
                </p>
              ) : (
                <ul
                  className="activity-list activity-modal-list"
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    padding: "8px 4px",
                    scrollbarWidth: "thin"
                  }}
                >
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

            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setViewAllOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentActivity;