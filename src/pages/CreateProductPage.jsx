// src/pages/CreateProductPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import AudienceTree from "../components/AudienceTree";
import client from "../api/client";
import { toast } from "../lib/toast";
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

/* ---------- helpers for read-only view ---------- */
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

function LoaderCard({ message = "Loading..." }) {
  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-center justify-center h-60">
      <div className="text-center">
        <div className="inline-block animate-spin text-3xl mb-2">⟳</div>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}

/* ---------- Read-only summary for non-owners ---------- */
function ReadOnlyProductView({ form, images, audSel, audTree }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const tags = (form.tagsInput || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Gallery */}
      {images?.length ? (
        <div className="grid gap-2 p-2 sm:grid-cols-2 md:grid-cols-3">
          {images.slice(0, 6).map((img, i) => (
            <div key={i} className="aspect-[4/3] w-full bg-gray-100 overflow-hidden rounded-lg">
              <img src={img.base64url} alt={img.title || `Image ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled product"}</h1>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
              {form.description || "No description provided."}
            </p>
          </div>
         
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4 text-sm text-gray-700">
            <div className="text-gray-800 font-medium">Pricing</div>
            <div className="mt-2">Price: {form.price !== "" ? form.price : "—"}</div>
            <div>Quantity: {form.quantity !== "" ? form.quantity : "—"}</div>
          </div>
          <div className="rounded-xl border p-4 text-sm text-gray-700">
            <div className="text-gray-800 font-medium">Location</div>
            <div className="mt-2">{form.country || "—"}</div>
          </div>
          <div className="rounded-xl border p-4 text-sm text-gray-700">
            <div className="text-gray-800 font-medium">Category</div>
            <div className="mt-2">{form.categoryId || "—"}</div>
            <div className="mt-1 text-xs text-gray-500">Subcategory: {form.subcategoryId || "—"}</div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length ? tags.map((t) => <span key={t} className={styles.chip}>{t}</span>) : <span className="text-sm text-gray-500">—</span>}
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
          <button type="button" onClick={() => history.back()} className={styles.ghost}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState(null);

  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]

  // Audience tree + selections (mirrors Events/Services)
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });



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
      const { data } = await client.get("/general-categories/tree?type=product");
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


  // Form state
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    subcategoryId: "",
    price: "",
    quantity: "",
    description: "",
    country: "",
    city: "",
    tagsInput: "",
  });

  // Images: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const readOnly = isEditMode  && ownerUserId && user?.id !== ownerUserId;

  // Load identities for AudienceTree
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

  // If editing, load existing product
  useEffect(() => {
    if (!isEditMode) return;
    setIsLoading(true);
    (async () => {
      try {
        const { data } = await client.get(`/products/${id}`);

        // infer owner (support multiple shapes)
        const ownerId =data.sellerUserId;

        
        setOwnerUserId(ownerId);

        setForm((f) => ({
          ...f,
          title: data.title || "",
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          price: data.price?.toString?.() || "",
          quantity: data.quantity?.toString?.() || "",
          description: data.description || "",
          country: data.country || "",
          city: data.city || "",
          tagsInput: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images
              .filter((x) => x?.base64url)
              .map((x, i) => ({
                title: x.title || x.name || `Image ${i + 1}`,
                base64url: x.base64url,
              }))
          );
        }

        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
        navigate("/business");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isEditMode, id, navigate]);

  // Load categories (legacy tree)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/categories/tree");
        setCats(data.categories || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    })();
  }, []);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!images.length) return "Please add at least one product image.";
    if (form.price !== "" && Number(form.price) < 0) return "Price cannot be negative.";
    if (form.quantity !== "" && Number(form.quantity) < 0) return "Quantity cannot be negative.";
    return null;
  }

  async function handleFilesChosen(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Only allow images
    const imgFiles = arr.filter((f) => f.type.startsWith("image/"));
    if (imgFiles.length !== arr.length) {
      toast.error("Only image files are allowed.");
    }
    const remaining = 20 - images.length;
    const slice = imgFiles.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          const base = file.name.replace(/\.[^/.]+$/, "");
          return { title: base, base64url };
        })
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some images could not be read.");
    }
  }

  function updateImageTitle(idx, title) {
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, title } : x)));
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function parsedTags() {
    return (form.tagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        price:
          form.price !== "" && !Number.isNaN(Number(form.price))
            ? Number(form.price)
            : undefined,
        quantity:
          form.quantity !== "" && !Number.isNaN(Number(form.quantity))
            ? Number(form.quantity)
            : undefined,
        description: form.description,
        country: form.country || undefined,
        city: form.city || undefined,
        tags: parsedTags(),
        images,
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
        await client.put(`/products/${id}`, payload);
        toast.success("Product updated!");
      } else {
        await client.post("/products", payload);
        toast.success("Product published!");
      }

      navigate("/business");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  }


   if (isLoading && id) {
        return (
          <FullPageLoader message="Loading product…" tip="Fetching..." />
        );
      }
    

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <Header page={"products"} />

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 fle justify-center gap-6">
        {/* Left/Main Form OR Read-only */}
        <section className="lg:col-span-8">
          {!isEditMode ? null : isLoading ? (
            <LoaderCard message="Loading product…" />
          ) : readOnly ? (
            <ReadOnlyProductView form={form} images={images} audSel={audSel} audTree={audTree} />
          ) : null}

          {/* Editable form (for owners or when creating) */}
          {(!isEditMode || (!isLoading && !readOnly)) && (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">
                    {isEditMode ? "Edit Product" : "Create New Product Post"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Share your product with the Pan-African community
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/business")}
                    className={styles.ghost}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.primary} disabled={saving}>
                    {saving ? "Saving…" : isEditMode ? "Update" : "Publish Product"}
                  </button>
                </div>
              </div>

              {/* Product Images */}
              <div>
                <h2 className="font-semibold mb-2">Product Images</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilesChosen(e.target.files)}
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-sm">➕ Click to add images (JPG/PNG/WebP…)</div>
                  <div className="text-xs text-gray-400 mt-1">Up to 20 images</div>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
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

              {/* Product Title */}
              <div>
                <h2 className="font-semibold">Product Title</h2>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Enter your product title..."
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>

              {/* Price + Quantity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h2 className="font-semibold">Price</h2>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0.00"
                    className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <h2 className="font-semibold">Quantity Available</h2>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    placeholder="Enter quantity"
                    className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-semibold">Product Description</h2>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe your product in detail..."
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <h2 className="font-semibold">Location</h2>
                <div className="mt-3 grid md:grid-cols-2 gap-4">
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
              </div>

              {/* Tags */}
              <div>
                <h2 className="font-semibold">Tags</h2>
                <input
                  type="text"
                  value={form.tagsInput}
                  onChange={(e) => setField("tagsInput", e.target.value)}
                  placeholder="Add tags separated by commas..."
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tags help others find your product
                </p>
              </div>



{/* ===== General Classification (SEARCHABLE) ===== */}
<section>
  <h2 className="font-semibold text-brand-600">Classification</h2>
  <p className="text-xs text-gray-600 mb-3">
    Search and pick the category that best describes your product.
  </p>

  <div className="grid md:grid-cols-2 gap-4">
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
    Select the industry category and subcategory that best describes your product.
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

              {/* ===== Share With (Audience selection) ===== */}
              <section>
                <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
                <p className="text-xs text-gray-600 mb-3">
                  Select who should see this product. Choose multiple identities, categories, subcategories, and sub-subs.
                </p>
                <AudienceTree
                  tree={audTree}
                  selected={audSel}
                  onChange={(next) => setAudSel(next)}
                />
              </section>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => navigate("/business")} className={styles.ghost}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryWide} disabled={saving}>
                  {saving ? "Saving…" : isEditMode ? "Update Product" : "Publish Product"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Right Sidebar (hidden for now) */}
        <aside className="lg:col-span-4 space-y-4 hidden">
          <div className="rounded-2xl bg-brand-700 p-6 text-white shadow-sm">
            <h3 className="text-lg font-semibold">🚀 Boost Your Post</h3>
            <p className="mt-1 text-sm">Reach more potential customers across Africa</p>
            <button className="mt-4 bg-white text-brand-700 rounded-lg px-4 py-2 text-sm font-semibold">
              Learn More
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-brand-600">📌 Product Posting Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>✅ Use high-quality images</li>
              <li>✅ Write detailed descriptions</li>
              <li>✅ Set competitive pricing</li>
              <li>✅ Use relevant tags</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
