// src/pages/onboarding/OnboardingGate.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOnboarding from "../../hooks/useOnboarding";

export default function OnboardingGate({ children }) {
  const nav = useNavigate();
  const { state } = useOnboarding();

  useEffect(() => {
    if (!state.loading) {
      if (state.nextStep === "identities") nav("/onboarding/who-you-are", { replace: true });
      else if (state.nextStep === "categories") nav("/onboarding/industry", { replace: true });
      else if (state.nextStep === "goals") nav("/onboarding/goals", { replace: true });
    }
  }, [state.loading, state.nextStep]);

  return children || null;
}
