// src/pages/CreateNeedPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client, { API_URL } from "../api/client";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import AudienceTree from "../components/AudienceTree";
import Header from "../components/Header";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";

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

  // Extract images and docs from attachments (stored as [{name: '', base64url: ''}])
  const images = attachments?.filter(att => isImage(att.base64url)) || [];
  const docs = attachments?.filter(att => !isImage(att.base64url)) || [];
  const coverImageUrl = images[0]?.base64url || null;

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {/* Cover hero */}
      {coverImageUrl ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          <img src={coverImageUrl} alt="Need cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 bg-white/90 border-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
            {form.relatedEntityType || "Need"}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled Need"}</h1>
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
          <div className="rounded-xl border p-4">
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
        {images.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Images</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.slice(1).map((img, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  <img src={img.base64url} alt={`Need image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {docs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
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

/* -------------- Page -------------- */
export default function CreateNeedPage() {
  const navigate = useNavigate();
  const { id, type: urlType } = useParams(); // Extract id and type from URL
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [currentType, setCurrentType] = useState("need");

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
    country: "",
    city: "",
    criteria: [], // array of strings
    relatedEntityType: "", // job | product | service | event | funding | information
    relatedEntityId: "",
  });

  const [criteriaInput, setCriteriaInput] = useState("");

  // Attachments: [{ name, base64url }]
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

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
    if (selectedCountries.length === 0) return allCityOptions;
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

        

        // Set attachments if they exist (stored as [{name: '', base64url: ''}])
        if (Array.isArray(data.attachments)) {
          setAttachments(data.attachments.map(att => ({
            name: att.name || att,
            base64url: att.base64url || att,
          })));
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
        navigate("/needs");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  // Set currentType based on URL type when creating
  useEffect(() => {
    if (urlType && !isEditMode) {
      setCurrentType(urlType);
      setField("relatedEntityType", urlType);
    }
  }, [urlType, isEditMode]);

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

  /* ---------- Handlers ---------- */

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
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

    // Cap total attachments
    const remainingSlots = 20 - attachments.length;
    const slice = remainingSlots > 0 ? arr.slice(0, remainingSlots) : [];

    // Upload files immediately and store filenames
    try {
      const formData = new FormData();
      slice.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await client.post('/needs/upload-attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadedFilenames = response.data.filenames || [];

      // Store as [{name: '', base64url: ''}] where base64url is the uploaded filename
      const mapped = slice.map((file, index) => ({
        name: file.name,
        base64url: `${API_URL}/uploads/${uploadedFilenames[index] || file.name}`,
      }));

      setAttachments((prev) => [...prev, ...mapped]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast.error('Failed to upload attachments');
    }
  }

  function removeAttachment(idx) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required";
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
        city: form.city || undefined,
        criteria: form.criteria,
        attachments, // Already contains {name: '', base64: ''} where base64 is uploaded filename

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
        if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);   // go back if possible
              } else {
                navigate("/");  // fallback if no history
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

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header page={"needs"} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div>
        
        <button
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
        </button>


          {!isEditMode && (
            <div>
              <h1 className="text-2xl font-bold mt-3">
                {isEditMode ? "Edit Need" : "Post What You Need"}
              </h1>
              <p className="text-sm text-gray-600">
                {form.relatedEntityType
                  ? `Share what you're looking for related to ${form.relatedEntityType} and connect with people who can help.`
                  : "Share what you're looking for and connect with people who can help."
                }
              </p>
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
          <section>
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
            <h2 className="font-semibold text-brand-600">Basic Information</h2>
            <div className="mt-3 grid gap-4">
              <div>
                <Label required>Title</Label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g., Looking for a React Developer position"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>
              <div>
                <Label required>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe what you're looking for in detail. What do you need and why?"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>
            </div>
          </section>


          {/* Budget & Urgency */}
          <section>
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
            <h2 className="font-semibold text-brand-600">Location</h2>
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
                />
              </div>
            </div>
          </section>

          {/* Criteria */}
          <section>
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
            <h2 className="font-semibold text-brand-600">Attachments (Optional)</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
              <div className="mb-2">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              Upload images or documents to support your need (max 5MB per file)
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
                            <img src={src} alt={a.name} className="h-full w-full object-cover" />
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
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Classification (General) - Hidden when relatedEntityType is "information", "other", or "job" */}
          {form.relatedEntityType !== "information" && form.relatedEntityType !== "other" && form.relatedEntityType !== "job" && form.relatedEntityType !== "partnership" && (
            <section>
              <h2 className="font-semibold text-brand-600">Classification</h2>
              <p className="text-xs text-gray-600 mb-3">
                Search and pick the category that best describes what you're looking for.
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
          )}

          {/* Industry Classification */}
          <section>
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
          <section>
            <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select who should see this need. Choose multiple identities, categories, subcategories, and sub-subs.
            </p>
            <AudienceTree
              tree={audTree}
              selected={audSel}
              onChange={(next) => setAudSel(next)}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={styles.ghost}
              onClick={() => navigate("/needs")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Need" : "Post Need"}
            </button>
          </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}