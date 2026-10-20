import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./ui/Spinner";

// Wrap routes that need a signed-in user. Pass adminOnly for owner-only pages.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
