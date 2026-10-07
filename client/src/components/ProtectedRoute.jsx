import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { loading, isAuthenticated, student } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-spinner"></div>

          <h2>Drishti Library</h2>

          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !student) {
    return <Navigate to="/login" replace />;
  }

  if (student.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
