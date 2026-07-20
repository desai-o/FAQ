import { Link } from "react-router-dom";
import { APP_NAME, FOOTER_LINKS, CONTACT } from "../../config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <span className="site-footer-logo-mark">💡</span>
            <span className="site-footer-logo-text">{APP_NAME}</span>
          </div>
          <p className="site-footer-tagline">
            The community-driven knowledge base where every answer counts.
          </p>
          <div className="site-footer-social" aria-label="Social links">
            <a href={CONTACT.twitter} aria-label="Twitter" target="_blank" rel="noreferrer noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.51 8.59L23 22h-6.91l-4.61-6.04L6.06 22H2.8l8.04-9.2L1.5 2h7.07l4.16 5.5L18.244 2zm-1.22 18h1.83L7.07 4H5.13l11.894 16z"/></svg>
            </a>
            <a href={CONTACT.github} aria-label="GitHub" target="_blank" rel="noreferrer noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.69-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
            </a>
            <a href={CONTACT.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div className="site-footer-col" key={title}>
            <h4>{title}</h4>
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  {link.to.startsWith("http") || link.to.startsWith("mailto:") ? (
                    <a href={link.to}>{link.label}</a>
                  ) : (
                    <Link to={link.to}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer-bottom">
        <span>© {year} {APP_NAME}. All rights reserved.</span>
        <span className="site-footer-legal">
          <Link to="/#privacy">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/#terms">Terms</Link>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${CONTACT.supportEmail}`}>Support</a>
        </span>
      </div>
    </footer>
  );
}