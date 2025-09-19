// src/pages/CreateMomentPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Plus } from "lucide-react";
import COUNTRIES from "../constants/countries"; // optional: if you want to suggest locations, else unused
import CITIES from "../constants/cities.json";
import client from "../api/client";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import AudienceTree from "../components/AudienceTree";
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
  plus: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
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

/* ---------- Read-only view for non-owners ---------- */
function ReadOnlyMomentView({ form, tags, images, audSel, audTree }) {
  const maps = React.useMemo(() => {
    const ids = new Map();
    const cats = new Map();
    const subs = new Map();
    const subsubs = new Map();
    for (const idn of audTree) {
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
  }, [audTree]);

  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const coverImageUrl = images && images.length > 0 ? images[0].base64url : null;

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {/* Cover hero */}
      {coverImageUrl ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          <img src={coverImageUrl} alt="Experience cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 bg-white/90 border-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
            {form.type || "Experience"}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled Experience"}</h1>
            <p className="mt-1 text-sm text-gray-700">{form.description || "No description provided."}</p>
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">Type</div>
            <div className="mt-2 text-sm text-gray-700">{form.type || "Not specified"}</div>
          </div>
          {form.date && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">Date</div>
              <div className="mt-2 text-sm text-gray-700">{form.date}</div>
            </div>
          )}
          {(form.location || form.city || form.country) && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">Location</div>
              <div className="mt-2 text-sm text-gray-700">
                {[form.location, form.city, form.country].filter(Boolean).join(", ") || "Not specified"}
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        {images && images.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Images</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.slice(1).map((img, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  <img src={img.base64url} alt={img.title || `Experience image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className={styles.chip}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Audience */}
        {(identities.length > 0 || categories.length > 0 || subcategories.length > 0 || subsubs.length > 0) && (
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
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={styles.ghost} onClick={() => window.history.back()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) || null,
    [options, value]
  );
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

  const displayValue = selected && !query ? selected.label : query;

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
            value={displayValue}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={onKeyDown}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="ss-results"
            aria-label={ariaLabel || placeholder}
            role="combobox"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-brand-200 text-black"
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
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      isActive ? "bg-brand-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(opt);
                    }}
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

/* ------------------------- Page ------------------------- */
export default function CreateMomentPage() {
  const navigate = useNavigate();
  const { id, type: urlType } = useParams(); // Extract id and type from URL
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [currentType, setCurrentType] = useState("need");

  // Form (Experience fields)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Achievement", // ENUM: Achievement | Milestone | Learning | Challenge | Opportunity
    date: "", // yyyy-mm-dd
    location: "",
    country: "",
    city: "",
    relatedEntityType: "", // job | event | product | service | tourism | funding
    relatedEntityId: "",
  });
  
  // Tags state
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  // Images ONLY: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // General taxonomy (Category/Subcategory/SubsubCategory)
  const [generalTree, setGeneralTree] = useState([]);
  const [selectedGeneral, setSelectedGeneral] = useState({
    categoryId: "",
    subcategoryId: "",
    subsubCategoryId: "",
  });

  // Industry taxonomy (IndustryCategory/Subcategory/SubsubCategory)
  const [industryTree, setIndustryTree] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState({
    categoryId: "",
    subcategoryId: "",
    subsubCategoryId: "",
  });

  // Create country options for SearchableSelect
  const countryOptions = COUNTRIES.map(country => ({
    value: country,
    label: country
  }));

  // Create city options for SearchableSelect (limit to reasonable number)
  const cityOptions = CITIES.slice(0, 1000).map(city => ({
    value: city.city,
    label: `${city.city}${city.country ? `, ${city.country}` : ''}`
  }));

  // AudienceTree data + selections (Sets, like Events page)
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  /* -------- Load taxonomy trees -------- */
  useEffect(() => {
    (async () => {
      try {
        const typeParam = currentType ? `?type=${currentType}` : "?type=need";
        const { data } = await client.get(`/general-categories/tree${typeParam}`);
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, [currentType]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/industry-categories/tree");
        setIndustryTree(data.industryCategories || []);
      } catch (err) {
        console.error("Failed to load industry categories", err);
      }
    })();
  }, []);

  // Load identities tree (for AudienceTree)
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

  // Set currentType based on URL type when creating
  useEffect(() => {
    if (urlType && !isEditMode) {
      setCurrentType(urlType);
      setField("relatedEntityType", urlType);
    }
  }, [urlType, isEditMode]);

  /* -------- Options builders -------- */
  const generalCategoryOptions = useMemo(
    () => generalTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [generalTree]
  );
  const generalSubcategoryOptions = useMemo(() => {
    const c = generalTree.find((x) => x.id === selectedGeneral.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [generalTree, selectedGeneral.categoryId]);
  const generalSubsubCategoryOptions = useMemo(() => {
    const c = generalTree.find((x) => x.id === selectedGeneral.categoryId);
    const sc = c?.subcategories?.find((s) => s.id === selectedGeneral.subcategoryId);
    return (sc?.subsubcategories || []).map((ssc) => ({ value: ssc.id, label: ssc.name || `Sub-sub ${ssc.id}` }));
  }, [generalTree, selectedGeneral.categoryId, selectedGeneral.subcategoryId]);

  const industryCategoryOptions = useMemo(
    () => industryTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [industryTree]
  );
  const industrySubcategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [industryTree, selectedIndustry.categoryId]);
  const industrySubsubCategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    const sc = c?.subcategories?.find((s) => s.id === selectedIndustry.subcategoryId);
    return (sc?.subsubs || []).map((ssc) => ({ value: ssc.id, label: ssc.name || `Sub-sub ${ssc.id}` }));
  }, [industryTree, selectedIndustry.categoryId, selectedIndustry.subcategoryId]);

  /* -------- Edit mode: load moment -------- */
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/moments/${id}`);

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

        setForm((f) => ({
          ...f,
          ...data,
          title: data.title || "",
          description: data.description || "",
          type: data.type || "Achievement",
          date: data.date || "",
          location: data.location || "",
          relatedEntityType: data.relatedEntityType || "",
          relatedEntityId: data.relatedEntityId || "",
        }));
        

        console.log({data})
        // Set tags
        if (Array.isArray(data.tags)) {
          setTags(data.tags);
        }

        if (Array.isArray(data.images)) {
          setImages(
            data.images.map((x, i) => ({
              title: x.title || x.name || `Image ${i + 1}`,
              base64url: x.base64url || x,
            }))
          );
        } else {
          setImages([]);
        }

        setSelectedGeneral({
          categoryId: data.generalCategoryId || "",
          subcategoryId: data.generalSubcategoryId || "",
          subsubCategoryId: data.generalSubsubCategoryId || "",
        });

        setSelectedIndustry({
          categoryId: data.industryCategoryId || "",
          subcategoryId: data.industrySubcategoryId || "",
          subsubCategoryId: data.industrySubsubCategoryId || "",
        });

        // Set currentType for general categories
        setCurrentType(data.relatedEntityType || "need");

        // audience selections
        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load experience");
        navigate("/experiences");
      }
    })();
  }, [isEditMode, id, navigate]);

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  /* -------- helpers -------- */
  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => ({ ...f, [name]: value }));
  }
  
  function addTag() {
    if (readOnly) return;
    const tag = tagInput.trim();
    if (!tag) return;
    
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }
  
  function removeTag(index) {
    if (readOnly) return;
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    if (!form.relatedEntityType) return "Related entity type is required.";
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    return null;
  }

  async function handleFilesChosen(files) {
    if (readOnly) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;

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

  /* -------- Submit -------- */
  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;

    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        date: form.date || null,
        location: form.location || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        tags: tags,
        images, // [{ title, base64url }]

        // Audience selections
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,

        // General taxonomy
        generalCategoryId: selectedGeneral.categoryId || null,
        generalSubcategoryId: selectedGeneral.subcategoryId || null,
        generalSubsubCategoryId: selectedGeneral.subsubCategoryId || null,

        // Industry taxonomy
        industryCategoryId: selectedIndustry.categoryId || null,
        industrySubcategoryId: selectedIndustry.subcategoryId || null,
        industrySubsubCategoryId: selectedIndustry.subsubCategoryId || null,

        // Related entity (optional)
        relatedEntityType: form.relatedEntityType || null, // job | event | product | service | tourism | funding
        relatedEntityId: form.relatedEntityId || null,
      };

      if (isEditMode) {
        await client.put(`/moments/${id}`, payload);
        toast.success("Experience updated!");
      } else {
        await client.post("/moments", payload);
        toast.success("Experience published!");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save moment");
    } finally {
      setSaving(false);
    }
  }

  if (loading && id) {
    return <FullPageLoader message="Loading experience…" tip="Fetching..." />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <Header page={"experiences"} />

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
            type="button"
          >
            ← Feed
          </button>
  
          {!isEditMode && (
            <div>
              <h1 className="text-2xl font-bold mt-3">
                {isEditMode ? "Edit Experience" : "Create Experience"}
              </h1>
              <p className="text-sm text-gray-600">
                {form.relatedEntityType
                  ? `Share an experience of ${form.relatedEntityType} — an achievement, milestone, or learning — and classify it for better discovery.`
                  : "Share an experience — an achievement, milestone, or learning — and classify it for better discovery."
                }
              </p>
            </div>
          )}
  
          {/* Read-only view for non-owners */}
          {readOnly ? (
            <ReadOnlyMomentView form={form} tags={tags} images={images} audSel={audSel} audTree={audTree} />
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-8"
            >
          {/* Related Entity (Required) - Moved to first position */}
          <section>
            <h2 className="font-semibold">What is this experience about? *</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <select
                value={form.relatedEntityType}
                onChange={(e) => setField("relatedEntityType", e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              >
                <option value="">Select entity type</option>
                <option value="job">Job</option>
                <option value="event">Event</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="tourism">Tourism</option>
                <option value="funding">Opportunity</option>
              </select>

            </div>
          </section>

          {/* Type */}
          <section>
            <h2 className="font-semibold">Experience Type</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {["Achievement", "Milestone", "Learning", "Challenge", "Opportunity"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setField("type", label)}
                  className={`border rounded-xl p-3 text-left transition-colors ${
                    form.type === label
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-brand-600"
                  }`}
                >
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </section>

          
          {/* Photos */}
          <section>
            <h2 className="font-semibold">Photos</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2">Upload Images</p>
              <p className="text-xs">Drag and drop your photos here, or click to browse (max 5MB each)</p>

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

          {/* Title */}
          <section>
            <h2 className="font-semibold">Title *</h2>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Give your experience a clear, strong title"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </section>

          {/* Date & Location */}
          <section>
            <h2 className="font-semibold">When & Where</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={form.date || ""}
                  onChange={(e) => setField("date", e.target.value)}
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="Location (e.g., Lagos, Nigeria)"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-gray-700">Country</label>
                <SearchableSelect
                  value={form.country}
                  onChange={(value) => setField("country", value)}
                  options={countryOptions}
                  placeholder="Search and select country..."
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-700">City</label>
                <SearchableSelect
                  value={form.city}
                  onChange={(value) => setField("city", value)}
                  options={cityOptions}
                  placeholder="Search and select city..."
                />
              </div>
            </div>
          </section>


          {/* Description */}
          <section>
            <h2 className="font-semibold">Description *</h2>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe what happened, what you learned, challenges faced, outcomes…"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              rows={5}
              required
            />
          </section>

          {/* Tags */}
          <section>
            <h2 className="font-semibold">Tags</h2>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., AI, grants, partnership, networking"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                aria-label="Add tag"
              >
                <I.plus /> Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                  >
                    {tag}
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => removeTag(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

         
          <section>
            <h2 className="font-semibold text-brand-600">General Classification</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-[12px] font-medium text-gray-700">Category</label>
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
                <label className="text-[12px] font-medium text-gray-700">Subcategory</label>
                <SearchableSelect
                  ariaLabel="Subcategory"
                  value={selectedGeneral.subcategoryId}
                  onChange={(val) => setSelectedGeneral((s) => ({ ...s, subcategoryId: val, subsubCategoryId: "" }))}
                  options={generalSubcategoryOptions}
                  placeholder="Search & select subcategory…"
                  disabled={!selectedGeneral.categoryId}
                />
              </div>
              <div className="hidden">{/*** Hide for now */}
                <label className="text-[12px] font-medium text-gray-700">Sub-sub</label>
                <SearchableSelect
                  ariaLabel="Sub-subcategory"
                  value={selectedGeneral.subsubCategoryId}
                  onChange={(val) => setSelectedGeneral((s) => ({ ...s, subsubCategoryId: val }))}
                  options={generalSubsubCategoryOptions}
                  placeholder="Search & select sub-sub…"
                  disabled={!selectedGeneral.subcategoryId}
                />
              </div>
            </div>
          </section>

          {/* Industry Classification  */}
       
          <section>
            <h2 className="font-semibold text-brand-600">Industry Classification</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-[12px] font-medium text-gray-700">Industry Category</label>
                <SearchableSelect
                  ariaLabel="Industry Category"
                  value={selectedIndustry.categoryId}
                  onChange={(val) => setSelectedIndustry({ categoryId: val, subcategoryId: "", subsubCategoryId: "" })}
                  options={industryCategoryOptions}
                  placeholder="Search & select…"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-700">Industry Subcategory</label>
                <SearchableSelect
                  ariaLabel="Industry Subcategory"
                  value={selectedIndustry.subcategoryId}
                  onChange={(val) => setSelectedIndustry((s) => ({ ...s, subcategoryId: val, subsubCategoryId: "" }))}
                  options={industrySubcategoryOptions}
                  placeholder="Search & select…"
                  disabled={!selectedIndustry.categoryId}
                />
              </div>
              <div className="hidden"> {/*** Hide for now */}
                <label className="text-[12px] font-medium text-gray-700">Industry Sub-sub</label>
                <SearchableSelect
                  ariaLabel="Industry Sub-subcategory"
                  value={selectedIndustry.subsubCategoryId}
                  onChange={(val) => setSelectedIndustry((s) => ({ ...s, subsubCategoryId: val }))}
                  options={industrySubsubCategoryOptions}
                  placeholder="Search & select…"
                  disabled={!selectedIndustry.subcategoryId}
                />
              </div>
            </div>
          </section>
       


          {/* Share With (Audience) */}
          <section>
            <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select who should see this experience. Choose multiple identities, categories, subcategories, and sub-subs.
            </p>
            <AudienceTree
              tree={audTree}
              selected={audSel}
              onChange={(next) => setAudSel(next)}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate("/experiences")} className={styles.ghost}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryWide} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Experience" : "Publish Experience"}
            </button>
          </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
