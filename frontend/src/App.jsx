import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Questions from "./pages/questions/Questions";
import QuestionDetail from "./pages/question-detail/QuestionDetail";
import Categories from "./pages/categories/Categories";
import Contributors from "./pages/contributors/Contributors";
import Bookmarks from "./pages/bookmarks/Bookmarks";
import Profile from "./pages/profile/Profile";
import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import Landing from "./pages/landing/Landing";
import Subscription from "./pages/subscription/Subscription";
import Admin from "./pages/admin/Admin";
import ChatWidget from "./shared/components/ChatWidget";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/questions/:id" element={<QuestionDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/contributors" element={<Contributors />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <ChatWidget />
    </>
  );
}
export default App;