import { useFAQ } from "../context/FAQContext";
import { Link } from "react-router-dom";

function TrendingQuestions() {
  const { questions, upvoteQuestion } = useFAQ();

  // Get top 5 questions sorted by votes
  const trending = [...questions]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  return (
    <section className="trending-card">
      <div className="trending-header">
        <h2>Trending Questions</h2>
        <span className="hot-badge">🔥 Hot this week</span>
      </div>

      {trending.map((q, index) => (
        <div key={q.id}>
          <div className="question-item">
            <div className="vote-col">
              <button
                className={`upvote ${q.voted ? "upvoted" : ""}`}
                onClick={() => upvoteQuestion(q.id)}
              >
                ▲
              </button>
              <span className="vote-count">{q.votes}</span>
            </div>

            <div className="question-body">
              <div className="q-tags">
                {q.answers && q.answers.length > 0 && <span className="tag answered">✓ Answered</span>}
                <span className="tag category">{q.category}</span>
              </div>

              <h3 className="q-title">
                <Link to={`/questions/${q.id}`}>{q.title}</Link>
              </h3>

              <p className="q-excerpt">{q.excerpt}</p>

              <div className="q-footer">
                <div className="q-hashtags">
                  {q.hashtags.map((tag) => (
                    <span key={tag} className="hashtag">#{tag}</span>
                  ))}
                </div>
                <div className="q-meta">👤 {q.users || 12} &nbsp; {q.time}</div>
              </div>
            </div>
          </div>
          {index !== trending.length - 1 && <div className="divider"></div>}
        </div>
      ))}

      <div className="divider"></div>
      <div className="view-all-row">
        <Link to="/questions" className="view-all-link">View All Questions →</Link>
      </div>
    </section>
  );
}

export default TrendingQuestions;