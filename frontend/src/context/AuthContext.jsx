import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  // If a token exists we confirm it with the server before showing the app.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  const clear = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch((err) => {
        // only sign out when the server rejected the token, not on a network blip
        if (err.response?.status === 401) clear();
      })
      .finally(() => setLoading(false));
  }, [clear]);

  useEffect(() => {
    window.addEventListener("auth:logout", clear);
    return () => window.removeEventListener("auth:logout", clear);
  }, [clear]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout: clear, isAdmin: user?.role === "admin" }),
    [user, loading, login, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
