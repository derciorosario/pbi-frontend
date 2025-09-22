import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import FullPageLoader from './src/components/ui/FullPageLoader';
import { useAuth } from './src/contexts/AuthContext';
import ProfileCompletionDialog from './src/components/ProfileCompletionDialog';

const ProtectedRouteOnboarding = () => {
  const { user, loading, profile } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    // Check if user is logged in and has missing profile information
    if (user && !loading && user?.accountType!="admin") {
      const missingBiography = !profile.about;
      const missingProfessionalTitle = !profile?.professionalTitle;
      
      if (missingBiography || missingProfessionalTitle) {
        setShowProfileDialog(true);
      }
    }

  }, [user, profile, loading]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (user && profile?.onboardingDone===false && user?.accountType!="admin") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <ProfileCompletionDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
      <Outlet />
    </>
  );
};

export default ProtectedRouteOnboarding;
