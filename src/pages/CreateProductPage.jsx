// src/pages/CreateProductPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import AudienceTree from "../components/AudienceTree";
import client, { API_URL } from "../api/client";
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

/* Image Slider Component */
function ImageSlider({ images, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        No Images
      </div>
    );
  }

  return (
    <div className={`relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Main Image */}
      <div className="w-full h-full">
        <img
          src={images[currentIndex].startsWith('http') 
            ? images[currentIndex] 
            : `${API_URL}/uploads/${images[currentIndex]}`
          }
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

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

const CURRENCY_OPTIONS = [
  "USD","EUR","GBP","NGN","GHS","ZAR","KES","UGX","TZS","XOF","XAF","MAD","DZD","TND","EGP","ETB",
  "NAD","BWP","MZN","ZMW","RWF","BIF","SOS","SDG","CDF"
];

/* ---------- Read-only summary for non-owners ---------- */
function ReadOnlyProductView({ form, images, audSel, audTree, hideHeader }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const tags = Array.isArray(form.tags)
  ? form.tags
  : (typeof form.tags === "string"
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : []);

  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Gallery - Using Image Slider */}
      {images?.length ? (
        <div className="p-4">
          <ImageSlider images={images} className="w-full" />
        </div>
      ) : (
        <div className="p-4">
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            No Images Available
          </div>
        </div>
      )}

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
            <div className="mt-2">Price: {form.price !== "" ? form.price : "—"} {form.currency ? `(${form.currency})`:''}</div>
            <div>Quantity: {form.quantity !== "" ? form.quantity : "—"}</div>
          </div>
          <div className="rounded-xl border p-4 text-sm text-gray-700">
            <div className="text-gray-800 font-medium">Location</div>
            <div className="mt-2">
              {form.city ? `${form.city}, ` : ""}
              {form.country || "-"}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="hidden">
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
      </div>
    </div>
  );
}

export default function CreateProductPage({ triggerImageSelection = false, hideHeader = false, onSuccess }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const [showAudienceSection, setShowAudienceSection] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
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
  const countryOptions = [
    { value: "All countries", label: "All countries" },
    ...COUNTRIES.map(country => ({
      value: country,
      label: country
    }))
  ];

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

  // Form state
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    subcategoryId: "",
    price: "",
    currency: "USD",
    quantity: "",
    description: "",
    country: "All countries",
    city: "",
    tags: [],
  });

  // Create city options for SearchableSelect (limit to reasonable number)
  const allCityOptions = CITIES.slice(0, 10000).map(city => ({
    value: city.city,
    label: `${city.city}${city.country ? `, ${city.country}` : ''}`,
    country: city.country
  }));

  // Support single or multi-country (comma-separated) selection
  const selectedCountries = useMemo(() => {
    if (!form.country) return [];
    return String(form.country)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [form.country]);

  // Filtered cities for dropdown based on selected countries
  const cityOptions = useMemo(() => {
    if (selectedCountries.length === 0 || selectedCountries.includes("all countries")) return [];
    const setLC = new Set(selectedCountries);
    return allCityOptions.filter((c) => setLC.has(c.country.toLowerCase()));
  }, [selectedCountries, allCityOptions]);

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

  const [tagInput, setTagInput] = useState("");

  // Images: array of strings (filenames)
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // Trigger image selection when component mounts with triggerImageSelection
  useEffect(() => {
    if (triggerImageSelection && fileInputRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerImageSelection]);

  const readOnly = isEditMode  && ownerUserId && user?.id !== ownerUserId;

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

  // Load identities for AudienceTree
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities?type=all");
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
        const { data } = await client.get(`/products/${id}?updated=true`);

        // infer owner (support multiple shapes)
        const ownerId =data.sellerUserId;

        
        setOwnerUserId(ownerId);

        setForm((f) => ({
          ...f,
          ...data,
          title: data.title || "",
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          price: data.price?.toString?.() || "",
          currency: data.currency || "USD",
          quantity: data.quantity?.toString?.() || "",
          description: data.description || "",
          country: data.country || "",
          city: data.city || "",
          //tagsInput: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          tags: Array.isArray(data.tags)
          ? data.tags
          : (typeof data.tags === "string"
              ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : []),

        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images
              .filter((x) => x?.filename || typeof x === 'string')
              .map((x) => typeof x === 'string' ? x : x.filename)
          );
        }

        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });

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
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
        navigate("/products");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isEditMode, id, navigate]);

  console.log({form})

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
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "country" && value === "All countries") {
        next.city = ""; // Clear city when "All countries" is selected
      }
      return next;
    });
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!images.length) return "Please add at least one product image.";
    if (form.price !== "" && Number(form.price) < 0) return "Price cannot be negative.";
    if (form.quantity !== "" && Number(form.quantity) < 0) return "Quantity cannot be negative.";
    return null;
  }

  // Function to upload multiple images
  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await client.post('/products/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.filenames.map((filename, index) => ({
        filename: filename,
        title: files[index].name.replace(/\.[^/.]+$/, ""),
        base64url: `${API_URL}/uploads/${filename}` // For preview
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    }
  };

  async function handleFilesChosen(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Check file sizes (5MB limit)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = arr.filter(file => file.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      toast.error(`Files exceeding 5MB limit: ${fileNames}`);
      return;
    }

    // Only allow images
    const imgFiles = arr.filter((f) => f.type.startsWith("image/"));
    if (imgFiles.length !== arr.length) {
      toast.error("Only image files are allowed.");
      return;
    }

    // Cap total attachments
    const remainingSlots = 20 - images.length;
    const slice = remainingSlots > 0 ? arr.slice(0, remainingSlots) : [];

    try {
      setUploading(true);
      setUploadingCount(slice.length);
      const formData = new FormData();
      slice.forEach(file => {
        formData.append('images', file);
      });

      const response = await client.post('/products/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const mapped = response.data.filenames.map((filename) => filename);

      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some images could not be uploaded.");
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
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
        city: (form.country === "All countries") ? undefined : (form.city || undefined),
        tags: form.tags,
        images: images.map(img => img.includes('http') ? img : `${API_URL}/uploads/${img}`),
        currency:form.currency,
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
        if (hideHeader && onSuccess) {
          onSuccess();
        } else {
          navigate("/products");
        }
      }

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
      {!hideHeader && <Header page={"products"} />}

      {/* ===== Content ===== */}
      <main className={`mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 ${hideHeader ? 'py-4' : 'py-8'} fle justify-center gap-6`}>
        {/* Left/Main Form OR Read-only */}

          {!hideHeader && (
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 mb-2 text-sm text-gray-600 hover:text-brand-600"
          >
            ← Go to Products
          </button>
        )}

        <section className="lg:col-span-8">
          {!isEditMode ? null : isLoading ? (
            <LoaderCard message="Loading product…" />
          ) : readOnly ? (
            <ReadOnlyProductView 
              form={form} 
              hideHeader={hideHeader} 
              images={images} 
              audSel={audSel} 
              audTree={audTree} 
            />
          ) : null}

          {/* Editable form (for owners or when creating) */}
          {(!isEditMode || (!isLoading && !readOnly)) && (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-6"
            >
             {isEditMode  && <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">
                    {isEditMode ? "Edit Product" : "Create New Product Post"}
                  </h1>
                
                </div>
              
              </div>}

              {/* Product Title */}
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Enter your product title..."
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>

              
              {/* Description */}
              <div>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                   placeholder="Describe your product in detail: Handcrafted leather bag made with premium materials. Features multiple compartments, adjustable strap, and water-resistant lining. Perfect for everyday use or special occasions."
                  _placeholder="Describe your product in detail..."
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>

              {/* Product Images */}
              <section>
                <h2 className="text-[12px] font-medium text-gray-700">Product Images <label className="text-[crimson] text-[14px]">*</label></h2>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
                  <div className="mb-2">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Upload images to showcase your product (max 5MB per file)
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

                  {(images.length > 0 || uploadingCount > 0) && (
                    <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                      {images.map((img, idx) => {
                        const isImg = true

                        // Resolve URL for filenames
                        let src = null;
                        if (img.startsWith("data:image")) {
                          src = img; // base64
                        } else if (img.startsWith("http://") || img.startsWith("https://")) {
                          src = img; // full URL
                        } else if (isImg) {
                          src = `${API_URL}/uploads/${img}`; // filename to full URL
                        }

                        return (
                          <div key={`${img}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                            <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                              {isImg ? (
                                <img src={src} alt={img} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs text-gray-500">DOC</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-sm font-medium">Image {idx+1}</div>
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
                        ))
                      }
                    </div>
                  )}

                </div>
              </section>

              {/* Price + Quantity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-[12px] font-medium text-gray-700">Price</h2>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value.replace(/[^\d\-\(\)]/g, ''))}
                    placeholder="0.00"
                    className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <h2 className="text-[12px] font-medium text-gray-700">Currency</h2>
                  <select 
                    className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                
                   name="currency" onChange={(e) => setField("currency", e.target.value)} value={form.currency}>
                    {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <h2 className="text-[12px] font-medium text-gray-700">Quantity Available</h2>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value.replace(/[^\d\-\(\)]/g, ''))}
                    placeholder="Enter quantity"
                    className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="mt-3 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-gray-700">Country</label>
                    <SearchableSelect
                      value={form.country}
                      onChange={(value) => setField("country", value)}
                      options={countryOptions}
                      placeholder="Search and select country..."
                      key={form.country} // Force remount when country changes to reset internal state
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-gray-700">City</label>
                    <SearchableSelect
                      key={form.country} // Force remount when country changes to reset internal state
                      value={form.city}
                      onChange={(value) => setField("city", value)}
                      options={cityOptions}
                      placeholder="Search and select city..."
                      disabled={form.country === "All countries"}
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
            
            <div className="hidden">
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
      placeholder="Add a tag (e.g., organic, handmade)"
      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
    />
    <button
      type="button"
      onClick={addTag}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
    >
      + Add
    </button>
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

  <p className="mt-1 text-xs text-gray-500">
    Tags help others find your product
  </p>
</div>




{/* ===== General Classification (SEARCHABLE) ===== */}
<section>

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
<section className="hidden">
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
  <div className="mb-4">
    {!showAudienceSection ? (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowAudienceSection(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Define Target Audience (optional)
        </button>
        <p className="text-xs text-gray-500">
          Target your post to specific audiences
        </p>
      </div>
    ) : (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
            <h3 className="font-semibold text-brand-600">Share With (Target Audience)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAudienceSection(false)}
            className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Hide
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Select who should see this product. 
        </p>

        <AudienceTree
          tree={audTree}
          selected={audSel}
          onChange={(next) => setAudSel(next)}
        />
      </div>
    )}
  </div>
</section>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                {!hideHeader && (
                  <button type="button" onClick={() => navigate("/products")} className={styles.ghost}>
                    Cancel
                  </button>
                )}
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