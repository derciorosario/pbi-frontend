// src/pages/CreateTourismPostPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Home, Users, Briefcase, Calendar, Building2, MapPin, Bell, Search, Image as ImageIcon,
} from "lucide-react";
import AudienceTree from "../components/AudienceTree";
import COUNTRIES from "../constants/countries";
import client from "../api/client";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";

/* ---------------- Shared styles (brand) ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  ghost:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-brand-600 text-brand-600 bg-white hover:bg-brand-50",
  badge:
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  chip:
    "inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs",
};

const I = {
  trash: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

/* File → data URL */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

/* Audience label maps */
function buildAudienceMaps(tree = []) {
  const ids = new Map(), cats = new Map(), subs = new Map(), subsubs = new Map();
  for (const idn of tree) {
    ids.set(String(idn.id), idn.name || idn.title || `Identity ${idn.id}`);
    for (const c of idn.categories || []) {
      cats.set(String(c.id), c.name || c.title || `Category ${c.id}`);
      for (const s of c.subcategories || []) {
        subs.set(String(s.id), s.name || s.title || `Subcategory ${s.id}`);
        for (const ss of s.subsubs || []) {
          subsubs.set(String(ss.id), ss.name || ss.title || `Sub-sub ${ss.id}`);
        }
      }
    }
  }
  return { ids, cats, subs, subsubs };
}

/* ---------- Read-only viewer for non-owners ---------- */
function ReadOnlyTourismPost({ postType, form, images, audSel, audTree }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map(k => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map(k => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map(k => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map(k => maps.subsubs.get(String(k))).filter(Boolean);

  const hero = images?.[0]?.base64url || null;
  const gallery = (images || []).slice(1);

  console.log({form,gallery,hero,images})

  const tags = (form.tagsInput || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Hero */}
      {hero ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          <img src={hero} alt="Cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 bg-white/90 border border-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
            {postType}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled Post"}</h1>
            <div className="mt-1 text-sm text-gray-700">
              {[form.location, form.country].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
         
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Season</div>
            <div className="mt-1 text-sm text-gray-700">{form.season || "—"}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Budget Range</div>
            <div className="mt-1 text-sm text-gray-700">{form.budgetRange || "—"}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Post Type</div>
            <div className="mt-1 text-sm text-gray-700">{postType || "—"}</div>
          </div>
        </div>

        {/* Gallery */}
        {gallery.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Photos</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gallery.map((img, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  <img src={img.base64url} alt={img.title || `Photo ${idx + 2}`} className="h-full w-full object-cover" />
                  {img.title ? (
                    <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {img.title}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {form.description || "No description provided."}
          </p>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length ? tags.map((t, i) => <span key={`${t}-${i}`} className={styles.chip}>{t}</span>) : <span className="text-sm text-gray-500">—</span>}
          </div>
        </div>

        {/* Audience */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Target Audience</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((x) => <span key={`i-${x}`} className={styles.chip}>{x}</span>)}
            {categories.map((x) => <span key={`c-${x}`} className={styles.chip}>{x}</span>)}
            {subcategories.map((x) => <span key={`s-${x}`} className={styles.chip}>{x}</span>)}
            {subsubs.map((x) => <span key={`ss-${x}`} className={styles.chip}>{x}</span>)}
            {!identities.length && !categories.length && !subcategories.length && !subsubs.length && (
              <span className="text-sm text-gray-500">Everyone</span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className={styles.ghost} onClick={() => history.back()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateTourismPostPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [loading,setLoading]=useState(true)
  const [ownerUserId, setOwnerUserId] = useState(null);

  const [postType, setPostType] = useState("Destination");
  const [saving, setSaving] = useState(false);

  // Audience
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Form
  const [form, setForm] = useState({
    title: "",
    country: "",
    location: "",
    description: "",
    season: "",
    budgetRange: "",
    tagsInput: "",
  });

  // Images ONLY: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  /* -------- Load AudienceTree -------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        setAudTree(data.identities || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* -------- Edit mode: load post -------- */
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        
    setLoading(true)
        const { data } = await client.get(`/tourism/${id}`);

        // detect owner (support several shapes)
        const ownerId =
          data.ownerUserId ??
          data.createdById ??
          data.userId ??
          data.author?.id ??
          data.owner?.id ??
          data.createdBy?.id ??
          null;
        setOwnerUserId(ownerId);

        setPostType(data.postType || "Destination");
        setForm((f) => ({
          ...f,
          title: data.title || "",
          country: data.country || "",
          location: data.location || "",
          description: data.description || "",
          season: data.season || "",
          budgetRange: data.budgetRange || "",
          tagsInput: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tagsInput || ""),
        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images
              .map((x, i) => ({
                title: x.title || x.name || `Image ${i + 1}`,
                base64url: x.base64url || x,
              }))
          );
        } else {
          setImages([]);
        }

        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });
        setLoading(false)
      } catch (err) {
        console.error(err);
        toast.error("Failed to load tourism post");
        navigate("/tourism");
      }
    })();
  }, [isEditMode, id, navigate]);




  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function parsedTags() {
    return (form.tagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.country.trim()) return "Country is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!images.length) return "Please add at least one image.";
    return null;
  }

  async function handleFilesChosen(files) {
    if (readOnly) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Images only; size cap 5MB each
    const onlyImages = arr.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== arr.length) {
      toast.error("Only image files are allowed.");
    }

    const sizeErrors = onlyImages.filter((f) => f.size > 5 * 1024 * 1024);
    if (sizeErrors.length) {
      toast.error("Each image must be ≤ 5MB.");
    }
    const accepted = onlyImages.filter((f) => f.size <= 5 * 1024 * 1024);

    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          const nameBase = file.name.replace(/\.[^/.]+$/, "");
          return { title: nameBase, base64url };
        })
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some images could not be read.");
    }
  }

  function updateImageTitle(idx, title) {
    if (readOnly) return;
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, title } : x)));
  }

  function removeImage(idx) {
    if (readOnly) return;
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }


  // General taxonomy
    const [generalTree, setGeneralTree] = useState([]);
    const [selectedGeneral, setSelectedGeneral] = useState({
      categoryId: "",
      subcategoryId: "",
      subsubCategoryId: "",
    });
  
  
    useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/general-categories/tree?type=tourism");
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, []);
  
  const generalCategoryOptions = useMemo(
    () => generalTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [generalTree]
  );
  
  const generalSubcategoryOptions = useMemo(() => {
    const c = generalTree.find((x) => x.id === selectedGeneral.categoryId);
    return (c?.subcategories || []).map((sc) => ({
      value: sc.id,
      label: sc.name || `Subcategory ${sc.id}`,
    }));
  }, [generalTree, selectedGeneral.categoryId]);
  
  const generalSubsubCategoryOptions = useMemo(() => {
    const c = generalTree.find((x) => x.id === selectedGeneral.categoryId);
    const sc = c?.subcategories?.find((s) => s.id === selectedGeneral.subcategoryId);
    return (sc?.subsubcategories || []).map((ssc) => ({
      value: ssc.id,
      label: ssc.name || `Sub-sub ${ssc.id}`,
    }));
  }, [generalTree, selectedGeneral.categoryId, selectedGeneral.subcategoryId]);
  
  
  
  /* ---------- Reusable SearchableSelect (combobox) ---------- */
  function SearchableSelect({
    value,
    onChange,
    options, // [{ value, label }]
    placeholder = "Select…",
    disabled = false,
    required = false,
    ariaLabel,
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef(null);
    const inputRef = useRef(null);
  
    const selected = useMemo(() => options.find((o) => String(o.value) === String(value)) || null, [options, value]);
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options.slice(0, 100);
      return options
        .map((o) => ({ o, score: (o.label || "").toLowerCase().indexOf(q) }))
        .filter((x) => x.score !== -1)
        .sort((a, b) => a.score - b.score)
        .map((x) => x.o)
        .slice(0, 100);
    }, [query, options]);
  
    useEffect(() => {
      function onDocClick(e) {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
  
    useEffect(() => {
      if (!open) setActiveIndex(0);
    }, [open, query]);
  
    function pick(opt) {
      onChange?.(opt?.value || "");
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    }
  
    function clear() {
      onChange?.("");
      setQuery("");
      setOpen(false);
      inputRef.current?.focus();
    }
  
    function onKeyDown(e) {
      if (disabled) return;
      if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        setOpen(true);
        return;
      }
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[activeIndex];
        if (opt) pick(opt);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
  
    return (
      <div ref={rootRef} className={`relative ${disabled ? "opacity-60" : ""}`}>
        <div className="grid gap-1.5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={disabled}
              placeholder={selected ? selected.label : placeholder}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => !disabled && setOpen(true)}
              onKeyDown={onKeyDown}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="ss-results"
              aria-label={ariaLabel || placeholder}
              role="combobox"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {selected && !disabled ? (
              <button
                type="button"
                onClick={clear}
                className="absolute right-8 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100"
                title="Clear"
              >
                ×
              </button>
            ) : null}
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <I.chevron />
            </span>
          </div>
  
          {/* Hidden required input to participate in HTML validity if needed */}
          {required && (
            <input
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              required
              value={value || ""}
              onChange={() => {}}
            />
          )}
        </div>
  
        {open && !disabled && (
          <div
            id="ss-results"
            role="listbox"
            className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No results</div>
            ) : (
              <ul className="max-h-72 overflow-auto">
                {filtered.map((opt, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isActive}
                      className={`cursor-pointer px-3 py-2 text-sm ${isActive ? "bg-brand-50" : "hover:bg-gray-50"}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
                    >
                      {opt.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
  

  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;

    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const payload = {
        postType,
        title: form.title,
        country: form.country,
        location: form.location || undefined,
        description: form.description,
        season: form.season || undefined,
        budgetRange: form.budgetRange || undefined,
        tags: parsedTags(),
        images, // [{ title, base64url }]
        identityIds: Array.from(audSel.identityIds),
        categoryIds: Array.from(audSel.categoryIds),
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),

        generalCategoryId: selectedGeneral.categoryId || null,
        generalSubcategoryId: selectedGeneral.subcategoryId || null,
        generalSubsubCategoryId: selectedGeneral.subsubCategoryId || null,
      };

      if (isEditMode) {
        await client.put(`/tourism/${id}`, payload);
        toast.success("Tourism post updated!");
      } else {
        await client.post("/tourism", payload);
        toast.success("Tourism post published!");
      }
      setLoading(true)
      navigate("/tourism");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save tourism post");
    } finally {
      setSaving(false);
      setLoading(false)
    }
  }

  
     if (loading && id) {
          return (
            <FullPageLoader message="Loading service…" tip="Fetching..." />
          );
    }
      

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <Header page={"tourism"}/>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/tourism")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
          type="button"
        >
          ← Back
        </button>
        {!isEditMode && <h1 className="text-2xl font-bold mt-3">{isEditMode ? "Edit Tourism Post" : "Create Tourism Post"}</h1>}
       {!isEditMode && <p className="text-sm text-gray-600">
          Share amazing destinations, experiences, and cultural insights across Africa
        </p>
}
        {/* Non-owner read-only view */}
        {readOnly ? (
          <ReadOnlyTourismPost
            postType={postType}
            form={form}
            images={images}
            audSel={audSel}
            audTree={audTree}
          />
        ) : (
          <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-8">
            {/* Post Type */}
            <section>
              <h2 className="font-semibold">Post Type</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Destination", desc: "Share a beautiful location" },
                  { label: "Experience", desc: "Share travel experiences" },
                  { label: "Culture", desc: "Share cultural insights" },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setPostType(t.label)}
                    className={`border rounded-xl p-4 text-left transition-colors ${
                      postType === t.label ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-600"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Title */}
            <section>
              <h2 className="font-semibold">Title *</h2>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Enter an engaging title for your post"
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              />
            </section>

            {/* Location */}
            <section>
              <h2 className="font-semibold">Country & City/Location *</h2>
              <div className="mt-2 grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                    required
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-3">
                    <I.chevron />
                  </span>
                </div>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="Enter specific location (e.g., Zanzibar, Stone Town)"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </section>

            {/* Media Upload (Images Only) */}
            <section>
              <h2 className="font-semibold">Photos</h2>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">Upload Images</p>
                <p className="text-xs">Drag and drop your photos here, or click to browse</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilesChosen(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Choose Files
                </button>
                <p className="mt-1 text-xs text-gray-400">Supported formats: JPG, PNG, WebP, GIF (Max 5MB each)</p>

                {images.length > 0 && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                    {images.map((img, idx) => (
                      <div key={idx} className="border rounded-xl overflow-hidden">
                        <div className="h-44 bg-gray-100">
                          <img
                            src={img.base64url}
                            alt={img.title || `Image ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={img.title}
                            onChange={(e) => updateImageTitle(idx, e.target.value)}
                            placeholder={`Image ${idx + 1} title`}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-2 rounded hover:bg-gray-100"
                            title="Remove"
                          >
                            <I.trash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="font-semibold">Description *</h2>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe this destination, share your experience, cultural insights, and travel tips..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                rows={4}
                required
              />
            </section>

            {/* Season & Budget */}
            <section>
              <h2 className="font-semibold">Best Season to Visit & Budget Range</h2>
              <div className="mt-2 grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    value={form.season}
                    onChange={(e) => setField("season", e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                  >
                    <option value="">Select Season</option>
                    <option>Summer</option>
                    <option>Winter</option>
                    <option>All Year</option>
                    <option>Rainy Season</option>
                    <option>Dry Season</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-3">
                    <I.chevron />
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={form.budgetRange}
                    onChange={(e) => setField("budgetRange", e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                  >
                    <option value="">Select Budget</option>
                    <option>$100 - $500</option>
                    <option>$500 - $2000</option>
                    <option>$2000+</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-3">
                    <I.chevron />
                  </span>
                </div>
              </div>
            </section>

            {/* Tags */}
            <section>
              <h2 className="font-semibold">Tags</h2>
              <input
                type="text"
                value={form.tagsInput}
                onChange={(e) => setField("tagsInput", e.target.value)}
                placeholder="Add relevant tags (e.g., wildlife, beaches, culture, adventure)"
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas to help others discover your post
              </p>
            </section>

            {/* ===== General Classification (SEARCHABLE) ===== */}
<section>
  <h2 className="font-semibold text-brand-600">Classification</h2>
  <p className="text-xs text-gray-600 mb-3">
    Search and pick the category that best describes your product.
  </p>

  <div className="grid md:grid-cols-2 gap-4">
    <div>
      <label className="text-[12px] font-medium text-gray-700">General Category</label>
      <SearchableSelect
        ariaLabel="Category"
        value={selectedGeneral.categoryId}
        onChange={(val) =>
          setSelectedGeneral({ categoryId: val, subcategoryId: "", subsubCategoryId: "" })
        }
        options={generalCategoryOptions}
        placeholder="Search & select category…"
      />
    </div>

    <div>
      <label className="text-[12px] font-medium text-gray-700">General Subcategory</label>
      <SearchableSelect
        ariaLabel="Subcategory"
        value={selectedGeneral.subcategoryId}
        onChange={(val) =>
          setSelectedGeneral((s) => ({ ...s, subcategoryId: val, subsubCategoryId: "" }))
        }
        options={generalSubcategoryOptions}
        placeholder="Search & select subcategory…"
        disabled={!selectedGeneral.categoryId}
      />
    </div>

    
  </div>
</section>

            {/* ===== Share With (Audience selection) ===== */}
            <section>
              <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select who should see this post. Choose multiple identities, categories, subcategories, and sub-subs.
              </p>
              <AudienceTree
                tree={audTree}
                selected={audSel}
                onChange={(next) => setAudSel(next)}
              />
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => navigate("/tourism")} className={styles.ghost}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryWide} disabled={saving}>
                {saving ? "Saving…" : isEditMode ? "Update Post" : "Publish Post"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
