import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './src/contexts/AuthContext';
import FullPageLoader from './src/components/ui/FullPageLoader';

const ProtectedRoute = ({ redirectTo = '/' }) => {
  const { user, loading, token, logout } = useAuth();

  // Special logout handler
  if (redirectTo === "/logout" && token && user) {
    logout();
    toast.remove();
    toast.success('Logout successfully!');
    return <Navigate to="/login" replace />;
  }

  // Handle loading state
  if (loading) {
    return <FullPageLoader/>;
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if onboarding not completed
  if (user && !user?.profile?.onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ Use <Outlet /> for nested routes
  return user ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
