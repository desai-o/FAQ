import "./NextBadgeCard.css";
import { BADGES, getNextBadgeToUnlock } from "./badges";

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function AllEarnedState() {
  return (
    <div className="next-badge-empty">
      <p>You've earned every badge — incredible work!</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="next-badge-row">
      <div className="next-badge-skeleton-circle" />
      <div style={{ flex: 1 }}>
        <div className="next-badge-skeleton-line" style={{ width: "60%" }} />
        <div className="next-badge-skeleton-line" style={{ width: "85%" }} />
      </div>
    </div>
  );
}

export default function NextBadgeCard({ badges = BADGES, isLoading = false }) {
  const nextBadge = isLoading ? null : getNextBadgeToUnlock(badges);

  return (
    <div className="next-badge-card">
      <span className="next-badge-title">Next Badge</span>

      {isLoading ? (
        <LoadingState />
      ) : !nextBadge ? (
        <AllEarnedState />
      ) : (
        <div className="next-badge-row">
          <div className="next-badge-icon-circle">
            <IconLock />
          </div>
          <div>
            <div className="next-badge-name">{nextBadge.name}</div>
            <div className="next-badge-description">{nextBadge.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}