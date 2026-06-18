import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import { useFAQ } from "../context/FAQContext";

function Contributors() {
  const [showModal, setShowModal] = useState(false);
  const { contributors } = useFAQ();

  // Top 6 contributors for the cards
  const topContributors = contributors.slice(0, 6).map((c, idx) => {
    const medals = ["🥇", "🥈", "🥉"];
    return {
      ...c,
      rank: idx + 1,
      medal: medals[idx] || ""
    };
  });

  // Top 10 contributors for the full leaderboard list
  const leaderboard = contributors.slice(0, 10).map((c, idx) => ({
    ...c,
    rank: idx + 1
  }));

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        <main className="content">
          <h1 className="page-title">Top Contributors</h1>
          <p className="page-subtitle">Community leaders making a difference</p>

          <div className="contributors-grid">
            {topContributors.map((c) => (
              <div key={c.name} className={`contributor-card tier-${c.tier}`}>
                {c.medal && <span className="contributor-medal">{c.medal}</span>}
                <div className={`avatar large bg-${c.tier}`}>{c.avatar}</div>
                <h3 className="contributor-name">{c.name}</h3>
                <div className="contributor-stats">
                  <div className="contrib-stat">
                    <span className="contrib-stat-value">{c.answers}</span>
                    <span className="contrib-stat-label">Answers</span>
                  </div>
                  <div className="contrib-stat-divider"></div>
                  <div className="contrib-stat">
                    <span className="contrib-stat-value">{c.questions || 0}</span>
                    <span className="contrib-stat-label">Questions</span>
                  </div>
                </div>
                <div className="contributor-reputation">
                  ⭐ {c.reputation.toLocaleString()} reputation
                </div>
              </div>
            ))}
          </div>

          <section className="leaderboard-section">
            <h2 className="section-heading">Full Leaderboard</h2>
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Contributor</th>
                    <th>Tier</th>
                    <th>Answers</th>
                    <th>Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user) => (
                    <tr key={user.name}>
                      <td className="rank-cell">#{user.rank}</td>
                      <td className="user-cell">
                        <div className="avatar small">{user.avatar}</div>
                        <span>{user.name}</span>
                      </td>
                      <td>
                        <span className={`tier-badge ${user.tier}`}>{user.tier}</span>
                      </td>
                      <td>{user.answers}</td>
                      <td className="rep-cell">⭐ {user.reputation.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default Contributors;