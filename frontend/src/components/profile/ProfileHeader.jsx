import { PencilIcon, UsersIcon, MapPinIcon, MailIcon } from "./ProfileIcons";
import { useAuth } from "../../context/AuthContext";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

// Placeholders used while the corresponding fields are not yet exposed by
// the backend. Pass 1 reads from AuthContext.user, which today carries
// id/name/email/role/questionsCount/answersCount/reputation/storage — it
// does NOT carry bio, location, createdAt, or cohort yet. Each of those
// falls back to the placeholder below so the UI stays consistent with the
// original design.
const DEFAULT_BIO =
  "I love asking questions, sharing answers, and contributing to the open-source community knowledge base.";
const PLACEHOLDER_LOCATION = "Location not set";
const PLACEHOLDER_MEMBER_SINCE = "Recently";

// Maps the auth role to the badge label shown next to the display name.
// Students and alumni keep the original "Contributor" label; staff are
// labeled more specifically so the badge accurately reflects privileges.
const ROLE_BADGE_LABELS = {
  student: "Contributor",
  alumni: "Contributor",
  moderator: "Moderator",
  admin: "Admin",
};

// Headline that appears under the @handle. Each role gets a phrasing that
// stays inside the same visual footprint as the original hardcoded string.
const ROLE_TITLES = {
  student: "Developer & Contributor",
  alumni: "Alumni & Contributor",
  moderator: "Moderator",
  admin: "Administrator",
};

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

// Format an ISO date like "2026-06-13T10:00:00.000Z" as "Jun 13, 2026".
// Returns null when the input isn't a valid date so the caller can pick a
// placeholder.
const formatMemberSince = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

function ProfileHeader() {
  const { user } = useAuth();

  if (!user) return null;

  const handle = `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const role = (user.role || "student").toLowerCase();

  // Live data (already on AuthContext.user)
  const badgeLabel = ROLE_BADGE_LABELS[role] || capitalize(role);
  const titleText = ROLE_TITLES[role] || "Community Member";

  // Placeholder fallbacks for fields Pass 1 hasn't exposed yet.
  const location = user.location || PLACEHOLDER_LOCATION;
  const bio = user.bio || DEFAULT_BIO;
  const memberSince = formatMemberSince(user.createdAt) || PLACEHOLDER_MEMBER_SINCE;

  return (
    <section className="profile-header-card">
      <div className="profile-header-left">
        <div className="profile-avatar-wrapper">
          <div
            className="profile-avatar-blank"
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-hover)",
              width: "100%",
              height: "100%",
              borderRadius: "50%"
            }}
          >
            {getInitials(user.name)}
          </div>
          <button className="avatar-edit-btn" aria-label="Edit photo">
            <PencilIcon size={11} color="#64748b" />
          </button>
        </div>

        <div className="profile-user-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{user.name}</h2>
            <span className="profile-pro-badge">{badgeLabel}</span>
          </div>
          <p className="profile-handle">{handle}</p>
          <p className="profile-title">{titleText} at CrowdFAQ</p>
          <div className="profile-meta">
            <span className="profile-meta-item">
              <MapPinIcon size={13} color="#9ca3af" /> {location}
            </span>
            <span className="profile-meta-item">
              <UsersIcon size={13} color="#9ca3af" /> Community Member
            </span>
          </div>
          <p className="profile-bio">{bio}</p>
          <a href={`mailto:${user.email}`} className="profile-email-link">
            <MailIcon size={13} color="#2563eb" />
            {user.email}
          </a>
        </div>
      </div>

      <div className="profile-header-right">
        <button className="edit-profile-btn">
          <PencilIcon size={13} color="#374151" /> Edit Profile
        </button>
        <div className="profile-details-grid">
          {[
            ["Username",     handle],
            ["Email",        user.email],
            ["Role",         capitalize(role)],
            ["Storage Mode", user.storage === "mongodb" ? "MongoDB Atlas" : "SQLite Fallback"],
            ["Member since", memberSince],
          ].map(([label, value]) => (
            <div className="profile-detail-row" key={label}>
              <span className="detail-label">{label}</span>
              <span className="detail-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
