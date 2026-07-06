import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("crowdfaq-token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data.data);
        } else {
          // Token expired or invalid
          localStorage.removeItem("crowdfaq-token");
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user profile on boot:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const token = data.meta?.token || data.token;
      localStorage.setItem("crowdfaq-token", token);

      // Fetch full user profile to get role and all user data
      const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setUser(meData.user || meData.data);
      } else {
        // Fallback: use user from login response
        const user = data.meta?.user || data.user || data.data;
        setUser(user);
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Signup failed");
      }

      const token = data.meta?.token || data.token;
      const user = data.meta?.user || data.user || data.data;
      localStorage.setItem("crowdfaq-token", token);
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crowdfaq-token");
    setUser(null);
    setError(null);
  };

  // Increment the current user's `answersCount` in local state so the
  // Profile page reflects new submissions immediately, without requiring a
  // full reload to re-fetch /auth/me. Backend remains the source of truth
  // for the absolute value; this only keeps the UI snapshot in sync.
  const incrementAnswersCount = () => {
    setUser((prev) => {
      if (!prev) return prev;
      const current = Number(prev.answersCount) || 0;
      return { ...prev, answersCount: current + 1 };
    });
  };

  // Increment the current user's `questionsCount` in local state so the
  // Profile page's "FAQs Created" stat updates immediately after posting
  // a new question, without waiting for a full reload to re-fetch
  // /auth/me. Mirrors `incrementAnswersCount` exactly — backend stays the
  // source of truth for the absolute value, this just keeps the UI
  // snapshot in sync between server refreshes.
  const incrementQuestionsCount = () => {
    setUser((prev) => {
      if (!prev) return prev;
      const current = Number(prev.questionsCount) || 0;
      return { ...prev, questionsCount: current + 1 };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        incrementAnswersCount,
        incrementQuestionsCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
