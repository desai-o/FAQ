import "./NextAchievementCard.css";
import { BADGES, getMostRecentBadge, formatEarnedDate } from "./badges";

// Reusing the same icon set as BadgeGrid.jsx. If you'd rather not duplicate
// these across files, we can extract them into a shared icons.js later —
// for now, keeping each component self-contained, same pattern as before.
const IconPeople = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconFlame = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconThumb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);
const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ICONS = {
  people: IconPeople,
  star: IconStar,
  book: IconBook,
  flame: IconFlame,
  target: IconTarget,
  thumb: IconThumb,
  chat: IconChat,
};

function EmptyState() {
  return (
    <div className="next-achievement-empty">
      <p>No badges earned yet — your first one is waiting!</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="next-achievement-row">
      <div className="next-achievement-skeleton-circle" />
      <div style={{ flex: 1 }}>
        <div className="next-achievement-skeleton-line" style={{ width: "60%" }} />
        <div className="next-achievement-skeleton-line" style={{ width: "85%" }} />
        <div className="next-achievement-skeleton-line" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export default function NextAchievementCard({ badges = BADGES, isLoading = false }) {
  const recentBadge = isLoading ? null : getMostRecentBadge(badges);
  const IconComponent = recentBadge ? ICONS[recentBadge.icon] : null;
  const colorClass = recentBadge ? `badge-color-${recentBadge.color}` : "";

  return (
    <div className="next-achievement-card">
      <span className="next-achievement-title">Recent Badge</span>

      {isLoading ? (
        <LoadingState />
      ) : !recentBadge ? (
        <EmptyState />
      ) : (
        <div className="next-achievement-row">
          <div className={`next-achievement-icon-circle ${colorClass}`}>
            <IconComponent />
          </div>
          <div>
            <div className="next-achievement-name">{recentBadge.name}</div>
            <div className="next-achievement-description">{recentBadge.description}</div>
            <div className="next-achievement-date">{formatEarnedDate(recentBadge.earnedDate)}</div>
          </div>
        </div>
      )}
    </div>
  );
}