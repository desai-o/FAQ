import { useState, useEffect, useRef } from "react";
import { useFAQ } from "../context/FAQContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../context/AuthContext";
import { fetchNotifications, markNotificationsAsRead, markNotificationAsRead } from "../api/faqApi";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className={`theme-toggle-btn ${theme}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="theme-icon-container">
        {/* Sun Icon */}
        <svg 
          className="sun-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>

        {/* Moon Icon */}
        <svg 
          className="moon-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </button>
  );
}


function getNotificationId(notification) {
  return notification.id || notification._id;
}

function isNotificationRead(notification) {
  return Boolean(notification.isRead ?? notification.is_read);
}

function getNotificationCreatedAt(notification) {
  return notification.createdAt || notification.created_at;
}

function Topbar({ openModal }) {
  const { searchQuery, setSearchQuery } = useFAQ();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMarkingNotificationsRead, setIsMarkingNotificationsRead] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications()
      .then((data) => {
        if (data?.data) {
          setNotifications(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
      });
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !isNotificationRead(notification)
  ).length;

  async function handleOpenNotifications() {
    const nextShow = !showDropdown;
    setShowDropdown(nextShow);

    if (!nextShow || unreadCount === 0 || !user || isMarkingNotificationsRead) {
      return;
    }

    setIsMarkingNotificationsRead(true);

    try {
      await markNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    } finally {
      setIsMarkingNotificationsRead(false);
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    if (!notificationId) return;

    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          getNotificationId(notification) === notificationId
            ? {
                ...notification,
                isRead: true,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
  }

  return (
    <header className="topbar">
      <form onSubmit={handleSearchSubmit} className="search-box">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          placeholder="Search questions, topics, contributors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="topbar-actions">
        <div className="topbar-notifications" ref={dropdownRef}>
          <button
            className="notif-btn"
            onClick={handleOpenNotifications}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {showDropdown && (
            <div
              className="notification-dropdown"
              role="menu"
              aria-label="Notifications"
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color, #e5e7eb)",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  Notifications
                </h4>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={getNotificationId(notification)}
                      onClick={() =>
                        handleMarkNotificationRead(
                          getNotificationId(notification)
                        )
                      }
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        cursor: "pointer",
                        backgroundColor: isNotificationRead(notification)
                          ? "transparent"
                          : "var(--surface-secondary)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "var(--text-primary)",
                          lineHeight: 1.4,
                        }}
                      >
                        {notification.message ||
                          "Someone interacted with your post."}
                      </p>

                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {new Date(
                          getNotificationCreatedAt(notification)
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <button className="ask-btn" onClick={openModal}>
          + Ask Question
        </button>

        {user ? (
          <div style={{ position: "relative" }}>
            <div
              className="avatar"
              style={{ cursor: "pointer" }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {getInitials(user.name)}
            </div>

            <ProfileDropdown
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
            />
          </div>
        ) : (
          <button
            className="signin-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
export default Topbar;