// src/hooks/useOnboarding.js
import { useEffect, useState } from "react";
import * as api from "../api/onboarding";

export default function useOnboarding() {
  const [state, setState] = useState({ loading: true, nextStep: null, progress: 0 });

  async function refresh() {
    const { data } = await api.getState();
    setState({ loading: false, ...data });
  }

  useEffect(() => { refresh(); }, []);

  return { state, refresh, saveProfileType: api.saveProfileType,saveIdentities:api.saveProfileType, saveCategories: api.saveCategories, saveGoals: api.saveGoals };
}
