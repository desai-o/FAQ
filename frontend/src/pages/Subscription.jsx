import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
function Subscription() {
  return (
    <>
    <Sidebar />
<div className="main-wrapper">
    <Topbar />
    <main className="content">
        <div className="hero">
            <h1>My Subscriptions</h1>
         <p>
            Manage your topics and discover personalized FAQ recommendations.
         </p>
        </div>

<section>
  <h2 className="section-heading">Subscribed Topics</h2>

  <div className="categories-grid">

    <div className="category-card">
      <div className="category-icon-circle blue">
        <span className="category-icon-emoji">🤖</span>
      </div>

      <h3 className="category-card-title">
        Artificial Intelligence
      </h3>

      <p className="category-card-desc">
        FAQs about AI, LLMs, neural networks and intelligent systems.
      </p>

      <p className="category-card-count">
        128 FAQs
      </p>

      <button className="unsubscribe-btn">
        Unsubscribe
      </button>

    </div>
    <div className="category-card">
  <div className="category-icon-circle blue">
    <span className="category-icon-emoji">💻</span>
  </div>

  <h3 className="category-card-title">
    Programming
  </h3>

  <p className="category-card-desc">
    FAQs about coding, frameworks, debugging and software development.
  </p>

  <p className="category-card-count">
    245 FAQs
  </p>

  <button className="unsubscribe-btn">
    Unsubscribe
  </button>
</div>
<div className="category-card">
  <div className="category-icon-circle green">
    <span className="category-icon-emoji">🎯</span>
  </div>

  <h3 className="category-card-title">
    Career
  </h3>

  <p className="category-card-desc">
    FAQs about job preparation, internships, interviews and career growth.
  </p>

  <p className="category-card-count">
    96 FAQs
  </p>

  <button className="unsubscribe-btn">
    Unsubscribe
  </button>
</div>

  </div>
</section>

<section className="subscription-section">
  <h2 className="section-heading">
    Recommended FAQs For You
  </h2>

  <div className="recommended-list">

    <div className="recommended-card">
      <div>
        <h3 className="recommended-title">
          How do Large Language Models handle context windows?
        </h3>

        <p className="recommended-desc">
          Learn how modern LLMs process long conversations and manage token limits effectively.
        </p>

        <span className="read-time">
          4 min read
        </span>
      </div>

      <a href="#" className="view-faq-btn">
        View FAQ →
      </a>
    </div>

    <div className="recommended-card">
      <div>
        <h3 className="recommended-title">
          Best practices for debugging React applications
        </h3>

        <p className="recommended-desc">
          Discover practical debugging techniques for React components, hooks and state management.
        </p>

        <span className="read-time">
          3 min read
        </span>
      </div>

      <a href="#" className="view-faq-btn">
        View FAQ →
      </a>
    </div>

    <div className="recommended-card">
      <div>
        <h3 className="recommended-title">
          How to prepare for technical interviews in 2026
        </h3>

        <p className="recommended-desc">
          Explore the latest interview trends, coding expectations and preparation strategies.
        </p>

        <span className="read-time">
          5 min read
        </span>
      </div>

      <a href="#" className="view-faq-btn">
        View FAQ →
      </a>
    </div>

  </div>
</section>


     <section className="subscription-bottom-grid">

  {/* Trending Section */}
  <div>
    <h2 className="section-heading">
      Trending In Your Interests
    </h2>

    <div className="trending-interest-card">

      <div className="interest-item">
        <h4>🔥 AI Agents & Autonomous Workflows</h4>
        <p>Trending among AI subscribers</p>
        <span>1.8k views this week</span>
      </div>

      <div className="interest-item">
        <h4>⚡ React Performance Optimization</h4>
        <p>Popular in Programming</p>
        <span>1.2k views this week</span>
      </div>

      <div className="interest-item">
        <h4>🎯 Internship Interview Experiences</h4>
        <p>Frequently discussed in Career</p>
        <span>950 views this week</span>
      </div>

    </div>
  </div>


  {/* Why These Recommendations */}
  <div>
    <h2 className="section-heading">
      Why These Recommendations?
    </h2>

    <div className="recommendation-info-card">

      <div className="recommendation-icon">
        🎯
      </div>

      <h3>Personalized For You</h3>

      <p>
        Recommendations are generated based on your
        subscribed topics, browsing activity,
        recently viewed FAQs and engagement patterns.
      </p>

      <div className="recommendation-tags">
        <span>AI</span>
        <span>Programming</span>
        <span>Career</span>
        <span>Recent Activity</span>
      </div>

    </div>
  </div>

</section>
      </main>
    </div>
    </>
  );
}

export default Subscription;