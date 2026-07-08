import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchUserFaqs, fetchUserQueries } from "../../api/faqApi";
import { FileIcon } from "./ProfileIcons";

// ---------------------------------------------------------------------------
// MyContent — "My FAQs Created" subtab
// ---------------------------------------------------------------------------
// Pulls the logged-in user's content from two endpoints in parallel:
//   - GET /faqs/user/:userId        → published FAQ rows (FAQ collection/table)
//   - GET /queries/user/:userId     → the user's own UserQuery rows
//
// The two streams are kept separate on purpose — the FAQs and Queries data
// models are intentionally not merged. On the client we split the query
// rows by status:
//   - status === "pending"  → Drafts section
//   - status === "resolved" → merged into the Published section
//
// Each row in the Published section links to the existing /questions/:id
// FAQ detail page. Drafts are rendered as plain rows (no Link) since there
// is no /queries/:id detail page in App.jsx; drafts are surfaced for
// visibility only and edited through the AskQuestionModal flow.
//
// Card chrome (profile-card / card-header-row / content-table /
// content-table-row / content-table-icon / content-table-title /
// content-table-stat / status-published) matches the AnswersTab so the
// two subtabs sit visually side-by-side without any new CSS.
//
// States:
//   loading  — centered "Loading your FAQs…" line
//   error    — centered red message from the thrown Error
//   empty    — friendly "you haven't created any FAQs yet"
//   data     — two sections: "Published · N" and "Drafts · N", newest first
// ---------------------------------------------------------------------------

// Inline-style badge for the Draft label — `content-status status-published`
// already exists for the category pill, but there is no built-in draft
// variant, so this keeps the change CSS-free while still giving a clear,
// color-distinct badge.
const DRAFT_BADGE_STYLE = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  background: "rgba(245, 158, 11, 0.12)",
  color: "#b45309",
  border: "1px solid rgba(245, 158, 11, 0.35)",
  whiteSpace: "nowrap"
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 4px 8px",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-secondary, #64748b)",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

// "time ago" formatter — local copy identical to the one in AnswersTab
// so a row like "2 days ago" reads the same across tabs.
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

// ID resolver that mirrors QuestionDetail's getQuestionId(): rows from
// /faqs/user/:userId and /queries/user/:userId carry `id` in SQLite mode but
// only `_id` (no `id` virtual) in MongoDB mode, so treating either as the
// canonical id keeps the /questions/:id link valid in both backends.
function pickId(item) {
  if (item == null) return "";
  if (typeof item === "string") return item;
  return String(item.id || item._id || item.mongo_id || "");
}

function MyContent() {
  const { user } = useAuth();

  const [faqs, setFaqs]               = useState([]);
  const [drafts, setDrafts]           = useState([]);
  const [resolvedQueries, setResolved] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);

  useEffect(() => {
    if (!user) {
      setFaqs([]);
      setDrafts([]);
      setResolved([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Fetch FAQs and Queries in parallel; treat each fetch failure as a
    // non-fatal warning so one broken endpoint doesn't blank out the tab.
    const safe = (promise) =>
      promise.then((res) => res).catch((err) => ({ __err: err }));

    Promise.all([
      safe(fetchUserFaqs(user.id)),
      safe(fetchUserQueries(user.id))
    ])
      .then(([faqRes, queryRes]) => {
        if (cancelled) return;

        const faqItems = faqRes && !faqRes.__err && Array.isArray(faqRes.data)
          ? faqRes.data
          : [];
        setFaqs(faqItems);

        const queryItems = queryRes && !queryRes.__err && Array.isArray(queryRes.data)
          ? queryRes.data
          : [];
        setDrafts(queryItems.filter((q) => q.status === "pending"));
        setResolved(
          queryItems.filter(
            (q) => q.status && q.status !== "pending"
          )
        );

        const errs = [];
        if (faqRes && faqRes.__err) {
          errs.push(faqRes.__err.message || "Could not load FAQs");
        }
        if (queryRes && queryRes.__err) {
          errs.push(queryRes.__err.message || "Could not load drafts");
        }
        if (errs.length) setError(errs.join("; "));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Couldn't load your content. Please try again.");
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

  // Published = FAQ rows + UserQuery rows whose status isn't "pending".
  // We tag each row with a `kind` so the renderer can choose the right link.
  // `pickId` resolves `id` / `_id` / `mongo_id` so the link works in both
  // SQLite and MongoDB storage modes (see QuestionDetail.getQuestionId).
  const publishedItems = [
    ...faqs.map((f) => ({ kind: "faq", id: pickId(f), source: f })),
    ...resolvedQueries.map((q) => ({ kind: "query", id: pickId(q), source: q }))
  ];
  const draftItems = drafts.map((q) => ({ kind: "draft", id: pickId(q), source: q }));

  const publishedCount = publishedItems.length;
  const draftCount     = draftItems.length;
  const totalCount     = publishedCount + draftCount;

  return (
    <div className="my-content-card profile-card">
      <div className="card-header-row">
        <h3>Your FAQs</h3>
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #64748b)"
          }}
        >
          {loading
            ? "Loading…"
            : `${totalCount} item${totalCount === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "var(--text-secondary, #64748b)",
            fontSize: "13px"
          }}
        >
          Loading your FAQs…
        </div>
      ) : error ? (
        <div
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
      ) : totalCount === 0 ? (
        <div
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
            You haven't created any FAQs yet.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
            Ask a question to get started. Drafts and published FAQs will appear here.
          </p>
        </div>
      ) : (
        <>
          {publishedCount > 0 && (
            <section aria-label={`Published items (${publishedCount})`}>
              <div style={SECTION_HEADER_STYLE}>
                <span>Published · {publishedCount}</span>
              </div>
              <table className="content-table">
                <tbody>
                  {publishedItems.map((item) => {
                    const src = item.source;
                    const title =
                      src.question || src.title || "Untitled FAQ";
                    const category = src.category || "General";
                    const time = formatTimestamp(src.createdAt);
                    const linkTo =
                      item.kind === "faq"
                        ? `/questions/${item.id}`
                        : `/questions/${item.id}`;

                    return (
                      <tr
                        key={`${item.kind}-${item.id}`}
                        className="content-table-row"
                      >
                        <td className="content-table-icon">
                          <FileIcon size={14} color="#cbd5e1" />
                        </td>
                        <td className="content-table-title">
                          <Link
                            to={linkTo}
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}
                          >
                            {title}
                            <span className="content-status status-published">
                              {category}
                            </span>
                          </Link>
                        </td>
                        <td className="content-table-stat">
                          <span
                            className="stat-empty"
                            title={src.createdAt || ""}
                          >
                            {time}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {draftCount > 0 && (
            <section
              aria-label={`Drafts (${draftCount})`}
              style={{ marginTop: publishedCount > 0 ? "8px" : 0 }}
            >
              <div style={SECTION_HEADER_STYLE}>
                <span>Drafts · {draftCount}</span>
              </div>
              <table className="content-table">
                <tbody>
                  {draftItems.map((item) => {
                    const src = item.source;
                    const title = src.question || src.title || "Untitled draft";
                    const category = src.category || "General";
                    const time = formatTimestamp(src.createdAt);

                    return (
                      <tr
                        key={`draft-${item.id}`}
                        className="content-table-row"
                      >
                        <td className="content-table-icon">
                          <FileIcon size={14} color="#cbd5e1" />
                        </td>
                        <td className="content-table-title">
                          <Link
                            to={`/questions/${item.id}`}
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}
                          >
                            {title}
                            <span style={DRAFT_BADGE_STYLE}>Draft</span>
                            <span className="content-status status-published">
                              {category}
                            </span>
                          </Link>
                        </td>
                        <td className="content-table-stat">
                          <span
                            className="stat-empty"
                            title={src.createdAt || ""}
                          >
                            {time}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default MyContent;
