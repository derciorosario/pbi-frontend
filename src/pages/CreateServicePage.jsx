// src/pages/CreateServicePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import AudienceTree from "../components/AudienceTree";
import Header from "../components/Header";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";

/* -------------- Shared styles (brand) -------------- */
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

/* -------------- Small helpers -------------- */
const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const I = {
  plus: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
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
  pin: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  ),
  clock: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm1-10.59V7h-2v6l5 3 .9-1.45-3.9-2.14Z"/>
    </svg>
  ),
  tag: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="m10 4 8 0a2 2 0 0 1 2 2v8l-8 8-8-8V6a2 2 0 0 1 2-2h4Z"/><circle cx="15" cy="9" r="1.5" fill="white"/>
    </svg>
  ),
  cash: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 6h18v12H3z"/><circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  ),
};

/* Convert a File to a data URL (base64) */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function isImage(base64url) {
  return typeof base64url === "string" && base64url.startsWith("data:image");
}

function fmtPrice(amount, type) {
  if (amount === "" || amount == null) return "—";
  return `${amount}${type ? ` (${type})` : ""}`;
}

/* Build quick lookup maps for audience labels from the identities tree */
function buildAudienceMaps(tree = []) {
  const ids = new Map();
  const cats = new Map();
  const subs = new Map();
  const subsubs = new Map();
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

/* Collect cover + gallery images from service object and attachments */
function extractServiceMedia(service = {}, attachments = []) {
  const urls = [];

  const pushIf = (u) => {
    if (typeof u === "string" && u.trim()) urls.push(u.trim());
  };
  const fromArr = (arr) => {
    if (Array.isArray(arr)) arr.forEach((u) => typeof u === "string" ? pushIf(u) : u?.url && pushIf(u.url));
  };

  // service-level urls if your backend ever adds them
  pushIf(service.coverImageUrl);
  pushIf(service.bannerUrl);
  pushIf(service.heroUrl);
  fromArr(service.images);
  fromArr(service.gallery);
  fromArr(service.photos);

  // images from attachments (base64)
  attachments.forEach((a) => {
    if (isImage(a?.base64url)) urls.push(a.base64url);
  });

  // unique
  const uniq = Array.from(new Set(urls));
  const coverImageUrl = service.coverImageUrl || uniq[0] || null;
  const images = uniq.filter((u) => u !== coverImageUrl);

  // non-image documents
  const docs = attachments
    .filter((a) => a?.base64url && !isImage(a.base64url))
    .map((a) => ({ name: a.name, base64url: a.base64url }));

  return { coverImageUrl, images, docs };
}

/* ---------- Read-only view for non-owners (with images) ---------- */
function ReadOnlyServiceView({ form, audSel, audTree, media }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const { coverImageUrl, images = [], docs = [] } = media || {};
  const skills = form.skills || [];

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {/* Cover hero */}
      {coverImageUrl ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={coverImageUrl} alt="Service cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 bg-white/90 border-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
            {form.serviceType || "Service"}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled Service"}</h1>
            <p className="mt-1 text-sm text-gray-700">{form.description || "No description provided."}</p>
          </div>
         
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium"><I.cash /> Pricing</div>
            <div className="mt-2 text-sm text-gray-700">{fmtPrice(form.priceAmount, form.priceType)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium"><I.clock /> Delivery</div>
            <div className="mt-2 text-sm text-gray-700">{form.deliveryTime || "—"}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium"><I.tag /> Experience</div>
            <div className="mt-2 text-sm text-gray-700">{form.experienceLevel || "—"}</div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium"><I.pin /> Location</div>
          <div className="mt-2 text-sm text-gray-700">
            <div>Type: {form.locationType || "—"}</div>
            {form.locationType === "On-site" ? (
              <div className="mt-1">{[form.city, form.country].filter(Boolean).join(", ") || "—"}</div>
            ) : null}
          </div>
        </div>

        {/* Gallery */}
        {(images?.length || 0) > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Images</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src={src} alt={`Service image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Non-image attachments */}
        {(docs?.length || 0) > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {docs.map((d, i) => (
                <a
                  key={`${d.name}-${i}`}
                  href={d.base64url}
                  download={d.name}
                  className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="h-10 w-10 rounded-md bg-gray-100 grid place-items-center text-xs text-gray-500">DOC</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">Tap to download</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Skills */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.length
              ? skills.map((s, idx) => (
                  <span key={`${s}-${idx}`} className={styles.chip}>{s}</span>
                ))
              : <span className="text-sm text-gray-500">—</span>}
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

/* -------------- Page -------------- */
export default function CreateServicePage() {
  const navigate = useNavigate();
  const { id } = useParams(); // optional edit mode (services/:id)
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const [loading,setLoading]=useState(true)

  // owner detection
  const [ownerUserId, setOwnerUserId] = useState(null);

  // AudienceTree data + selections (Sets, like Events page)
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Form state
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    serviceType: "Consulting",
    description: "",
    priceAmount: "",
    priceType: "Fixed Price", // Fixed Price | Hourly
    deliveryTime: "1 Week",
    locationType: "Remote", // Remote | On-site
    experienceLevel: "Intermediate",
    country: "",
    city: "",
    skills: [], // array of strings
  });

  const [skillInput, setSkillInput] = useState("");

  // Attachments: [{ name, base64url }]
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Media extracted for read-only view
  const [media, setMedia] = useState({ coverImageUrl: null, images: [], docs: [] });

  // Read-only if editing and current user is not the owner
  const readOnly = isEditMode && ownerUserId && user?.id != ownerUserId;

  /* ---------- Effects ---------- */

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

  // If editing, fetch existing service
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const { data } = await client.get(`/services/${id}`);
        
    setLoading(true)

        // detect owner id (support several possible shapes)
        const ownerId = data.providerUserId

        setOwnerUserId(ownerId);

        // hydrate form
        setForm((f) => ({
          ...f,
          title: data.title || "",
          serviceType: data.serviceType || "Consulting",
          description: data.description || "",
          priceAmount: data.priceAmount?.toString() || "",
          priceType: data.priceType || "Fixed Price",
          deliveryTime: data.deliveryTime || "1 Week",
          locationType: data.locationType || "Remote",
          experienceLevel: data.experienceLevel || "Intermediate",
          country: data.country || "",
          city: data.city || "",
          skills: Array.isArray(data.skills) ? data.skills : [],
        }));

        // attachments
        let nextAttachments = [];
        if (Array.isArray(data.attachments)) {
          nextAttachments = data.attachments
            .filter((a) => a?.name && a?.base64url)
            .map((a) => ({ name: a.name, base64url: a.base64url }));
          setAttachments(nextAttachments);
        } else {
          setAttachments([]);
        }

        // audience selections
        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });

        // build media
        setMedia(extractServiceMedia(data, nextAttachments));
        setLoading(false)
      } catch (err) {
        console.error(err);
        toast.error("Failed to load service");
        navigate("/services");
      }
    })();
  }, [isEditMode, id, navigate]);

  // If attachments change (owner may add during edit), refresh media
  useEffect(() => {
    if (!isEditMode) return;
    setMedia((m) => extractServiceMedia({ coverImageUrl: m.coverImageUrl }, attachments));
  }, [attachments, isEditMode]);

  /* ---------- Handlers ---------- */

  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => {
      const next = { ...f, [name]: value };
      // Clear country/city if Remote
      if (name === "locationType" && value === "Remote") {
        next.country = "";
        next.city = "";
      }
      return next;
    });
  }

  function addSkill() {
    if (readOnly) return;
    const v = (skillInput || "").trim();
    if (!v) return;
    setForm((f) =>
      f.skills.includes(v) ? f : { ...f, skills: [...f.skills, v] }
    );
    setSkillInput("");
  }

  function removeSkill(idx) {
    if (readOnly) return;
    setForm((f) => ({ ...f, skills: f.skills.filter((_, i) => i !== idx) }));
  }

  async function handleFilesChosen(files) {
    if (readOnly) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Optionally cap total
    const remainingSlots = 20 - attachments.length;
    const slice = remainingSlots > 0 ? arr.slice(0, remainingSlots) : [];

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          return { name: file.name, base64url };
        })
      );
      setAttachments((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some files could not be read.");
    }
  }

  function removeAttachment(idx) {
    if (readOnly) return;
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (form.priceType !== "Fixed Price" && form.priceType !== "Hourly")
      return "Invalid price type";
    if (form.priceAmount && Number(form.priceAmount) < 0)
      return "Price cannot be negative";
    if (form.locationType === "On-site" && !form.country)
      return "Country is required for On-site services";
    return null;
  }




  // General taxonomy
  const [generalTree, setGeneralTree] = useState([]);
  const [selectedGeneral, setSelectedGeneral] = useState({
    categoryId: "",
    subcategoryId: "",
    subsubCategoryId: "",
  });

  // Industry taxonomy
  const [industryTree, setIndustryTree] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState({
    categoryId: "",
    subcategoryId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/general-categories/tree?type=service");
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

    // Show selected value or placeholder
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
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
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
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      const payload = {
        ...form,
        priceAmount:
          form.priceAmount !== "" && !Number.isNaN(Number(form.priceAmount))
            ? Number(form.priceAmount)
            : undefined,
        attachments,
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,

        generalCategoryId: selectedGeneral.categoryId || null,
        generalSubcategoryId: selectedGeneral.subcategoryId || null,
        generalSubsubCategoryId: selectedGeneral.subsubCategoryId || null,
        // Industry taxonomy
        industryCategoryId: selectedIndustry.categoryId || null,
        industrySubcategoryId: selectedIndustry.subcategoryId || null,
      };

      if (form.locationType === "Remote") {
        delete payload.country;
        delete payload.city;
      }

      if (isEditMode) {
        await client.put(`/services/${id}`, payload);
        toast.success("Service updated!");
      } else {
        await client.post("/services", payload);
        toast.success("Service published!");
      }

      navigate("/services");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save service");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- UI ---------- */

   if (loading && id) {
        return (
          <FullPageLoader message="Loading service…" tip="Fetching..." />
        );
      }
    

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header page={"services"} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/services")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
          type="button"
        >
          ← Back to services
        </button>

       {user && <>
        <h1 className="text-2xl font-bold mt-3">
          {isEditMode ? "Edit Service" : "Create Service Post"}
        </h1>
        <p className="text-sm text-gray-600">
          Share your professional services with the 54Links community.
        </p></>}

        {/* Non-owner summary view (with images) */}
        {readOnly ? (
          <ReadOnlyServiceView form={form} audSel={audSel} audTree={audTree} media={media} />
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8"
          >
            {/* Service Type */}
            <section>
              <h2 className="font-semibold text-brand-600">Service Type</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Consulting", desc: "Professional advice and expertise" },
                  { label: "Freelance Work", desc: "Project-based services" },
                  { label: "Product/Service", desc: "Physical or digital products" },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.label}
                    onClick={() => setField("serviceType", t.label)}
                    className={`border rounded-xl p-4 text-left transition-colors ${
                      form.serviceType === t.label
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-brand-600"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Basic Info */}
            <section>
              <h2 className="font-semibold text-brand-600">Basic Information</h2>
              <div className="mt-3 grid gap-4">
                <div>
                  <Label required>Title</Label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="e.g., Growth Marketing Strategy Sprint"
                    className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                    required
                  />
                </div>
                <div>
                  <Label required>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Describe your service in detail. What problems do you solve? What value do you provide?"
                    className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section>
              <h2 className="font-semibold text-brand-600">Pricing</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Amount</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceAmount}
                    onChange={(e) => setField("priceAmount", e.target.value)}
                    placeholder="0.00"
                    className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div className="relative">
                  <Label>Price Type</Label>
                  <select
                    value={form.priceType}
                    onChange={(e) => setField("priceType", e.target.value)}
                    className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option>Fixed Price</option>
                    <option>Hourly</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 bottom-3">
                    <I.chevron />
                  </span>
                </div>
                <div className="relative">
                  <Label>Typical Delivery</Label>
                  <select
                    value={form.deliveryTime}
                    onChange={(e) => setField("deliveryTime", e.target.value)}
                    className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option>1 Day</option>
                    <option>3 Days</option>
                    <option>1 Week</option>
                    <option>2 Weeks</option>
                    <option>1 Month</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 bottom-3">
                    <I.chevron />
                  </span>
                </div>
              </div>
            </section>

            {/* Location & Experience */}
            <section>
              <h2 className="font-semibold text-brand-600">Location & Experience</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Label>Location Type</Label>
                  <select
                    value={form.locationType}
                    onChange={(e) => setField("locationType", e.target.value)}
                    className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option>Remote</option>
                    <option>On-site</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 bottom-3">
                    <I.chevron />
                  </span>
                </div>

                <div className="relative">
                  <Label>Experience Level</Label>
                  <select
                    value={form.experienceLevel}
                    onChange={(e) => setField("experienceLevel", e.target.value)}
                    className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option>Entry Level</option>
                    <option>Intermediate</option>
                    <option>Expert</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 bottom-3">
                    <I.chevron />
                  </span>
                </div>
              </div>

              {form.locationType === "On-site" && (
                <div className="mt-3 grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label required>Country</Label>
                    <select
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      required
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 bottom-3">
                      <I.chevron />
                    </span>
                  </div>
                  <div>
                    <Label>City</Label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="City"
                      className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Skills & Tags */}
            <section>
              <h2 className="font-semibold text-brand-600">Skills & Tags</h2>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add skills (e.g., JavaScript, Marketing, Design)"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                  aria-label="Add skill"
                >
                  <I.plus /> Add
                </button>
              </div>

              {form.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.skills.map((s, idx) => (
                    <span
                      key={`${s}-${idx}`}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                    >
                      {s}
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => removeSkill(idx)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>


            {/* ===== General Classification (SEARCHABLE) ===== */}
<section>
 <h2 className="font-semibold text-brand-600">Classification</h2>
 <p className="text-xs text-gray-600 mb-3">
   Search and pick the category that best describes your service.
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

{/* ===== Industry Classification ===== */}
<section>
 <h2 className="font-semibold text-brand-600">Industry Classification</h2>
 <p className="text-xs text-gray-600 mb-3">
   Select the industry category and subcategory that best describes your service.
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
</section>

            {/* Share With (Audience) */}
            <section>
              <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select who should see this service. Choose multiple identities, categories, subcategories, and sub-subs.
              </p>
              <AudienceTree
                tree={audTree}
                selected={audSel}
                onChange={(next) => setAudSel(next)}
              />
            </section>

            {/* Portfolio / Attachments */}
            <section>
              <h2 className="font-semibold text-brand-600">Portfolio Samples (Optional)</h2>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
                <div className="mb-2">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Upload images or documents showcasing your work
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    className="hidden"
                    onChange={(e) => handleFilesChosen(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Choose Files
                  </button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                    {attachments.map((a, idx) => (
                      <div key={`${a.name}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                        <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                          {isImage(a.base64url) ? (
                            <img src={a.base64url} alt={a.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-500">DOC</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{a.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">Attached</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Remove"
                        >
                          <I.trash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className={styles.ghost}
                onClick={() => navigate("/services")}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primary} disabled={saving}>
                {saving ? "Saving…" : isEditMode ? "Update Service" : "Publish Service"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
