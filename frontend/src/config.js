// Centralized configuration for the CrowdFAQ frontend.
// Reads from Vite environment variables when available,
// falls back to sensible defaults so the app works in dev and prod.

const ENV = import.meta?.env || {};

const DEFAULT_API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://faq-crowdsourcing-api.onrender.com";

export const API_BASE_URL = ENV.VITE_API_URL || DEFAULT_API_URL;
export const APP_NAME = "CrowdFAQ";
export const APP_TAGLINE =
  "The community-driven knowledge base where every answer counts.";

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Questions", to: "/questions" },
  { label: "Categories", to: "/categories" },
  { label: "Contributors", to: "/contributors" },
  { label: "Bookmarks", to: "/bookmarks" },
];

export const FOOTER_LINKS = {
  Product: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Questions", to: "/questions" },
    { label: "Categories", to: "/categories" },
    { label: "Contributors", to: "/contributors" },
  ],
  Extensions: [
    { label: "Chrome Extension", to: "/#chrome-extension" },
    { label: "Firefox Extension", to: "/#firefox-extension" },
    { label: "Download for Chrome", to: "/#chrome-extension" },
    { label: "Download for Firefox", to: "/#firefox-extension" },
  ],
  Company: [
    { label: "About", to: "/#about" },
    { label: "Contact", to: "mailto:hello@crowdfaq.app" },
    { label: "Privacy", to: "/#privacy" },
    { label: "Terms", to: "/#terms" },
  ],
  Support: [
    { label: "Help Center", to: "/#help" },
    { label: "FAQ", to: "/#faq" },
    { label: "Feedback", to: "mailto:feedback@crowdfaq.app" },
    { label: "Status", to: "https://faq-crowdsourcing-api.onrender.com/api/health" },
  ],
};

export const CONTACT = {
  email: "hello@crowdfaq.app",
  supportEmail: "support@crowdfaq.app",
  twitter: "https://twitter.com/crowdfaq",
  github: "https://github.com/crowdfaq",
  linkedin: "https://linkedin.com/company/crowdfaq",
};

export default {
  API_BASE_URL,
  APP_NAME,
  APP_TAGLINE,
  NAV_LINKS,
  FOOTER_LINKS,
  CONTACT,
};
