import { useState, useMemo, useEffect, useCallback } from "react";
import NotificationCard from "./NotificationCard";
import NotificationGroup from "./NotificationGroup";
import NotificationFilters from "./NotificationFilters";
import NotificationSearch from "./NotificationSearch";

function getGroupLabel(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const noteDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (noteDate.getTime() === today.getTime()) return "Today";
    return "Yesterday";
  }
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return "This Week";
  if (diffDays < 30) return "This Month";
  return "Older";
}

function groupNotifications(notifs) {
  const groups = {};
  notifs.forEach((n) => {
    const label = getGroupLabel(n.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  const order = ["Today", "Yesterday", "This Week", "This Month", "Older"];
  return order.filter((l) => groups[l]).map((l) => ({ label: l, items: groups[l] }));
}

const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "answer_received", title: "New answer on your question", description: "Dr. Sarah Kim answered 'Best roadmap for AI/ML in 2026?'", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "n2", type: "question_followed", title: "Question you follow got updated", description: "Marcus Wei added a new answer to 'How does virtual memory work?'", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: "n3", type: "mention", title: "You were mentioned in a discussion", description: "Priya Sharma mentioned you in 'Top conferences to publish ML research'", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "n4", type: "warning", title: "Flagged content review", description: "Your question 'Rust vs Go for backend' received a flag for spam", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: "n5", type: "answer_received", title: "New answer on your question", description: "Prof. David Müller answered 'Intuition behind eigenvalues in PCA?'", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "n6", type: "system", title: "Welcome to CrowdFAQ!", description: "Thanks for joining. Complete your profile to get started.", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: "n7", type: "question_followed", title: "New activity in followed question", description: "New answer in 'Fine-tuning LLMs with limited compute budget?'", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: "n8", type: "answer_received", title: "Your answer was upvoted", description: "Your answer in 'Best roadmap for AI/ML' received 12 upvotes", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: "n9", type: "system", title: "Achievement unlocked: Helper", description: "You've answered 5 questions! Keep up the great work.", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
  { id: "n10", type: "warning", title: "Community guideline reminder", description: "Please ensure your questions follow our community guidelines", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString() },
];

function getStoredNotifications() {
  try {
    const stored = localStorage.getItem("crowdfaq_notifications");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt).toISOString() }));
    }
  } catch { }
  return null;
}

function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stored = getStoredNotifications();
    if (stored) {
      setNotifications(stored);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      try {
        localStorage.setItem("crowdfaq_notifications", JSON.stringify(MOCK_NOTIFICATIONS));
      } catch { }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const saveNotifications = useCallback((updated) => {
    setNotifications(updated);
    try {
      localStorage.setItem("crowdfaq_notifications", JSON.stringify(updated));
    } catch { }
  }, []);

  const handleMarkRead = useCallback((id) => {
    saveNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, [notifications, saveNotifications]);

  const handleMarkAllRead = useCallback(() => {
    saveNotifications(
      notifications.map((n) => ({ ...n, isRead: true }))
    );
  }, [notifications, saveNotifications]);

  const handleDelete = useCallback((id) => {
    saveNotifications(notifications.filter((n) => n.id !== id));
  }, [notifications, saveNotifications]);

  const handleClearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const filtered = useMemo(() => {
    let result = [...notifications];

    if (activeFilter === "unread") {
      result = result.filter((n) => !n.isRead);
    } else if (activeFilter === "answers") {
      result = result.filter((n) => n.type === "answer_received");
    } else if (activeFilter === "questions") {
      result = result.filter((n) => n.type === "question_followed");
    } else if (activeFilter === "warnings") {
      result = result.filter((n) => n.type === "warning");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? db - da : da - db;
    });

    return result;
  }, [notifications, activeFilter, sortBy, searchQuery]);

  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-center">
        <div className="notif-center-header">
          <div className="notif-center-title-row">
            <h2 className="notif-center-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount} new</span>
            )}
          </div>
          <div className="notif-center-actions">
            {unreadCount > 0 && (
              <button className="notif-header-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-header-btn notif-header-btn-danger" onClick={handleClearAll}>
                Clear all
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <NotificationSearch value={searchQuery} onChange={setSearchQuery} />
        <NotificationFilters
          activeFilter={activeFilter}
          sortBy={sortBy}
          onFilterChange={setActiveFilter}
          onSortChange={setSortBy}
        />

        <div className="notif-center-body">
          {loading && (
            <div className="notif-center-state">
              <div className="notif-spinner" />
              <p>Loading notifications...</p>
            </div>
          )}

          {error && (
            <div className="notif-center-state notif-center-error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <h3>Failed to load notifications</h3>
              <p>{error}</p>
              <button className="notif-retry-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="notif-center-state notif-center-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <h3>{searchQuery || activeFilter !== "all" ? "No matching notifications" : "No notifications yet"}</h3>
              <p>{searchQuery || activeFilter !== "all" ? "Try adjusting your search or filters." : "When you get notifications, they'll appear here."}</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            grouped.map((group) => (
              <NotificationGroup key={group.label} label={group.label}>
                {group.items.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </NotificationGroup>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationCenter;
