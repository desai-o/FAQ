import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const observerRef = useRef(null);

  // Scroll animations observer setup
  useEffect(() => {
    const faders = document.querySelectorAll(".scroll-fade");
    const options = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, options);

    faders.forEach((fader) => observer.observe(fader));
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Smooth scroll handler for #product nav link
  useEffect(() => {
    const productLink = document.querySelector('a[href="#product"]');
    const handleProductClick = (e) => {
      e.preventDefault();
      const productEl = document.getElementById("product");
      if (productEl) {
        productEl.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (productLink) {
      productLink.addEventListener("click", handleProductClick);
    }

    return () => {
      if (productLink) {
        productLink.removeEventListener("click", handleProductClick);
      }
    };
  }, []);

  const handleCopyWidget = () => {
    const codeText = `<!-- CrowdFAQ Floating Widget -->
<script 
  src="http://localhost:5173/widget.js" 
  data-site-id="crowdfaq-100" 
  async
></script>`;
    
    navigator.clipboard.writeText(codeText).then(() => {
      const copyBtn = document.querySelector(".landing-copy-btn");
      if (copyBtn) {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      }
    });
  };

  const isDark = theme === "dark";

  return (
    <div className="landing-container">
      {/* Dynamic Background glows */}
      <div className="auth-glow-circle auth-glow-1" style={{ opacity: isDark ? 0.08 : 0.12 }}></div>
      <div className="auth-glow-circle auth-glow-2" style={{ opacity: isDark ? 0.08 : 0.12 }}></div>

      {/* Landing Navbar */}
      <header className="landing-navbar">
        <div className="logo-container">
          <div className="logo-badge">Q</div>
          <span>CrowdFAQ</span>
        </div>
        <ul className="landing-nav-links">
          <li><a href="#product">Product</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#community">Community</a></li>
          <li><a href="#developers">Developers</a></li>
        </ul>
        <div className="landing-nav-actions">
          {/* Theme Toggle Button */}
          <button
            className={`theme-toggle-btn ${theme}`}
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="theme-icon-container">
              <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
          </button>

          {user ? (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Go to App
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero scroll-fade">
        <h1>Where Communities<br />Build Knowledge.</h1>
        <p>Ask questions, discover answers, and learn from your community — powered by AI.</p>
        <div className="landing-hero-ctas">
          <button className="btn btn-primary" onClick={() => navigate(user ? "/dashboard" : "/signup")}>
            {user ? "Go to Dashboard" : "Get Started"}
          </button>
          <button className="btn btn-secondary" onClick={() => document.getElementById("features").scrollIntoView()}>
            See How It Works
          </button>
        </div>

        {/* Trust Badges */}
        <div className="landing-trust-badges">
          <div className="landing-trust-badge-item">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.15 12.2c0 3.73-2.15 6.78-4.5 9-.42.4-1 .4-1.42 0-2.35-2.22-4.5-5.27-4.5-9 0-3.5 1.5-6.5 4.5-9.67.43-.46 1.15-.46 1.58 0 3 3.17 4.34 6.17 4.34 9.67zM12 2.5c-.32 0-.64.08-.93.23-.37.2-.67.5-.87.87l-.03.07C7.9 7.73 6.9 10.38 6.9 13.06c0 3.5 1.7 6.1 3.5 8.1l.05.05c.34.33.8.52 1.28.52s.94-.19 1.28-.52l.05-.05c1.8-2 3.5-4.6 3.5-8.1 0-2.68-1-5.33-3.27-9.33l-.03-.07c-.2-.37-.5-.67-.87-.87-.29-.15-.61-.23-.93-.23z"/></svg>
            <span>MongoDB</span>
          </div>
          <div className="landing-trust-badge-item">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"/></svg>
            <span>Google Gemini</span>
          </div>
          <div className="landing-trust-badge-item">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 24a2.23 2.23 0 0 1-1.12-.31L2.1 18.5a2.25 2.25 0 0 1-1.1-2V6.6a2.25 2.25 0 0 1 1.1-2l8.77-5.18a2.23 2.23 0 0 1 2.25 0l8.77 5.18a2.25 2.25 0 0 1 1.1 2v9.91a2.25 2.25 0 0 1-1.1 2l-8.77 5.19A2.23 2.23 0 0 1 12 24zM2.87 6.13c-.11.06-.18.17-.18.3v9.91c0 .13.07.24.18.3l8.78 5.19c.11.07.26.07.37 0l8.78-5.19c.11-.06.18-.17.18-.3V6.43c0-.13-.07-.24-.18-.3L12.25 1c-.11-.07-.26-.07-.37 0z"/></svg>
            <span>Node.js</span>
          </div>
          <div className="landing-trust-badge-item">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.66c0 .4-.18.84-.53 1.3-1 .92-2.73 1.83-5.06 2.65a29.83 29.83 0 0 1 2.37 4.14c.48.97.66 1.85.53 2.47-.1.49-.37.93-.78 1.25-.4.32-.9.46-1.4.4-.87-.1-1.93-.84-3.13-2.18-1.52.88-3.15 1.63-4.8 2.2a27.67 27.67 0 0 1-.36 3.65c-.17 1.07-.63 1.89-1.28 2.23-.42.22-.9.31-1.37.26a2.43 2.43 0 0 1-1.46-.77c-.82-.87-1.16-2.31-1-4.08a28.2 28.2 0 0 1-1.26-4.66c-2.33-.82-4.06-1.73-5.07-2.65C.18 11.5 0 11.06 0 10.66c0-.4.18-.84.53-1.3 1-.92 2.73-1.83 5.06-2.65a29.83 29.83 0 0 1-2.37-4.14C1.74 1.6.14.72.27.1c.1-.49.37-.93.78-1.25.4-.32.9-.46 1.4-.4.87.1 1.93.84 3.13 2.18 1.52-.88 3.15-1.63 4.8-2.2A27.67 27.67 0 0 1 10.74.88c.17-1.07.63-1.89c1.28-2.23.42-.22.9-.31c1.37-.26a2.43 2.43 0 0 1 1.46.77c.82.87 1.16 2.31 1 4.08a28.2 28.2 0 0 1 1.26 4.66c2.33.82 4.06 1.73 5.07 2.65.35.46.53.9.53 1.3z"/></svg>
            <span>React</span>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="landing-product-section scroll-fade" style={{ padding: "80px 6% 40px", textAlign: "center", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
        <h2 className="landing-section-title" style={{ fontSize: "38px", marginBottom: "16px" }}>Product Overview</h2>
        <p className="landing-section-subtitle" style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "600px", marginBottom: "48px" }}>Explore our interactive dashboard to manage your community knowledge base, track contributor status, and answer questions.</p>

        {/* Browser Mockup */}
        <div className="landing-browser-mockup scroll-fade">
          <div className="landing-mockup-header">
            <div className="landing-mockup-dot red"></div>
            <div className="landing-mockup-dot yellow"></div>
            <div className="landing-mockup-dot green"></div>
            <div className="landing-mockup-address">crowdfaq.com/dashboard</div>
          </div>
          <div className="landing-mockup-body">
            <div className="landing-mockup-sidebar">
              <div className="landing-mockup-sidebar-logo">
                <div className="logo-badge" style={{ width: "18px", height: "18px", fontSize: "11px", background: "#fff", color: "#000" }}>Q</div>
                <span>CrowdFAQ</span>
              </div>
              <ul className="landing-mockup-menu">
                <li className="landing-mockup-menu-item active"><span className="landing-mockup-menu-dot"></span>Dashboard</li>
                <li className="landing-mockup-menu-item"><span className="landing-mockup-menu-dot"></span>Questions</li>
                <li className="landing-mockup-menu-item"><span className="landing-mockup-menu-dot"></span>Categories</li>
                <li className="landing-mockup-menu-item"><span className="landing-mockup-menu-dot"></span>Contributors</li>
                <li className="landing-mockup-menu-item"><span className="landing-mockup-menu-dot"></span>Bookmarks</li>
              </ul>
            </div>
            <div className="landing-mockup-main">
              <div className="landing-mockup-title">Dashboard Overview</div>
              <div className="landing-mockup-grid">
                <div className="landing-mockup-card">
                  <h4>Total Questions</h4>
                  <p>12,842</p>
                </div>
                <div className="landing-mockup-card">
                  <h4>Answers Posted</h4>
                  <p>42,109</p>
                </div>
                <div className="landing-mockup-card">
                  <h4>Community Rep</h4>
                  <p>158,400</p>
                </div>
              </div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" }}>Recent FAQ Threads</div>
              <div className="landing-mockup-list">
                <div className="landing-mockup-list-item">
                  <div className="landing-mockup-item-left">
                    <h5>How does virtual memory work at the OS level?</h5>
                    <p>Asked by Jordan Lee · 2 hours ago</p>
                  </div>
                  <span className="landing-mockup-badge">Resolved</span>
                </div>
                <div className="landing-mockup-list-item">
                  <div className="landing-mockup-item-left">
                    <h5>Best roadmap for AI/ML in 2026?</h5>
                    <p>Asked by Alex Chen · 1 day ago</p>
                  </div>
                  <span className="landing-mockup-badge">3 Answers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="landing-stats-strip scroll-fade">
        <div className="landing-stats-item">
          <span className="landing-stats-val">12.8K</span>
          <span className="landing-stats-lbl">Questions Asked</span>
        </div>
        <div className="landing-stats-item">
          <span className="landing-stats-val">3.2K</span>
          <span className="landing-stats-lbl">Active Members</span>
        </div>
        <div className="landing-stats-item">
          <span className="landing-stats-val">42K</span>
          <span className="landing-stats-lbl">Answers Posted</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features">
        <h2 className="landing-section-title scroll-fade">Engineered for Knowledge sharing</h2>
        <p className="landing-section-subtitle scroll-fade">Everything you need to capture, organize, and query community knowledge efficiently.</p>

        <div className="landing-features-grid">
          <div className="landing-feature-card scroll-fade">
            <div className="landing-feature-icon">📝</div>
            <h3>AI-Powered Summaries</h3>
            <p>Instantly summarize complex discussion threads into clean key takeaways powered by Gemini</p>
          </div>
          <div className="landing-feature-card scroll-fade">
            <div className="landing-feature-icon">🔌</div>
            <h3>Embeddable Widget</h3>
            <p>Integrate a floating knowledge helper directly into any website with a single line of code</p>
          </div>
          <div className="landing-feature-card scroll-fade">
            <div className="landing-feature-icon">🏆</div>
            <h3>Contributor Profiles</h3>
            <p>Track your impact, earn reputation, build your knowledge portfolio</p>
          </div>
        </div>
      </section>

      {/* Download Extension Banner */}
      <section className="landing-extension-banner scroll-fade">
        <div className="landing-extension-banner-container">
          <h2 className="landing-extension-banner-title">⚡ Available as a Browser Extension — Get CrowdFAQ answers anywhere on the web</h2>
          <div className="landing-extension-banner-btns">
            <button className="btn btn-chrome" onClick={() => alert('Chrome Extension download starts soon!')}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: "8px" }}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 3.6c2.3 0 4.3.9 5.8 2.4l-7.7 7.7-3.9-3.9c-.8-.8-.8-2 0-2.8l1.4-1.4c.8-.8 2-.8 2.8 0l1.6 1.6 4.9-4.9c-1.4-1-3.1-1.6-4.9-1.6zm0 16.8c-4.6 0-8.4-3.8-8.4-8.4s3.8-8.4 8.4-8.4 8.4 3.8 8.4 8.4-3.8 8.4-8.4 8.4z"/></svg>
              Add to Chrome
            </button>
            <button className="btn btn-firefox" onClick={() => alert('Firefox Add-on download starts soon!')}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: "8px" }}><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm.8 4.2c.4 0 .8.1 1.2.3.8.4 1.4 1.1 1.7 2 .4.8.4 1.8.1 2.7l.5.3c1-.6 2.3-.9 3.5-.8-.8-2-2.3-3.6-4.2-4.5l-2.8 0zm-7.3 4c1-.8 2.3-1.3 3.6-1.3.8 0 1.6.2 2.3.6l-.3.6c-.6 1.1-.6 2.4-.1 3.5.4 1 1.2 1.8 2.2 2.2l-.6 1.1c-.8.8-1.9 1.3-3.1 1.3-2.2 0-4.1-1.5-4.6-3.6-.6-2 .1-4.1 1.6-4.4zm6.5 11.6c-4 0-7.3-3.3-7.3-7.3s3.3-7.3 7.3-7.3 7.3 3.3 7.3 7.3-3.3 7.3-7.3 7.3zm.8-11.4c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1s.2.8.5 1.1c.3.3.7.5 1.1.5s.8-.2 1.1-.5c.3-.3.5-.7.5-1.1s-.2-.8-.5-1.1c-.3-.3-.7-.5-1.1-.5z"/></svg>
              Add to Firefox
            </button>
          </div>
        </div>
      </section>

      {/* Widget Integration Section */}
      <section id="extension" className="landing-extension-section scroll-fade">
        <div className="landing-extension-card">
          <div className="landing-extension-info">
            <h2>Embed CrowdFAQ on Any Website</h2>
            <p>Integrate our floating widget code block directly into your HTML. Allow your readers to search FAQ items or submit custom questions directly from your own website.</p>
            <button className="btn btn-primary" onClick={handleCopyWidget}>Copy Widget Code</button>
          </div>
          <div className="landing-code-container">
            <button className="landing-copy-btn" onClick={handleCopyWidget}>Copy</button>
            <pre>
              <code>
{`<!-- CrowdFAQ Floating Widget -->
<script 
  src="http://localhost:5173/widget.js" 
  data-site-id="crowdfaq-100" 
  async
></script>`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-dark">
        <div className="landing-footer-dark-row">
          <div className="logo-container">
            <div className="logo-badge">Q</div>
            <span>CrowdFAQ</span>
          </div>
          <ul className="landing-footer-dark-links">
            <li><a href="#product">Product</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#community">Community</a></li>
            <li><a href="#privacy">Privacy</a></li>
            <li><a href="#terms">Terms</a></li>
          </ul>
          <div className="landing-footer-dark-copyright">
            &copy; 2026 CrowdFAQ Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
