import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
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

/* ---------- Read-only view for non-owners ---------- */
function ReadOnlyEventView({ form, coverImageBase64, meta, audSel, audTree }) {
  const tz = form.timezone || "Africa/Lagos";
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const coverSrc = coverImageBase64 || form.coverImageUrl || "";

  return (
    <div className="mt-6 rounded-2xl bg-white border p-0 shadow-sm overflow-hidden">
      {coverSrc ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="Event cover" className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4 {styles.badge} bg-white/90 border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
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
                Deadline:{" "}
                {form.registrationDeadline ? fmtDate(form.registrationDeadline, tz) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Target Audience</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((x) => (
              <span key={`i-${x}`} className={styles.chip}>{x}</span>
            ))}
            {categories.map((x) => (
              <span key={`c-${x}`} className={styles.chip}>{x}</span>
            ))}
            {subcategories.map((x) => (
              <span key={`s-${x}`} className={styles.chip}>{x}</span>
            ))}
            {subsubs.map((x) => (
              <span key={`ss-${x}`} className={styles.chip}>{x}</span>
            ))}
            {identities.length + categories.length + subcategories.length + subsubs.length === 0 && (
              <span className="text-sm text-gray-500">Everyone</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {/* You can wire this to a “message organizer” flow later */}
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

export default function CreateEventPage() {
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
    country: "",
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

  const readOnly = isEditMode && organizerUserId && user?.id !== organizerUserId;

  useEffect(() => {
    if (!id) return;
    setIsEditMode(true);
    setLoadingMeta(true);
    (async () => {
      try {
        const { data } = await client.get(`/events/${id}`);
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
        });

        if (data.coverImageBase64) setCoverImageBase64(data.coverImageBase64);

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
      } catch (e) {
        console.error(e);
        alert("Failed to load event data");
        navigate("/events");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/events/meta");
        setMeta(data);
        setForm((f) => ({
          ...f,
          country: f.country || "Nigeria",
          timezone: f.timezone || data.timezones[0] || "Africa/Lagos",
        }));
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || "Failed to load form metadata");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

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
      if (name === "locationType") {
        if (value === "Virtual") {
          next.address = "";
          next.city = "";
          next.country = "";
        } else {
          next.onlineUrl = "";
        }
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;

    if (!form.title || !form.description) return alert("Title and description are required");
    if (!form.date || !form.startTime) return alert("Date and start time are required");
    if (form.registrationType === "Paid" && (!form.price || !form.currency))
      return alert("Price and currency are required for paid events");

    setSaving(true);
    try {
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      const payload = {
        ...form,
        coverImageBase64,
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,
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
      }

      if (isEditMode) {
        await client.put(`/events/${id}`, payload);
        toast.success("Event updated successfully!");
      } else {
        await client.post("/events", payload);
        toast.success("Event created successfully!");
        navigate(`/events`);
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  }

  if (loadingMeta) {
    return (
      <FullPageLoader message="Loading event form…" tip="Fetching categories and preferences" />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header page={"events"} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
        >
          ← Go to Events
        </button>

        {user?.id && <>
        <h1 className="text-2xl font-bold mt-3">{isEditMode ? "Edit Event" : "Create Event"}</h1>
        <p className="text-sm text-gray-600">
          {isEditMode ? "Update your event details" : "Share your event with the community"}
        </p>
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
            {/* Event Type */}
            <section>
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
            </section>

            {/* Basic Info */}
            <section>
              <h2 className="font-semibold text-brand-600">Basic Information</h2>
              <div className="mt-3 grid gap-4">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Enter event title"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe your event..."
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                  rows={4}
                  required
                />
              </div>
            </section>

            {/* Date & Time */}
            <section>
              <h2 className="font-semibold text-brand-600">Date & Time</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="relative mt-3">
                <select
                  value={form.timezone}
                  onChange={(e) => setField("timezone", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {meta.timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
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
                    <div className="relative">
                      <select
                        value={form.country}
                        onChange={(e) => setField("country", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                        <I.chevron />
                      </span>
                    </div>

                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="City"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
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
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <select
                    value={form.registrationType}
                    onChange={(e) => setField("registrationType", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option>Free</option>
                    <option>Paid</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <I.chevron />
                  </span>
                </div>

                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value)}
                  placeholder="Seats / capacity (optional)"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              {form.registrationType === "Paid" && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="Price"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    required
                  />
                  <div className="relative">
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
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <I.chevron />
                    </span>
                  </div>
                </div>
              )}

              <input
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => setField("registrationDeadline", e.target.value)}
                className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </section>

            {/* Audience */}
            <section>
              <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select who should see this event. You can choose multiple identities, categories, subcategories, and sub-subcategories.
              </p>
              <AudienceTree tree={audTree} selected={audSel} onChange={(next) => setAudSel(next)} />
            </section>

            {/* Cover */}
            <section>
              <h2 className="font-semibold text-brand-600 mt-8">Cover Image</h2>
              <CoverImagePicker label="Cover Image (optional)" value={coverImageBase64} onChange={setCoverImageBase64} />
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button type="button" className={styles.primaryGhost} onClick={() => navigate("/events")}>
                Cancel
              </button>
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
