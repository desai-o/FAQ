import {
  MessagePlusIcon, PencilIcon, SendIcon,
  BookmarkIcon, ClockIcon, ChevronRightIcon
} from "./ProfileIcons";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";

// ---------------------------------------------------------------------------
// QuickLinks — Pass 1 wiring
// ---------------------------------------------------------------------------
// Replaces the hardcoded counts with live values derived from existing
// frontend state. No new endpoints, no model changes.
//
// Source mapping:
//   - "My FAQs"          -> questions authored by current user (same
//                           identifier resolution as ProfileStats,
//                           RecentContent, TopFAQ, RecentActivity).
//   - "Draft FAQs"       -> authored questions whose status is NOT in the
//                           {resolved, approved, published} set.
//   - "Published FAQs"   -> authored questions whose status IS in that
//                           set. (Draft + Published == My FAQs total.)
//   - "Bookmarked FAQs"  -> any question with q.bookmarked === true.
//                           FAQContext.loadBookmarks() merges the
//                           backend /api/bookmarks set into the cache for
//                           the logged-in user; FAQContext.bookmarkQuestion
//                           updates it locally on toggle. No additional
//                           plumbing required here.
//   - "Recently Viewed"  -> NOT computable from existing frontend state.
//                           The codebase has no view-history tracker in
//                           FAQContext; the home-page "Recently Viewed"
//                           surface is not implemented. We render "—"
//                           with an accessible tooltip explaining the
//                           limitation, instead of inventing a number.
// ---------------------------------------------------------------------------

const PUBLISHED_STATUSES = new Set(["resolved", "approved", "published"]);

function isPublished(question) {
  return PUBLISHED_STATUSES.has(String(question.status || "").toLowerCase());
}

function QuickLinks() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  // Counts default to 0 so the layout stays stable when data is missing
  // (e.g. before FAQContext has loaded, or while the user is anonymous).
  let myCount = 0;
  let draftCount = 0;
  let publishedCount = 0;
  let bookmarkedCount = 0;

  if (user) {
    const userId = user.id ? String(user.id) : "";

    if (userId) {
      const list = Array.isArray(questions) ? questions : [];

      for (const q of list) {
        const qUserId = q.userId || q.user_id || q.authorId;
        if (qUserId && String(qUserId) === userId) {
          myCount += 1;
          if (isPublished(q)) publishedCount += 1;
          else draftCount += 1;
        }
        if (q.bookmarked) bookmarkedCount += 1;
      }
    }
  }

  const quickLinks = [
    {
      label: "My FAQs",
      count: myCount,
      Icon: () => <MessagePlusIcon size={15} color="#64748b" />
    },
    {
      label: "Draft FAQs",
      count: draftCount,
      Icon: () => <PencilIcon size={15} color="#64748b" />
    },
    {
      label: "Published FAQs",
      count: publishedCount,
      Icon: () => <SendIcon size={15} color="#64748b" />
    },
    {
      label: "Bookmarked FAQs",
      count: bookmarkedCount,
      Icon: () => <BookmarkIcon size={15} color="#64748b" />
    },
    {
      label: "Recently Viewed",
      count: "—",
      Icon: () => <ClockIcon size={15} color="#64748b" />,
      countTitle:
        "Recently viewed history isn't tracked yet, so a count isn't available from the existing frontend data."
    }
  ];

  return (
    <div className="quick-links-card profile-card">
      <h3 className="quick-links-heading">Quick Links</h3>
      <div className="quick-links">
        {quickLinks.map((link) => (
          <button key={link.label} className="quick-link-row">
            <span className="quick-link-icon"><link.Icon /></span>
            <span className="quick-link-label">{link.label}</span>
            <span
              className="quick-link-count"
              title={link.countTitle || undefined}
            >
              {link.count}
            </span>
            <span className="quick-link-arrow">
              <ChevronRightIcon size={15} color="#cbd5e1" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickLinks;