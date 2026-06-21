import { useState, useEffect } from "react";
import { fetchActivityStats, fetchHeatmapStats } from "../../api/faqApi";
import { useAuth } from "../../context/AuthContext";
import { useFAQ } from "../../context/FAQContext";

// ── Contribution Heatmap (52 weeks × 7 days) ──────────────────────────────────
function ContributionHeatmap({ heatmapData }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];

  const getColor = (interactions) => {
    if (!interactions || interactions === 0) return "var(--border, #e5e7eb)";
    if (interactions <= 1) return "#bbf7d0";
    if (interactions <= 3) return "#4ade80";
    if (interactions <= 6) return "#16a34a";
    return "#14532d";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <div style={{ width: 40 }} />
        {slots.map((slot) => (
          <div
            key={slot}
            style={{
              flex: 1,
              fontSize: 10,
              color: "var(--text-secondary, #6b7280)",
              textAlign: "center",
              minWidth: 36,
            }}
          >
            {slot}
          </div>
        ))}
      </div>

      {days.map((day) => (
        <div key={day} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
          <div
            style={{
              width: 40,
              fontSize: 11,
              color: "var(--text-secondary, #6b7280)",
              flexShrink: 0,
            }}
          >
            {day}
          </div>
          {slots.map((slot) => {
            const cell = heatmapData.find(
              (d) => d.day === day && d.time === slot
            );
            const count = cell ? cell.interactions : 0;
            return (
              <div
                key={slot}
                title={`${day} ${slot}: ${count} interactions`}
                style={{
                  flex: 1,
                  minWidth: 36,
                  height: 22,
                  borderRadius: 4,
                  backgroundColor: getColor(count),
                  cursor: "default",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              />
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, color: "var(--text-secondary, #6b7280)" }}>
        <span>Less</span>
        {["var(--border, #e5e7eb)", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"].map((color) => (
          <div key={color} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Weekly Bar Chart ──────────────────────────────────────────────────────────
function WeeklyActivityChart({ activityData }) {
  const labels = activityData.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const questions = activityData.questions || Array(7).fill(0);
  const answers = activityData.answers || Array(7).fill(0);
  const upvotes = activityData.upvotes || Array(7).fill(0);

  const maxVal = Math.max(...questions, ...answers, ...upvotes, 1);

  const barSets = [
    { label: "Questions", data: questions, color: "#2563eb" },
    { label: "Answers",   data: answers,   color: "#16a34a" },
    { label: "Upvotes",   data: upvotes,   color: "#f59e0b" },
  ];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {barSets.map(({ label, color }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary, #6b7280)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {labels.map((day, i) => (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>
              {barSets.map(({ data, color, label }) => {
                const pct = maxVal > 0 ? (data[i] / maxVal) * 100 : 0;
                return (
                  <div
                    key={label}
                    title={`${day} ${label}: ${data[i]}`}
                    style={{
                      width: 8,
                      height: `${Math.max(pct, 2)}%`,
                      backgroundColor: color,
                      borderRadius: "2px 2px 0 0",
                      transition: "height 0.4s ease",
                      cursor: "default",
                    }}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: 10, color: "var(--text-secondary, #6b7280)" }}>{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Streak Indicator ──────────────────────────────────────────────────────────
function StreakIndicator({ streak }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderRadius: 10,
      background: streak > 0
        ? "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,179,8,0.06))"
        : "var(--surface-secondary, #f9fafb)",
      border: `1px solid ${streak > 0 ? "rgba(245,158,11,0.35)" : "var(--border, #e5e7eb)"}`,
    }}>
      <span style={{ fontSize: 26 }}>{streak > 0 ? "🔥" : "💤"}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: streak > 0 ? "#f59e0b" : "var(--text-primary)" }}>
          {streak} day{streak !== 1 ? "s" : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary, #6b7280)" }}>
          {streak > 0 ? "Current streak" : "Start contributing to build a streak!"}
        </div>
      </div>
    </div>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ stats }) {
  const cards = [
    { label: "Total Questions",  value: stats.questions,  icon: "❓", color: "#2563eb" },
    { label: "Total Answers",    value: stats.answers,    icon: "💬", color: "#16a34a" },
    { label: "Total Bookmarks",  value: stats.bookmarks,  icon: "🔖", color: "#7c3aed" },
    { label: "Votes Received",   value: stats.votes,      icon: "👍", color: "#f59e0b" },
    { label: "Reputation",       value: stats.reputation, icon: "⭐", color: "#0d9488" },
    { label: "FAQs Created",     value: stats.faqs,       icon: "📋", color: "#dc2626" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: 12,
    }}>
      {cards.map(({ label, value, icon, color }) => (
        <div
          key={label}
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border, #e5e7eb)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div style={{ fontSize: 20, fontWeight: 700, color }}>
            {value ?? 0}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary, #6b7280)", lineHeight: 1.3 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "48px 24px",
      color: "var(--text-secondary, #6b7280)",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
        No activity yet
      </h3>
      <p style={{ fontSize: 14, maxWidth: 340, margin: "0 auto", lineHeight: 1.6 }}>
        Start asking questions or answering existing ones to build your profile activity.
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function ActivityVisualization() {
  const { user } = useAuth();
  const { contributors } = useFAQ();

  const [range, setRange] = useState("week");
  const [activityData, setActivityData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Derive user stats from context
  const currentUser = contributors.find((c) => c.name === user?.name) || {};
  const stats = {
    questions:  currentUser.questions  ?? user?.questionsCount ?? 0,
    answers:    currentUser.answers    ?? user?.answersCount   ?? 0,
    bookmarks:  currentUser.bookmarks  ?? 0,
    votes:      currentUser.votes      ?? Math.floor((currentUser.reputation ?? user?.reputation ?? 0) / 10),
    reputation: currentUser.reputation ?? user?.reputation    ?? 0,
    faqs:       currentUser.questions  ?? user?.questionsCount ?? 0,
  };

  const totalActivity = stats.questions + stats.answers + stats.faqs;

  // Calculate a simple streak from weekly data
  const calcStreak = (weeklyQuestions, weeklyAnswers) => {
    const combined = weeklyQuestions.map((q, i) => q + (weeklyAnswers[i] || 0));
    let streak = 0;
    for (let i = combined.length - 1; i >= 0; i--) {
      if (combined[i] > 0) streak++;
      else break;
    }
    return streak;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [activity, heatmap] = await Promise.all([
          fetchActivityStats(range),
          fetchHeatmapStats(range),
        ]);
        setActivityData(activity);
        setHeatmapData(heatmap.data || []);
      } catch (err) {
        console.error("Failed to load activity data:", err);
        setError("Could not load activity data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const streak = activityData
    ? calcStreak(activityData.questions || [], activityData.answers || [])
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Activity &amp; Contributions
        </h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border, #e5e7eb)",
            background: "var(--surface-secondary, #f9fafb)",
            color: "var(--text-primary)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-secondary, #6b7280)", fontSize: 14 }}>
          <span className="auth-spinner" style={{ display: "inline-block", marginRight: 8 }} />
          Loading activity data...
        </div>
      )}

      {/* Empty state for new users */}
      {!loading && totalActivity === 0 && !error && <EmptyState />}

      {/* Main content */}
      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="profile-card" style={{ padding: 20 }}>
            <div className="card-header-row" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Contribution Summary</h3>
              <StreakIndicator streak={streak} />
            </div>
            <SummaryCards stats={stats} />
          </div>

          {/* Weekly Chart */}
          {activityData && (
            <div className="profile-card" style={{ padding: 20 }}>
              <div className="card-header-row" style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Weekly Activity</h3>
                <span style={{ fontSize: 12, color: "var(--text-secondary, #6b7280)" }}>
                  {activityData.meta?.totalEvents || 0} total events
                </span>
              </div>
              <WeeklyActivityChart activityData={activityData} />
            </div>
          )}

          {/* Heatmap */}
          {heatmapData.length > 0 && (
            <div className="profile-card" style={{ padding: 20 }}>
              <div className="card-header-row" style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Activity Heatmap</h3>
                <span style={{ fontSize: 12, color: "var(--text-secondary, #6b7280)" }}>
                  By time of day
                </span>
              </div>
              <ContributionHeatmap heatmapData={heatmapData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityVisualization;