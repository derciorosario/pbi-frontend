// src/pages/CreateJobOpportunity.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import CITIES from "../constants/cities.json";
import Header from "../components/Header";
import CoverImagePicker from "../components/CoverImagePicker";
import AudienceTree from "../components/AudienceTree";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";

/* brand icons (trimmed) */
const I = {
  briefcase: () => (
    <svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z" />
      <path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z" />
    </svg>
  ),
  doc: () => (
    <svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v6h6" className="opacity-70" />
    </svg>
  ),
  pin: () => (
    <svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  ),
  send: () => (
    <svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="m2 21 21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  ),
  back: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 19 8 12l7-7" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  calendar: () => (
    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h2v3H7zm8 0h2v3h-2z" />
      <path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z" />
    </svg>
  ),
  search: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 2a8 8 0 1 1 5.293 13.707l4 4-1.414 1.414-4-4A8 8 0 0 1 10 2Zm0 2a6 6 0 1 0 .001 12.001A6 6 0 0 0 10 4Z" />
    </svg>
  ),
  x: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={` ${props.className || ""} w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""}`}
  />
);

const Select = ({ children, ...rest }) => (
  <div className="relative">
    <select
      {...rest}
      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-purple-200"
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
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""}`}
  />
);

const CURRENCY_OPTIONS = [
  "USD","EUR","GBP","NGN","GHS","ZAR","KES","UGX","TZS","XOF","XAF","MAD","DZD","TND","EGP","ETB",
  "NAD","BWP","MZN","ZMW","RWF","BIF","SOS","SDG","CDF"
];

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


/* ---------- helpers for read-only view ---------- */
const styles = {
  badge: "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  chip: "inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs",
};

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
    if (!q) return options; // Show all options when no query for city dropdown
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

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return dateStr;
  }
}
function fmtSalary(minSalary, maxSalary, currency) {
  const cur = currency || "";
  if (minSalary && maxSalary) return `${minSalary}–${maxSalary} ${cur}`;
  if (minSalary) return `From ${minSalary} ${cur}`;
  if (maxSalary) return `Up to ${maxSalary} ${cur}`;
  return "—";
}
function buildAudienceMaps(tree = []) {
  const ids = new Map(), cats = new Map(), subs = new Map(), subsubs = new Map();
  for (const idn of tree) {
    ids.set(String(idn.id), idn.name || idn.title || `Identity ${idn.id}`);
    for (const c of (idn.categories || [])) {
      cats.set(String(c.id), c.name || c.title || `Category ${c.id}`);
      for (const s of (c.subcategories || [])) {
        subs.set(String(s.id), s.name || s.title || `Subcategory ${s.id}`);
        for (const ss of (s.subsubs || [])) {
          subsubs.set(String(ss.id), ss.name || ss.title || `Sub-sub ${ss.id}`);
        }
      }
    }
  }
  return { ids, cats, subs, subsubs };
}

// Try to collect images from various job fields
function extractMedia(job = {}) {
  const urls = new Set();
  const addUrl = (u) => { if (typeof u === "string" && u.trim()) urls.add(u.trim()); };

  const fromArray = (arr) => {
    if (Array.isArray(arr)) arr.forEach((u) => {
      if (typeof u === "string") addUrl(u);
      else if (u && typeof u.url === "string") addUrl(u.url);
    });
  };

  addUrl(job.coverImageUrl);
  addUrl(job.imageUrl);
  addUrl(job.bannerUrl);
  addUrl(job.heroUrl);

  // gallery-like fields
  fromArray(job.images);
  fromArray(job.gallery);
  fromArray(job.photos);
  fromArray(job.media);

  // attachments with image mime or extension
  if (Array.isArray(job.attachments)) {
    job.attachments.forEach((a) => {
      const u = a?.url || a?.href;
      const mime = a?.mimeType || a?.contentType;
      if (mime?.startsWith?.("image/")) addUrl(u);
      else if (typeof u === "string" && /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(u)) addUrl(u);
    });
  }

  const logoUrl = job.logoUrl || job.companyLogoUrl || null;
  const all = Array.from(urls);
  const coverImageUrl = job.coverImageUrl || job.bannerUrl || job.heroUrl || all[0] || null;
  const images = all.filter((u) => u !== coverImageUrl);

  return { logoUrl, coverImageUrl, images };
}

/* ============== Friendlier Company Picker ============== */
function highlight(text, q) {
  if (!q) return text;
  try {
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    const parts = (text || "").split(re);
    return parts.map((p, i) =>
      re.test(p) ? <mark key={i} className="bg-yellow-100 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>
    );
  } catch {
    return text;
  }
}

/**
 * InlineCompanyPicker
 * Props:
 *  - companies: [{id,name,email,city,country}]
 *  - value: selected companyId
 *  - onChange: (company | null) => void
 *  - required: boolean (adds hidden required input)
 */
function InlineCompanyPicker({ companies = [], value, onChange, required }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = useMemo(() => companies.find((c) => c.id === value) || null, [companies, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies.slice(0, 20);
    const scored = companies
      .map((c) => {
        const hay = `${c.name || ""} ${c.email || ""} ${c.city || ""} ${c.country || ""}`.toLowerCase();
        const idx = hay.indexOf(q);
        // simple ranking: earlier match + has name match
        const nameIdx = (c.name || "").toLowerCase().indexOf(q);
        const score = (nameIdx !== -1 ? 0 : 5) + (idx === -1 ? 999 : idx);
        return { c, score };
      })
      .filter((x) => x.score < 999)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.c);
    return scored.slice(0, 12);
  }, [companies, query]);

  useEffect(() => {
    if (!open) setActiveIndex(0);
  }, [open, query]);

 
   function pick(c) {
    onChange?.(c);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    onChange?.(null);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  // ✅ Add this
  function handleBlur() {
    // Defer so clicks on results (with preventDefault on mousedown) can run first
    setTimeout(() => {
      const q = query.trim();
      if (!q) return; // no free-text to validate; keep current selection
      const exact = companies.find(
        (c) => (c.name || "").trim().toLowerCase() === q.toLowerCase()
      );
      if (exact) {
        pick(exact);
      } else {
        clear(); // no exact match → clear selection + input
      }
    }, 0);
  }

  function onKeyDown(e) {
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
      const c = filtered[activeIndex];
      if (c) pick(c);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={selected ? selected.name : "Search companies…"}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              onBlur={handleBlur}   
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="company-results"
              role="combobox"
              autoComplete="off"
              className={selected ? "text-gray-400 placeholder-black" : "text-gray-700 placeholder-gray-400"}
            />
           
            {selected && (
              <button
                type="button"
                onClick={clear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100"
                aria-label="Clear selected company"
                title="Clear"
              >
                <I.x />
              </button>
            )}
          </div>
        </div>

        {/* Hidden input to participate in form validation when required */}
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

     
      {/* Results popover */}
      {open && (
        <div
          id="company-results"
          role="listbox"
          className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No companies found.</div>
          ) : (
            <ul className="max-h-72 overflow-auto">
              {filtered.map((c, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={isActive}
                    className={`cursor-pointer px-3 py-2 text-sm flex items-center justify-between ${
                      isActive ? "bg-brand-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => {
                      // prevent blur before click completes
                      e.preventDefault();
                      pick(c);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {highlight(c.name || "Unnamed", query)}
                      </div>
                      <div className="text-[12px] text-gray-500 truncate">
                        {c.email ? <span className="mr-2">{highlight(c.email, query)}</span> : null}
                        {(c.city || c.country) ? (
                          <span className="">{[c.city, c.country].filter(Boolean).join(", ")}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="ml-3 text-[11px] text-gray-400">{c.country || ""}</span>
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

/* ---------- Read-only component for non-owners (with images) ---------- */
function ReadOnlyJobView({ form, audSel, audTree, media, coverImageBase64 }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const skills = (form.requiredSkills || [])
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { logoUrl, coverImageUrl, images = [] } = media || {};
  const coverSrc = coverImageBase64 || coverImageUrl || null;

  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Cover image (hero) */}
      {coverSrc ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={coverSrc} alt="Job cover" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {logoUrl ? (
              <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-gray-200 bg-white">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div>
              <h1 className="text-xl font-bold">{form.title || "Untitled role"}</h1>
              <div className="mt-1 text-sm text-gray-700">
                {form.companyName ? (
                  <>
                    <span className="font-medium">{form.companyName}</span>
                    {form.make_company_name_private ? (
                      <span className="ml-2 text-xs text-gray-500">(company kept private)</span>
                    ) : null}
                  </>
                ) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.doc/> Job Details</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div>Department: {form.department || "—"}</div>
              <div>Experience: {form.experienceLevel || "—"}</div>
              <div>Type: {form.jobType || "—"}</div>
              <div>Work Mode: {form.workMode || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.pin/> Location</div>
            <div className="mt-2 text-sm text-gray-700">
              <div>{[form.city, form.country].filter(Boolean).join(", ") || "—"}</div>
              <div className="mt-1">Salary: {fmtSalary(form.minSalary, form.maxSalary, form.currency)}</div>
              <div className="mt-1">Benefits: {form.benefits || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.send/> Applications</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div>Deadline: {fmtDate(form.applicationDeadline)}</div>
              <div>Positions: {form.positions || "—"}</div>
              <div>Contact: {form.contactEmail || "—"}</div>
            </div>
          </div>
        </div>

        {(images?.length || 0) > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Images</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src={src} alt={`Job image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {form.description || "No description provided."}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Required Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.length ? skills.map((s) => <span key={s} className={styles.chip}>{s}</span>) : <span className="text-sm text-gray-500">—</span>}
          </div>
        </div>

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

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-brand-600 text-brand-600 bg-white hover:bg-brand-50"
            onClick={() => history.back()}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function CreateJobOpportunity() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get job ID from URL if editing
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const [coverImageBase64, setCoverImageBase64] = useState(null);

  // Form validation errors
  const [errors, setErrors] = useState({
    title: "",
    companyId: "",
    country: "",
    city: "",
    description: "",
    requiredSkills: [],
    skills:[],
    minSalary: "",
    maxSalary: "",
    currency: "",
    applicationDeadline: "",
    positions: "",
    contactEmail: "",
  });
  const [skillInput, setSkillInput] = useState("")

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
        const { data } = await client.get("/general-categories/tree?type=job");
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


  const [companies, setCompanies] = useState([]);
  const [ownerUserId, setOwnerUserId] = useState(null);

  // Legacy single list for primary category dropdown (kept for compatibility in DB)
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  // NEW: full audience tree from /public/identities
  const [audTree, setAudTree] = useState([]);

  const [form, setForm] = useState({
    title: "", companyName: "", companyId: "", make_company_name_private: false, department: "", experienceLevel: "",
    description: "", requiredSkills: "",
    country:"", city: "",
    minSalary: "", maxSalary: "", currency: "USD", benefits: "",
    applicationDeadline: "", positions: 1, applicationInstructions: "", contactEmail: "",
    categoryId: "", subcategoryId: "",
    jobType: "", workLocation: "", workSchedule: "",
    careerLevel: "", paymentType: "",
    workMode: "", description: "", requiredSkills: "",
    country:"", city: "",
  });

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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/companies?limit=2000");
        setCompanies(data.companies || []);
      } catch (e) {
        console.error("Failed to load companies", e);
      }
    })();
  }, []);

  // Keep companyName in sync if we only have an id
  useEffect(() => {
    if (form.companyId && !form.companyName) {
      const c = companies.find((x) => x.id === form.companyId);
      if (c) setForm((f) => ({ ...f, companyName: c.name }));
    }
  }, [companies, form.companyId]);

  // NEW: selection sets (use Sets to keep toggling simple)
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // NEW: media state for images
  const [media, setMedia] = useState({ logoUrl: null, coverImageUrl: null, images: [] });

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  // Check if we're in edit mode and fetch job data if we are
  useEffect(() => {
    if (!id) return;
    setIsEditMode(true);
    setIsLoading(true);

    (async () => {
      try {
        const { data } = await client.get(`/jobs/${id}`);
        const job = data.job;

        // infer owner field across possible shapes
        const ownerId =
          job.ownerUserId ??
          job.postedByUserId ??
          job.createdById ??
          job.userId ??
          job.createdBy?.id ??
          job.poster?.id ??
          null;
        setOwnerUserId(ownerId);

        // Update form with job data
        setForm({
          title: job.title || "",
          companyId: job.companyId || "",
          companyName: job.company?.name || job.companyName || "",
          make_company_name_private: job.make_company_name_private || false,
          department: job.department || "",
          experienceLevel: job.experienceLevel || "",
          jobType: job.jobType || "",
          workMode: job.workMode || "",
          description: job.description || "",
          //requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills || "",
          requiredSkills: Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : (typeof job.requiredSkills === "string"
              ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
              : []),

          country: job.country || COUNTRIES[0] || "",
          city: job.city || "",
          minSalary: job.minSalary?.toString() || "",
          maxSalary: job.maxSalary?.toString() || "",
          currency: job.currency || "USD",
          benefits: job.benefits || "",
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split("T")[0] : "",
          positions: job.positions || 1,
          applicationInstructions: job.applicationInstructions || "",
          contactEmail: job.contactEmail || "",
          categoryId: job.categoryId || "",
          subcategoryId: job.subcategoryId || "",
          jobType: job.jobType || "",
          workLocation: job.workLocation || "",
          workSchedule: job.workSchedule || "",
          careerLevel: job.careerLevel || "",
          paymentType: job.paymentType || "",
        });

        // Set audience selections
        if (
          job.audienceIdentities?.length ||
          job.audienceCategories?.length ||
          job.audienceSubcategories?.length ||
          job.audienceSubsubs?.length
        ) {
          setAudSel({
            identityIds: new Set(job.audienceIdentities?.map((i) => i.id) || []),
            categoryIds: new Set(job.audienceCategories?.map((c) => c.id) || []),
            subcategoryIds: new Set(job.audienceSubcategories?.map((s) => s.id) || []),
            subsubCategoryIds: new Set(job.audienceSubsubs?.map((s) => s.id) || []),
          });
        }

        // Collect images/logos/cover
        setMedia(extractMedia(job));
        if (job.coverImageBase64) setCoverImageBase64(job.coverImageBase64);

        // Set industry selections if they exist
        setSelectedIndustry({
          categoryId: job.industryCategoryId || "",
          subcategoryId: job.industrySubcategoryId || "",
        });
      } catch (error) {
        console.error("Error fetching job data:", error);
        toast.error("Failed to load job data");
        navigate("/jobs");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  // Load legacy categories for primary dropdown (industry)
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


    function addSkill() {
    if (readOnly) return;
    const v = (skillInput || "").trim();
    if (!v) return;
    setForm((f) =>
      f.requiredSkills.includes(v)
        ? f
        : { ...f, requiredSkills: [...f.requiredSkills, v] }
    );
    setSkillInput("");
  }

  function removeSkill(idx) {
    if (readOnly) return;
    setForm((f) => ({
      ...f,
      requiredSkills: f.requiredSkills.filter((_, i) => i !== idx),
    }));
  }


  // Load full identities tree (who to share with)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        setAudTree(data.identities || []);
      } catch (error) {
        console.error("Error loading identities:", error);
      }
    })();
  }, []);

  const subsOfSelected = useMemo(() => {
    const cat = cats.find((c) => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [cats, form.categoryId]);

  // Build options for industry pickers
  const industryCategoryOptions = useMemo(
    () => industryTree.map((c) => ({ value: c.id, label: c.name || `Category ${c.id}` })),
    [industryTree]
  );
  const industrySubcategoryOptions = useMemo(() => {
    const c = industryTree.find((x) => x.id === selectedIndustry.categoryId);
    return (c?.subcategories || []).map((sc) => ({ value: sc.id, label: sc.name || `Subcategory ${sc.id}` }));
  }, [industryTree, selectedIndustry.categoryId]);

  const onChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "categoryId") next.subcategoryId = "";
      return next;
    });
    // Clear error for this field while typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Form validation function
  function validate() {
    const next = {
      title: "",
      companyId: "",
      country: "",
      city: "",
      description: "",
      requiredSkills: [],
      minSalary: "",
      maxSalary: "",
      currency: "",
      applicationDeadline: "",
      positions: "",
      contactEmail: "",
    };

    // Required field validations
    if (!form.title.trim()) {
      next.title = "Job title is required.";
    } else if (form.title.trim().length < 3) {
      next.title = "Job title must be at least 3 characters long.";
    }

    if (!form.companyId) {
      next.companyId = "Please select a company.";
    }

    if (!form.country) {
      next.country = "Country is required.";
    }

    if (!form.city) {
      next.city = "City is required.";
    }

    if (!form.description.trim()) {
      next.description = "Job description is required.";
    } else if (form.description.trim().length < 10) {
      next.description = "Job description must be at least 10 characters long.";
    }

    // Salary validations
    if (form.minSalary && isNaN(Number(form.minSalary))) {
      next.minSalary = "Minimum salary must be a valid number.";
    } else if (form.minSalary && Number(form.minSalary) < 0) {
      next.minSalary = "Minimum salary cannot be negative.";
    }

    if (form.maxSalary && isNaN(Number(form.maxSalary))) {
      next.maxSalary = "Maximum salary must be a valid number.";
    } else if (form.maxSalary && Number(form.maxSalary) < 0) {
      next.maxSalary = "Maximum salary cannot be negative.";
    }

    if (form.minSalary && form.maxSalary && Number(form.minSalary) > Number(form.maxSalary)) {
      next.maxSalary = "Maximum salary must be greater than minimum salary.";
    }

    // Positions validation
    if (form.positions && (isNaN(Number(form.positions)) || Number(form.positions) < 1)) {
      next.positions = "Number of positions must be at least 1.";
    }

    // Email validation
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      next.contactEmail = "Please enter a valid email address.";
    }

    // Application deadline validation
    if (form.applicationDeadline) {
      const deadline = new Date(form.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadline < today) {
        next.applicationDeadline = "Application deadline cannot be in the past.";
      }
    }

    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    // Validate form
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    // Additional validation for industry selection
    const identityIds = Array.from(audSel.identityIds);
    const categoryIds = Array.from(audSel.categoryIds);

    if (!form.categoryId && categoryIds.length === 0) {
      toast.error("Please select at least one industry category.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...form,
        positions: Number(form.positions || 1),
        requiredSkills: form.requiredSkills, // backend will normalize
        minSalary: form.minSalary === "" ? null : Number(form.minSalary),
        maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),
        subcategoryId: form.subcategoryId || null,

        // Audience selection arrays
        identityIds,
        categoryIds,
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),

        coverImageBase64,

        companyId: form.companyId || null,
        companyName: form.companyName || "",

        // Industry taxonomy
        industryCategoryId: selectedIndustry.categoryId || null,
        industrySubcategoryId: selectedIndustry.subcategoryId || null,
      };

      const promise = isEditMode
        ? client.put(`/jobs/${id}`, payload)
        : client.post("/jobs", payload);

      await toast.promise(
        promise,
        {
          loading: isEditMode ? "Updating job…" : "Creating job…",
          success: isEditMode ? "Job updated successfully!" : "Job created successfully!",
          error: (err) => err?.response?.data?.message || (isEditMode ? "Failed to update job" : "Failed to create job")
        },
        { id: "job-submit" }
      );

      if (!isEditMode) {
        navigate("/jobs");
      }

    } catch (error) {
      // Error already handled by toast.promise
      console.error("Error saving job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <FullPageLoader message="Loading job…" tip="Fetching..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header page={"jobs"} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 cursor-pointer">
          <a onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <I.back /> Back to Jobs
          </a>
        </div>

        {user?.id && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isEditMode ? "Edit Job Opportunity" : "Create Job Opportunity"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? "Update your job posting details below."
                : "Post a new job opening and choose exactly who should see it."}
            </p>
          </div>
        )}

        {/* Show read-only summary for non-owners (with images) */}
        {readOnly ? (
          <ReadOnlyJobView
            form={form}
            audSel={audSel}
            audTree={audTree}
            media={media}
            coverImageBase64={coverImageBase64}
          />
        ) : isLoading && !isEditMode ? (
          <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin text-3xl mb-2">⟳</div>
              <p>Loading job data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6">
            {/* ===== Basic Information ===== */}
            <div className="flex items-center gap-2"><I.briefcase /><h3 className="font-semibold">Basic Information</h3></div>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Job Title</Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>

              {/* --- Replaced old input+select with InlineCompanyPicker --- */}
              <div>
                <Label required>Company</Label>
                <InlineCompanyPicker
                  companies={companies}
                  value={form.companyId}
                  required
                  onChange={(picked) => {
                    setForm((f) => ({
                      ...f,
                      companyId: picked?.id || "",
                      companyName: picked?.name || "",
                    }));
                  }}
                />
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    id="make_company_name_private"
                    name="make_company_name_private"
                    checked={form.make_company_name_private}
                    onChange={(e) => setForm({ ...form, make_company_name_private: e.target.checked })}
                    className="h-4 w-4 accent-brand-600 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="make_company_name_private" className="ml-2 text-sm text-gray-700">
                    Make it private
                  </label>
                </div>
              </div>

              <div>
                <Label>Department</Label>
                <Input name="department" value={form.department} onChange={onChange} placeholder="e.g. Engineering, Marketing" />
              </div>

              <div className="hidden">
                <Label>Experience Level</Label>
                <Select name="experienceLevel" value={form.experienceLevel} onChange={onChange}>
                  <option value="">Select experience level</option>
                  <option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option>
                </Select>
              </div>
            </div>

            <hr className="my-5 border-gray-200" />

            {/* ===== Job Details ===== */}
            <div className="flex items-center gap-2"><I.doc /><h3 className="font-semibold">Job Details</h3></div>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
  <div>
    <Label required>Job Type</Label>
    <Select name="jobType" value={form.jobType} onChange={onChange} required>
      <option value="">Select job type</option>
      <option>Full-Time</option><option>Part-Time</option>
      <option>Temporary</option><option>Seasonal</option>
      <option>Internship</option><option>Apprenticeship</option>
      <option>Contract / Freelance</option>
    </Select>
  </div>

  <div>
    <Label>Work Location</Label>
    <Select name="workLocation" value={form.workLocation} onChange={onChange} required>
      <option value="">Select location</option>
      <option>On-Site</option><option>Remote</option>
      <option>Hybrid</option><option>Field-Based</option>
    </Select>
  </div>

  <div>
    <Label>Work Schedule</Label>
    <Select name="workSchedule" value={form.workSchedule} onChange={onChange} required>
      <option value="">Select schedule</option>
      <option>Day Shift</option><option>Night Shift</option>
      <option>Rotational Shifts</option><option>Flexible Hours</option>
      <option>Weekend Jobs</option><option>Overtime</option><option>On-Call</option>
    </Select>
  </div>

  <div>
    <Label>Career Level</Label>
    <Select name="careerLevel" value={form.careerLevel} onChange={onChange} required>
      <option value="">Select level</option>
      <option>Entry-Level</option><option>Mid-Level</option>
      <option>Senior-Level</option><option>Executive / C-Suite</option>
      <option>Volunteer / Community Work</option>
    </Select>
  </div>

  <div>
    <Label>Payment Type</Label>
    <Select name="paymentType" value={form.paymentType} onChange={onChange} required>
      <option value="">Select payment type</option>
      <option>Salaried Jobs</option><option>Hourly Jobs</option>
      <option>Commission-Based</option><option>Stipend-Based</option>
      <option>Equity / Profit-Sharing Roles</option>
    </Select>
  </div>
</div>

            
            <div className="mt-3 grid md:grid-cols-3 gap-4">
              
              

              <div className="md:col-span-3">
                <Label required>Job Description</Label>
                <Textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="Describe the role, responsibilities, and what you're looking for…" required/>
              </div>
              
              <div className="md:col-span-3">
                <Label>Required Skills & Qualifications</Label>
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
                    placeholder="Add skills (e.g., React, Node.js, Leadership)"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                  >
                    + Add
                  </button>
                </div>

                {form.requiredSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.requiredSkills.map((s, idx) => (
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
              </div>

            </div>






         
            <hr className="my-5 border-gray-200" />

            {/* ===== Industry Classification ===== */}
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
              <h3 className="font-semibold">Industry Classification</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Search and pick the industry category that best describes this job opportunity.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Industry Category</Label>
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
                <Label>Industry Subcategory</Label>
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

               <hr className="my-5 border-gray-200" />

            {/* ===== Share With (Audience selection) ===== */}
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
              <h3 className="font-semibold">Share with (identities & industries)</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Pick who should see this job. You can select multiple identities, industries and roles.
            </p>

            <AudienceTree
              tree={audTree}
              selected={audSel}
              onChange={(next) => setAudSel(next)}
            />


            <hr className="my-5 border-gray-200" />

            {/* ===== Location & Compensation ===== */}
            <div className="flex items-center gap-2"><I.pin /><h3 className="font-semibold">Location & Compensation</h3></div>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <Label required>Country</Label>
                <SearchableSelect
                  value={form.country}
                  onChange={(value) => setForm({ ...form, country: value, city: "" })}
                  options={countryOptions}
                  placeholder="Search and select country..."
                  required
                />
              </div>
              <div>
                <Label>City</Label>
                <SearchableSelect
                  key={form.country} // Force remount when country changes to reset internal state
                  value={form.city}
                  onChange={(value) => setForm({ ...form, city: value })}
                  options={cityOptions}
                  placeholder="Search and select city..."
                />
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-4">
              <div><Label>Min Salary</Label><Input name="minSalary" type="number" min="0" step="1" value={form.minSalary} onChange={onChange} placeholder="e.g. 2000"/></div>
              <div><Label>Max Salary</Label><Input name="maxSalary" type="number" min="0" step="1" value={form.maxSalary} onChange={onChange} placeholder="e.g. 4000"/></div>
              <div>
                <Label>Currency</Label>
                <Select name="currency" value={form.currency} onChange={onChange}>
                  {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="md:col-span-3"><Label>Benefits</Label><Input name="benefits" value={form.benefits} onChange={onChange} placeholder="Health insurance, remote work…"/></div>
            </div>

            <hr className="my-5 border-gray-200" />

            {/* ===== Application Details ===== */}
            <div className="flex items-center gap-2"><I.send /><h3 className="font-semibold">Application Details</h3></div>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <Label>Application Deadline</Label>
                <div className="relative">
                  <Input
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={onChange}
                    id="applicationDeadline"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    onClick={() => document.getElementById("applicationDeadline").showPicker()}
                    tabIndex="-1"
                    aria-label="Open date picker"
                    title="Open date picker"
                  >
                    <I.calendar />
                  </button>
                </div>
              </div>
              <div><Label>Number of Positions</Label><Input name="positions" type="number" min="1" value={form.positions} onChange={onChange}/></div>
            </div>

            <div className="mt-3"><Label>Application Instructions</Label><Textarea name="applicationInstructions" value={form.applicationInstructions} onChange={onChange} rows={3} placeholder="Provide specific instructions for applicants…"/></div>
            <div className="mt-3"><Label>Contact Email</Label><Input name="contactEmail" type="email" value={form.contactEmail} onChange={onChange} placeholder="hr@company.com"/></div>

            {/* ===== Cover Image (optional) ===== */}
            <hr className="my-5 border-gray-200" />
            <div className="flex items-center gap-2"><I.doc /><h3 className="font-semibold">Cover Image</h3></div>
            <p className="text-xs text-gray-600 mb-3">
              Optional hero image for the job (shown at the top of the posting).
            </p>
            <CoverImagePicker
              label="Upload a cover image (optional)"
              value={coverImageBase64}
              onChange={setCoverImageBase64}
            />
            <div className="flex justify-end gap-3 mt-8">
              {isLoading ? (
                <button type="button" className="px-4 py-2 rounded-xl bg-brand-600 text-white opacity-70 cursor-not-allowed" disabled>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  {isEditMode ? "Updating..." : "Creating..."}
                </button>
              ) : (
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:opacity-90">
                  {isEditMode ? "Update Job" : "Create Job"}
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
