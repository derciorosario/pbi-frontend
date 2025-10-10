// src/pages/CrowdfundForm.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import client, { API_URL } from "../api/client";
import AudienceTree from "../components/AudienceTree";
import DefaultLayout from "../layout/DefaultLayout";
import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";
import { toast } from "../lib/toast";

/* --- Minimal inline icons --- */
const I = {
  upload: () => (
    <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3 7 8h3v6h4V8h3l-5-5z" />
      <path d="M5 18h14v3H5z" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  trash: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z" />
    </svg>
  ),
};

/* --- Small form atoms --- */
const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      props.className || ""
    }`}
  />
);

const Select = ({ children, ...rest }) => (
  <div className="relative">
    <select
      {...rest}
      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
      <I.chevron />
    </span>
  </div>
);

const Textarea = (props) => (
  <textarea
    rows={props.rows || 4}
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      props.className || ""
    }`}
  />
);


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

/* ---------- Read-only viewer for non-owners (with images) ---------- */
function ReadOnlyCrowdfundView({ form, images, audSel, audTree }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map(k => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map(k => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map(k => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map(k => maps.subsubs.get(String(k))).filter(Boolean);

  const hero = images?.[0] ? `${API_URL}/uploads/${images[0]}` : null;
  const gallery = (images || []).slice(1);
  const tags = (form.tags || "")
    .split(/[,\n]/g)
    .map(t => t.trim())
    .filter(Boolean);
  const links = (form.links || "")
    .split(/[,\n]/g)
    .map(t => t.trim())
    .filter(Boolean);

  function fmtCurrency(v) {
    if (v == null || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return `${form.currency || "USD"} ${n.toLocaleString()}`;
    }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      {/* Hero */}
      {hero ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          <img src={hero} alt="Project cover" className="h-full w-full object-cover" />
          
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Title & location */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled Project"}</h1>
            <div className="mt-1 text-sm text-gray-700">
              {[form.city, form.country].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Goal</div>
            <div className="mt-1 text-sm">{fmtCurrency(form.goal)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Raised</div>
            <div className="mt-1 text-sm">{fmtCurrency(form.raised)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Currency</div>
            <div className="mt-1 text-sm">{form.currency || "—"}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium">Deadline</div>
            <div className="mt-1 text-sm">{form.deadline || "—"}</div>
          </div>
        </div>

        {/* Gallery */}
        {gallery.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Gallery</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gallery.map((img, idx) => {
                const src = img.startsWith("http") ? img : `${API_URL}/uploads/${img}`;
                return (
                  <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                    <img src={src} alt={`Image ${idx + 2}`} className="h-full w-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Pitch */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Pitch</h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {form.pitch || "No description provided."}
          </p>
        </div>

        {/* Rewards & Team */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Rewards / Perks</h3>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{form.rewards || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Team</h3>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{form.team || "—"}</p>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Links</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {links.length
              ? links.map((u, i) => (
                  <a
                    key={`${u}-${i}`}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-200"
                  >
                    {u}
                  </a>
                ))
              : <span className="text-sm text-gray-500">—</span>}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length
              ? tags.map((t, i) => (
                  <span key={`${t}-${i}`} className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs">
                    {t}
                  </span>
                ))
              : <span className="text-sm text-gray-500">—</span>}
          </div>
        </div>

        {/* Audience */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Target Audience</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((x) => <span key={`i-${x}`} className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs">{x}</span>)}
            {categories.map((x) => <span key={`c-${x}`} className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs">{x}</span>)}
            {subcategories.map((x) => <span key={`s-${x}`} className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs">{x}</span>)}
            {subsubs.map((x) => <span key={`ss-${x}`} className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs">{x}</span>)}
            {!identities.length && !categories.length && !subcategories.length && !subsubs.length && (
              <span className="text-sm text-gray-500">Everyone</span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="rounded-lg px-3 py-1.5 text-sm font-semibold border border-brand-600 text-brand-600 bg-white hover:bg-brand-50" onClick={() => history.back()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/** Create/Edit Crowdfunding Project */
export default function CrowdfundForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const [loading,setLoading]=useState(true)

  const [ownerUserId, setOwnerUserId] = useState(null);

  const fileRef = useRef(null);
  // Images: array of strings (filenames)
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  const [saving, setSaving] = useState(false);

  // Audience tree data and selection
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    country: "",
    city: "",
    goal: "",
    raised: "",
    currency: "USD",
    deadline: "",
    pitch: "",
    rewards: "",
    team: "",
    links: "", // comma/newline separated
    tags: [],
    email: "",
    phone: "",
    visibility: "public",
    status: "draft",
  });

  const [tagInput, setTagInput] = useState("");

  const change = (e) => {
    if (readOnly) return;
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const chooseFiles = () => { if (!readOnly) fileRef.current?.click(); };

  /* Load categories and audience tree */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/categories/tree");
        setCats(data.categories || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    })();
    (async () => {
      try {
        const { data } = await client.get("/public/identities?type=all");
        setAudTree(data.identities || []);
      } catch (err) {
        console.error("Error loading identities:", err);
      }
    })();
  }, []);

  /* Edit mode: fetch existing project */
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {

        
        const { data } = await client.get(`/funding/projects/${id}`);

        // detect owner (support several shapes)
        const ownerId =
          data.ownerUserId ??
          data.createdById ??
          data.userId ??
          data.owner?.id ??
          data.creator?.id ??
          data.createdBy?.id ??
          null;
        setOwnerUserId(ownerId);

        setForm((f) => ({
          ...f,
          title: data.title || "",
          categoryId: data.categoryId || "",
          country: data.country || "",
          city: data.city || "",
          goal: data.goal?.toString?.() || "",
          raised: data.raised?.toString?.() || "",
          currency: data.currency || "USD",
          deadline: data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "",
          pitch: data.pitch || "",
          rewards: data.rewards || "",
          team: data.team || "",
          links: Array.isArray(data.links) ? data.links.join(", ") : data.links || "",
         // tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "",
         tags: Array.isArray(data.tags)
          ? data.tags
          : (typeof data.tags === "string"
              ? data.tags.split(/[,\n]/g).map((t) => t.trim()).filter(Boolean)
              : []),

          email: data.email || "",
          phone: data.phone || "",
          visibility: data.visibility || "public",
          status: data.status || "draft",
        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images
              .filter((x) => x?.filename || typeof x === "string")
              .map((x) => (typeof x === "string" ? x : x.filename))
          );
        } else {
          setImages([]);
        }

        // Set audience selection if available
        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });

        setLoading(false)
      } catch (err) {
        console.error(err);
        console.log({err})
        toast.error("Could not load the project.");
        navigate("/funding");
      }
    })();
  }, [isEditMode, id, navigate]);


  function addTag() {
  if (readOnly) return;
  const v = (tagInput || "").trim();
  if (!v) return;
  setForm((f) =>
    f.tags.includes(v) ? f : { ...f, tags: [...f.tags, v] }
  );
  setTagInput("");
}

function removeTag(idx) {
  if (readOnly) return;
  setForm((f) => ({
    ...f,
    tags: f.tags.filter((_, i) => i !== idx),
  }));
}



  const readOnly = isEditMode  && ownerUserId && user?.id !== ownerUserId;

  /* Upload guard: images only, <=5MB each, max 20 total */
  async function handleFilesChosen(fileList) {
    if (readOnly) return;
    const arr = Array.from(fileList || []);
    if (!arr.length) return;

    // Only images
    const onlyImages = arr.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== arr.length) {
      toast.error("Only image files are allowed.");
      return;
    }

    // Size check (5MB)
    const oversize = onlyImages.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversize.length) {
      toast.error("Each image must be at most 5MB.");
      return;
    }
    const accepted = onlyImages.filter((f) => f.size <= 5 * 1024 * 1024);

    // Cap total (20)
    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));
    if (!slice.length) return;

    try {
      setUploading(true);
      setUploadingCount(slice.length);
      const formData = new FormData();
      slice.forEach((file) => formData.append("images", file));

      const response = await client.post("/funding/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilenames = response.data?.filenames || [];
      setImages((prev) => [...prev, ...uploadedFilenames]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }


  function removeImage(idx) {
    if (readOnly) return;
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  /* Helpers -> payload */
  function parsedTags() {
    return (form.tags || "")
      .split(/[,\n]/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function parsedLinks() {
    return (form.links || "")
      .split(/[,\n]/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.country) return "Country is required.";
    if (!form.goal || Number(form.goal) <= 0) return "Funding goal must be greater than zero.";
    if (!form.deadline) return "Deadline is required.";
    if (!form.pitch.trim()) return "Project pitch/description is required.";
    if (!images.length) return "Please add at least one image.";
    return null;
  }




  // General taxonomy
  const [generalTree, setGeneralTree] = useState([]);
  const [selectedGeneral, setSelectedGeneral] = useState({
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

  // Industry taxonomy
  const [industryTree, setIndustryTree] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState({
    categoryId: "",
    subcategoryId: "",
  });

  useEffect(() => {
  (async () => {
    try {
      const { data } = await client.get("/general-categories/tree?type=opportunity");
      setGeneralTree(data.generalCategories || []);
    } catch (err) {
      console.error("Failed to load general categories", err);
    }
  })();
}, []);

  // Load INDUSTRY taxonomy tree
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

  // Build options for industry pickers
  const industryCategoryOptions = useMemo(
    () => industryTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [industryTree]
  );
  const industrySubcategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [industryTree, selectedIndustry.categoryId]);
  
  
  
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
    const [focused, setFocused] = useState(false);
  
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

    // Show query while editing; only show selected label when not editing
    const isEditing = focused || open || query !== "";
    const displayValue = isEditing ? query : (selected?.label || "");
  
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
      if (!open) {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (selected && !query) {
            // Start editing from the selected label and remove last character
            setQuery((selected.label || "").slice(0, -1));
          } else {
            // Remove last character from current query
            setQuery((query || "").slice(0, -1));
          }
          setOpen(true);
        }
        return;
      }
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
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => { if (!disabled) { setFocused(true); setOpen(true); } }}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              aria-autocomplete="list"
              aria-expanded={open} aria-controls="ss-results"
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
  

  async function handleSubmit(status) {
    if (readOnly) return;
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || undefined,
        country: form.country,
        city: form.city || undefined,
        goal: Number(form.goal),
        raised: form.raised ? Number(form.raised) : 0,
        currency: form.currency,
        deadline: form.deadline, // YYYY-MM-DD
        pitch: form.pitch,
        rewards: form.rewards || undefined,
        team: form.team || undefined,
        links: parsedLinks(),
        tags: form.tags,

        email: form.email || undefined,
        phone: form.phone || undefined,
        visibility: form.visibility || "public",
        status, // "draft" | "published"
        images: images.map((f) => `${API_URL}/uploads/${f}`),
        // Include audience targeting data
        identityIds: Array.from(audSel.identityIds),
        categoryIds: Array.from(audSel.categoryIds),
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),

        generalCategoryId: selectedGeneral.categoryId || null,
        generalSubcategoryId: selectedGeneral.subcategoryId || null,
        generalSubsubCategoryId: selectedGeneral.subsubCategoryId || null,
        // Industry taxonomy
        industryCategoryId: selectedIndustry.categoryId || null,
        industrySubcategoryId: selectedIndustry.subcategoryId || null,
      };

      if (isEditMode) {
        await client.put(`/funding/projects/${id}`, payload);
        toast.success("Project updated successfully!");
      } else {
        await client.post("/funding/projects", payload);
        toast.success(status === "draft" ? "Draft saved!" : "Project published!");
      }
      navigate("/funding");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Could not save the project.");
    } finally {
      setSaving(false);
    }
  }

    if (loading && id) {
          return (
            <FullPageLoader message="Loading product…" tip="Fetching..." />
          );
      }

  return (
    <DefaultLayout>
      <Header page={'funding'}/>
      <div className="max-w-4xl mx-auto my-5">
        <button
          onClick={() => navigate("/funding")}
          className="flex mb-5 items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
          type="button"
        >
          ← Back to Funding
        </button>

        {/* Non-owner summary view */}
        {readOnly ? (
          <ReadOnlyCrowdfundView form={form} images={images} audSel={audSel} audTree={audTree} />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{isEditMode ? "Edit Funding Project" : "Create Funding Project"}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Present your idea, set goals, and raise funds from the 54Links community.
            </p>

            {/* Title & Category */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Project Title</Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={change}
                  placeholder="e.g., Payments platform for SMEs"
                  required
                />
              </div>
              <div className="hidden">
                <Label required>Category</Label>
                <Select name="categoryId" value={form.categoryId} onChange={change} required>
                  <option value="">Select</option>
                  {cats.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Country</Label>
                <SearchableSelect
                  value={form.country}
                  onChange={(value) => setForm({ ...form, country: value })}
                  options={countryOptions}
                  placeholder="Search and select country..."
                  required
                />
              </div>
              <div>
                <Label>City</Label>
                <SearchableSelect
                  value={form.city}
                  onChange={(value) => setForm({ ...form, city: value })}
                  options={cityOptions}
                  placeholder="Search and select city..."
                />
              </div>
            </div>

            {/* Goal, Raised, Currency, Deadline */}
            <div className="mt-4 grid md:grid-cols-4 gap-4">
              <div>
                <Label required>Funding Goal</Label>
                <Input
                  name="goal"
                  type="number"
                  min="0"
                  value={form.goal}
                  onChange={change}
                  placeholder="e.g., 50000"
                  required
                />
              </div>

              <div>
                <Label>Amount Raised</Label>
                <Input
                  name="raised"
                  type="number"
                  min="0"
                  value={form.raised}
                  onChange={change}
                  placeholder="e.g., 25000"
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select name="currency" value={form.currency} onChange={change}>
                  {[
                    "USD","EUR","GBP","NGN","GHS","ZAR","KES","UGX","TZS","XOF","XAF","MAD","DZD","TND","EGP","ETB",
                    "NAD","BWP","MZN","ZMW","RWF","BIF","SOS","SDG","CDF",
                  ].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label required>Deadline</Label>
                <Input name="deadline" type="date" value={form.deadline} onChange={change} required />
              </div>
            </div>

            {/* Media (images only) */}
            <div className="mt-4">
              <Label>Media (images)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
                <div className="mb-2">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Upload images to showcase your crowdfunding project (max 5MB per file)
                <div className="mt-3">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFilesChosen(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={chooseFiles}
                    className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Choose Files
                  </button>
                </div>

                {(images.length > 0 || uploadingCount > 0) && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                    {images.map((img, idx) => {
                      const src =
                        img.startsWith("http://") || img.startsWith("https://")
                          ? img
                          : `${API_URL}/uploads/${img}`;
                      return (
                        <div key={`${img}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                          <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                            <img src={src} alt={img} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">Image {idx + 1}</div>
                            <div className="text-[11px] text-gray-500 truncate">Attached</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Remove"
                          >
                            <I.trash />
                          </button>
                        </div>
                      );
                    })}

                    {uploadingCount > 0 &&
                      Array.from({ length: uploadingCount }).map((_, idx) => (
                        <div key={`img-skel-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                          <div className="h-12 w-12 rounded-md bg-gray-200 animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse" />
                          </div>
                          <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                        </div>
                      ))}
                  </div>
                )}

                <p className="mt-2 text-[11px] text-gray-400">
                  Formats: JPG, PNG, WebP, GIF — up to 5MB each, max 20 images.
                </p>
              </div>
            </div>

            {/* Pitch / Description */}
            <div className="mt-4">
              <Label required>Pitch / Description</Label>
              <Textarea
                name="pitch"
                value={form.pitch}
                onChange={change}
                rows={6}
                placeholder="Explain the problem, your solution, market, traction, and how funds will be used."
                required
              />
            </div>

            {/* Rewards / Team */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <Label>Rewards / Perks (optional)</Label>
                <Textarea
                  name="rewards"
                  value={form.rewards}
                  onChange={change}
                  rows={4}
                  placeholder="e.g., Early access, platform credits, swag…"
                />
              </div>
              <div>
                <Label>Team</Label>
                <Textarea
                  name="team"
                  value={form.team}
                  onChange={change}
                  rows={4}
                  placeholder="Who’s building this? Roles and experience."
                />
              </div>
            </div>

            {/* Links */}
            <div className="mt-4">
              <Label>Links (site, deck, demo)</Label>
              <Input
                name="links"
                value={form.links}
                onChange={change}
                placeholder="Separate with commas or new lines: https://..., https://..."
              />
            </div>

            {/* Contact & Tags */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input name="email" value={form.email} onChange={change} placeholder="you@company.com" />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input name="phone" value={form.phone} onChange={change} placeholder="+244 ..." />
              </div>
            </div>

           <div className="mt-4 mb-6">
            <Label>Tags</Label>
            <div className="flex items-center gap-2">
           <div className="flex-1"> 
               <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                
                placeholder="Add a tag (e.g., fintech, payments, SME)"
              />
            </div>
            <div>
                <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
              >
                + Add
              </button>
            </div>
            </div>

            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((t, idx) => (
                  <span
                    key={`${t}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                  >
                    {t}
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
            <p className="mt-1 text-[11px] text-gray-400">
              Tags help others discover your crowdfunding project
            </p>
          </div>




            
            {/* ===== General Classification (SEARCHABLE) ===== */}
            <div>
              <h2 className="font-semibold text-brand-600">Classification</h2>
              <p className="text-xs text-gray-600 mb-3">
                Search and pick the category that best describes your crowdfunding project.
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
            
                <div className="hidden">
                  <label className="text-[12px] font-medium text-gray-700">General Sub-subcategory</label>
                  <SearchableSelect
                    ariaLabel="General Sub-subcategory"
                    value={selectedGeneral.subsubCategoryId}
                    onChange={(val) => setSelectedGeneral((s) => ({ ...s, subsubCategoryId: val }))}
                    options={generalSubsubCategoryOptions}
                    placeholder="Search & select sub-subcategory…"
                    disabled={!selectedGeneral.subcategoryId}
                  />
                </div>
              </div>
            </div>
            
            {/* ===== Industry Classification ===== */}
            <div className="mt-6">
              <h2 className="font-semibold text-brand-600">Industry Classification</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select the industry category and subcategory that best describes your crowdfunding project.
              </p>
            
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-gray-700">Industry Category</label>
                  <SearchableSelect
                    ariaLabel="Industry Category"
                    value={selectedIndustry.categoryId}
                    onChange={(val) =>
                      setSelectedIndustry({ categoryId: val, subcategoryId: "" })
                    }
                    options={industryCategoryOptions}
                    placeholder="Search & select industry category…"
                  />
                </div>
            
                <div>
                  <label className="text-[12px] font-medium text-gray-700">Industry Subcategory</label>
                  <SearchableSelect
                    ariaLabel="Industry Subcategory"
                    value={selectedIndustry.subcategoryId}
                    onChange={(val) =>
                      setSelectedIndustry((s) => ({ ...s, subcategoryId: val }))
                    }
                    options={industrySubcategoryOptions}
                    placeholder="Search & select industry subcategory…"
                    disabled={!selectedIndustry.categoryId}
                  />
                </div>
              </div>
            </div>


            {/* Audience Targeting */}
            <div className="mt-4">
              <Label>Target Audience</Label>
              <div className="mt-2 border border-gray-200 rounded-xl p-4 bg-gray-50/60">
                <p className="text-sm text-gray-500 mb-3">
                  Select who should see this funding project in their feeds and recommendations.
                </p>
                {audTree.length > 0 ? (
                  <AudienceTree
                    tree={audTree || []}
                    selected={audSel}
                    onChange={setAudSel}
                  />
                ) : (
                  <p className="text-sm text-gray-400 italic">Loading audience options...</p>
                )}
              </div>
            </div>



            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => handleSubmit("published")}
                type="button"
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
              >
                {saving ? "Publishing…" : "Publish project"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
