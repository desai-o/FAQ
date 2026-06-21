// Milestone thresholds — the reputation points needed to reach each level.
// Static for now; can later be moved to a backend config or database table.
export const MILESTONES = [
  { name: "Beginner",            threshold: 0 },
  { name: "Contributor",         threshold: 100 },
  { name: "Trusted Contributor", threshold: 500 },
  { name: "Expert",              threshold: 1000 },
  { name: "Community Leader",    threshold: 2500 },
];

// Given a reputation number, figure out:
// - which milestone the user currently sits in (the highest one they've passed)
// - the next milestone they're working toward (or null if they're at the max)
// - how far along they are toward that next milestone, as a percentage
export function getMilestoneProgress(reputation) {
  // Defensive: treat missing/invalid reputation as 0 rather than crashing.
  const rep = typeof reputation === "number" && !isNaN(reputation) ? reputation : 0;

  // Find the current milestone: the last one whose threshold the user has reached.
  let current = MILESTONES[0];
  let next = MILESTONES[1] || null;

  for (let i = 0; i < MILESTONES.length; i++) {
    if (rep >= MILESTONES[i].threshold) {
      current = MILESTONES[i];
      next = MILESTONES[i + 1] || null;
    }
  }

  // If there's no next milestone, the user has hit the top level.
  if (!next) {
    return {
      current,
      next: null,
      progressPercent: 100,
      pointsRemaining: 0,
      reputation: rep,
    };
  }

  const rangeStart = current.threshold;
  const rangeEnd = next.threshold;
  const rangeSize = rangeEnd - rangeStart;
  const earnedInRange = rep - rangeStart;

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((earnedInRange / rangeSize) * 100))
  );

  const pointsRemaining = Math.max(0, rangeEnd - rep);

  return {
    current,
    next,
    progressPercent,
    pointsRemaining,
    reputation: rep,
  };
}