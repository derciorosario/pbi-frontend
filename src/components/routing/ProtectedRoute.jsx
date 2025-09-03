import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import FullPageLoader from "../ui/FullPageLoader";

export default function ProtectedRoute({ roles }) {
  const { isAuthed, loading, ready, hasRole } = useAuth();
  const location = useLocation();

  if (!ready && loading) {
    return <FullPageLoader message="Loading…" tip="" />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
