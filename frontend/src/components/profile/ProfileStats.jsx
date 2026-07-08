import {
  MessagePlusIcon, PencilIcon, SendIcon,
  MessageCircleIcon, EyeIcon, ThumbsUpIcon
} from "./ProfileIcons";
import { useFAQ } from "../../context/FAQContext";
import { useAuth } from "../../context/AuthContext";

/**
 * ProfileStats — Pass 1 wiring
 * ---------------------------
 * Data sources available today (no new endpoints):
 *   - AuthContext.user          -> questionsCount, answersCount, reputation, role, id, ...
 *   - FAQContext.questions[]    -> items authored by the user with .views,
 *                                  and nested .answers[].userId / .votes
 *
 * Per-stat wiring:
 *   FAQs Created        LIVE   -> user.questionsCount (from /api/auth/me)
 *   FAQs Edited         FALLBACK = 0
 *      Reason: the backend has no endpoint that returns the count of
 *      FAQ-revision records authored by a given user, and the contributor
 *      leaderboard doesn't carry this metric either. Requires a new
 *      aggregation endpoint (planned for Pass 2).
 *
 *   Answers Submitted   LIVE   -> user.answersCount (from /api/auth/me)
 *   Comments Added      FALLBACK = 0
 *      Reason: there is no Comment model in the backend — no Comment
 *      schema in backend/models, no /api/comments routes, no count
 *      anywhere in /auth/me or the contributor leaderboard. Requires a
 *      new model + endpoints (planned for Pass 3).
 *
 *   Total Views         LIVE-ish -> sum of `.views` on the user's items in
 *                                   FAQContext, filtered by user.id
 *      Reason for fallback inside the formula: the Mongo FAQ / Query
 *      models don't currently expose a `views` field, so backend-sourced
 *      items report 0. The legacy q*12 + a*15 estimator was removed in
 *      favour of an honest 0 — once views tracking is added to the
 *      backend this stat will populate automatically.
 *
 *   Helpful Votes       LIVE-ish -> sum of `.votes` across the user's
 *                                   answers in FAQContext (answers are
 *                                   nested inside their parent question)
 *      Reason for fallback: same as Total Views — if the nested answers
 *      array isn't populated for backend-sourced data, the sum will be
 *      0 until answers are loaded alongside their question.
 */
function ProfileStats() {
  const { questions } = useFAQ();
  const { user } = useAuth();

  if (!user) return null;

  // Reliable identifier instead of the previous name-based lookup.
  // Auth payload gives us the canonical user id; FAQ items store it as
  // userId / user_id / authorId depending on source, so we normalize.
  const userId = user.id ? String(user.id) : "";

  const myItems = (questions || []).filter((q) => {
    const qUserId = q.userId || q.user_id || q.authorId;
    if (!qUserId || !userId) return false;
    return String(qUserId) === userId;
  });

  const totalViews = myItems.reduce(
    (sum, q) => sum + (Number(q.views) || 0),
    0
  );

  const helpfulVotes = (questions || []).reduce((sum, q) => {
    const answerVotes = (q.answers || []).reduce((aSum, ans) => {
      const ansUserId = ans.userId || ans.user_id || ans.authorId;
      if (!ansUserId || !userId) return aSum;
      if (String(ansUserId) !== userId) return aSum;
      return aSum + (Number(ans.votes) || 0);
    }, 0);
    return sum + answerVotes;
  }, 0);

  const stats = [
    {
      label: "FAQs Created",
      value: Number(user.questionsCount) || 0,
      Icon: () => <MessagePlusIcon size={18} color="#2563eb" />
    },
    {
      label: "FAQs Edited",
      // FALLBACK: see component docstring — no backend aggregation yet.
      value: 0,
      Icon: () => <PencilIcon size={18} color="#2563eb" />
    },
    {
      label: "Answers Submitted",
      value: Number(user.answersCount) || 0,
      Icon: () => <SendIcon size={18} color="#2563eb" />
    },
    {
      label: "Comments Added",
      // FALLBACK: see component docstring — no Comment model exists.
      value: 0,
      Icon: () => <MessageCircleIcon size={18} color="#2563eb" />
    },
    {
      label: "Total Views",
      value: totalViews,
      Icon: () => <EyeIcon size={18} color="#2563eb" />
    },
    {
      label: "Helpful Votes",
      value: helpfulVotes,
      Icon: () => <ThumbsUpIcon size={18} color="#2563eb" />
    },
  ];

  return (
    <section className="profile-stats-row">
      {stats.map((s) => (
        <div key={s.label} className="profile-stat-card">
          <div className="stat-icon-wrap">
            <s.Icon />
          </div>
          <div className="stat-text">
            <h3>{s.value}</h3>
            <p>{s.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default ProfileStats;