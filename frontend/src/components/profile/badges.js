// Mock badge data — each badge knows its own unlock condition.
// "earnedDate: null" means the badge hasn't been unlocked yet.
// Replace this array with real data from your backend once that's ready;
// the shape (id, name, description, icon, earnedDate, color) should stay the same.
export const BADGES = [
  {
    id: "top-contributor",
    name: "Top Contributor",
    description: "Contributed to 100+ FAQs or answers",
    icon: "people",
    earnedDate: "2024-05-12",
    color: "purple",
  },
  {
    id: "expert",
    name: "Expert",
    description: "Received 500+ helpful votes",
    icon: "star",
    earnedDate: "2024-04-28",
    color: "blue",
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    description: "Viewed 1000+ articles or FAQs",
    icon: "book",
    earnedDate: "2024-03-16",
    color: "green",
  },
  {
    id: "hot-question",
    name: "Hot Question",
    description: "Asked a question with 50+ answers",
    icon: "flame",
    earnedDate: "2024-02-10",
    color: "orange",
  },
  {
    id: "sharp-shooter",
    name: "Sharp Shooter",
    description: "Answered 50+ questions correctly",
    icon: "target",
    earnedDate: "2024-01-22",
    color: "teal",
  },
  {
    id: "helpful-one",
    name: "Helpful One",
    description: "Received 200+ helpful votes",
    icon: "thumb",
    earnedDate: "2024-01-10",
    color: "yellow",
  },
  {
    id: "active-member",
    name: "Active Member",
    description: "Active for 30 days in a row",
    icon: "chat",
    earnedDate: "2023-12-05",
    color: "red",
  },
  {
    id: "guru",
    name: "Guru",
    description: "Earn 2000+ helpful votes",
    icon: "lock",
    earnedDate: null,
    color: "gray", // locked badges always render gray regardless of this value
  },
];

// Helper: is a badge earned?
export function isBadgeEarned(badge) {
  return Boolean(badge.earnedDate);
}

// Helper: format "2024-05-12" → "Earned on May 12, 2024"
export function formatEarnedDate(earnedDate) {
  if (!earnedDate) return "Locked";
  const date = new Date(earnedDate);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Earned on ${formatted}`;
}

// Helper: the most recently earned badge (used by the "Recent Badge" card)
export function getMostRecentBadge(badges) {
  const earned = badges.filter(isBadgeEarned);
  if (earned.length === 0) return null;
  return earned.reduce((latest, badge) =>
    new Date(badge.earnedDate) > new Date(latest.earnedDate) ? badge : latest
  );
}

// Helper: the next badge to unlock — the first locked badge in the list.
// Returns null if every badge is already earned.
export function getNextBadgeToUnlock(badges) {
  return badges.find((badge) => !isBadgeEarned(badge)) || null;
}