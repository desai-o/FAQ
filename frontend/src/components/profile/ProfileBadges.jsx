import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  TrophyIcon,
  StarIcon,
  RocketIcon,
  FlameIcon,
  TargetIcon,
  MedalIcon,
  PencilIcon,
  MessageCircleIcon,
  BarChartIcon,
} from "./ProfileIcons";

// Per-label styling that restores the original colored badge appearance
// (icon + accent color + background + ring color). The five original entries
// are preserved verbatim, and mappings are added for the live backend badge
// names emitted by `backend/services/badgeService.js` (First Question,
// First Answer, Century Contributor) so each earns a distinct look.
const BADGE_DEFINITIONS = [
  // --- Original hardcoded set (preserved exactly) ---
  { label: "Top Contributor",     Icon: TrophyIcon,        color: "#7C3AED", bg: "#EDE9FE", ring: "#C4B5FD" },
  { label: "Expert",              Icon: StarIcon,          color: "#1D4ED8", bg: "#DBEAFE", ring: "#93C5FD" },
  { label: "AI/ML Guru",          Icon: RocketIcon,        color: "#047857", bg: "#D1FAE5", ring: "#6EE7B7" },
  { label: "Hot Question",        Icon: FlameIcon,         color: "#B45309", bg: "#FEF3C7", ring: "#FCD34D" },
  { label: "Sharp Shooter",       Icon: TargetIcon,        color: "#B91C1C", bg: "#FEE2E2", ring: "#FCA5A5" },
  // --- Live backend badges ---
  { label: "First Question",      Icon: PencilIcon,        color: "#4F46E5", bg: "#E0E7FF", ring: "#A5B4FC" },
  { label: "First Answer",        Icon: MessageCircleIcon, color: "#0F766E", bg: "#CCFBF1", ring: "#5EEAD4" },
  { label: "Century Contributor", Icon: BarChartIcon,      color: "#BE185D", bg: "#FCE7F3", ring: "#F9A8D4" },
];

// Generic style for any badge label that isn't in BADGE_DEFINITIONS.
// Keeps the existing JSX/CSS structure intact while still rendering the
// badge, so nothing the backend returns is silently dropped.
const GENERIC_BADGE = {
  Icon: MedalIcon,
  color: "#475569",
  bg: "#F1F5F9",
  ring: "#CBD5E1",
};

function lookupBadge(label) {
  return BADGE_DEFINITIONS.find((b) => b.label === label) || { label, ...GENERIC_BADGE };
}

// Force every label to render on exactly two lines so all badges share the
// same vertical rhythm (matches "First Question" / "First Answer" alignment).
// Multi-word labels get a <br /> between each word; single-word labels get a
// trailing <br /> so they match the height of the multi-word ones.
function renderLabel(label) {
  const words = label.split(/\s+/);
  const nodes = [];
  words.forEach((word, i) => {
    if (i > 0) nodes.push(<br key={`br-${i}`} />);
    nodes.push(word);
  });
  if (words.length === 1) nodes.push(<br key="br-pad" />);
  return nodes;
}

// ---------------------------------------------------------------------------
// BadgeIcon — extracted rendering helper
// ---------------------------------------------------------------------------
// Reused by both the card preview (first N badges) and the "View all" modal
// (the full list), so a single change to the badge circle / label markup
// stays in sync across both surfaces.
// ---------------------------------------------------------------------------
function BadgeIcon({ badge }) {
  return (
    <div className="badge-icon-item">
      <div className="badge-circle" style={{ background: badge.bg, borderColor: badge.ring }}>
        <div className="badge-inner-ring" style={{ borderColor: badge.color + "30" }}>
          <badge.Icon size={20} color={badge.color} />
        </div>
      </div>
      <span className="badge-icon-label" style={{ color: badge.color }}>
        {renderLabel(badge.label)}
      </span>
    </div>
  );
}

// How many badges to surface directly in the card. Anything beyond this
// is reachable through the "View all" modal. 5 matches the original
// hardcoded card so users with the canonical badge set see the exact same
// preview they did before.
const PREVIEW_LIMIT = 5;

function ProfileBadges() {
  const { user } = useAuth();

  // Replace the original hardcoded `badges` list with the logged-in user's
  // actual badges. Known labels keep their original icon / colour; unknown
  // labels render with a generic MedalIcon and neutral palette.
  const badges = (Array.isArray(user?.badges) ? user.badges : []).map(lookupBadge);

  const [modalOpen, setModalOpen] = useState(false);

  // Escape-to-close + body-scroll lock, mirroring the pattern used by
  // AskQuestionModal.jsx. Only attached while the modal is open so the
  // rest of the Profile page keeps its normal scroll/keyboard behaviour.
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

  const previewBadges = badges.slice(0, PREVIEW_LIMIT);

  return (
    <div className="badges-card profile-card">
      <div className="card-header-row">
        <h3>Badges</h3>
        {badges.length > 0 && (
          <button
            type="button"
            className="view-all-btn"
            onClick={() => setModalOpen(true)}
          >
            View all{badges.length > PREVIEW_LIMIT ? ` (${badges.length})` : ""}
          </button>
        )}
      </div>
      <div className="badges-icon-row">
        {previewBadges.map((b) => (
          <BadgeIcon key={b.label} badge={b} />
        ))}
      </div>

      {modalOpen && (
        <div
          className="modal-overlay active"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          {/* Stop click propagation so clicks inside the modal don't
              bubble up to the overlay (which would close it). */}
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-badges-modal-title"
          >
            <div className="modal-header">
              <h2 id="all-badges-modal-title">All Badges</h2>
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
              {badges.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary, #64748b)",
                    padding: "16px 0",
                    fontSize: "14px"
                  }}
                >
                  You haven't earned any badges yet.
                </p>
              ) : (
                <div
                  className="badges-icon-row badges-modal-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "16px 12px",
                    maxHeight: "60vh",
                    overflowY: "auto",
                    padding: "8px 4px",
                    scrollbarWidth: "thin"
                  }}
                >
                  {badges.map((b) => (
                    <BadgeIcon key={b.label} badge={b} />
                  ))}
                </div>
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

export default ProfileBadges;