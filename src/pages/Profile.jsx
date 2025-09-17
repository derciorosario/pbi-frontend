// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "../lib/toast";
import {
  getMe,
  updatePersonal,
  updateProfessional,
  getIdentityCatalog,
  updateDoSelections,
  updateInterestSelections,
} from "../api/profile";
import { getUserById, updateUser } from "../api/admin";
import ProfilePhoto from "../components/ProfilePhoto";
import COUNTRIES from "../constants/countries.js";
import Header from "../components/Header.jsx";

const Tab = {
  PERSONAL: "personal",
  PROFESSIONAL: "professional",
  DO: "do",
  INTERESTS: "interests",
};

export default function ProfilePage() {
  const { id: userId } = useParams();
  const location = useLocation();
  const isAdminEditing = location.pathname.includes('/admin/user-profile/');
  
  const [active, setActive]   = useState(Tab.PERSONAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [me, setMe]           = useState(null);
  const [identities, setIdentities] = useState([]);
  
  // Determine if this is a company account
  const isCompany = me?.user?.accountType === "company";

  // Personal
  const [personal, setPersonal] = useState({
    name: "", phone: "", nationality: "",
    country: "", countryOfResidence: "", city: "",
    birthDate: "", professionalTitle: "", about: "", avatarUrl: ""
  });

  // Professional (no categories here)
  const [professional, setProfessional] = useState({
    experienceLevel: "",
    skills: [],
    languages: [],
  });

  // DOES (what I DO)
  const [doIdentityIds, setDoIdentityIds] = useState([]);
  const [doCategoryIds, setDoCategoryIds] = useState([]);
  const [doSubcategoryIds, setDoSubcategoryIds] = useState([]);
  const [doSubsubCategoryIds, setDoSubsubCategoryIds] = useState([]);

  // WANTS (what I’m looking for) + limits
  const MAX_WANT_IDENTITIES = 3;
  const MAX_WANT_CATEGORIES = 3;
  const [wantIdentityIds, setWantIdentityIds] = useState([]);
  const [wantCategoryIds, setWantCategoryIds] = useState([]);
  const [wantSubcategoryIds, setWantSubcategoryIds] = useState([]);
  const [wantSubsubCategoryIds, setWantSubsubCategoryIds] = useState([]);

  // UI open/close (DO / WANT)
  const [openCatsDo, setOpenCatsDo] = useState(() => new Set());
  const [openSubsDo, setOpenSubsDo] = useState(() => new Set());
  const [openCatsWant, setOpenCatsWant] = useState(() => new Set());
  const [openSubsWant, setOpenSubsWant] = useState(() => new Set());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        let userData;
        const { data: catalog } = await getIdentityCatalog();
        
        if (isAdminEditing && userId) {
          // Admin editing another user
          const { data } = await getUserById(userId);
          userData = {
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              nationality: data.nationality,
              country: data.country,
              countryOfResidence: data.countryOfResidence,
              city: data.city,
              accountType: data.accountType,
              avatarUrl: data.avatarUrl
            },
            profile: data.profile || {},
            progress: data.progress || { percent: 0 },
            doIdentityIds: data.identities?.map(i => i.id) || [],
            doCategoryIds: data.categories?.map(c => c.id) || [],
            doSubcategoryIds: data.subcategories?.map(s => s.id) || [],
            doSubsubCategoryIds: data.subsubcategories?.map(s => s.id) || [],
            interestIdentityIds: data.interests?.identities?.map(i => i.id) || [],
            interestCategoryIds: data.interests?.categories?.map(c => c.id) || [],
            interestSubcategoryIds: data.interests?.subcategories?.map(s => s.id) || [],
            interestSubsubCategoryIds: data.interests?.subsubcategories?.map(s => s.id) || []
          };
        } else {
          // User editing their own profile
          const { data } = await getMe();
          userData = data;
        }

        setMe(userData);
        setIdentities(Array.isArray(catalog?.identities) ? catalog.identities : []);

        // hydrate personal
        const u = userData.user || {};
        const p = userData.profile || {};
        setPersonal({
          name: u.name || "",
          phone: u.phone || "",
          nationality: u.nationality || "",
          country: u.country || "",
          countryOfResidence: u.countryOfResidence || "",
          city: u.city || "",
          birthDate: p.birthDate || "",
          professionalTitle: p.professionalTitle || "",
          about: p.about || "",
          avatarUrl: u.avatarUrl || p.avatarUrl || "",
        });

        // hydrate professional
        setProfessional({
          experienceLevel: p.experienceLevel || "",
          skills: Array.isArray(p.skills) ? p.skills : [],
          languages: Array.isArray(p.languages) ? p.languages : [],
        });

        // DOES
        setDoIdentityIds(userData.doIdentityIds || []);
        setDoCategoryIds(userData.doCategoryIds || []);
        setDoSubcategoryIds(userData.doSubcategoryIds || []);
        setDoSubsubCategoryIds(userData.doSubsubCategoryIds || []);

        // WANTS
        setWantIdentityIds(userData.interestIdentityIds || []);
        setWantCategoryIds(userData.interestCategoryIds || []);
        setWantSubcategoryIds(userData.interestSubcategoryIds || []);
        setWantSubsubCategoryIds(userData.interestSubsubCategoryIds || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminEditing, userId]);

  // Use the progress percentage from the API response
  const progress = me?.progress?.percent ?? 0;
  const levels = ["Junior", "Mid", "Senior", "Lead", "Director", "C-level"];

  /* ---------- Save handlers ---------- */
  async function savePersonal() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          name: personal.name,
          phone: personal.phone,
          nationality: personal.nationality,
          country: personal.country,
          countryOfResidence: personal.countryOfResidence,
          city: personal.city,
          profile: {
            birthDate: personal.birthDate,
            professionalTitle: personal.professionalTitle,
            about: personal.about,
            avatarUrl: personal.avatarUrl
          }
        };
        
        await updateUser(userId, userData);
        toast.success("Personal info saved!");
        
        // Refresh user data
        const { data } = await getUserById(userId);
        setMe({
          ...me,
          user: {
            ...me.user,
            name: personal.name,
            phone: personal.phone,
            nationality: personal.nationality,
            country: personal.country,
            countryOfResidence: personal.countryOfResidence,
            city: personal.city
          },
          profile: {
            ...me.profile,
            birthDate: personal.birthDate,
            professionalTitle: personal.professionalTitle,
            about: personal.about,
            avatarUrl: personal.avatarUrl
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updatePersonal(personal);
        setMe(data);
        toast.success("Personal info saved!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveProfessional() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          profile: {
            experienceLevel: professional.experienceLevel,
            skills: professional.skills,
            languages: professional.languages
          }
        };
        
        await updateUser(userId, userData);
        toast.success("Professional info saved!");
        
        // Refresh user data
        const { data } = await getUserById(userId);
        
        // Update local state with the latest data from the API
        setMe({
          ...me,
          profile: {
            ...me.profile,
            experienceLevel: professional.experienceLevel,
            skills: professional.skills,
            languages: professional.languages
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updateProfessional(professional);
        setMe(data);
        toast.success("Professional info saved!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveDo() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user - this would require additional backend endpoints
        // for admins to update user taxonomy selections
        toast.error("Admin editing of taxonomy selections is not supported yet.");
      } else {
        // User editing their own profile
        const { data } = await updateDoSelections({
          identityIds: doIdentityIds,
          categoryIds: doCategoryIds,
          subcategoryIds: doSubcategoryIds,
          subsubCategoryIds: doSubsubCategoryIds,
        });
        setMe(data);
        toast.success("Updated what you DO!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveInterests() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user - this would require additional backend endpoints
        // for admins to update user taxonomy selections
        toast.error("Admin editing of taxonomy selections is not supported yet.");
      } else {
        // User editing their own profile
        const { data } = await updateInterestSelections({
          identityIds: wantIdentityIds,
          categoryIds: wantCategoryIds,
          subcategoryIds: wantSubcategoryIds,
          subsubCategoryIds: wantSubsubCategoryIds,
        });
        setMe(data);
        toast.success("Updated what you're LOOKING FOR!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  /* ---------- Relationships (maps) ---------- */
  const getIdentityKey = (iden) => iden.id || `name:${iden.name}`;

  const catToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        m[c.id] = m[c.id] || new Set();
        m[c.id].add(ik);
      }
    }
    return m;
  }, [identities]);

  const subToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          m[s.id] = m[s.id] || new Set();
          m[s.id].add(ik);
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (!x?.id) continue;
            m[x.id] = m[x.id] || new Set();
            m[x.id].add(ik);
          }
        }
      }
    }
    return m;
  }, [identities]);

  const subToCat = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (s?.id) m[s.id] = c.id;
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (x?.id) m[x.id] = s.id;
          }
        }
      }
    }
    return m;
  }, [identities]);

  const catToAllSubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        const subs = (c.subcategories || []).map((s) => s.id).filter(Boolean);
        m[c.id] = Array.from(new Set([...(m[c.id] || []), ...subs]));
      }
    }
    return m;
  }, [identities]);

  const subToAllSubsubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          const subsubs = (s.subsubs || []).map((x) => x.id).filter(Boolean);
          m[s.id] = Array.from(new Set([...(m[s.id] || []), ...subsubs]));
        }
      }
    }
    return m;
  }, [identities]);

  /* ---------- Helpers: generic toggles ---------- */
  function makeToggleIdentity({ pickIds, setPickIds, setCats, setSubs, setX }) {
    return (identityKey) => {
      setPickIds((prev) => {
        const picked = prev.includes(identityKey) ? prev.filter(x => x !== identityKey) : [...prev, identityKey];
        const stillCovered = (map, id) => {
          const ownersSet = map[id];
          return ownersSet ? picked.some(ik => ownersSet.has(ik)) : false;
        };
        setX(prev => prev.filter(xid => stillCovered(subsubToIdentityKeys, xid)));
        setSubs(prev => prev.filter(sid => stillCovered(subToIdentityKeys, sid)));
        setCats(prev => prev.filter(cid => stillCovered(catToIdentityKeys, cid)));
        return picked;
      });
    };
  }

  function makeToggleCategory({ catIds, setCatIds, setSubIds, setXIds }) {
    return (catId) => {
      if (!catId) return;
      const has = catIds.includes(catId);
      if (has) {
        const subs = catToAllSubIds[catId] || [];
        const xIds = subs.flatMap(sid => subToAllSubsubIds[sid] || []);
        setCatIds(prev => prev.filter(x => x !== catId));
        setSubIds(prev => prev.filter(s => !subs.includes(s)));
        setXIds(prev => prev.filter(x => !xIds.includes(x)));
      } else {
        setCatIds(prev => [...prev, catId]);
      }
    };
  }

  function makeToggleSub({ subIds, setSubIds, setXIds, setCatIds }) {
    return (subId) => {
      if (!subId) return;
      const parentCatId = subToCat[subId];
      const has = subIds.includes(subId);
      if (has) {
        const xIds = subToAllSubsubIds[subId] || [];
        setSubIds(prev => prev.filter(x => x !== subId));
        setXIds(prev => prev.filter(x => !xIds.includes(x)));
      } else {
        if (parentCatId) {
          setCatIds(prev => (prev.includes(parentCatId) ? prev : [...prev, parentCatId]));
        }
        setSubIds(prev => [...prev, subId]);
      }
    };
  }

  function makeToggleSubsub({ setXIds, subIds, setSubIds, setCatIds }) {
    return (xId) => {
      if (!xId) return;
      const parentSubId = subsubToSub[xId];
      const parentCatId = parentSubId ? subToCat[parentSubId] : null;
      setXIds(prev => {
        const has = prev.includes(xId);
        if (has) return prev.filter(x => x !== xId);
        if (parentSubId && !subIds.includes(parentSubId)) setSubIds(p => [...p, parentSubId]);
        if (parentCatId) setCatIds(p => (p.includes(parentCatId) ? p : [...p, parentCatId]));
        return [...prev, xId];
      });
    };
  }

  /* ---------- DOES ---------- */
  const toggleIdentityDo = makeToggleIdentity({
    pickIds: doIdentityIds, setPickIds: setDoIdentityIds,
    setCats: setDoCategoryIds, setSubs: setDoSubcategoryIds, setX: setDoSubsubCategoryIds,
  });
  const toggleCategoryDo = makeToggleCategory({
    catIds: doCategoryIds, setCatIds: setDoCategoryIds,
    setSubIds: setDoSubcategoryIds, setXIds: setDoSubsubCategoryIds,
  });
  const toggleSubDo = makeToggleSub({
    subIds: doSubcategoryIds, setSubIds: setDoSubcategoryIds,
    setXIds: setDoSubsubCategoryIds, setCatIds: setDoCategoryIds,
  });
  const toggleSubsubDo = makeToggleSubsub({
    setXIds: setDoSubsubCategoryIds,
    subIds: doSubcategoryIds, setSubIds: setDoSubcategoryIds,
    setCatIds: setDoCategoryIds,
  });

  /* ---------- WANTS (with limits) ---------- */
  const toggleIdentityWant = (identityKey) => {
    setWantIdentityIds(prev => {
      const has = prev.includes(identityKey);
      if (has) return prev.filter(x => x !== identityKey);
      if (prev.length >= MAX_WANT_IDENTITIES) return prev; // limit
      return [...prev, identityKey];
    });
  };

  const toggleCategoryWant = (catId) => {
    setWantCategoryIds(prev => {
      const has = prev.includes(catId);
      if (has) {
        const subs = catToAllSubIds[catId] || [];
        const xs = subs.flatMap(sid => subToAllSubsubIds[sid] || []);
        setWantSubcategoryIds(p => p.filter(id => !subs.includes(id)));
        setWantSubsubCategoryIds(p => p.filter(id => !xs.includes(id)));
        return prev.filter(id => id !== catId);
      } else {
        if (prev.length >= MAX_WANT_CATEGORIES) return prev; // limit
        return [...prev, catId];
      }
    });
  };

  const toggleSubWant = (subId) => {
    const parentCatId = subToCat[subId];
    setWantSubcategoryIds(prev => {
      const has = prev.includes(subId);
      if (has) return prev.filter(x => x !== subId);
      if (parentCatId && !wantCategoryIds.includes(parentCatId)) {
        if (wantCategoryIds.length >= MAX_WANT_CATEGORIES) return prev; // limit
        setWantCategoryIds(p => [...p, parentCatId]);
      }
      return [...prev, subId];
    });
  };

  const toggleSubsubWant = (xId) => {
    const parentSubId = subsubToSub[xId];
    const parentCatId = parentSubId ? subToCat[parentSubId] : null;
    setWantSubsubCategoryIds(prev => {
      const has = prev.includes(xId);
      if (has) return prev.filter(x => x !== xId);
      if (parentSubId && !wantSubcategoryIds.includes(parentSubId)) {
        setWantSubcategoryIds(p => [...p, parentSubId]);
      }
      if (parentCatId && !wantCategoryIds.includes(parentCatId)) {
        if (wantCategoryIds.length >= MAX_WANT_CATEGORIES) return prev; // limit
        setWantCategoryIds(p => [...p, parentCatId]);
      }
      return [...prev, xId];
    });
  };

  /* ---------- AUTO-OPEN ON TAB ENTER ---------- */
  const computeOpenFromSelections = (catIds, subIds, xIds) => {
    const cats = new Set(catIds);
    const subs = new Set(subIds);

    // parents from subIds
    for (const sid of subIds) {
      const pc = subToCat[sid];
      if (pc) cats.add(pc);
    }
    // parents from xIds
    for (const xid of xIds) {
      const ps = subsubToSub[xid];
      if (ps) {
        subs.add(ps);
        const pc = subToCat[ps];
        if (pc) cats.add(pc);
      }
    }
    return { cats, subs };
  };

  // Open “DO” sets on entering the DO tab or when selections change
  useEffect(() => {
    if (active !== Tab.DO) return;
    const { cats, subs } = computeOpenFromSelections(
      doCategoryIds, doSubcategoryIds, doSubsubCategoryIds
    );
    setOpenCatsDo(cats);
    setOpenSubsDo(subs);
  }, [active, doCategoryIds, doSubcategoryIds, doSubsubCategoryIds, subToCat, subsubToSub]);

  // Open “WANTS” sets on entering the INTERESTS tab or when selections change
  useEffect(() => {
    if (active !== Tab.INTERESTS) return;
    const { cats, subs } = computeOpenFromSelections(
      wantCategoryIds, wantSubcategoryIds, wantSubsubCategoryIds
    );
    setOpenCatsWant(cats);
    setOpenSubsWant(subs);
  }, [active, wantCategoryIds, wantSubcategoryIds, wantSubsubCategoryIds, subToCat, subsubToSub]);

  /* ---------- UI ---------- */
  const Loading = () => (
    <div className="min-h-screen grid place-items-center text-brand-700">
      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
      </svg>
      <span className="ml-2">Loading…</span>
    </div>
  );

  if (loading) return <Loading />;
  if (!me) return null;

  function IdentityGrid({ picked, onToggle, limit }) {
    const reached = typeof limit === "number" && picked.length >= limit;
    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
        {identities.map((iden, i) => {
          const key = getIdentityKey(iden);
          const active = picked.includes(key);
          const disabled = !active && reached;
          return (
            <button
              key={`${i}-${iden.name}`}
              onClick={() => !disabled && onToggle(key)}
              disabled={disabled}
              className={`rounded-xl flex items-center justify-between border px-4 py-3 text-left hover:shadow-soft ${
                active ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="font-medium">{iden.name}</div>
                <div className="text-xs text-gray-500">{(iden.categories || []).length} categories</div>
              </div>
              <input type="checkbox" className="h-4 w-4 pointer-events-none" checked={active} readOnly />
            </button>
          );
        })}
      </div>
    );
  }

  function CategoryTree({
    selectedIdentitiesKeys,
    catIds, subIds, xIds,
    openCats, openSubs,
    onToggleCat, onToggleSub, onToggleSubsub,
    setOpenCats, setOpenSubs,
    catLimit,
    ensureCatOpenOnSelect = true,
    ensureSubOpenOnSelect = true,
  }) {
    const hasSubs = (cat) => Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
    const hasSubsubs = (sc) => Array.isArray(sc?.subsubs) && sc.subsubs.length > 0;
    const reachedCatLimit = typeof catLimit === "number" && catIds.length >= catLimit;

    const selectedIdentities = useMemo(() => {
      const keys = new Set(selectedIdentitiesKeys);
      return identities.filter((iden) => keys.has(getIdentityKey(iden)));
    }, [identities, selectedIdentitiesKeys]);

    if (selectedIdentities.length === 0) {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          Select at least one identity to see categories.
        </div>
      );
    }

    const toggleCatOpen = (catId) => {
      setOpenCats(prev => {
        const n = new Set(prev);
        n.has(catId) ? n.delete(catId) : n.add(catId);
        return n;
      });
    };
    const toggleSubOpen = (subId) => {
      setOpenSubs(prev => {
        const n = new Set(prev);
        n.has(subId) ? n.delete(subId) : n.add(subId);
        return n;
      });
    };

    return (
      <div className="space-y-4">
        {selectedIdentities.map((iden, iIdx) => (
          <div key={`iden-${iIdx}`} className="rounded-xl border">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
              <div className="font-semibold">{iden.name}</div>
              <span className="text-xs text-gray-500">
                {(iden.categories || []).length} categories
              </span>
            </div>

            <div className="px-4 py-4 space-y-3">
              {(iden.categories || []).map((cat, cIdx) => {
                const _hasSubs = hasSubs(cat);
                const catOpen = !!cat.id && openCats.has(cat.id);
                const catSelected = !!cat.id && catIds.includes(cat.id);
                const catDisabled = !!cat.id && !catSelected && reachedCatLimit;

                return (
                  <div key={`cat-${iIdx}-${cIdx}`} className="border rounded-lg">
                    {/* Entire row toggles open/close */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      role="button"
                      aria-expanded={catOpen}
                      onClick={() => cat.id && toggleCatOpen(cat.id)}
                    >
                      <label
                        className={`flex items-center gap-2 ${catDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={catSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!cat.id) return;
                            if (catDisabled) return;
                            onToggleCat(cat.id);
                            if (ensureCatOpenOnSelect && _hasSubs) {
                              setOpenCats(prev => new Set(prev).add(cat.id));
                            }
                          }}
                          disabled={!cat.id || catDisabled}
                          title={!cat.id ? "Category not found in DB" : (catDisabled ? "Category limit reached" : "")}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </label>

                      {_hasSubs && (
                        <span className={`text-gray-500 transition-transform ${catOpen ? "rotate-180" : ""}`}>▾</span>
                      )}
                    </div>

                    {_hasSubs && catOpen && (
                      <div className="px-4 pb-4 space-y-3">
                        {(cat.subcategories || []).map((sc, sIdx) => {
                          const _hasSubsubs = hasSubsubs(sc);
                          const isOpen = !!sc.id && openSubs.has(sc.id);
                          const isSelected = !!sc.id && subIds.includes(sc.id);

                          const parentSelected = !!cat.id && catIds.includes(cat.id);
                          const subDisabled = !isSelected && !parentSelected && reachedCatLimit;

                          return (
                            <div key={`sub-${iIdx}-${cIdx}-${sIdx}`} className="border rounded-lg">
                              <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                                role="button"
                                aria-expanded={isOpen}
                                onClick={() => sc.id && toggleSubOpen(sc.id)}
                              >
                                <label
                                  className={`flex items-center gap-3 ${subDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (!sc.id) return;
                                      if (subDisabled) return;
                                      onToggleSub(sc.id);
                                      if (ensureSubOpenOnSelect && _hasSubsubs) {
                                        setOpenSubs(prev => new Set(prev).add(sc.id));
                                      }
                                    }}
                                    disabled={!sc.id || subDisabled}
                                    title={!sc.id ? "Subcategory not found in DB" : (subDisabled ? "Category limit reached" : "")}
                                  />
                                  <span className="font-medium">{sc.name}</span>
                                </label>

                                {_hasSubsubs && (
                                  <span className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                                )}
                              </div>

                              {_hasSubsubs && (isOpen || isSelected) && (
                                <div className="px-4 pb-3">
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {sc.subsubs.map((ss, ssIdx) => {
                                      const parentCatSelected = !!cat.id && catIds.includes(cat.id);
                                      const ssSelected = !!ss.id && xIds.includes(ss.id);
                                      const ssDisabled = !ssSelected && !parentCatSelected && reachedCatLimit;
                                      return (
                                        <label
                                          key={`ss-${iIdx}-${cIdx}-${sIdx}-${ssIdx}`}
                                          className={`inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm ${ssDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!ss.id && ssSelected}
                                            onChange={() => {
                                              if (!ss.id || ssDisabled) return;
                                              onToggleSubsub(ss.id);
                                            }}
                                            disabled={!ss.id || ssDisabled}
                                            title={!ss.id ? "Level-3 not found in DB" : (ssDisabled ? "Category limit reached" : "")}
                                          />
                                          <span>{ss.name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {!isAdminEditing && <Header/>}
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header + progress */}
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isCompany ? "Company Profile" : "Profile"}
              </h1>
              <p className="text-gray-500">
                {isCompany
                  ? "Update your company information and preferences"
                  : "Update your information and preferences"}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div className="font-medium">Completion</div>
              <div>{progress}%</div>
            </div>
          </div>
          <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-3 bg-brand-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 flex-wrap">
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.PERSONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.PERSONAL)}>
            {isCompany ? "Company Info" : "Personal"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.PROFESSIONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.PROFESSIONAL)}>
            {isCompany ? "Company Details" : "Professional"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.DO ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.DO)}>
            {isCompany ? "What We Offer" : "What I DO"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.INTERESTS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.INTERESTS)}>
            {isCompany ? "What We're LOOKING FOR" : "What I'm LOOKING FOR"}
          </button>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-soft p-5">
          {/* PERSONAL */}
          {active === Tab.PERSONAL && (
            <div className="space-y-4">
              <ProfilePhoto onChange={(base64)=>setPersonal({ ...personal, avatarUrl: base64 })} avatarUrl={personal.avatarUrl}/>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company name" : "Full name"}
                  </label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.name}
                         onChange={e=>setPersonal({...personal, name:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input disabled={!isAdminEditing} className={`w-full ${!isAdminEditing ? 'opacity-50 pointer-events-none':''} border rounded-lg px-3 py-2 bg-gray-50`} value={me?.user?.email || ""} readOnly/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.phone}
                         onChange={e=>setPersonal({...personal, phone:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birth date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" value={personal.birthDate || ""}
                         onChange={e=>setPersonal({...personal, birthDate:e.target.value})}/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nationality</label>
                  <select value={personal.nationality} onChange={e=>setPersonal({...personal, nationality:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country of residence</label>
                  <select value={personal.countryOfResidence} onChange={e=>setPersonal({...personal, countryOfResidence:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country (birth)</label>
                  <select value={personal.country} onChange={e=>setPersonal({...personal, country:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.city}
                         onChange={e=>setPersonal({...personal, city:e.target.value})}/>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company description/type" : "Professional title"}
                  </label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.professionalTitle}
                         onChange={e=>setPersonal({...personal, professionalTitle:e.target.value})}
                         placeholder={isCompany ? "e.g., Venture Capital Firm, Technology Startup" : "e.g., Software Engineer, Marketing Specialist"}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "About the company" : "About you"}
                  </label>
                  <textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={personal.about}
                            onChange={e=>setPersonal({...personal, about:e.target.value})}
                            placeholder={isCompany
                              ? "Describe your company, its mission, and focus areas..."
                              : "Tell others about yourself, your background, and interests..."}/>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={savePersonal} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* PROFESSIONAL */}
          {active === Tab.PROFESSIONAL && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company size/stage" : "Experience level"}
                  </label>
                  <select className="w-full border rounded-lg px-3 py-2"
                          value={professional.experienceLevel}
                          onChange={e=>setProfessional(p=>({ ...p, experienceLevel: e.target.value }))}>
                    <option value="">Select</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isCompany ? "Company expertise" : "Skills"}
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  {isCompany ? "Working languages" : "Languages"}
                </label>
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
                <button disabled={saving} onClick={saveProfessional} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* WHAT I DO */}
          {active === Tab.DO && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Company identities (what we DO)" : "Identities (what you DO)"}
                </h3>
                <IdentityGrid picked={doIdentityIds} onToggle={toggleIdentityDo} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Categories (what we DO)" : "Categories (what you DO)"}
                </h3>
                <CategoryTree
                  selectedIdentitiesKeys={doIdentityIds}
                  catIds={doCategoryIds}
                  subIds={doSubcategoryIds}
                  xIds={doSubsubCategoryIds}
                  openCats={openCatsDo}
                  openSubs={openSubsDo}
                  onToggleCat={(id) => {
                    toggleCategoryDo(id);
                    setOpenCatsDo(prev => new Set(prev).add(id));
                  }}
                  onToggleSub={(id) => {
                    toggleSubDo(id);
                    setOpenSubsDo(prev => new Set(prev).add(id));
                  }}
                  onToggleSubsub={toggleSubsubDo}
                  setOpenCats={setOpenCatsDo}
                  setOpenSubs={setOpenSubsDo}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveDo} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* WHAT I’M LOOKING FOR */}
          {active === Tab.INTERESTS && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Identities (what we're LOOKING FOR)" : "Identities (what you're LOOKING FOR)"}
                </h3>
                <span className="text-sm text-gray-500">Selected {wantIdentityIds.length}/{MAX_WANT_IDENTITIES}</span>
              </div>
              <IdentityGrid picked={wantIdentityIds} onToggle={toggleIdentityWant} limit={MAX_WANT_IDENTITIES}/>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Categories (what we're LOOKING FOR)" : "Categories (what you're LOOKING FOR)"}
                </h3>
                <span className="text-sm text-gray-500">Selected {wantCategoryIds.length}/{MAX_WANT_CATEGORIES}</span>
              </div>
              <CategoryTree
                selectedIdentitiesKeys={wantIdentityIds}
                catIds={wantCategoryIds}
                subIds={wantSubcategoryIds}
                xIds={wantSubsubCategoryIds}
                openCats={openCatsWant}
                openSubs={openSubsWant}
                onToggleCat={(id) => {
                  toggleCategoryWant(id);
                  setOpenCatsWant(prev => new Set(prev).add(id));
                }}
                onToggleSub={(id) => {
                  toggleSubWant(id);
                  setOpenSubsWant(prev => new Set(prev).add(id));
                }}
                onToggleSubsub={toggleSubsubWant}
                setOpenCats={setOpenCatsWant}
                setOpenSubs={setOpenSubsWant}
                catLimit={MAX_WANT_CATEGORIES}
              />

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveInterests} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
