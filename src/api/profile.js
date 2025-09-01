// src/api/profile.js
import client from "./client";

export const getMe              = () => client.get("/profile/me");
export const updateIdentity     = (payload) => client.put("/profile/identity", payload);
export const updatePersonal     = (payload) => client.put("/profile/personal", payload);
export const updateProfessional = (payload) => client.put("/profile/professional", payload);
export const updateInterests    = (payload) => client.put("/profile/interests", payload);

// Public data (if you don't have these yet)
export const listCategories = () => client.get("/public/categories");
export const listGoals      = () => client.get("/public/goals");
