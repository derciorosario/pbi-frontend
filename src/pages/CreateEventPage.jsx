// src/pages/CreateEventPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client,{API_URL} from "../api/client";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import FullPageLoader from "../components/ui/FullPageLoader";
import CoverImagePicker from "../components/CoverImagePicker";
import Header from "../components/Header";
import AudienceTree from "../components/AudienceTree";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";

const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed",
  primaryGhost:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-brand-600 text-brand-600 bg-white hover:bg-brand-50",
  badge:
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  chip:
    "inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs",
};

const I = {
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  calendar: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2v2H5a2 2 0 0 0-2 2v1h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 7H3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z" />
    </svg>
  ),
  mapPin: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  ),
  ticket: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 7a2 2 0 0 1 2-2h5v3a2 2 0 1 0 4 0V5h5a2 2 0 0 1 2 2v3h-3a2 2 0 1 0 0 4h3v3a2 2 0 0 1-2 2h-5v-3a2 2 0 1 0-4 0v3H5a2 2 0 0 1-2-2v-3h3a2 2 0 1 0 0-4H3V7z" />
    </svg>
  ),
};

/* ---------- Small helpers ---------- */
function fmtDate(dateStr, tz) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeZone: tz || "UTC" }).format(d);
  } catch {
    return dateStr;
  }
}
function fmtTime(hhmm, tz) {
  if (!hhmm) return "";
  try {
    const d = new Date();
    const [H, M] = hhmm.split(":").map(Number);
    d.setHours(H, M, 0, 0);
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: tz || "UTC" }).format(d);
  } catch {
    return hhmm;
  }
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
      // Handle backspace when dropdown is closed to start editing
      if (e.key === "Backspace") {
        e.preventDefault();
        if (selected && !query) {
          // Start editing from the selected value by removing last char
          setQuery((selected.label || "").slice(0, -1));
        } else {
          // Remove last character from current query (if any)
          setQuery((query || "").slice(0, -1));
        }
        setOpen(true);
        return;
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

// Create country options for SearchableSelect
const countryOptions = [
  { value: "All countries", label: "All countries" },
  ...COUNTRIES.map(country => ({
    value: country,
    label: country
  }))
];

// Create city options for SearchableSelect (limit to reasonable number)
const allCityOptions = CITIES.slice(0, 10000).map(city => ({
  value: city.city,
  label: `${city.city}${city.country ? `, ${city.country}` : ''}`,
  country: city.country
}));



/* ---------- Timezone label with UTC offset ---------- */
function tzOffsetLabel(tz, when = new Date()) {
  try {
    // Pega "GMT+2" ou similar de forma robusta
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(when);
    const raw = parts.find(p => p.type === "timeZoneName")?.value || "";

    // Normaliza para "UTC+02:00"
    // Aceita "GMT+2", "UTC+2", "GMT+02:00", etc.
    const m = raw.match(/(GMT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
    if (m) {
      const sign = m[2].startsWith("-") ? "-" : "+";
      const h = Math.abs(parseInt(m[2], 10));
      const mm = m[3] ? parseInt(m[3], 10) : 0;
      const hh = String(h).padStart(2, "0");
      const mmm = String(mm).padStart(2, "0");
      return `UTC${sign}${hh}:${mmm}`;
    }
    // fallback: sem parsing confiável
    return raw || "UTC";
  } catch {
    return "UTC";
  }
}

function tzWithOffset(tz) {
  return `${tz} (${tzOffsetLabel(tz)})`;
}


/* ---------- Read-only view for non-owners ---------- */
function ReadOnlyEventView({ form, coverImageBase64, meta, audSel, audTree }) {
  const tz = form.timezone || "Africa/Lagos";
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const coverSrc = coverImageBase64 || form.coverImageUrl || null;

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {coverSrc ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="Event cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 bg-white/90 border-gray-200 text-gray-700 px-2 py-0.5 rounded-full border text-xs">
            {form.eventType || "Event"}
          </span>
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{form.title || "Untitled event"}</h1>
            <p className="mt-1 text-sm text-gray-600">{form.description || "No description provided."}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <I.calendar /> <span>Date & Time</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <div>{fmtDate(form.date, tz)}</div>
              <div>
                {fmtTime(form.startTime, tz)}
                {form.endTime ? ` – ${fmtTime(form.endTime, tz)}` : ""} <span className="text-gray-500">({tz})</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <I.mapPin /> <span>Location</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {form.locationType === "Virtual" ? (
                form.onlineUrl ? (
                  <a href={form.onlineUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                    Join link
                  </a>
                ) : (
                  "Online"
                )
              ) : (
                <>
                  <div>{form.address || "—"}</div>
                  <div>{[form.city, form.country].filter(Boolean).join(", ") || "—"}</div>
                </>
              )}
              <div className="mt-1 text-xs text-gray-500">{form.locationType || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <I.ticket /> <span>Registration</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <div>
                {form.registrationType === "Paid"
                  ? `${form.price || "—"} ${form.currency || ""}`
                  : "Free"}
              </div>
              <div>Capacity: {form.capacity || "—"}</div>
              <div>
                Deadline: {form.registrationDeadline ? fmtDate(form.registrationDeadline, tz) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Target Audience</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((x) => (<span key={`i-${x}`} className={styles.chip}>{x}</span>))}
            {categories.map((x) => (<span key={`c-${x}`} className={styles.chip}>{x}</span>))}
            {subcategories.map((x) => (<span key={`s-${x}`} className={styles.chip}>{x}</span>))}
            {subsubs.map((x) => (<span key={`ss-${x}`} className={styles.chip}>{x}</span>))}
            {identities.length + categories.length + subcategories.length + subsubs.length === 0 && (
              <span className="text-sm text-gray-500">Everyone</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={styles.primaryGhost} onClick={() => history.back()}>
            Back
          </button>
          {form.onlineUrl ? (
            <a href={form.onlineUrl} target="_blank" rel="noreferrer" className={styles.primary}>
              Open Join Link
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage({ triggerImageSelection = false, hideHeader = false, onSuccess }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [organizerUserId, setOrganizerUserId] = useState(null);

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

  // Industry taxonomy
  const [industryTree, setIndustryTree] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState({
    categoryId: "",
    subcategoryId: "",
  });
  const [showAudienceSection, setShowAudienceSection] = useState(false);

  const [form, setForm] = useState({
    eventType: "Workshop",
    title: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    date: "",
    startTime: "",
    endTime: "",
    timezone: "Africa/Lagos",
    locationType: "In-Person",
    country: "All countries",
    city: "",
    address: "",
    onlineUrl: "",
    registrationType: "Free",
    price: "",
    currency: "USD",
    capacity: "",
    registrationDeadline: "",
    coverImageUrl: "",
  });

  const [meta, setMeta] = useState({ categories: [], currencies: [], timezones: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [coverImageBase64, setCoverImageBase64] = useState(null);
  const [coverImageFilename, setCoverImageFilename] = useState(null);
  const imagePickerRef = useRef(null);

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

  const readOnly = isEditMode && organizerUserId && user?.id !== organizerUserId;

  // Load single event (edit)
  useEffect(() => {
    if (!id) return;
    setIsEditMode(true);
    setLoadingMeta(true);
    (async () => {
      try {
        const { data } = await client.get(`/events/${id}?updated=true`);
        const orgId =
          data.organizerUserId ??
          data.organizerId ??
          data.createdById ??
          data.organizer?.id ??
          data.createdBy?.id ??
          data.userId ??
          null;
        setOrganizerUserId(orgId);

        setForm({
          eventType: data.eventType || "Workshop",
          title: data.title || "",
          description: data.description || "",
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          date: data.startAt ? new Date(data.startAt).toISOString().split("T")[0] : "",
          startTime: data.startAt ? new Date(data.startAt).toISOString().split("T")[1].substring(0, 5) : "",
          endTime: data.endAt ? new Date(data.endAt).toISOString().split("T")[1].substring(0, 5) : "",
          timezone: data.timezone || "Africa/Lagos",
          locationType: data.locationType || "In-Person",
          country: data.country || "",
          city: data.city || "",
          address: data.address || "",
          onlineUrl: data.onlineUrl || "",
          registrationType: data.registrationType || "Free",
          price: data.price?.toString() || "",
          currency: data.currency || "USD",
          capacity: data.capacity?.toString() || "",
          registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString().split("T")[0] : "",
          coverImageUrl: data.coverImageUrl || "",
          coverImageBase64:data.coverImageBase64 || data.coverImageUrl 
        });

        if (data.coverImageBase64) {
          if (data.coverImageBase64.startsWith('data:') || data.coverImageBase64.startsWith('http')) {
            // If it's a base64 string (old format), use it as preview
            setCoverImageBase64(data.coverImageBase64);
          } else {
            // If it's a filename (new format), store it
            setCoverImageFilename(data.coverImageBase64);
            // Set preview URL for the image
            setCoverImageBase64(API_URL+`/uploads/${data.coverImageBase64}`);
          }
        }

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

        // If event already has general taxonomy set, prefill selectedGeneral
        setSelectedGeneral({
          categoryId: data.generalCategoryId || "",
          subcategoryId: data.generalSubcategoryId || "",
          subsubCategoryId: data.generalSubsubCategoryId || "",
        });

        // If event already has industry taxonomy set, prefill selectedIndustry
        setSelectedIndustry({
          categoryId: data.industryCategoryId || "",
          subcategoryId: data.industrySubcategoryId || "",
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load event data");
        navigate("/events");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [id, navigate]);

  // Load meta
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/events/meta");
        setMeta(data);
        setForm((f) => ({
          ...f,
          country: f.country,
          timezone: f.timezone || data.timezones[0] || "Africa/Lagos",
        }));
      } catch (e) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Failed to load form metadata");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);


  // Trigger image selection when component mounts with triggerImageSelection
  useEffect(() => {
    if (triggerImageSelection && imagePickerRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
         console.log(imagePickerRef.current)
        imagePickerRef.current?.pick();
       
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [triggerImageSelection]);

  // Load audience identities tree
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities?type=all");
        setAudTree(data.identities || []);
      } catch (error) {
        console.error("Error loading identities:", error);
      }
    })();
  }, []);

  // Load GENERAL taxonomy tree (searchable pickers)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/general-categories/tree?type=event");
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

  const subcategoryOptions = useMemo(() => {
    if (!form.categoryId) return [];
    const cat = meta.categories.find((c) => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [form.categoryId, meta.categories]);

  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "categoryId") next.subcategoryId = "";
      if (name === "registrationType" && value === "Free") next.price = "";
      if (name === "country") {
        // When "All countries" is selected, clear the city field
        if (value === "All countries") {
          next.city = "";
        }
      }
      if (name === "locationType") {
        if (value === "Virtual") {
          next.address = "";
          next.city = "";
          // Don't clear country when switching to Virtual, keep "All countries" as default
        } else {
          next.onlineUrl = "";
        }
      }
      return next;
    });
  }

  // Function to upload the cover image
  const uploadCoverImage = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      const response = await client.post('/events/upload-cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.filename;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
      return null;
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;

    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    if (!form.date || !form.startTime) {
      toast.error("Date and start time are required");
      return;
    }
    if (form.registrationType === "Paid" && (!form.price || !form.currency)) {
      toast.error("Price and currency are required for paid events");
      return;
    }

    setSaving(true);
    try {
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      // Upload cover image if there's a new one
      let imageFilename = coverImageFilename;

      if (coverImageBase64 instanceof File) {
        imageFilename = await uploadCoverImage(coverImageBase64);
      }

      console.log({a:imageFilename,coverImageBase64})

      const payload = {
        ...form,
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,
        // Use the filename instead of base64 data
        coverImageBase64: !coverImageBase64 ? null : imageFilename,
        coverImageUrl:!coverImageBase64 ? null :  imageFilename,
        // NEW — general taxonomy from searchable pickers
        generalCategoryId: selectedGeneral.categoryId || null,
        generalSubcategoryId: selectedGeneral.subcategoryId || null,
        generalSubsubCategoryId: selectedGeneral.subsubCategoryId || null,
        // Industry taxonomy
        industryCategoryId: selectedIndustry.categoryId || null,
        industrySubcategoryId: selectedIndustry.subcategoryId || null,
      };

      if (!payload.subcategoryId) delete payload.subcategoryId;
      if (payload.registrationType === "Free") {
        delete payload.price;
        delete payload.currency;
      }
      if (payload.locationType === "Virtual") {
        delete payload.address;
        delete payload.city;
        delete payload.country;
      } else {
        delete payload.onlineUrl;
        // When country is "All countries", ensure city is not sent
        if (payload.country === "All countries") {
          delete payload.city;
        }
      }

      if (isEditMode) {
        await client.put(`/events/${id}`, payload);
        toast.success("Event updated successfully!");
      } else {
        await client.post("/events", payload);
        toast.success("Event created successfully!");
        if (hideHeader && onSuccess) {
          onSuccess();
        } else {
          navigate(`/events`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  }

  // Build options for searchable pickers
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

  // Build options for industry pickers
  const industryCategoryOptions = useMemo(
    () => industryTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [industryTree]
  );
  const industrySubcategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [industryTree, selectedIndustry.categoryId]);

  if (loadingMeta) {
    return (
      <FullPageLoader message="Loading event form…" tip="Fetching categories and preferences" />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {!hideHeader && <Header page={"events"} />}
      <main className={`mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 ${hideHeader ? 'py-4' : 'py-8'}`}>
        {!hideHeader && (
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
          >
            ← Go to Events
          </button>
        )}

        {isEditMode && <>
          <h1 className="text-2xl font-bold mt-3">{isEditMode ? "Edit Event" : "Create Event"}</h1>
        
        </>}

        {/* Non-owner gets a friendly read-only presentation */}
        {readOnly ? (
          <ReadOnlyEventView
            form={form}
            coverImageBase64={coverImageBase64}
            meta={meta}
            audSel={audSel}
            audTree={audTree}
          />
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8"
          >

               {/* Basic Info */}
            <section>
             <div className="mt-3 grid gap-4">
                {/*** <label className="text-[12px] font-medium text-gray-700">Enter event title</label> */}
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  _placeholder="Enter event title"
                  placeholder="Event title: Annual Marketing Conference 2024"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
                {/***<label className="text-[12px] font-medium text-gray-700">Description</label> */}
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  _placeholder="Describe your event..."
                   placeholder="Describe your event: Join us for a day of networking and learning about the latest marketing trends. Featuring industry experts and hands-on workshops."
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>
            </section>


               {/* Cover */}
            <section>
              <CoverImagePicker
                ref={imagePickerRef}
                label="Cover Image (optional)"
                value={coverImageBase64}
                preview={typeof coverImageBase64 === 'string' ? coverImageBase64 : null}
                onChange={setCoverImageBase64}
              />
            </section>

            {/* Event Type */}
          {/***  <section>
              <h2 className="font-semibold text-brand-600">Event Type</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["Workshop", "Conference", "Networking"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setField("eventType", t)}
                    className={`border rounded-xl p-4 text-left transition-colors ${
                      form.eventType === t
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-brand-600"
                    }`}
                  >
                    <div className="font-medium">{t}</div>
                    <div className="text-xs text-gray-500">
                      {t === "Workshop"
                        ? "Interactive learning session"
                        : t === "Conference"
                        ? "Large-scale gathering"
                        : "Connect with peers"}
                    </div>
                  </button>
                ))}
              </div>
            </section> */}

           

         
           
           {/* Date & Time */}
          <section>
            <h2 className="font-semibold text-brand-600">Date & Time</h2>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1">
                <label className="text-[12px] font-medium text-gray-700">Date <label className="text-[crimson]">*</label></label>
                <input
                  type="date"
                  min={isEditMode ? form.createdAt?.split('T')?.[0] : new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>

              <div className="grid gap-1">
                <label className="text-[12px] font-medium text-gray-700">Start time <label className="text-[crimson]">*</label></label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                  placeholder="HH:MM"
                  title="Formato 24h (HH:MM), ex.: 14:30"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>

              <div className="grid gap-1">
                <label className="text-[12px] font-medium text-gray-700">End time (optional)</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                  placeholder="HH:MM"
                  title="Formato 24h (HH:MM), ex.: 16:00"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
            </div>
            </div>

            <div className="relative mt-3">
              <label className="sr-only">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {meta.timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tzWithOffset(tz)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <I.chevron />
              </span>
             
            </div>
          </section>


            {/* Location */}
            <section>
              <h2 className="font-semibold text-brand-600">Location</h2>
              <div className="mt-3 flex gap-6 text-sm">
                {["In-Person", "Virtual", "Hybrid"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="locationType"
                      checked={form.locationType === opt}
                      onChange={() => setField("locationType", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>

              {form.locationType !== "Virtual" ? (
                <>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
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

                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Full address"
                    className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </>
              ) : (
                <input
                  type="url"
                  value={form.onlineUrl}
                  onChange={(e) => setField("onlineUrl", e.target.value)}
                  placeholder="Meeting link (Zoom/Meet/etc.)"
                  className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              )}
            </section>

           
           
           {/* Registration */}
          <section>
            <h2 className="font-semibold text-brand-600">Registration</h2>

            {/* Registration Type & Capacity */}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">
                  Registration Type
                </label>
                <select
                  value={form.registrationType}
                  onChange={(e) => setField("registrationType", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option>Free</option>
                  <option>Paid</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-[2.3rem] -translate-y-1/2">
                  <I.chevron />
                </span>
              </div>

              <div>
                <label className="block text-[0.8rem] font-medium text-gray-700 mb-1">
                  Seats / Capacity (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value.replace(/[^\d\-\(\)]/g, ''))}
                  placeholder="e.g. 200"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            {/* Price & Currency (only if Paid) */}
            {form.registrationType === "Paid" && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value.replace(/[^\d\-\(\)]/g, ''))}
                    placeholder="e.g. 50.00"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setField("currency", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {meta.currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-[2.3rem] -translate-y-1/2">
                    <I.chevron />
                  </span>
                </div>
              </div>
            )}

            {/* Registration Deadline */}
            <div className="mt-3">
              <label className="block text-[0.8rem]  font-medium text-gray-700 mb-1">
                Registration Deadline (last day to register)
              </label>
              <input
                type="date"
                 min={isEditMode ? form.createdAt?.split('T')?.[0] : new Date().toISOString().split('T')[0]}
                value={form.registrationDeadline}
                onChange={(e) => setField("registrationDeadline", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </section>




            {/* General Classification (SEARCHABLE) */}
            <section>
            

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-gray-700">General Category <span className="text-gray-400 font-normal">(optional)</span></label>
                  <SearchableSelect
                    ariaLabel="General Category"
                    value={selectedGeneral.categoryId}
                    onChange={(val) =>
                      setSelectedGeneral({ categoryId: val, subcategoryId: "", subsubCategoryId: "" })
                    }
                    options={generalCategoryOptions}
                    placeholder="Search & select category…"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-gray-700">General Subcategory <span className="text-gray-400 font-normal">(optional)</span></label>
                  <SearchableSelect
                    ariaLabel="General Subcategory"
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

            {/* Industry Classification */}
            <section className="hidden">
              <h2 className="font-semibold text-brand-600">Industry Classification</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select the industry category and subcategory that best describes your event.
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

            {/* Audience */}
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
                    Select who should see this event.
                  </p>

                  <AudienceTree tree={audTree} selected={audSel} onChange={(next) => setAudSel(next)} />
                </div>
              )}
            </div>
          </section>
                    

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {!hideHeader && (
                <button type="button" className={styles.primaryGhost} onClick={() => navigate("/events")}>
                  Cancel
                </button>
              )}
              <button type="submit" className={styles.primary} disabled={saving}>
                {saving ? "Saving…" : isEditMode ? "Update Event" : "Publish Event"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
