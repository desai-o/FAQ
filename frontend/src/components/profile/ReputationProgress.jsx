import "./ReputationProgress.css";
import { useTheme } from "../../context/ThemeContext";
import { getMilestoneProgress } from "./milestones";


export default function ReputationProgress({ reputation, isLoading = false }) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="rep-card" data-theme={theme}>
        <div className="rep-skeleton-line" style={{ width: "40%" }} />
        <div className="rep-skeleton-bar" />
        <div className="rep-skeleton-line" style={{ width: "60%" }} />
      </div>
    );
  }

  const { current, next, progressPercent, pointsRemaining, reputation: rep } =
    getMilestoneProgress(reputation);

  return (
    <div className="rep-card">
      <div className="rep-head">
        <span className="rep-title">Your Reputation</span>
      </div>

      <div className="rep-score-row">
        <div>
          <div className="rep-score">{rep.toLocaleString()}</div>
          <div className="rep-score-label">Current Reputation</div>
        </div>
        <div className="rep-level-badge">{current.name}</div>
      </div>

      <div className="rep-progress-track">
        <div
          className="rep-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {next ? (
        <div className="rep-progress-caption">
          {progressPercent}% to <strong>{next.name}</strong> ({pointsRemaining.toLocaleString()} points to go)
        </div>
      ) : (
        <div className="rep-progress-caption">
          You've reached the highest level — <strong>{current.name}</strong>
        </div>
      )}
    </div>
  );
}