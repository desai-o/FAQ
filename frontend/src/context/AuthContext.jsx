import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../api/client";

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
        const data = await apiRequest("/auth/me");
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem("crowdfaq-token");
        setUser(null);
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
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("crowdfaq-token", data.token);
      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message);

      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      localStorage.setItem("crowdfaq-token", data.token);
      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message);

      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crowdfaq-token");
    setUser(null);
    setError(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}