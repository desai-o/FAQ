import { Link } from "react-router-dom";
import { TrophyIcon } from "./ProfileIcons";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";

// ---------------------------------------------------------------------------
// TopFAQ — Pass 1 wiring
// ---------------------------------------------------------------------------
// Replaces the hardcoded "API Authentication Guide" sample with the
// logged-in user's actual most-viewed question, sourced from
// FAQContext.questions and filtered by the canonical user.id returned by
// /api/auth/me. The identifier resolution (q.userId / q.user_id /
// q.authorId, stringified on both sides) matches ProfileStats and
// RecentContent so the three sections stay in agreement.
//
// Selection rule: highest `views` wins. Ties resolve newest-first.
// Empty / no-data states render through the same DOM nodes the original
// markup used — no CSS class names added or removed, so the card layout,
// spacing, and styling are preserved exactly.
// ---------------------------------------------------------------------------

function formatViews(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v >= 1000) {
    const rounded = (v / 1000).toFixed(1).replace(/\.0$/, "");
    return `${rounded}K`;
  }
  return String(v);
}

function TopFAQ() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  if (!user) return null;

  const userId = user.id ? String(user.id) : "";

  // Authored-by-me filter — same identifier resolution used in
  // ProfileStats and RecentContent.
  const myContent = (questions || []).filter((q) => {
    const qUserId = q.userId || q.user_id || q.authorId;
    if (!qUserId || !userId) return false;
    return String(qUserId) === userId;
  });

  // Highest-viewed authored question (tiebreak: newest first).
  const topByViews = myContent
    .slice()
    .sort((a, b) => {
      const aViews = Number(a.views) || 0;
      const bViews = Number(b.views) || 0;
      if (bViews !== aViews) return bViews - aViews;
      const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bDate - aDate;
    })[0];

  // Three render states — same DOM nodes, different copy/values:
  //   1. No authored content        -> "no questions yet"
  //   2. No view counts available   -> "view tracking not enabled"
  //   3. Populated                  -> the user's top viewed question
  let title;
  let sub;
  let num;
  let label = "Views";

  if (!topByViews) {
    title = "No top FAQ yet";
    sub = "Once you ask a question, your most-viewed one will appear here.";
    num = "—";
  } else {
    const viewsNum = Number(topByViews.views);
    if (!Number.isFinite(viewsNum) || viewsNum <= 0) {
      title = "View tracking not enabled";
      sub = "View counts aren't yet available for your content.";
      num = "—";
    } else {
      title = topByViews.title || topByViews.question || "Untitled";
      sub = "Your most viewed FAQ";
      num = formatViews(viewsNum);
    }
  }

  return (
    <div className="top-faq-card profile-card">
      <div className="card-header-row">
        <h3>
          Top FAQ <span className="card-subhead">(by views)</span>
        </h3>
        <Link to="/questions" className="view-all-btn">View all</Link>
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
    </div>
  );
}

export default TopFAQ;