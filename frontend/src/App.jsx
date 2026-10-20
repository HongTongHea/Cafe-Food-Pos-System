import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/ui/Spinner";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import POS from "./pages/POS";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Users from "./pages/Users";

// The dashboard pulls in the chart library, so it loads only when an admin opens it.
const Dashboard = lazy(() => import("./pages/Dashboard"));

function Home() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/dashboard" : "/pos"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/pos" element={<POS />} />
          <Route path="/orders" element={<Orders />} />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<Spinner />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="/products" element={<Products />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
