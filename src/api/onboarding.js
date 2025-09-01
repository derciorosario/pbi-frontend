// src/api/onboarding.js
import client from "./client";

export const getState = () => client.get("/onboarding/state");
export const saveProfileType = (primaryIdentity) =>
  client.post("/onboarding/profile-type", { primaryIdentity });
export const saveCategories = (categoryIds, subcategoryIds) =>
  client.post("/onboarding/categories", { categoryIds, subcategoryIds });
export const saveGoals = (goalIds) =>
  client.post("/onboarding/goals", { goalIds });
