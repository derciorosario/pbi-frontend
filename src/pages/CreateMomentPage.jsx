// src/pages/CreateMomentPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import COUNTRIES from "../constants/countries"; // optional: if you want to suggest locations, else unused
import client from "../api/client";
import { toast } from "../lib/toast";
import Header from "../components/Header";
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
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
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
export default function CreateMomentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState(null);

  // Form (Moment fields)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Achievement", // ENUM: Achievement | Milestone | Learning | Challenge | Opportunity
    date: "", // yyyy-mm-dd
    location: "",
    tagsInput: "",
    relatedEntityType: "", // job | event | product | service | tourism | funding
    relatedEntityId: "",
  });

  // Images ONLY: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

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

  /* -------- Load taxonomy trees -------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/general-categories/tree"); // can add ?type=moment if you filter server-side
        setGeneralTree(data.generalCategories || []);
      } catch (err) {
        console.error("Failed to load general categories", err);
      }
    })();
  }, []);

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
        const { data } = await client.get(`/moments/${id}`);

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
          title: data.title || "",
          description: data.description || "",
          type: data.type || "Achievement",
          date: data.date || "",
          location: data.location || "",
          tagsInput: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tagsInput || ""),
          relatedEntityType: data.relatedEntityType || "",
          relatedEntityId: data.relatedEntityId || "",
        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images.map((x, i) => ({
              title: x.title || x.name || `Image ${i + 1}`,
              base64url: x.base64url || x,
            }))
          );
        } else {
          setImages([]);
        }

        setSelectedGeneral({
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          subsubCategoryId: data.subsubCategoryId || "",
        });

        setSelectedIndustry({
          categoryId: data.industryCategoryId || "",
          subcategoryId: data.industrySubcategoryId || "",
          subsubCategoryId: data.industrySubsubCategoryId || "",
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load moment");
        navigate("/moments");
      }
    })();
  }, [isEditMode, id, navigate]);

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  /* -------- helpers -------- */
  function setField(name, value) {
    if (readOnly) return;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function parsedTags() {
    return (form.tagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    return null;
  }

  async function handleFilesChosen(files) {
    if (readOnly) return;
    const arr = Array.from(files || []);
    if (!arr.length) return;

    const onlyImages = arr.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== arr.length) {
      toast.error("Only image files are allowed.");
    }

    const sizeErrors = onlyImages.filter((f) => f.size > 5 * 1024 * 1024);
    if (sizeErrors.length) {
      toast.error("Each image must be ≤ 5MB.");
    }
    const accepted = onlyImages.filter((f) => f.size <= 5 * 1024 * 1024);

    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          const nameBase = file.name.replace(/\.[^/.]+$/, "");
          return { title: nameBase, base64url };
        })
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some images could not be read.");
    }
  }

  function updateImageTitle(idx, title) {
    if (readOnly) return;
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, title } : x)));
  }

  function removeImage(idx) {
    if (readOnly) return;
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  /* -------- Submit -------- */
  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;

    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        date: form.date || null,
        location: form.location || undefined,
        tags: parsedTags(),
        images, // [{ title, base64url }]

        // General taxonomy
        categoryId: selectedGeneral.categoryId || null,
        subcategoryId: selectedGeneral.subcategoryId || null,
        subsubCategoryId: selectedGeneral.subsubCategoryId || null,

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
        toast.success("Moment updated!");
      } else {
        await client.post("/moments", payload);
        toast.success("Moment published!");
      }
      navigate("/moments");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save moment");
    } finally {
      setSaving(false);
    }
  }

  if (loading && id) {
    return <FullPageLoader message="Loading moment…" tip="Fetching..." />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <Header page={"moments"} />

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/moments")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
          type="button"
        >
          ← Back
        </button>

        {!isEditMode && (
          <>
            <h1 className="text-2xl font-bold mt-3">
              {isEditMode ? "Edit Moment" : "Create Moment"}
            </h1>
            <p className="text-sm text-gray-600">
              Share a moment — an achievement, milestone, or learning — and classify it for better discovery.
            </p>
          </>
        )}

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-8"
        >
          {/* Type */}
          <section>
            <h2 className="font-semibold">Moment Type</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {["Achievement", "Milestone", "Learning", "Challenge", "Opportunity"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setField("type", label)}
                  className={`border rounded-xl p-3 text-left transition-colors ${
                    form.type === label
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-brand-600"
                  }`}
                >
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section>
            <h2 className="font-semibold">Title *</h2>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Give your moment a clear, strong title"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </section>

          {/* Date & Location */}
          <section>
            <h2 className="font-semibold">When & Where</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <input
                type="date"
                value={form.date || ""}
                onChange={(e) => setField("date", e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Location (e.g., Lagos, Nigeria)"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </section>

          {/* Photos */}
          <section>
            <h2 className="font-semibold">Photos</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2">Upload Images</p>
              <p className="text-xs">Drag and drop your photos here, or click to browse (max 5MB each)</p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesChosen(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Choose Files
              </button>

              {images.length > 0 && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
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
          </section>

          {/* Description */}
          <section>
            <h2 className="font-semibold">Description *</h2>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe what happened, what you learned, challenges faced, outcomes…"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              rows={5}
              required
            />
          </section>

          {/* Tags */}
          <section>
            <h2 className="font-semibold">Tags</h2>
            <input
              type="text"
              value={form.tagsInput}
              onChange={(e) => setField("tagsInput", e.target.value)}
              placeholder="e.g., AI, grants, partnership, networking"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
          </section>

          {/* Classification (General) */}
          <section>
            <h2 className="font-semibold text-brand-600">General Classification</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
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
              <div>
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

          {/* Industry Classification */}
          <section>
            <h2 className="font-semibold text-brand-600">Industry Classification</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
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
              <div>
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

          {/* Related Entity (Optional) */}
          <section>
            <h2 className="font-semibold">Link to Related Entity (optional)</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <select
                value={form.relatedEntityType}
                onChange={(e) => setField("relatedEntityType", e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <option value="">None</option>
                <option value="job">Job</option>
                <option value="event">Event</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="tourism">Tourism</option>
                <option value="funding">Funding</option>
              </select>
              <input
                type="text"
                value={form.relatedEntityId}
                onChange={(e) => setField("relatedEntityId", e.target.value)}
                placeholder="Related entity ID (UUID)"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                disabled={!form.relatedEntityType}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate("/moments")} className={styles.ghost}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryWide} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Moment" : "Publish Moment"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
