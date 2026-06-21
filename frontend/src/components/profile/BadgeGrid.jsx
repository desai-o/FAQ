import "./BadgeGrid.css";
import { BADGES, isBadgeEarned, formatEarnedDate } from "./badges";

// ─── Icon components (same set as BadgesTab.jsx) ───────────────────────────
const IconPeople = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);
const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconFlame = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconThumb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
  lock: IconLock,
};

// ─── Single badge card ───────────────────────────────────────────────────
function BadgeCard({ badge }) {
  const earned = isBadgeEarned(badge);
  // Locked badges always show the lock icon, regardless of their "real" icon —
  // this matches the screenshot, where "Guru" shows a lock, not a trophy.
  const IconComponent = earned ? ICONS[badge.icon] : ICONS.lock;
  const colorClass = earned ? `badge-color-${badge.color}` : "badge-color-gray";

  return (
    <div className={`badge-card ${earned ? "badge-earned" : "badge-locked"}`}>
      <div className={`badge-icon-circle ${colorClass}`}>
        <IconComponent />
      </div>
      <strong className="badge-name">{badge.name}</strong>
      <span className="badge-description">{badge.description}</span>
      <span className="badge-earned-date">{formatEarnedDate(badge.earnedDate)}</span>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────
function BadgeGridEmpty() {
  return (
    <div className="badge-grid-empty">
      <p>No badges to show yet. Start contributing to earn your first badge!</p>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────
function BadgeGridLoading() {
  return (
    <div className="badge-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="badge-card badge-skeleton">
          <div className="badge-skeleton-circle" />
          <div className="badge-skeleton-line" style={{ width: "70%" }} />
          <div className="badge-skeleton-line" style={{ width: "90%" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export default function BadgeGrid({ badges = BADGES, isLoading = false, totalBadgeCount }) {
  if (isLoading) {
    return (
      <div className="badge-grid-card">
        <div className="badge-grid-head">
          <div>
            <div className="badge-grid-title">Badges Earned</div>
            <div className="badge-grid-subtitle">Loading...</div>
          </div>
        </div>
        <BadgeGridLoading />
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="badge-grid-card">
        <div className="badge-grid-head">
          <div className="badge-grid-title">Badges Earned</div>
        </div>
        <BadgeGridEmpty />
      </div>
    );
  }

  const earnedCount = badges.filter(isBadgeEarned).length;
  // totalBadgeCount lets the count reflect a larger catalog than what's
  // currently loaded (e.g. "7 of 18") — falls back to badges.length if not given.
  const total = totalBadgeCount ?? badges.length;

  return (
    <div className="badge-grid-card">
      <div className="badge-grid-head">
        <div>
          <div className="badge-grid-title">Badges Earned</div>
          <div className="badge-grid-subtitle">
            {earnedCount} of {total} badges earned
          </div>
        </div>
      </div>

      <div className="badge-grid">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}