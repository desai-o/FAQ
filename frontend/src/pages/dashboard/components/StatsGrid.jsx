const stats = [
  {
    icon: "💬",
    value: "12.8K",
    label: "Questions Asked",
    color: "black",
  },
  {
    icon: "👥",
    value: "3.2K",
    label: "Active Members",
    color: "black",
  },
  {
    icon: "📈",
    value: "42K",
    label: "Answers Posted",
    color: "black",
  },
];

function StatsGrid() {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <div className={`stat-icon ${stat.color}`}>
            {stat.icon}
          </div>

          <div className="stat-number">
            {stat.value}
          </div>

          <div className="stat-label">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;