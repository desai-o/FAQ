import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import { useFAQ } from "../context/FAQContext";

const filters = ["All", "Unanswered", "Most Voted", "Newest"];

function Questions() {
  const { questions, upvoteQuestion, searchQuery, setSearchQuery } = useFAQ();
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  let filtered = [...questions];

  // Apply search query
  if (searchQuery.trim()) {
    filtered = filtered.filter(
      (q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.hashtags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply category filter
  if (selectedCategory !== "All Categories") {
    filtered = filtered.filter((q) => q.category === selectedCategory);
  }

  // Apply active tab filter
  if (activeFilter === "Unanswered") {
    filtered = filtered.filter((q) => !q.answers || q.answers.length === 0);
  } else if (activeFilter === "Most Voted") {
    filtered = filtered.sort((a, b) => b.votes - a.votes);
  } else if (activeFilter === "Newest") {
    // Newest first by sorting on ID (timestamp) or index
    filtered = filtered.sort((a, b) => {
      // Handle non-numeric IDs gracefully
      const aVal = typeof a.id === "number" ? a.id : 0;
      const bVal = typeof b.id === "number" ? b.id : 0;
      return bVal - aVal;
    });
  }

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        <main className="content">
          <h1 className="page-title">All Questions</h1>

          <div className="questions-search-bar">
            <div className="questions-search-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="category-dropdown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option>All Categories</option>
              <option>Programming</option>
              <option>Artificial Intelligence</option>
              <option>Career</option>
              <option>Research</option>
              <option>Scholarships</option>
              <option>Mathematics</option>
            </select>
          </div>

          <div className="filter-tabs">
            <div className="filter-tabs-left">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`tab-btn ${activeFilter === f ? "tab-active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="results-count">
              📄 {filtered.length} questions
            </span>
          </div>

          <div className="question-list-flat">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ textAlign: "center", padding: "40px 20px" }}>
                <span className="empty-icon" style={{ fontSize: "48px" }}>🔍</span>
                <h3>No questions found</h3>
                <p>Try resetting filters or typing a different search keyword.</p>
              </div>
            ) : (
              filtered.map((q, index) => (
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

                      <h3 className="q-title q-title-blue">
                        <Link to={`/questions/${q.id}`}>{q.title}</Link>
                      </h3>

                      <p className="q-excerpt">{q.excerpt}</p>

                      <div className="q-footer">
                        <div className="q-hashtags">
                          {q.hashtags.map((tag) => (
                            <span key={tag} className="hashtag">#{tag}</span>
                          ))}
                        </div>
                        <div className="q-meta">
                          👤 {q.author || "Community"} &nbsp; 💬 {q.answers ? q.answers.length : 0} answers &nbsp; {q.time}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index !== filtered.length - 1 && <div className="divider"></div>}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default Questions;