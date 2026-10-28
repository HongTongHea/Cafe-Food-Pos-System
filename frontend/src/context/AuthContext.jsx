import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  // Clear authentication only.
  // Do not clear shop settings or the shop logo.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Verify the saved login token when the page is refreshed.
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get("/auth/me")
      .then((res) => {
        if (cancelled) return;

        const currentUser = res.data.user;

        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      })
      .catch((err) => {
        // Log out only if the server confirms the token is invalid.
        if (!cancelled && err.response?.status === 401) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Support logout events triggered elsewhere in the app.
  useEffect(() => {
    window.addEventListener("auth:logout", logout);

    return () => {
      window.removeEventListener("auth:logout", logout);
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);

    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
