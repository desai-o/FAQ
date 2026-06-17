import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Categories from "./pages/Categories";
import Contributors from "./pages/Contributors";
import Bookmarks from "./pages/Bookmarks";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import Subscription from "./pages/Subscription";
import HelpCenter from "./pages/HelpCenter";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import AIChatbot from "./components/AIChatbot";

function App() {
  return (
    <>
      <Routes>
        {/* Public Landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Public / Standard Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected User Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
        <Route path="/questions/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/contributors" element={<ProtectedRoute><Contributors /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />

        {/* Protected Admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
      </Routes>
      <AIChatbot />
    </>
  );
}

export default App;