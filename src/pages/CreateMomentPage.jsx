// src/pages/CreateMomentPage.jsx
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Video, Plus } from "lucide-react";
import COUNTRIES from "../constants/countries"; // optional: if you want to suggest locations, else unused
import client, { API_URL } from "../api/client";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import AudienceTree from "../components/AudienceTree";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";
import MediaViewer from "../components/FormMediaViewer"; // Import the new MediaViewer component

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
            {form.title && <h1 className="text-xl font-bold">{form.title || "Untitled Experience"}</h1>}
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
              <div className="flex items-center gap-2 text-gray-700 font-medium">Address</div>
              <div className="mt-2 text-sm text-gray-700">
                {[form.location, form.city, form.country].filter(Boolean).join(", ") || "Not specified"}
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        {images && images.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Media</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.slice(1).map((img, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  {img.type === 'video' ? (
                    <video 
                      src={img.base64url} 
                      controls 
                      className="h-full w-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={img.base64url} alt={img.name || `Experience image ${idx + 1}`} className="h-full w-full object-cover" />
                  )}
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
  const [focused, setFocused] = useState(false);

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
export default function CreateMomentPage({ triggerImageSelection = false, type, hideHeader = false, onSuccess }) {
  const navigate = useNavigate();
  const { id, type: urlType } = useParams(); // Extract id and type from URL
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [showAudienceSection, setShowAudienceSection] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({}); // Track progress per file
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [currentType, setCurrentType] = useState("need");
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Form (Experience fields)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Achievement", // ENUM: Achievement | Milestone | Learning | Challenge | Opportunity
    date: "", // yyyy-mm-dd
    location: "",
    country: "All countries",
    city: "",
    relatedEntityType: "", // job | event | product | service | tourism | funding
    relatedEntityId: "",
  });
  
  // Tags state
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  // Images: [{ name, base64url, type: 'image' | 'video' }]
  const [images, setImages] = useState([]);
  // Attachments: [{ name, base64url }]
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const imagePickerRef = useRef(null);

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
  const countryOptions = [
    { value: "All countries", label: "All countries" },
    ...COUNTRIES.map(country => ({
      value: country,
      label: country
    }))
  ];

  // State for cities data
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/data/cities.json');
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
        toast.error('Failed to load cities data');
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Memoized city options
  const allCityOptions = useMemo(() => {
    return cities.slice(0, 10000).map(city => ({
      value: city.city,
      label: `${city.city}${city.country ? `, ${city.country}` : ''}`,
      country: city.country
    }));
  }, [cities]);

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
        let t=form.relatedEntityType=="funding" ? 'opportunity' :  form.relatedEntityType
        const typeParam = t ? `?type=${t}` : "?type=moment";
        const { data } = await client.get(`/general-categories/tree${typeParam}`);
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, [form.relatedEntityType]);

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
        const { data } = await client.get("/public/identities?type=all");
        setAudTree(data.identities || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Set currentType based on prop type or URL type when creating
  useEffect(() => {
    if (!isEditMode) {
      // Prioritize the type prop from PostComposer, fallback to URL type
      const effectiveType = type || urlType;
      if (effectiveType) {
        setCurrentType(effectiveType);
        setField("relatedEntityType", effectiveType);
      }
    }
  }, [type, urlType, isEditMode]);

  // Expose pick method to parent components
  useImperativeHandle(imagePickerRef, () => ({
    pick: () => fileInputRef.current?.click()
  }));

  // Trigger image selection when component mounts with triggerImageSelection
  useEffect(() => {
    if (triggerImageSelection && imagePickerRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        imagePickerRef.current?.pick();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerImageSelection]);

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
        const { data } = await client.get(`/moments/${id}?updated=true`);

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
            data.images
          );
        } else {
          setImages([]);
        }

        // Set attachments if they exist
        if (Array.isArray(data.attachments)) {
          setAttachments(
            data.attachments.map((att) => ({
              name: att.name || "Attachment",
              base64url: att.base64url || att.url || ""
            }))
          );
        } else {
          setAttachments([]);
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
        navigate("/feed");
      }
    })();
  }, [isEditMode, id, navigate]);

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  /* -------- helpers -------- */
  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "country" && value === "All countries") {
        next.city = ""; // Clear city when "All countries" is selected
      }
      return next;
    });
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
   // if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    return null;
  }

  async function handleFilesChosen(files) {
    if (readOnly) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Accept both images and videos
    const mediaFiles = arr.filter((f) => 
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    
    if (mediaFiles.length !== arr.length) {
      toast.error("Only image and video files are allowed.");
      return;
    }

    const sizeErrors = mediaFiles.filter((f) => f.size > 50 * 1024 * 1024); // 50MB for videos
    if (sizeErrors.length) {
      toast.error("Each file must be up to 50MB.");
      return;
    }

    const accepted = mediaFiles.filter((f) => f.size <= 50 * 1024 * 1024);
    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));

    // Upload files immediately and store filenames
    try {
      setUploading(true);
      setUploadingCount(slice.length);
      
      // Reset progress for new uploads
      const initialProgress = {};
      slice.forEach(file => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      const formData = new FormData();
      slice.forEach(file => {
        formData.append('media', file);
      });

      const response = await client.post('/moments/upload-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // Update progress for all files (simplified - you could track individual files if needed)
            const newProgress = {};
            slice.forEach(file => {
              newProgress[file.name] = percentCompleted;
            });
            setUploadProgress(newProgress);
          }
        }
      });

      const uploadedFilenames = response.data.filenames || [];

      // Store with type information
      const mapped = slice.map((file, index) => ({
        base64url: `${uploadedFilenames[index] || file.name}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: file.type.startsWith("video/") ? "video" : "image"
      }));

      setImages((prev) => [...prev, ...mapped]);
      setUploadProgress({}); // Clear progress after upload
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media files');
      setUploadProgress({}); // Clear progress on error
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }

  console.log({images})

  function updateImageName(idx, name) {
    if (readOnly) return;
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, name } : x)));
  }

  function removeImage(idx) {
    if (readOnly) return;
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleMediaClick(index) {
    setSelectedMediaIndex(index);
    setMediaViewerOpen(true);
  }

  function closeMediaViewer() {
    setMediaViewerOpen(false);
  }

  // Get all media URLs for the MediaViewer
  const mediaUrls = useMemo(() => {
    return images.map(img => img.base64url);
  }, [images]);

  async function handleAttachmentsChosen(files) {
    if (readOnly) return;
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
        city: (form.country === "All countries") ? undefined : (form.city || undefined),
        tags: tags,
        images, // Now contains {base64url: filename, name: '', type: 'image'|'video'}
        attachments, // Keep attachments as base64 for now

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
        if (hideHeader && onSuccess) {
          onSuccess();
        } else {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);   // go back if possible
          } else {
            navigate("/");  // fallback if no history
          }
        }
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
      {!hideHeader && <Header page={"experiences"} />}

      {/* ===== Content ===== */}
      <main className={`mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 ${hideHeader ? 'py-4' : 'py-8'}`}>
        <div>
          {!hideHeader && <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);   // go back if possible
              } else {
                navigate("/");  // fallback if no history
              }
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
            type="button"
          >
            ←  {window.history.state && window.history.state.idx > 0 ? 'Back':'Feed'}
          </button>}

  
          {(isEditMode && !readOnly) && (
            <div>
              <h1 className="text-2xl font-bold mt-3">
                {isEditMode ? "Edit Experience" : "Share Experience"}
              </h1>
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
          {hideHeader && <section className="hidden">
            <h2 className="font-semibold">What is this experience about? *</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <select
                value={form.relatedEntityType}
                onChange={(e) => setField("relatedEntityType", e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
               
              >
                <option value="">Select entity type</option>
                <option value="job">Job</option>
                <option value="event">Event</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="tourism">Tourism</option>
                <option value="funding">Funding</option>
              </select>

            </div>
          </section>}

               {/* Description */}
          <section>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={
                 form.relatedEntityType=="job"  ? (user?.accountType!="company" ? "Share a professional experience, an achievement, milestone or learnings.": "Share a professional experience, an achievement, milestone or learnings, and inspire talents to join your organization or programs") :
                 form.relatedEntityType=="event"  ? (user?.accountType!="company" ? "Share an experience of an event, an achievement, milestone or learning": "Share an experience of an event, an achievement, milestone or learning and inspire potential clients to experience it.") :
                 form.relatedEntityType=="product"  ? (user?.accountType!="company" ? "Share an experience or review of a product and inspire others to experience it.":"Share an insight, achievement or experience with your products and inspire potential clients to experience it.") :
                 form.relatedEntityType=="service"  ? (user?.accountType!="company" ? "Share an insight, achievement or experience with a service and inspire others to experience it. ":"Share an insight, achievement or experience with your services and inspire potential clients  to experience it.") :
                 form.relatedEntityType=="tourism"  ? (user?.accountType!="company" ? "Share your experience with a tourism attraction and inspire others to experience it.":"Share an experience with your tourism services and invite potential clients to experience it.") :
                 form.relatedEntityType=="funding"  ? (user?.accountType!="company" ? "Share an insight, learning or achievement related to funding and inspire others to experience it.":"Share an insight, learning or achievement related to your programs and inspire others to benefit from it.") :
                  form.relatedEntityType
                  ? `Share an experience of ${form.relatedEntityType} — an achievement, milestone, or learning`
                  : "Share an experience — an achievement, milestone, or learning"
                }
              __placeholder="Example: Just launched our new product! Learned valuable lessons about scaling and user onboarding."
              _placeholder="Describe what happened, what you learned, challenges faced, outcomes…"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              rows={5}
              required
            />
          </section>

            {/* Photos & Videos */}
          <section>
            <h2 className="font-semibold text-[12px] text-gray-700">Photos & Videos</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
              <div className="flex justify-center items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs">Images</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span className="text-xs">Videos</span>
                </div>
              </div>
              Upload images or videos showcasing your experience
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
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
                  {images.map((img, idx) => (
                    <div key={`${img.base64url}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                      <div 
                        className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center relative cursor-pointer"
                        onClick={() => handleMediaClick(idx)}
                      >
                        {img.type === 'video' ? (
                          <>
                            <video 
                              src={img.base64url} 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Video className="h-4 w-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <img src={img.base64url} alt={img.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={img.name}
                          onChange={(e) => updateImageName(idx, e.target.value)}
                          placeholder={`${img.type === 'video' ? 'Video' : 'Image'} ${idx + 1} name`}
                          className="w-full text-sm font-medium border-none p-0 focus:outline-none focus:ring-0"
                        />
                        <div className="text-[11px] text-gray-500 truncate">
                          {img.type === 'video' ? 'Video' : 'Image'} • Attached
                        </div>
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
                  ))}

                  {uploadingCount > 0 &&
                    Array.from({ length: uploadingCount }).map((_, idx) => (
                      <div key={`img-skel-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                        <div className="h-12 w-12 rounded-md bg-gray-200 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse" />
                          {/* Upload Progress Bar */}
                          {uploading && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Object.values(uploadProgress)[0] || 0}%` 
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                      </div>
                    ))}
                </div>
              )}

              {/* Upload Progress Indicator */}
              {uploading && Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Uploading {Object.keys(uploadProgress).length} file(s)...
                    </span>
                    <span className="text-sm text-gray-500">
                      {Object.values(uploadProgress)[0]}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Object.values(uploadProgress)[0] || 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <p className="mt-2 text-[11px] text-gray-400">
                  Up to 50MB each. Supported formats: JPG, PNG, GIF, MP4, MOV
              </p>
            </div>
          </section>


          {/* Type */}
     

     
              <section>
            <h2 className="text-[12px] font-medium text-gray-700">Experience Type</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                form.relatedEntityType === "job" || form.relatedEntityType === "event"
                  ? ['Achievement', 'Learning experience', 'Motivational', 'Article/opinion']
                  : ["Achievement", "Recommendation", "Milestone"]
              ).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setField("type", label)}
                  className={`border rounded-xl p-3 text-center transition-colors break-words min-h-[60px] flex items-center justify-center ${
                    form.type === label
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-brand-600"
                  }`}
                >
                  <span className="text-sm font-medium leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          
        

          {/* Attachments  hidden for now*/}
          <section className="hidden">
            <h2 className="font-semibold">Attachments (Optional)</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
              <div className="mb-2">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              Upload documents or other files to support your experience
              <div className="mt-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  className="hidden"
                  onChange={(e) => handleAttachmentsChosen(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Choose Files
                </button>
              </div>

             
        
          {attachments.map((a, idx) => {
        const isImage =
          typeof a.base64url === "string" &&
          (a.base64url.startsWith("data:image") || /\.(jpe?g|png|gif|webp|svg)$/i.test(a.base64url));

        // Resolve src for image
        let src = null;
        if (a.base64url?.startsWith("data:image") || a.base64url?.startsWith("http")) {
          src = a.base64url;
        } else if (isImage) {
          // It's a filename like "1.png"
          src = a.base64url
        }

        return (
          <div key={`${a.name}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
            <div className="h-10 w-10 rounded-md bg-gray-100 grid place-items-center overflow-hidden">
              {isImage ? (
                <img src={src} alt={a.title} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">DOC</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{a.title}</div>
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
        );
      })}

            </div>
          </section>

          {/* Title */}
          <section className="hidden">
            <h2 className="font-semibold">Title *</h2>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Give your experience a clear, strong title"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
             
            />
          </section>

       

          {/* Date & Location */}
          <section>
            <h2 className="font-semibold hidden">When & Where</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4 hidden">
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
                <label className="text-[12px] font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="Address"
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
          </section>


        

          {/* Tags */}
          <section className="hidden">
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

         
          <section className={`${form.relatedEntityType=="_job" ? 'hidden':''}`}>
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
       
          <section className="hidden">
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
          
          {/* Share With (Audience) */}
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
          Define Audience (optional)
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
          Select who should see this experience.
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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {!hideHeader && (
              <button type="button" onClick={() => navigate("/feed")} className={styles.ghost}>
                Cancel
              </button>
            )}
            <button type="submit" className={styles.primaryWide} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update" : "Publish"}
            </button>
          </div>
            </form>
          )}
        </div>
      </main>

      {/* Media Viewer */}
      {mediaViewerOpen && (
        <MediaViewer
          urls={mediaUrls}
          initialIndex={selectedMediaIndex}
          onClose={closeMediaViewer}
        />
      )}
      
    </div>
  );
}