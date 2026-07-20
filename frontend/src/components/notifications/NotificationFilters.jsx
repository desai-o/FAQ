const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "answers", label: "Answers" },
  { key: "questions", label: "Questions" },
  { key: "warnings", label: "Warnings" },
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

function NotificationFilters({ activeFilter, sortBy, onFilterChange, onSortChange }) {
  return (
    <div className="notif-filters">
      <div className="notif-filter-chips">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`notif-filter-chip ${activeFilter === f.key ? "chip-active" : ""}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="notif-sort">
        <span className="notif-sort-label">Sort:</span>
        <select
          className="notif-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default NotificationFilters;
