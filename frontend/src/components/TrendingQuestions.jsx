const questions = [
  {
    id: 1,
    votes: 142,
    answered: true,
    category: "Artificial Intelligence",
    title: "Best roadmap for AI/ML in 2026?",
    excerpt:
      "I'm a sophomore CS student and want to break into AI/ML. What's the best structured roadmap to follow in 2026?",
    hashtags: ["AI", "machine-learning", "roadmap"],
    users: 24,
    time: "2 days ago",
  },
  {
    id: 2,
    votes: 118,
    answered: true,
    category: "Programming",
    title: "How does virtual memory work at the OS level?",
    excerpt:
      "I understand the concept of virtual memory, but I want to dig deeper into the kernel-level mechanism.",
    hashtags: ["operating-systems", "memory", "low-level"],
    users: 18,
    time: "4 days ago",
  },
];

function TrendingQuestions() {
  return (
    <section className="trending-card">
      <div className="trending-header">
        <h2>Trending Questions</h2>
        <span className="hot-badge">
          ↗ Hot this week
        </span>
      </div>

      {questions.map((q, index) => (
        <div key={q.id}>
          <div className="question-item">
            <div className="vote-col">
              <button className="upvote">
                ⇧
              </button>

              <span className="vote-count">
                {q.votes}
              </span>
            </div>

            <div className="question-body">
              <div className="q-tags">

                {q.answered && (
                  <span className="tag answered">
                    ✓ Answered
                  </span>
                )}

                <span className="tag category">
                  {q.category}
                </span>

              </div>

              <h3 className="q-title">
                {q.title}
              </h3>

              <p className="q-excerpt">
                {q.excerpt}
              </p>

              <div className="q-footer">

                <div className="q-hashtags">
                  {q.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="hashtag"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="q-meta">
                  👤 {q.users} &nbsp;
                  {q.time}
                </div>

              </div>
            </div>
          </div>

          {index !== questions.length - 1 && (
            <div className="divider"></div>
          )}
        </div>
      ))}
    </section>
  );
}

export default TrendingQuestions;