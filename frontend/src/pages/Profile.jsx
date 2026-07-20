import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME } from "../config";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "activity", label: "Activity" },
  { key: "account", label: "Account" },
];

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  if (!user) {
    return (
      <div className="profile-guard">
        <h2>You're not signed in</h2>
        <p>Sign in to view and edit your profile.</p>
        <Link to="/login" className="profile-cta">Sign in</Link>
      </div>
    );
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ name, bio, avatar });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 200) {
      setMessage({ type: "error", text: "Image must be under 200KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage(null);
    const data = new FormData(e.currentTarget);
    const currentPassword = data.get("currentPassword");
    const newPassword = data.get("newPassword");
    const confirm = data.get("confirm");
    if (newPassword !== confirm) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage({ type: "success", text: "Password changed successfully." });
      e.currentTarget.reset();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    const ok = window.confirm("This will permanently delete your account. Continue?");
    if (!ok) return;
    deleteAccount();
    navigate("/", { replace: true });
  }

  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "—";

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {avatar && avatar.startsWith("data:") ? (
            <img src={avatar} alt="avatar" />
          ) : (
            <span>{(avatar || user.name || user.email || "U").charAt(0).toUpperCase()}</span>
          )}
          <button type="button" className="profile-avatar-edit" onClick={() => fileRef.current?.click()} aria-label="Change avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarFile} />
        </div>
        <div className="profile-header-info">
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-meta">Member since {joined} · {user.provider === "google" ? "Google account" : "Email account"}</p>
        </div>
      </div>

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`profile-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => { setActiveTab(t.key); setMessage(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className={`profile-message profile-message-${message.type}`}>{message.text}</div>}

      {activeTab === "profile" && (
        <form className="profile-form" onSubmit={handleSaveProfile}>
          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Initials (avatar fallback)
            <input value={avatar} onChange={(e) => setAvatar(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="JD" />
          </label>
          <label>
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell the community a bit about yourself..." />
          </label>
          <button type="submit" className="profile-submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}

      {activeTab === "security" && (
        <form className="profile-form" onSubmit={handleChangePassword}>
          <label>
            Current password
            <input name="currentPassword" type="password" required autoComplete="current-password" />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <label>
            Confirm new password
            <input name="confirm" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <button type="submit" className="profile-submit" disabled={saving}>
            {saving ? "Updating..." : "Change password"}
          </button>
        </form>
      )}

      {activeTab === "activity" && (
        <div className="profile-activity">
          <div className="profile-activity-empty">
            <span>📈</span>
            <h3>Your activity will appear here</h3>
            <p>As you ask, answer, and bookmark questions, your activity timeline will populate automatically.</p>
            <Link to="/questions" className="profile-cta">Browse questions</Link>
          </div>
        </div>
      )}

      {activeTab === "account" && (
        <div className="profile-account">
          <div className="profile-account-row">
            <div>
              <h4>Sign out</h4>
              <p>You'll need to sign back in to access your account.</p>
            </div>
            <button className="profile-btn-secondary" onClick={() => { logout(); navigate("/"); }}>Sign out</button>
          </div>
          <div className="profile-account-row profile-account-danger">
            <div>
              <h4>Delete account</h4>
              <p>Permanently delete your {APP_NAME} account and all associated data.</p>
            </div>
            <button className="profile-btn-danger" onClick={handleDelete}>Delete account</button>
          </div>
        </div>
      )}
    </div>
  );
}