// src/pages/CreateOfferingPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
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
export default function CreateOfferingPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // optional edit mode
  const isEditMode = Boolean(id);
  const { user } = useAuth();

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
    offeringType: "Service", // Service | Product | Partnership | Investment | Other
    description: "",
    budget: "",
    timeline: "Flexible",
    location: "",
    requirements: [], // array of strings
  });

  const [requirementInput, setRequirementInput] = useState("");

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

  // Load general categories
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/general-categories/tree?type=offering");
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, []);

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

  function addRequirement() {
    const v = requirementInput.trim();
    if (!v) return;
    setForm((f) =>
      f.requirements.includes(v) ? f : { ...f, requirements: [...f.requirements, v] }
    );
    setRequirementInput("");
  }

  function removeRequirement(idx) {
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, i) => i !== idx) }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    // For now, just show a success message since backend isn't implemented yet
    toast.success("Offering created successfully! (Frontend only - backend coming soon)");
    navigate("/offerings"); // This route doesn't exist yet, but that's fine
  }

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header page={"offerings"} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/offerings")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
          type="button"
        >
          ← Back to offerings
        </button>

        <h1 className="text-2xl font-bold mt-3">
          {isEditMode ? "Edit Offering" : "Create Offering"}
        </h1>
        <p className="text-sm text-gray-600">
          Share what you're looking for and connect with people who can help.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8"
        >
          {/* Offering Type */}
          <section>
            <h2 className="font-semibold text-brand-600">What are you looking for?</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Service", desc: "Professional services" },
                { label: "Product", desc: "Products or goods" },
                { label: "Partnership", desc: "Business partnerships" },
                { label: "Investment", desc: "Investment opportunities" },
                { label: "Other", desc: "Something else" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.label}
                  onClick={() => setField("offeringType", t.label)}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    form.offeringType === t.label
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
                  placeholder="e.g., Looking for a web developer for my startup"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
              </div>
              <div>
                <Label required>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe what you're looking for in detail. What do you need help with?"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>
            </div>
          </section>

          {/* Budget & Timeline */}
          <section>
            <h2 className="font-semibold text-brand-600">Budget & Timeline</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Budget Range</Label>
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => setField("budget", e.target.value)}
                  placeholder="e.g., $5,000 - $10,000"
                  className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="relative">
                <Label>Timeline</Label>
                <select
                  value={form.timeline}
                  onChange={(e) => setField("timeline", e.target.value)}
                  className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option>ASAP</option>
                  <option>1-3 months</option>
                  <option>3-6 months</option>
                  <option>6+ months</option>
                  <option>Flexible</option>
                </select>
                <span className="pointer-events-none absolute right-2 bottom-3">
                  <I.chevron />
                </span>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="font-semibold text-brand-600">Requirements & Skills Needed</h2>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                placeholder="Add specific requirements or skills needed"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                aria-label="Add requirement"
              >
                <I.plus /> Add
              </button>
            </div>

            {form.requirements.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.requirements.map((req, idx) => (
                  <span
                    key={`${req}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                  >
                    {req}
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => removeRequirement(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Classification */}
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

          {/* Industry Classification */}
          <section>
            <h2 className="font-semibold text-brand-600">Industry Classification</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select the industry category that best describes your offering.
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
              Select who should see this offering. Choose multiple identities, categories, subcategories, and sub-subs.
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
              onClick={() => navigate("/offerings")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primary}>
              {isEditMode ? "Update Offering" : "Publish Offering"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}