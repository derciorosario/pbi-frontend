// src/api/profile.js
import client from "./client";

// PERFIL
export const getMe              = () => client.get("/profile/me");
export const updatePersonal     = (payload) => client.put("/profile/personal", payload);
export const updateProfessional = (payload) => client.put("/profile/professional", payload);

// TAXONOMIA (identidades → categorias → subcategorias → subsub)
export const getIdentityCatalog = () => client.get("/public/identities");

// NOVO: seleções do que FAZ (identidades/categorias/subs/subsubs)
export const updateDoSelections = (payload) => client.put("/profile/do-selections", payload);

// NOVO: seleções do que PROCURA (identidades/categorias/subs/subsubs)
export const updateInterestSelections = (payload) => client.put("/profile/interest-selections", payload);

// NOVO: seleções de indústrias (categorias/subs/subsubs)
export const updateIndustrySelections = (payload) => client.put("/profile/industry-selections", payload);
