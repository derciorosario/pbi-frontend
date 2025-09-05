import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import FullPageLoader from './src/components/ui/FullPageLoader';
import { useAuth } from './src/contexts/AuthContext';

const ProtectedRouteOnboarding = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (user && profile?.onboardingDone===false) {
    return <Navigate to="/onboarding" replace />;
  }


  return <Outlet />; 
};

export default ProtectedRouteOnboarding;
