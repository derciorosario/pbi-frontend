// src/pages/CreateNeedPage.jsx
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client, { API_URL } from "../api/client";
import COUNTRIES from "../constants/countries";
import AudienceTree from "../components/AudienceTree";
import Header from "../components/Header";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import MediaViewer from "../components/FormMediaViewer"; // Import the MediaViewer component
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
  pin: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  ),
  video: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="m17 10.5-5-3v6l5-3Z"/><rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  image: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="m21 15-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
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

function isImage(base64url) {
  return typeof base64url === "string" && base64url.startsWith("data:image");
}

function isVideo(base64url) {
  return typeof base64url === "string" && base64url.startsWith("data:video");
}

function getFileType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

/* ---------- Read-only view for non-owners ---------- */
function ReadOnlyNeedView({ form, attachments, audSel, audTree }) {
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

  // Extract media and docs from attachments (stored as [{name: '', base64url: '', type: 'image'|'video'|'document'}])
  const media = attachments?.filter(att => att.type === 'image' || att.type === 'video') || [];
  const docs = attachments?.filter(att => att.type === 'document') || [];
  const coverMediaUrl = media[0]?.base64url || null;

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {/* Cover hero */}
      {coverMediaUrl ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {media[0]?.type === 'video' ? (
            <video 
              src={coverMediaUrl} 
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <img src={coverMediaUrl} alt="Need cover" className="h-full w-full object-cover" />
          )}
          <span className="absolute left-4 top-4 bg-white/90 border-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
            {form.relatedEntityType || "Need"}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {form.title && <h1 className="text-xl font-bold">{form.title || "Untitled Need"}</h1>}
            <p className="mt-1 text-sm text-gray-700">{form.description || "No description provided."}</p>
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          {form.budget && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium"><I.cash /> Budget</div>
              <div className="mt-2 text-sm text-gray-700">{form.budget}</div>
            </div>
          )}
          <div className="rounded-xl border p-4 hidden">
            <div className="flex items-center gap-2 text-gray-700 font-medium"><I.tag /> Urgency</div>
            <div className="mt-2 text-sm text-gray-700">{form.urgency}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium"><I.pin /> Location</div>
            <div className="mt-2 text-sm text-gray-700">
              {[form.city, form.country].filter(Boolean).join(", ") || "Not specified"}
            </div>
          </div>
        </div>

        {/* Gallery */}
        {media.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Media</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {media.slice(1).map((item, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  {item.type === 'video' ? (
                    <video 
                      src={item.base64url} 
                      controls 
                      className="h-full w-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={item.base64url} alt={`Need image ${idx + 1}`} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {docs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Documents</h3>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {docs.map((att, i) => (
                <a
                  key={`${att.name}-${i}`}
                  href={`${client.defaults.baseURL}/uploads/needs/${att.base64url}`}
                  download={att.name}
                  className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="h-10 w-10 rounded-md bg-gray-100 grid place-items-center text-xs text-gray-500">DOC</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{att.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">Tap to download</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Criteria */}
        {form.criteria && form.criteria.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Requirements</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.criteria.map((criteria, idx) => (
                <span key={`${criteria}-${idx}`} className={styles.chip}>{criteria}</span>
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

/* -------------- Page -------------- */
export default function CreateNeedPage({ triggerImageSelection = false, type, hideHeader = false, onSuccess }) {
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

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  // AudienceTree data + selections (Sets, like Events page)
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    urgency: "Medium",
    location: "",
    country: "All countries",
    city: "",
    criteria: [], // array of strings
    relatedEntityType: "", // job | product | service | event | funding | information
    relatedEntityId: "",
  });

  const [criteriaInput, setCriteriaInput] = useState("");

  // Attachments: [{ name, base64url, type: 'image' | 'video' | 'document' }]
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const imagePickerRef = useRef(null);

  // Temporary debug
{console.log('Attachments:', attachments)}

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

  // Industry taxonomy
  const [industryTree, setIndustryTree] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState({
    categoryId: "",
    subcategoryId: "",
  });

  /* ---------- Effects ---------- */

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

  // Load general categories
  useEffect(() => {
    (async () => {
      try {
        let t=form.relatedEntityType=="funding" ? 'opportunity' :  form.relatedEntityType
        const typeParam = t ? `?type=${t}` : "?type=need";
        const { data } = await client.get(`/general-categories/tree${typeParam}`);
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, [form.relatedEntityType]);

  // Load industry categories
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

  // Load single need (edit)
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const { data } = await client.get(`/needs/${id}?updated=true`);
        const ownerId = data.userId || data.createdById || data.user?.id || null;
        setOwnerUserId(ownerId);

        setForm({
          title: data.title || "",
          description: data.description || "",
          budget: data.budget || "",
          urgency: data.urgency || "Medium",
          location: data.location || "",
          country: data.country || "",
          city: data.city || "",
          criteria: Array.isArray(data.criteria) ? data.criteria : [],
          relatedEntityType: data.relatedEntityType || "",
          relatedEntityId: data.relatedEntityId || "",
        });

        // Set currentType for general categories
        setCurrentType(data.relatedEntityType || "need");

        // Set attachments if they exist (stored as [{name: '', base64url: '', type: ''}])
        if (Array.isArray(data.attachments)) {
          setAttachments(data.attachments);
        } else {
          setAttachments([]);
        }

        // Set audience selections
        if (
          data.audienceIdentities?.length ||
          data.audienceCategories?.length ||
          data.audienceSubcategories?.length ||
          data.audienceSubsubs?.length
        ) {
          setAudSel({
            identityIds: new Set(data.audienceIdentities?.map((i) => i.id) || []),
            categoryIds: new Set(data.audienceCategories?.map((c) => c.id) || []),
            subcategoryIds: new Set(data.audienceSubcategories?.map((s) => s.id) || []),
            subsubCategoryIds: new Set(data.audienceSubsubs?.map((s) => s.id) || []),
          });
        }

        // Set general taxonomy
        setSelectedGeneral({
          categoryId: data.generalCategoryId || "",
          subcategoryId: data.generalSubcategoryId || "",
          subsubCategoryId: data.generalSubsubCategoryId || "",
        });

        // Set industry taxonomy
        setSelectedIndustry({
          categoryId: data.industryCategoryId || "",
          subcategoryId: data.industrySubcategoryId || "",
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load need data");
        navigate("/feed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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

  // Clear general category selections when relatedEntityType is "information", "other", "job", or "partnership"
  useEffect(() => {
    if (form.relatedEntityType === "information" || form.relatedEntityType === "other" || form.relatedEntityType === "job" || form.relatedEntityType === "partnership") {
      setSelectedGeneral({
        categoryId: "",
        subcategoryId: "",
        subsubCategoryId: "",
      });
    }
  }, [form.relatedEntityType]);

  /* ---------- Options builders -------- */
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

  const industryCategoryOptions = useMemo(
    () => industryTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [industryTree]
  );
  const industrySubcategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [industryTree, selectedIndustry.categoryId]);

  // Get media URLs for the MediaViewer (only images and videos)
  const mediaUrls = useMemo(() => {
    return attachments
      .filter(att => att.type === 'image' || att.type === 'video')
      .map(att => att.base64url);
  }, [attachments]);

  /* ---------- Handlers ---------- */

  function setField(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "country" && value === "All countries") {
        next.city = ""; // Clear city when "All countries" is selected
      }
      return next;
    });
  }

  function addCriteria() {
    const v = criteriaInput.trim();
    if (!v) return;
    setForm((f) =>
      f.criteria.includes(v) ? f : { ...f, criteria: [...f.criteria, v] }
    );
    setCriteriaInput("");
  }

  function removeCriteria(idx) {
    setForm((f) => ({ ...f, criteria: f.criteria.filter((_, i) => i !== idx) }));
  }

  function handleMediaClick(index) {
    setSelectedMediaIndex(index);
    setMediaViewerOpen(true);
  }

  function closeMediaViewer() {
    setMediaViewerOpen(false);
  }

  async function handleFilesChosen(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Check file sizes (50MB limit for videos, 5MB for others)
    const maxSizeBytes = {
      video: 50 * 1024 * 1024,
      image: 5 * 1024 * 1024,
      document: 5 * 1024 * 1024
    };

    const oversizedFiles = arr.filter(file => {
      const fileType = getFileType(file);
      return file.size > maxSizeBytes[fileType];
    });

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      toast.error(`Files exceeding size limit: ${fileNames}`);
      return;
    }

    // Cap total attachments
    const remainingSlots = 20 - attachments.length;
    const slice = remainingSlots > 0 ? arr.slice(0, remainingSlots) : [];

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
        formData.append('attachments', file);
      });

      const response = await client.post('/needs/upload-attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // Update progress for all files
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
        name: file.name,
        base64url: `${uploadedFilenames[index] || file.name}`,
        type: getFileType(file)
      }));

      setAttachments((prev) => [...prev, ...mapped]);
      setUploadProgress({}); // Clear progress after upload
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast.error('Failed to upload attachments');
      setUploadProgress({}); // Clear progress on error
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }

  function removeAttachment(idx) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
 //   if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    return null;
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
        title: form.title,
        description: form.description,
        budget: form.budget || undefined,
        urgency: form.urgency,
        location: form.location || undefined,
        country: form.country || undefined,
        city: (form.country === "All countries") ? undefined : (form.city || undefined),
        criteria: form.criteria,
        attachments, // Already contains {name: '', base64url: '', type: ''} where base64url is uploaded filename

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

        // Related entity (optional)
        relatedEntityType: form.relatedEntityType || null,
        relatedEntityId: form.relatedEntityId || null,
      };

      if (isEditMode) {
        await client.put(`/needs/${id}`, payload);
        toast.success("Need updated!");
      } else {
        await client.post("/needs", payload);
        toast.success("Need posted successfully!");
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
      toast.error(error?.response?.data?.message || "Could not save need");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- UI ---------- */

  if (loading && id) {
    return <FullPageLoader message="Loading need…" tip="Fetching..." />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {!hideHeader && <Header page={"needs"} />}
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
          ← {window.history.state && window.history.state.idx > 0 ? 'Back':'Feed'} 
        </button>}


          {(isEditMode && !readOnly) && (
            <div>
              <h1 className="text-2xl font-bold mt-3">
                {isEditMode ? "Edit Need" : "Post What You Need"}
              </h1>
            </div>
          )}

          {/* Read-only view for non-owners */}
          {readOnly ? (
            <ReadOnlyNeedView form={form} attachments={attachments} audSel={audSel} audTree={audTree} />
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8"
            >
          {/* What are you looking for? */}
          <section className="hidden">
            <h2 className="font-semibold">What are you looking for? *</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Job", value: "job", desc: "Employment opportunities" },
                { label: "Product", value: "product", desc: "Specific products or goods" },
                { label: "Service", value: "service", desc: "Professional services" },
                { label: "Event", value: "event", desc: "Events or gatherings" },
                { label: "Tourism", value: "tourism", desc: "Travel and tourism services" },
                { label: "Partnership", value: "partnership", desc: "Business partnerships" },
                { label: "Funding", value: "funding", desc: "Financial support" },
                { label: "Information", value: "information", desc: "Advice or knowledge" },
                { label: "Other", value: "other", desc: "Something else" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.label}
                  onClick={() => setField("relatedEntityType", t.value)}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    form.relatedEntityType === t.value
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
            <div className="mt-3 grid gap-4">
              <div className="hidden">
                <Label required>Title</Label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g., Looking for a React Developer position"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                     placeholder={
                     form.relatedEntityType=="job" ? 'Share details of the position you are looking for and connect with people that can really help find it.' :
                     form.relatedEntityType=="event" ? "Describe the type of event you are interested and connect with people that can help you find it.":
                     form.relatedEntityType=="product" ? 'Describe the type of products you are looking for and connect with people that can help you find it.' :
                     form.relatedEntityType=="service" ? 'Share the type or services you need and connect with people that can help you find it. ' :
                     form.relatedEntityType=="tourism" ? 'Describe the type of experience you are looking for and connect with people that can help you find it.' :
                     form.relatedEntityType=="funding" ? 'Describe the type of funding you are looking for and connect with people that can help you find it. ' :
                       form.relatedEntityType
                    ? `Share what you're looking for related to ${form.relatedEntityType} and connect with people who can help.`
                     : "Share what you're looking for and connect with people who can help."
                   }
                   __placeholder="Example: Looking for a graphic designer to create branding materials for our new restaurant opening next month."
                  _placeholder="Describe what you're looking for in detail. What do you need and why?"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>
            </div>
          </section>


          {/* Budget & Urgency */}
          <section className="hidden">
            <h2 className="font-semibold text-brand-600">Budget & Urgency</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Budget Range (if applicable)</Label>
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => setField("budget", e.target.value)}
                  placeholder="e.g., $50,000 - $70,000"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="relative">
                <Label>Urgency Level</Label>
                <select
                  value={form.urgency}
                  onChange={(e) => setField("urgency", e.target.value)}
                  className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
                <span className="pointer-events-none absolute right-2 bottom-3">
                  <I.chevron />
                </span>
              </div>
            </div>
          </section>

          {/* Location */}
          <section>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Country</Label>
                <SearchableSelect
                  value={form.country}
                  onChange={(value) => setField("country", value)}
                  options={countryOptions}
                  placeholder="Search and select country..."
                  key={form.country} // Force remount when country changes to reset internal state
                />
              </div>
              <div>
                <Label>City</Label>
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

          {/* Criteria */}
          <section className="hidden">
            <h2 className="font-semibold text-brand-600">Specific Criteria or Requirements</h2>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={criteriaInput}
                onChange={(e) => setCriteriaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCriteria();
                  }
                }}
                placeholder="Add specific requirements or criteria"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={addCriteria}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                aria-label="Add criteria"
              >
                <I.plus /> Add
              </button>
            </div>

            {form.criteria.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.criteria.map((criteria, idx) => (
                  <span
                    key={`${criteria}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                  >
                    {criteria}
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => removeCriteria(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Attachments */}
          <section>
            <Label>Attachments (Optional)</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
              <div className="flex justify-center items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <I.image />
                  <span className="text-xs">Images</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <I.video />
                  <span className="text-xs">Videos</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">Documents</span>
                </div>
              </div>
              Upload images, videos, or documents to support your need
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
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
            
              {(attachments.length > 0 || uploadingCount > 0) && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                  {attachments.map((a, idx) => {
                    const isMedia = a.type === 'image' || a.type === 'video';
                    const isDocument = a.type === 'document';

                    if (isMedia) {
                      return (
                        <div key={`${a.name}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                          <div 
                            className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center relative cursor-pointer"
                            onClick={() => handleMediaClick(idx)}
                          >
                            {a.type === 'video' ? (
                              <>
                                <video 
                                  src={a.base64url} 
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <I.video />
                                </div>
                              </>
                            ) : (
                              <img src={a.base64url} alt={a.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{a.name}</div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {a.type === 'video' ? 'Video' : 'Image'} • Attached
                            </div>
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
                    }

                    if (isDocument) {
                      return (
                        <a
                          key={`${a.name}-${idx}`}
                          href={a.base64url}
                          download={a.name}
                          className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50"
                        >
                          <div className="h-12 w-12 rounded-md bg-gray-100 grid place-items-center text-xs text-gray-500">DOC</div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{a.name}</div>
                            <div className="text-[11px] text-gray-500 truncate">Tap to download</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeAttachment(idx);
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Remove"
                          >
                            <I.trash />
                          </button>
                        </a>
                      );
                    }

                    return null;
                  })}

                  {uploadingCount > 0 &&
                    Array.from({ length: uploadingCount }).map((_, idx) => (
                      <div key={`att-skel-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                        <div className="h-12 w-12 rounded-md bg-gray-200 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <div className="h-4 w-3/5 bg-gray-200 rounded mb-2 animate-pulse" />
                          <div className="h-3 w-2/5 bg-gray-200 rounded animate-pulse" />
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
                    ))
                  }
                </div>
              )}

              <p className="mt-2 text-[11px] text-gray-400">
                Images & Documents: Up to 5MB each. Videos: Up to 50MB each.
                Supported formats: JPG, PNG, GIF, MP4, MOV, PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
              </p>
            </div>
          </section>

          {/* Classification (General) - Hidden when relatedEntityType is "information", "other", or "job" */}
          {form.relatedEntityType !== "information" && form.relatedEntityType !== "other" && form.relatedEntityType !== "job" && form.relatedEntityType !== "partnership" && (
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
          )}

          {/* Industry Classification */}
          <section className="hidden">
            <h2 className="font-semibold text-brand-600">Industry Classification</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select the industry category that best describes your need.
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
          Select who should see this post.
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
              <button
                type="button"
                className={styles.ghost}
                onClick={() => navigate("/feed")}
              >
                Cancel
              </button>
            )}
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update" : "Post"}
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