const TYPE_ICONS = {
  answer_received: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  question_followed: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  mention: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9v-1.17a2.83 2.83 0 0 0-5.66 0V12"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
};

const TYPE_COLORS = {
  answer_received: "notif-type-answer",
  question_followed: "notif-type-follow",
  mention: "notif-type-mention",
  warning: "notif-type-warning",
  system: "notif-type-system",
};

function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationCard({ notification, onMarkRead, onDelete }) {
  const { id, type, title, description, isRead, createdAt } = notification;

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(id);
    }
  };

  return (
    <div
      className={`notif-card ${isRead ? "notif-read" : "notif-unread"} ${TYPE_COLORS[type] || ""}`}
      onClick={handleClick}
    >
      <div className="notif-card-indicator">
        {!isRead && <span className="notif-unread-dot" />}
      </div>
      <div className={`notif-card-icon ${TYPE_COLORS[type] || ""}`}>
        {TYPE_ICONS[type] || TYPE_ICONS.system}
      </div>
      <div className="notif-card-body">
        <div className="notif-card-header">
          <span className="notif-card-title">{title}</span>
          <span className="notif-card-time">{formatTimeAgo(createdAt)}</span>
        </div>
        <p className="notif-card-desc">{description}</p>
      </div>
      <div className="notif-card-actions">
        {!isRead && (
          <button
            className="notif-action-btn notif-mark-read"
            title="Mark as read"
            onClick={(e) => { e.stopPropagation(); onMarkRead?.(id); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        )}
        <button
          className="notif-action-btn notif-delete"
          title="Delete notification"
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  );
}

export default NotificationCard;
