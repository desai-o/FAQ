import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrophyIcon } from "./ProfileIcons";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";

// ---------------------------------------------------------------------------
// TopFAQ — Pass X wiring (View all modal + upvote ranking)
// ---------------------------------------------------------------------------
// Replaces the hardcoded "API Authentication Guide" sample with the
// logged-in user's actual top-voted question, sourced from
// FAQContext.questions and filtered by the canonical user.id returned by
// /api/auth/me. The identifier resolution (q.userId / q.user_id /
// q.authorId, stringified on both sides) matches ProfileStats and
// RecentContent so the three sections stay in agreement.
//
// Selection rule: highest `votes` wins (votes is the upvote count on
// each question — see FAQContext and backend Vote routes). Ties
// resolve newest-first.
//
// Empty / no-data states render through the same DOM nodes the original
// markup used — no CSS class names added or removed, so the card layout,
// spacing, and styling are preserved exactly. If the user has authored
// at least one question, the card always shows that question and its
// upvote count (0 if no one has upvoted yet) — we never display a
// placeholder message instead of a real number.
//
// The "View all" affordance opens an in-page modal that lists the
// user's top 5 questions by upvotes, instead of navigating to
// /questions. Mirrors the Badges and Recent Activity modals exactly
// (overlay, close button, outside click, Escape key, scrollable body).
// ---------------------------------------------------------------------------

// How many of the user's top-voted FAQs to surface in the "View all"
// modal. Matches the Badges / Recent Activity modal caps so all three
// Profile cards share the same preview rhythm. The card itself is
// unchanged — it still shows the single top-by-votes question.
const MODAL_LIMIT = 5;

// Format an upvote count for display. Returns:
//   - "0"    for 0 upvotes (so the card never shows a placeholder
//            dash when a real question exists with no upvotes yet)
//   - "1.2K" for >= 1000
//   - "42"   for 1–999
//   - null   only for NaN / undefined / non-finite values
function formatUpvotes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v === 0) return "0";
  if (v >= 1000) {
    const rounded = (v / 1000).toFixed(1).replace(/\.0$/, "");
    return `${rounded}K`;
  }
  return String(v);
}

function TopFAQ() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  // Modal open/close state. Hooks must come before the `if (!user)`
  // early return below so the order is stable across renders.
  const [modalOpen, setModalOpen] = useState(false);

  // Escape-to-close + body-scroll lock for the "View all" modal.
  // Mirrors the Badges / Recent Activity modals exactly. Only attached
  // while the modal is open so the rest of the Profile page keeps its
  // normal scroll and keyboard behaviour.
  useEffect(() => {
    if (!modalOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  if (!user) return null;

  const userId = user.id ? String(user.id) : "";

  // Authored-by-me filter — same identifier resolution used in
  // ProfileStats and RecentContent.
  const myContent = (questions || []).filter((q) => {
    const qUserId = q.userId || q.user_id || q.authorId;
    if (!qUserId || !userId) return false;
    return String(qUserId) === userId;
  });

  // Highest-voted authored question (tiebreak: newest first). We keep
  // the full sorted list so the modal can reuse it; the card still
  // reads only the first entry, so its layout is unchanged.
  const sortedByVotes = myContent.slice().sort((a, b) => {
    const aVotes = Number(a.votes) || 0;
    const bVotes = Number(b.votes) || 0;
    if (bVotes !== aVotes) return bVotes - aVotes;
    const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bDate - aDate;
  });

  const topByVotes = sortedByVotes[0];
  // The modal shows the top MODAL_LIMIT FAQs sorted by upvotes.
  const modalFaqs = sortedByVotes.slice(0, MODAL_LIMIT);

  // Two render states — same DOM nodes, different copy/values:
  //   1. No authored content        -> "no questions yet"
  //   2. Populated                  -> the user's top voted question
  //
  // We deliberately do NOT have a "tracking not enabled" branch — if
  // the user has asked any questions, we show the top one and its
  // upvote count (which can legitimately be 0).
  let title;
  let sub;
  let num;
  let label = "Upvotes";

  if (!topByVotes) {
    title = "No top FAQ yet";
    sub = "Once you ask a question, your top-voted one will appear here.";
    num = "—";
  } else {
    title = topByVotes.title || topByVotes.question || "Untitled";
    sub = "Your top voted FAQ";
    // If `votes` is missing entirely, fall back to "0" so the card
    // never shows a blank or a dash when there's a real question.
    num = formatUpvotes(topByVotes.votes) ?? "0";
  }

  return (
    <div className="top-faq-card profile-card">
      <div className="card-header-row">
        <h3>
          Top FAQ <span className="card-subhead">(by upvotes)</span>
        </h3>
        {/* "View all" opens an in-page modal instead of navigating to
            /questions. Reuses the same modal markup as Badges and
            Recent Activity so the three cards behave identically. */}
        {modalFaqs.length > 0 && (
          <button
            type="button"
            className="view-all-btn"
            onClick={() => setModalOpen(true)}
          >
            View all{modalFaqs.length < sortedByVotes.length ? ` (${sortedByVotes.length})` : ""}
          </button>
        )}
      </div>
      <div className="top-faq-item">
        <div className="top-faq-icon-wrap">
          <TrophyIcon size={22} color="#D97706" />
        </div>
        <div className="top-faq-text">
          <p className="top-faq-title">{title}</p>
          <p className="top-faq-sub">{sub}</p>
        </div>
        <div className="top-faq-views">
          <span className="top-faq-num">{num}</span>
          <span className="top-faq-label">{label}</span>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-overlay active"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          {/* Stop click propagation so clicks inside the modal don't
              bubble up to the overlay (which would close it). Mirrors
              the Badges / Recent Activity modals exactly. */}
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="top-faq-modal-title"
          >
            <div className="modal-header">
              <h2 id="top-faq-modal-title">Your Top FAQs</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalFaqs.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary, #64748b)",
                    padding: "16px 0",
                    fontSize: "14px"
                  }}
                >
                  You haven't asked any questions yet.
                </p>
              ) : (
                <ul
                  className="top-faq-modal-list"
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "8px 4px",
                    maxHeight: "60vh",
                    overflowY: "auto",
                    scrollbarWidth: "thin"
                  }}
                >
                  {modalFaqs.map((q, idx) => {
                    const qId = q.id ?? q._id;
                    const qTitle = q.title || q.question || "Untitled";
                    const qVotes = formatUpvotes(q.votes) ?? "0";
                    return (
                      <li
                        key={qId != null ? `top-${qId}` : `top-${idx}`}
                        className="top-faq-modal-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 8px",
                          borderBottom: "1px solid var(--border, #e2e8f0)"
                        }}
                      >
                        <span
                          className="top-faq-rank"
                          style={{
                            minWidth: "24px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#D97706"
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <span
                          className="top-faq-modal-title"
                          style={{
                            flex: 1,
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--text-primary, #1e293b)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {qId != null ? (
                            <Link
                              to={`/questions/${qId}`}
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              {qTitle}
                            </Link>
                          ) : (
                            qTitle
                          )}
                        </span>
                        <span
                          className="top-faq-modal-views"
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary, #64748b)",
                            fontWeight: 600,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {qVotes} upvotes
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setModalOpen(false)}
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

export default TopFAQ;