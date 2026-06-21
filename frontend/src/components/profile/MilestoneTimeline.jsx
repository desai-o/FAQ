import "./MilestoneTimeline.css";
import { MILESTONES, getMilestoneProgress } from "./milestones";

function LoadingState() {
  return (
    <div className="milestone-timeline-row">
      {MILESTONES.map((_, i) => (
        <div key={i} className="milestone-stop">
          <div className="milestone-skeleton-dot" />
          <div className="milestone-skeleton-label" />
        </div>
      ))}
    </div>
  );
}

export default function MilestoneTimeline({ reputation, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="milestone-timeline-card">
        <span className="milestone-timeline-title">Milestone Roadmap</span>
        <LoadingState />
      </div>
    );
  }

  const { current, progressPercent } = getMilestoneProgress(reputation);

  const currentIndex = MILESTONES.findIndex((m) => m.name === current.name);
  const segmentWidth = 100 / (MILESTONES.length - 1);
  const overallProgressPercent =
    currentIndex * segmentWidth + (progressPercent / 100) * segmentWidth;

  return (
    <div className="milestone-timeline-card">
      <span className="milestone-timeline-title">Milestone Roadmap</span>

      <div className="milestone-timeline-row">
        <div className="milestone-track">
          <div className="milestone-track-fill" style={{ width: `${overallProgressPercent}%` }} />
        </div>

        <div className="milestone-dots">
          {MILESTONES.map((milestone) => {
            let status = "upcoming";
            if (milestone.threshold < current.threshold) status = "past";
            if (milestone.name === current.name) status = "current";

            return (
              <div key={milestone.name} className={`milestone-stop milestone-${status}`}>
                <div className="milestone-dot" />
                <div className="milestone-label">{milestone.name}</div>
                <div className="milestone-threshold">{milestone.threshold.toLocaleString()} pts</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}