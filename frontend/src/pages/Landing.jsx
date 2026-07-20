import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, APP_TAGLINE } from "../config";

const FEATURES = [
  {
    icon: "💬",
    title: "Ask anything",
    description: "Pose a question and let the community respond with thoughtful, vetted answers.",
  },
  {
    icon: "🏷️",
    title: "Organized categories",
    description: "Browse questions by topic so you can dive into what matters to you, fast.",
  },
  {
    icon: "🏆",
    title: "Top contributors",
    description: "Reputation points, badges, and a leaderboard recognize the people who help most.",
  },
  {
    icon: "🔖",
    title: "Bookmarks",
    description: "Save questions you want to revisit and never lose track of what you learned.",
  },
  {
    icon: "🧠",
    title: "AI assistant",
    description: "A floating chatbot helps you find answers, even when you're on the move.",
  },
  {
    icon: "🔌",
    title: "Browser extensions",
    description: "Chrome and Firefox add-ons bring the community's answers to any page you visit.",
  },
];

const TESTIMONIALS = [
  { name: "Dr. Sarah Kim", role: "Researcher", quote: "CrowdFAQ cut my literature review time in half. The community is fast, sharp, and surprisingly generous." },
  { name: "Marcus Wei", role: "Software Engineer", quote: "Whenever I hit a weird bug, I post it here. The answers beat Stack Overflow half the time." },
  { name: "Priya Sharma", role: "ML Researcher", quote: "The reputation system actually rewards good explanations. It's the most thoughtful Q&A community I've used." },
];

const FAQ_ITEMS = [
  { q: "Is CrowdFAQ free to use?", a: "Yes. The core product is free. We'll add optional team and analytics plans in the future." },
  { q: "Do I need an account to read questions?", a: "No. Browsing questions and answers is open to everyone. You only need an account to ask, answer, or bookmark." },
  { q: "How does the Chrome extension work?", a: "Install the extension, click the icon on any page, and CrowdFAQ will surface related questions and let you ask a new one without leaving the page." },
  { q: "Can I delete my account?", a: "Yes. Open your profile, scroll to the bottom of the Account tab, and click Delete account." },
];

const PRICING = [
  { name: "Free", price: "$0", cadence: "forever", features: ["Unlimited questions", "Unlimited answers", "Bookmarks", "Browser extension"], cta: "Get started", highlight: false },
  { name: "Pro", price: "$9", cadence: "per month", features: ["Everything in Free", "Verified badge", "Advanced analytics", "Priority support"], cta: "Start Pro trial", highlight: true },
  { name: "Team", price: "$29", cadence: "per month", features: ["Everything in Pro", "Team spaces", "Admin controls", "SSO + audit log"], cta: "Contact sales", highlight: false },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handlePrimaryCta() {
    if (isAuthenticated) navigate("/dashboard");
    else navigate("/signup");
  }

  function handleSecondaryCta() {
    if (isAuthenticated) navigate("/questions");
    else navigate("/login");
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <span className="landing-blob landing-blob-1" />
          <span className="landing-blob landing-blob-2" />
          <span className="landing-blob landing-blob-3" />
        </div>
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Crowdsourced · Community-driven · Always free</span>
          <h1 className="landing-title">
            The knowledge base <span className="landing-title-accent">built by everyone, for everyone</span>
          </h1>
          <p className="landing-subtitle">{APP_TAGLINE}</p>
          <div className="landing-hero-cta">
            <button className="landing-btn landing-btn-primary" onClick={handlePrimaryCta}>
              {isAuthenticated ? "Open dashboard" : "Get started — it's free"}
            </button>
            <button className="landing-btn landing-btn-secondary" onClick={handleSecondaryCta}>
              {isAuthenticated ? "Browse questions" : "Sign in"}
            </button>
          </div>
          <div className="landing-hero-meta">
            <span>✨ 12,400+ answers</span>
            <span>👥 3,800 contributors</span>
            <span>🏷️ 24 categories</span>
          </div>
        </div>
        <div className="landing-hero-visual" aria-hidden="true">
          <div className="landing-card-stack">
            <div className="landing-fake-card landing-fake-card-1">
              <span className="landing-tag landing-tag-blue">Python</span>
              <h4>How do I optimize a Pandas groupby on 50M rows?</h4>
              <p>"Use categorical dtypes and chunk the operation..."</p>
              <div className="landing-fake-meta">
                <span>↑ 248</span>
                <span>💬 14 answers</span>
              </div>
            </div>
            <div className="landing-fake-card landing-fake-card-2">
              <span className="landing-tag landing-tag-green">ML</span>
              <h4>Best roadmap for AI/ML in 2026?</h4>
              <p>"Start with classical ML, then PyTorch, then transformers..."</p>
              <div className="landing-fake-meta">
                <span>↑ 192</span>
                <span>💬 22 answers</span>
              </div>
            </div>
            <div className="landing-fake-card landing-fake-card-3">
              <span className="landing-tag landing-tag-orange">Career</span>
              <h4>How do I negotiate a senior offer at a startup?</h4>
              <div className="landing-fake-meta">
                <span>↑ 87</span>
                <span>💬 9 answers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-header">
          <h2>Built for curious people</h2>
          <p>Every feature you need to ask, answer, and learn — without the noise.</p>
        </div>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <article key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="chrome-extension">
        <div className="landing-extension">
          <div className="landing-extension-text">
            <span className="landing-eyebrow landing-eyebrow-blue">Chrome Extension</span>
            <h2>Get answers without leaving the page</h2>
            <p>The CrowdFAQ Chrome extension surfaces relevant community answers right inside your browser. Highlight any text, click the icon, and ask a question without losing context.</p>
            <ul className="landing-extension-list">
              <li>🔍 One-click search across the entire knowledge base</li>
              <li>✍️ Ask a new question from any page</li>
              <li>🔖 Save answers to your bookmarks automatically</li>
              <li>🌙 Native dark mode that matches your browser</li>
            </ul>
            <div className="landing-extension-cta">
              <a
                className="landing-btn landing-btn-primary"
                href="/extensions/crowdfaq-chrome-latest.zip"
                onClick={(e) => { e.preventDefault(); alert("Chrome extension download will be available once published to the Chrome Web Store. Build artifacts can be packaged from the /extensions folder."); }}
              >
                Add to Chrome — it's free
              </a>
              <Link className="landing-btn landing-btn-ghost" to="/#chrome-extension">
                Learn more →
              </Link>
            </div>
          </div>
          <div className="landing-extension-visual landing-extension-visual-chrome">
            <div className="landing-extension-mock">
              <div className="landing-extension-bar">
                <span className="landing-extension-dot landing-extension-dot-red" />
                <span className="landing-extension-dot landing-extension-dot-yellow" />
                <span className="landing-extension-dot landing-extension-dot-green" />
                <span className="landing-extension-url">chrome-extension://crowdfaq/popup.html</span>
              </div>
              <div className="landing-extension-body">
                <div className="landing-extension-search">
                  <span>🔍</span>
                  <span>pandas groupby optimization</span>
                </div>
                <div className="landing-extension-result">
                  <strong>How do I optimize a Pandas groupby on 50M rows?</strong>
                  <p>"Use categorical dtypes, chunk the operation, and avoid apply..."</p>
                  <span className="landing-extension-result-meta">↑ 248 · 14 answers</span>
                </div>
                <div className="landing-extension-result">
                  <strong>Best practices for very large DataFrames?</strong>
                  <p>"Dask, Polars, or Modin — pick based on your team..."</p>
                  <span className="landing-extension-result-meta">↑ 162 · 9 answers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="firefox-extension">
        <div className="landing-extension landing-extension-flip">
          <div className="landing-extension-visual landing-extension-visual-firefox">
            <div className="landing-extension-mock landing-extension-mock-firefox">
              <div className="landing-extension-bar">
                <span className="landing-extension-dot landing-extension-dot-red" />
                <span className="landing-extension-dot landing-extension-dot-yellow" />
                <span className="landing-extension-dot landing-extension-dot-green" />
                <span className="landing-extension-url">about:addons</span>
              </div>
              <div className="landing-extension-body">
                <div className="landing-extension-pill">🦊 Firefox Add-on</div>
                <h4>{APP_NAME} for Firefox</h4>
                <p>Lightweight, private, and built with the WebExtensions API. Works on Firefox 109+.</p>
                <div className="landing-extension-feature-grid">
                  <span>⚡ Instant search</span>
                  <span>🛡️ Privacy-first</span>
                  <span>🌗 Dark mode</span>
                  <span>⌨️ Keyboard shortcuts</span>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-extension-text">
            <span className="landing-eyebrow landing-eyebrow-orange">Firefox Extension</span>
            <h2>Privacy-first. Built for the open web.</h2>
            <p>The Firefox add-on ships with the same powerful features, but with stricter privacy defaults and a smaller footprint. No tracking, no third-party scripts.</p>
            <ul className="landing-extension-list">
              <li>🦊 Native Firefox integration</li>
              <li>🛡️ Zero tracking, zero analytics</li>
              <li>⌨️ Keyboard-first power user shortcuts</li>
              <li>🔄 Cross-browser sync with your CrowdFAQ account</li>
            </ul>
            <div className="landing-extension-cta">
              <a
                className="landing-btn landing-btn-primary"
                href="/extensions/crowdfaq-firefox-latest.xpi"
                onClick={(e) => { e.preventDefault(); alert("Firefox extension download will be available once published to addons.mozilla.org. Build artifacts can be packaged from the /extensions folder."); }}
              >
                Add to Firefox
              </a>
              <Link className="landing-btn landing-btn-ghost" to="/#firefox-extension">
                View source →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="pricing">
        <div className="landing-section-header">
          <h2>Simple, honest pricing</h2>
          <p>Start free. Upgrade when your team needs more.</p>
        </div>
        <div className="landing-pricing">
          {PRICING.map((p) => (
            <div key={p.name} className={`landing-price-card ${p.highlight ? "landing-price-highlight" : ""}`}>
              {p.highlight && <span className="landing-price-badge">Most popular</span>}
              <h3>{p.name}</h3>
              <div className="landing-price-amount">
                <span className="landing-price-value">{p.price}</span>
                <span className="landing-price-cadence">{p.cadence}</span>
              </div>
              <ul>
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <button
                className={`landing-btn ${p.highlight ? "landing-btn-primary" : "landing-btn-secondary"} landing-btn-block`}
                onClick={handlePrimaryCta}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="testimonials">
        <div className="landing-section-header">
          <h2>Loved by curious people</h2>
          <p>From students to staff engineers, here's what the community says.</p>
        </div>
        <div className="landing-testimonials">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="landing-testimonial">
              <blockquote>"{t.quote}"</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="faq">
        <div className="landing-section-header">
          <h2>Frequently asked questions</h2>
          <p>Can't find what you're looking for? Email <a href="mailto:hello@crowdfaq.app">hello@crowdfaq.app</a>.</p>
        </div>
        <div className="landing-faq">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={item.q} className="landing-faq-item" open={idx === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to learn something new?</h2>
          <p>Join thousands of curious people sharing what they know.</p>
          <button className="landing-btn landing-btn-primary landing-btn-lg" onClick={handlePrimaryCta}>
            {isAuthenticated ? "Open dashboard" : `Create your free ${APP_NAME} account`}
          </button>
        </div>
      </section>
    </div>
  );
}