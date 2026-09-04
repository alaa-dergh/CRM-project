import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a page in <ProtectedRoute roles={["ADMIN"]}> to restrict by role.
// Omit `roles` to just require any logged-in user.
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
