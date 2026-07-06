import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserRecentAnswers } from "../../api/faqApi";
import { MessageCircleIcon } from "./ProfileIcons";

// ---------------------------------------------------------------------------
// AnswersTab — Pass 1 wiring
// ---------------------------------------------------------------------------
// Pulls the logged-in user's recent answers from the server via
// `fetchUserRecentAnswers(userId)`. The route only returns metadata
// (id, questionId/queryId, title, sourceType, createdAt) — no answer
// body — which matches the rest of the Profile's "list views".
//
// The card chrome (profile-card / card-header-row / content-table /
// content-table-row / content-table-icon / content-table-title /
// content-table-stat) is identical to RecentContent's, so the tab
// blends in with the rest of the Profile without introducing any
// new CSS.
//
// States:
//   loading  — centered "Loading your answers…" line
//   error    — centered red message from the thrown Error
//   empty    — friendly "you haven't answered any questions yet"
//   data     — table of recent answers, newest first
// ---------------------------------------------------------------------------

// Compact "time ago" formatter. Kept local so the tab has no dependency
// on RecentActivity's private helper. Mirrors its thresholds so a row
// like "2 days ago" reads the same as the activity feed.
function formatTimestamp(iso) {
  const t = new Date(iso || 0).getTime();
  if (!Number.isFinite(t) || t <= 0) return "—";
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

// Map the server's sourceType ("faq" | "query") onto the existing
// status badges already styled in RecentContent.jsx, so the Answers
// tab uses the same chip styles without introducing new CSS classes.
function deriveSourceBadge(sourceType) {
  if (sourceType === "faq") {
    return { label: "FAQ",   cls: "status-published" };
  }
  if (sourceType === "query") {
    return { label: "Query", cls: "status-draft" };
  }
  return { label: "Unknown", cls: "status-draft" };
}

function AnswersTab() {
  const { user } = useAuth();

  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!user) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUserRecentAnswers(user.id)
      .then((res) => {
        if (cancelled) return;
        // `request()` returns the raw payload. The success helper wraps
        // the answer list in `.data`, so we read defensively.
        const items = Array.isArray(res?.data) ? res.data : [];
        setAnswers(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Couldn't load your answers. Please try again.");
        setAnswers([]);
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

  return (
    <div className="answers-tab-card profile-card">
      <div className="card-header-row">
        <h3>Your Answers</h3>
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #64748b)"
          }}
        >
          {loading
            ? "Loading…"
            : `${answers.length} answer${answers.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div
          className="answers-loading"
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "var(--text-secondary, #64748b)",
            fontSize: "13px"
          }}
        >
          Loading your answers…
        </div>
      ) : error ? (
        <div
          className="answers-error"
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
      ) : answers.length === 0 ? (
        <div
          className="answers-empty"
          style={{
            padding: "24px 16px",
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
            You haven't answered any questions yet.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
            Once you post an answer, it will appear here with the question it answered.
          </p>
        </div>
      ) : (
        <table className="content-table">
          <tbody>
            {answers.map((a) => {
              const displayTitle = a.title || "Untitled question";
              const badge = deriveSourceBadge(a.sourceType);
              const time = formatTimestamp(a.createdAt);

              return (
                <tr key={a.id} className="content-table-row">
                  <td className="content-table-icon">
                    <MessageCircleIcon size={14} color="#cbd5e1" />
                  </td>
                  <td className="content-table-title">
                    {displayTitle}
                    <span className={`content-status ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="content-table-stat">
                    <span className="stat-empty" title={a.createdAt || ""}>
                      {time}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AnswersTab;