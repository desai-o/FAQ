import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Categories from "./pages/Categories";
import Contributors from "./pages/Contributors";
import Bookmarks from "./pages/Bookmarks";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import PublicNavbar from "./components/layout/PublicNavbar";
import Footer from "./components/layout/Footer";
import FloatingChatbot from "./components/chatbot/FloatingChatbot";
import { APP_NAME } from "./config";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/landing"]);
const AUTH_ROUTES = new Set(["/login", "/signup"]);
const CHATBOT_HIDDEN = new Set(["/login", "/signup"]);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = APP_NAME;
    const map = {
      "/": `${base} — Crowdsourced Knowledge for Everyone`,
      "/login": `Sign in · ${base}`,
      "/signup": `Create account · ${base}`,
      "/dashboard": `Dashboard · ${base}`,
      "/questions": `Questions · ${base}`,
      "/categories": `Categories · ${base}`,
      "/contributors": `Contributors · ${base}`,
      "/bookmarks": `Bookmarks · ${base}`,
      "/profile": `Profile · ${base}`,
    };
    document.title = map[pathname] || base;
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.has(location.pathname);
  const isAuthRoute = AUTH_ROUTES.has(location.pathname);
  const hideChatbot = CHATBOT_HIDDEN.has(location.pathname);

  return (
    <>
      <ScrollToTop />
      <DocumentTitle />

      {isPublicRoute && <PublicNavbar />}

      <main className={isPublicRoute ? "app-main app-main-public" : "app-main"}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/contributors" element={<Contributors />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>

      {isPublicRoute && !isAuthRoute && <Footer />}

      {!hideChatbot && <FloatingChatbot />}
    </>
  );
}

export default App;
