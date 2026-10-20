import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLogin) {
      // token expired or account disabled: let AuthContext sign the user out
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  }
);

// Pull a friendly message out of any axios error.
export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ERR_NETWORK") return "Cannot reach the server. Check your connection.";
  return fallback;
};

export default api;
