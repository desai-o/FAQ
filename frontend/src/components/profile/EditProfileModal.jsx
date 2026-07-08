import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

// ---------------------------------------------------------------------------
// EditProfileModal — controlled modal for editing the current user's profile
// ---------------------------------------------------------------------------
// Opens from the "Edit Profile" button in ProfileHeader. Lets the user edit
// username (required, 3–30 chars, [a-zA-Z0-9_-] — displayed separately
// from `name` on the profile header), name (required, 1–80 chars),
// location (optional, ≤80 chars), and bio (optional, ≤500 chars). Save
// delegates to AuthContext.updateProfile(), which PATCHes /auth/me and
// merges the returned user into context, so the Profile page reflects the
// new values as soon as the modal closes.
//
// UX notes:
//   - Local form state hydrates from the current user each time the modal
//     opens (or when the user changes underneath) so re-opening always
//     shows the latest data.
//   - Escape closes, backdrop click closes (only when not submitting to
//     avoid mid-save losses), Cancel button closes.
//   - All inputs and the Save button are disabled while submitting.
//   - Inline error message for validation failures and thrown errors.
//   - ARIA: role="dialog" + aria-modal="true" + aria-labelledby on title.
//   - Reuses existing classes (.profile-card, .card-header-row,
//     .auth-form-group, .auth-input, .auth-submit-btn, .auth-error-msg).
//     No new CSS needed.
// ---------------------------------------------------------------------------

const NAME_MAX = 80;
const BIO_MAX = 500;
const LOCATION_MAX = 80;
// Username is a separate display handle, distinct from `name`. The server
// (PATCH /auth/me) enforces the same 3–30 / [a-zA-Z0-9_-] rules; these
// constants are kept here so the inline validation matches exactly.
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Hydrate form fields from the current user whenever the modal opens.
  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setLocation(user.location || "");
    setError(null);
  }, [isOpen, user]);

  // Close on Escape (but never mid-save).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setError(`Name must be ${NAME_MAX} characters or fewer.`);
      return;
    }
    const trimmedUsername = username.trim();
    if (
      trimmedUsername.length < USERNAME_MIN ||
      trimmedUsername.length > USERNAME_MAX
    ) {
      setError(
        `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters.`
      );
      return;
    }
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError(
        "Username can only contain letters, numbers, underscores, and dashes."
      );
      return;
    }
    if (bio.length > BIO_MAX) {
      setError(`Bio must be ${BIO_MAX} characters or fewer.`);
      return;
    }
    if (location.length > LOCATION_MAX) {
      setError(`Location must be ${LOCATION_MAX} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        username: trimmedUsername,
        name: trimmedName,
        bio,
        location
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Couldn't save your changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = BIO_MAX - bio.length;

  return (
    <div
      className="edit-profile-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
    >
      <form
        onSubmit={handleSave}
        className="profile-card edit-profile-modal"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "20px",
          background: "var(--bg-primary, #fff)",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)"
        }}
      >
        <div className="card-header-row" style={{ marginBottom: "12px" }}>
          <h3 id="edit-profile-modal-title" style={{ margin: 0 }}>
            Edit Profile
          </h3>
        </div>

        <div className="auth-form-group" style={{ marginBottom: "12px" }}>
          <label
            htmlFor="edit-profile-name"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px"
            }}
          >
            Name
          </label>
          <input
            id="edit-profile-name"
            type="text"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={NAME_MAX}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div className="auth-form-group" style={{ marginBottom: "12px" }}>
          <label
            htmlFor="edit-profile-username"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px"
            }}
          >
            Username
          </label>
          <input
            id="edit-profile-username"
            type="text"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            required
            placeholder="e.g. alex_k"
            autoComplete="username"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          />
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-secondary, #64748b)",
              marginTop: "4px"
            }}
          >
            {USERNAME_MIN}–{USERNAME_MAX} chars · letters, numbers, underscores, dashes
          </div>
        </div>

        <div className="auth-form-group" style={{ marginBottom: "12px" }}>
          <label
            htmlFor="edit-profile-location"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px"
            }}
          >
            Location
          </label>
          <input
            id="edit-profile-location"
            type="text"
            className="auth-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={submitting}
            maxLength={LOCATION_MAX}
            placeholder="City, country, or timezone"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div className="auth-form-group" style={{ marginBottom: "12px" }}>
          <label
            htmlFor="edit-profile-bio"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px"
            }}
          >
            Bio
          </label>
          <textarea
            id="edit-profile-bio"
            className="auth-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={submitting}
            maxLength={BIO_MAX}
            rows={4}
            placeholder="Tell the community a little about yourself"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
          <div
            style={{
              fontSize: "11px",
              color:
                remaining < 0
                  ? "#ef4444"
                  : "var(--text-secondary, #64748b)",
              textAlign: "right",
              marginTop: "4px"
            }}
          >
            {remaining} characters remaining
          </div>
        </div>

        {error && (
          <div
            className="auth-error-msg"
            role="alert"
            style={{
              padding: "8px 10px",
              marginBottom: "12px",
              borderRadius: "6px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "13px"
            }}
          >
            {error}
          </div>
        )}

        <div
          className="edit-profile-modal-actions"
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              background: "transparent",
              color: "var(--text-primary, #1e293b)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: "6px",
              background: submitting
                ? "#94a3b8"
                : "var(--accent-primary, #2563eb)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "Saving\u2026" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfileModal;
