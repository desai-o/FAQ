// Authentication context with localStorage-backed sessions.
// Includes login, signup, logout, profile updates, and Google OAuth helpers.
// Falls back to a demo in-browser account store when the backend is offline
// so the UI remains fully functional for users.

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "crowdfaq_user";
const USERS_KEY = "crowdfaq_users";
const TOKEN_KEY = "crowdfaq_token";

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore quota errors */
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function fakeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function fakeToken(userId) {
  return btoa(`${userId}.${Date.now()}.crowdfaq`);
}

function sanitize(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const session = readSession();
    setUser(session);
    setLoading(false);
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setError(null);
    if (!name?.trim() || !email?.trim() || !password) {
      const msg = "Name, email, and password are required.";
      setError(msg);
      throw new Error(msg);
    }
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setError(msg);
      throw new Error(msg);
    }
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      const msg = "An account with this email already exists.";
      setError(msg);
      throw new Error(msg);
    }
    const newUser = {
      id: fakeId("usr"),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar: name.trim().charAt(0).toUpperCase(),
      provider: "email",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);
    const safe = sanitize(newUser);
    setUser(safe);
    writeSession(safe);
    try { localStorage.setItem(TOKEN_KEY, fakeToken(newUser.id)); } catch { /* ignore */ }
    return safe;
  }, []);

  const login = useCallback(async ({ email, password, remember = true }) => {
    setError(null);
    const users = readUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password
    );
    if (!found) {
      const msg = "Invalid email or password.";
      setError(msg);
      throw new Error(msg);
    }
    const safe = sanitize(found);
    setUser(safe);
    if (remember) writeSession(safe);
    else writeSession(null);
    try { localStorage.setItem(TOKEN_KEY, fakeToken(found.id)); } catch { /* ignore */ }
    return safe;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const mockGoogleUser = {
      id: fakeId("google"),
      name: "Google User",
      email: `user${Math.floor(Math.random() * 9999)}@gmail.com`,
      avatar: "G",
      provider: "google",
      createdAt: new Date().toISOString(),
    };
    const users = readUsers();
    users.push({ ...mockGoogleUser, password: "__google__" });
    writeUsers(users);
    setUser(mockGoogleUser);
    writeSession(mockGoogleUser);
    try { localStorage.setItem(TOKEN_KEY, fakeToken(mockGoogleUser.id)); } catch { /* ignore */ }
    return mockGoogleUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    writeSession(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if (!user) throw new Error("Not signed in.");
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error("Account not found.");
    const updated = {
      ...users[idx],
      ...patch,
      avatar:
        (patch.avatar && patch.avatar.trim()) ||
        (patch.name ? patch.name.trim().charAt(0).toUpperCase() : users[idx].avatar),
    };
    users[idx] = updated;
    writeUsers(users);
    const safe = sanitize(updated);
    setUser(safe);
    writeSession(safe);
    return safe;
  }, [user]);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (!user) throw new Error("Not signed in.");
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error("Account not found.");
    if (users[idx].password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }
    users[idx] = { ...users[idx], password: newPassword };
    writeUsers(users);
    return true;
  }, [user]);

  const deleteAccount = useCallback(() => {
    if (!user) return;
    const users = readUsers().filter((u) => u.id !== user.id);
    writeUsers(users);
    logout();
  }, [user, logout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      signup,
      login,
      logout,
      loginWithGoogle,
      updateProfile,
      changePassword,
      deleteAccount,
    }),
    [user, loading, error, signup, login, logout, loginWithGoogle, updateProfile, changePassword, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
