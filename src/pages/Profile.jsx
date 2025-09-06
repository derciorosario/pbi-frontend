// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import {
  getMe, updateIdentity, updatePersonal, updateProfessional, updateInterests,
  listCategories, listGoals
} from "../api/profile";
import ProfilePhoto from "../components/ProfilePhoto";
import { useNavigate } from "react-router-dom";
import COUNTRIES from "../constants/countries.js";
import Header from "../components/Header.jsx";

/* ---------------- SVG icons ---------------- */
const I = {
  feed: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/></svg>,
  people: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM6 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM2 20a6 6 0 0 1 12 0v1H2Zm12.5 1v-1a7.5 7.5 0 0 1 9.5-7.2V21Z"/></svg>,
  jobs: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"/><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z"/></svg>,
  calendar: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v3H7zm8 0h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z"/></svg>,
  biz: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V3h8v6h10v12H3Z"/><path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z"/></svg>,
  pin: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"/></svg>,
  chevron: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="m6 9 6 6 6-6"/></svg>,
  search: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/></svg>,
  heart: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.349-9.428-7.061A5.5 5.5 0 0 1 11.5 6.5L12 7l.5-.5a5.5 5.5 0 0 1 8.928 7.439C18.716 16.651 12 21 12 21z"/></svg>,
  comment: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4M12 2v14"/></svg>,
  msg: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  eye: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"/></svg>,
  filter: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7z"/></svg>,
  close: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>,
};
const Tab = { PERSONAL: "personal", PROFESSIONAL: "professional", INTERESTS: "interests" };

export default function ProfilePage() {
  const [active, setActive]       = useState(Tab.PERSONAL);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [me, setMe]               = useState(null);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals]           = useState([]);
  const navigate=useNavigate()

  // Forms
  const [identity, setIdentity] = useState({ primaryIdentity: "" });
 const [personal, setPersonal] = useState({
  name: "", phone: "", nationality: "",
  country: "", countryOfResidence: "", city: "", // 🆕
  birthDate: "", professionalTitle: "", about: "", avatarUrl: ""
});
  const [professional, setProfessional] = useState({
    experienceLevel: "",
    skills: [],
    languages: [],
    // featured
    categoryId: "",
    subcategoryId: "",
    // multi-select (optional)
    categoryIds: [],
    subcategoryIds: []
  });
  const [interests, setInterests] = useState({ goalIds: [] });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: meData }, { data: cats }, { data: gs }] = await Promise.all([
          getMe(),
          listCategories(),
          listGoals(),
        ]);
        setMe(meData);
        setCategories(cats || []);
        setGoals(gs || []);

        // hydrate
        const u = meData.user || {};
        const p = meData.profile || {};
        setIdentity({ primaryIdentity: p.primaryIdentity || "" });

        setPersonal({
            name: u.name || "",
            phone: u.phone || "",
            nationality: u.nationality || "",
            country: u.country || "",
            countryOfResidence: u.countryOfResidence || "", // 🆕
            city: u.city || "",
            birthDate: p.birthDate || "",
            professionalTitle: p.professionalTitle || "",
            about: p.about || "",
            avatarUrl: p.avatarUrl || "",
        });

        setProfessional({
          experienceLevel: p.experienceLevel || "",
          skills: Array.isArray(p.skills) ? p.skills : [],
          languages: Array.isArray(p.languages) ? p.languages : [],
          categoryId: p.categoryId || "",
          subcategoryId: p.subcategoryId || "",
          categoryIds: meData.selectedCategoryIds || [],
          subcategoryIds: meData.selectedSubcategoryIds || []
        });

        setInterests({ goalIds: meData.selectedGoalIds || [] });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const progress = me?.progress?.percent ?? 0;
  const levels = ["Junior", "Mid", "Senior", "Lead", "Director", "C-level"];

  async function saveIdentity() {
    try {
      setSaving(true);
      const { data } = await updateIdentity(identity);
      setMe(data);
      toast.success("Saved!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function savePersonal(stay = true) {
    try {
      setSaving(true);
      const { data } = await updatePersonal(personal);
      setMe(data);
      toast.success(stay ? "Draft saved." : "Saved!");
      if (!stay) setActive(Tab.PROFESSIONAL);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveProfessional(stay = true) {
    try {
      setSaving(true);
      const { data } = await updateProfessional(professional);
      setMe(data);
      toast.success(stay ? "Draft saved." : "Saved!");
      if (!stay) setActive(Tab.INTERESTS);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveInterests() {
    try {
      setSaving(true);
      const { data } = await updateInterests(interests);
      setMe(data);
      toast.success("Saved!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
        </svg>
        <span className="ml-2">Loading…</span>
      </div>
    );
  }

  // derive subcategories of featured category
  const featuredSubs =
    categories.find(c => c.id === professional.categoryId)?.subcategories || [];

  return (
    <div>
      
      <Header/>

    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header + progress */}
      <div className="bg-white rounded-2xl shadow-soft p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
            <p className="text-gray-500">Tell your story, grow your network</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="font-medium">Complete your Profile</div>
            <div>{progress}% of 100%</div>
          </div>
        </div>
        <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-3 bg-brand-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Identity quick card */}
      <div className="mt-6 bg-white rounded-2xl shadow-soft p-5">
        <h2 className="text-lg font-semibold mb-3">Who You Are</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
          {["Entrepreneur", "Seller", "Buyer", "Job Seeker", "Recruiter", "Investor", "Other"].map(v => (
            <label key={v} className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <input
                type="radio"
                name="identity"
                checked={identity.primaryIdentity === v}
                onChange={() => setIdentity({ primaryIdentity: v })}
              />
              <span>{v}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-3">
          <button disabled={saving} onClick={saveIdentity} className="px-4 py-2 rounded-xl bg-brand-700 text-white">
            Save Identity
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg border ${active===Tab.PERSONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`}
            onClick={() => setActive(Tab.PERSONAL)}
          >
            Personal Info
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${active===Tab.PROFESSIONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`}
            onClick={() => setActive(Tab.PROFESSIONAL)}
          >
            Professional Info
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${active===Tab.INTERESTS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`}
            onClick={() => setActive(Tab.INTERESTS)}
          >
            Interests & Goals
          </button>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-soft p-5">
          {/* PERSONAL */}
          {active === Tab.PERSONAL && (
            <div className="space-y-4">
              {/* Avatar URL */}
             
       
       
       {/* Avatar Upload */}

       <ProfilePhoto onChange={(base64)=>setPersonal({ ...personal, avatarUrl: base64 })} avatarUrl={personal.avatarUrl}/>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.name}
                         onChange={e=>setPersonal({...personal, name:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={me?.user?.email || ""} readOnly/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.phone}
                         onChange={e=>setPersonal({...personal, phone:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birth Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" value={personal.birthDate || ""}
                         onChange={e=>setPersonal({...personal, birthDate:e.target.value})}/>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Country (Nationality)</label>
                           
                             <select
                                name="country"
                                value={personal.country}
                                onChange={e => setPersonal({ ...personal, country: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="" disabled>Select country</option>
                                {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Country of Residence</label>
                          
                             <select
                                name="country"
                                value={personal.countryOfResidence}
                                onChange={e => setPersonal({ ...personal, countryOfResidence: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="" disabled>Select country</option>
                                {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.city}
                         onChange={e=>setPersonal({...personal, city:e.target.value})}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Professional Title</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.professionalTitle}
                         onChange={e=>setPersonal({...personal, professionalTitle:e.target.value})}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">About You</label>
                  <textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={personal.about}
                            onChange={e=>setPersonal({...personal, about:e.target.value})}/>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={()=>savePersonal(true)} className="px-4 py-2 rounded-xl border border-brand-700 text-brand-700 bg-white">Save Draft</button>
                <button disabled={saving} onClick={()=>savePersonal(false)} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* PROFESSIONAL */}
          {active === Tab.PROFESSIONAL && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Featured Industry</label>
                  <select className="w-full border rounded-lg px-3 py-2"
                          value={professional.categoryId}
                          onChange={(e)=>setProfessional(p=>({ ...p, categoryId: e.target.value, subcategoryId: "" }))}>
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience Level</label>
                  <select className="w-full border rounded-lg px-3 py-2"
                          value={professional.experienceLevel}
                          onChange={(e)=>setProfessional(p=>({ ...p, experienceLevel: e.target.value }))}>
                    <option value="">Select level</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {professional.categoryId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Featured Subcategory</label>
                  <select className="w-full border rounded-lg px-3 py-2"
                          value={professional.subcategoryId}
                          onChange={(e)=>setProfessional(p=>({ ...p, subcategoryId: e.target.value }))}>
                    <option value="">Select a subcategory</option>
                    {featuredSubs.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>
              )}

              {/* Multi-select (optional): keep your onboarding selections in the profile page too */}
              <div>
                <label className="block text-sm font-medium mb-1">Your Categories (multi-select)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const checked = professional.categoryIds.includes(c.id);
                    return (
                      <label key={c.id} className={`px-3 py-1 rounded-full border cursor-pointer ${checked ? "bg-brand-50 border-brand-600 text-brand-700" : "border-gray-200"}`}>
                        <input type="checkbox" className="hidden"
                          checked={checked}
                          onChange={()=>{
                            setProfessional(p=>{
                              const has = p.categoryIds.includes(c.id);
                              const next = has ? p.categoryIds.filter(x=>x!==c.id) : [...p.categoryIds, c.id];
                              // if removing, also remove its subs
                              const subIds = (c.subcategories || []).map(s=>s.id);
                              return { ...p, categoryIds: next, subcategoryIds: p.subcategoryIds.filter(id => !subIds.includes(id)) };
                            });
                          }}/>
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              {!!professional.categoryIds.length && (
                <div>
                  <label className="block text-sm font-medium mb-1">Your Subcategories</label>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {categories
                      .filter(c => professional.categoryIds.includes(c.id))
                      .flatMap(c => c.subcategories.map(sc => ({ ...sc, parentId: c.id })))
                      .map(sc => {
                        const checked = professional.subcategoryIds.includes(sc.id);
                        return (
                          <label key={sc.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                            <input type="checkbox" checked={checked}
                                   onChange={()=>{
                                     setProfessional(p=>{
                                       const has = p.subcategoryIds.includes(sc.id);
                                       const next = has ? p.subcategoryIds.filter(x=>x!==sc.id) : [...p.subcategoryIds, sc.id];
                                       // ensure parent cat present
                                       const categoryIds = p.categoryIds.includes(sc.parentId) ? p.categoryIds : [...p.categoryIds, sc.parentId];
                                       return { ...p, subcategoryIds: next, categoryIds };
                                     });
                                   }}/>
                            <span>{sc.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {professional.skills.map((s,i)=>(
                    <span key={i} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-sm">
                      {s}
                      <button onClick={()=>setProfessional(p=>({ ...p, skills: p.skills.filter((_,idx)=>idx!==i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Type a skill and press Enter"
                       onKeyDown={(e)=>{
                         if (e.key === "Enter") {
                           e.preventDefault();
                           const v = e.currentTarget.value.trim();
                           if (v) setProfessional(p=>({ ...p, skills: Array.from(new Set([...(p.skills||[]), v])) }));
                           e.currentTarget.value = "";
                         }
                       }}/>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium mb-1">Languages</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {professional.languages.map((lng,i)=>(
                    <span key={i} className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <b>{lng.name}</b> <em className="text-gray-600">{lng.level}</em>
                      <button onClick={()=>setProfessional(p=>({ ...p, languages: p.languages.filter((_,idx)=>idx!==i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="lang-name" className="flex-1 border rounded-lg px-3 py-2" placeholder="Language (e.g., English)"/>
                  <select id="lang-level" className="w-40 border rounded-lg px-3 py-2">
                    <option>Basic</option><option>Intermediate</option><option>Advanced</option><option>Native</option>
                  </select>
                  <button
                    className="px-3 py-2 rounded-lg border"
                    onClick={()=>{
                      const name  = document.getElementById("lang-name").value.trim();
                      const level = document.getElementById("lang-level").value;
                      if (!name) return;
                      setProfessional(p=>({ ...p, languages: [...(p.languages||[]), { name, level }] }));
                      document.getElementById("lang-name").value = "";
                    }}>
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={()=>saveProfessional(true)}  className="px-4 py-2 rounded-xl border border-brand-700 text-brand-700 bg-white">Save Draft</button>
                <button disabled={saving} onClick={()=>saveProfessional(false)} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* INTERESTS */}
          {active === Tab.INTERESTS && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {goals.map(g=>(
                  <label key={g.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                    <input type="checkbox"
                           checked={interests.goalIds.includes(g.id)}
                           onChange={()=>{
                              setInterests(prev=>{
                                const has = prev.goalIds.includes(g.id);
                                let next = has ? prev.goalIds.filter(x=>x!==g.id) : [...prev.goalIds, g.id];
                                return { goalIds: next };
                              });
                           }}/>
                    <span>{g.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveInterests} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
