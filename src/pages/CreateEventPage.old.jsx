import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import FullPageLoader from "../components/ui/FullPageLoader";
import CoverImagePicker from "../components/CoverImagePicker";
import Header from "../components/Header";
import AudienceTree from "../components/AudienceTree";
import { toast } from "../lib/toast";

const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  primaryGhost:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-brand-600 text-brand-600 bg-white hover:bg-brand-50",
};

const I = {
  chevron: () => (
    <svg
      className="h-4 w-4 text-gray-500"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get event ID from URL if editing
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Audience tree data
  const [audTree, setAudTree] = useState([]);
  
  // Audience selections (using Sets for easy toggling)
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // form state
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

  const [meta, setMeta] = useState({
    categories: [],
    currencies: [],
    timezones: [],
  });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [coverImageBase64, setCoverImageBase64] = useState(null);

  // Check if we're in edit mode and fetch event data if we are
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      setLoadingMeta(true);
      
      const fetchEventData = async () => {
        try {
          const { data } = await client.get(`/events/${id}`);
          
          // Update form with event data
          setForm({
            eventType: data.eventType || "Workshop",
            title: data.title || "",
            description: data.description || "",
            categoryId: data.categoryId || "",
            subcategoryId: data.subcategoryId || "",
            date: data.startAt ? new Date(data.startAt).toISOString().split('T')[0] : "",
            startTime: data.startAt ? new Date(data.startAt).toISOString().split('T')[1].substring(0, 5) : "",
            endTime: data.endAt ? new Date(data.endAt).toISOString().split('T')[1].substring(0, 5) : "",
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
            registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString().split('T')[0] : "",
            coverImageUrl: data.coverImageUrl || "",
          });
          
          if (data.coverImageBase64) {
            setCoverImageBase64(data.coverImageBase64);
          }
          
          // Set audience selections
          if (data.audienceIdentities?.length || data.audienceCategories?.length ||
              data.audienceSubcategories?.length || data.audienceSubsubs?.length) {
            setAudSel({
              identityIds: new Set(data.audienceIdentities?.map(i => i.id) || []),
              categoryIds: new Set(data.audienceCategories?.map(c => c.id) || []),
              subcategoryIds: new Set(data.audienceSubcategories?.map(s => s.id) || []),
              subsubCategoryIds: new Set(data.audienceSubsubs?.map(s => s.id) || []),
            });
          }
        } catch (error) {
          console.error("Error fetching event data:", error);
          alert("Failed to load event data");
          navigate("/events");
        }
      };
      
      fetchEventData();
    }
  }, [id, navigate]);

  // Fetch categories/subcategories/currencies/timezones
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

  const subcategoryOptions = useMemo(() => {
    if (!form.categoryId) return [];
    const cat = meta.categories.find((c) => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [form.categoryId, meta.categories]);

  function setField(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };
      // reset invalid subcategory if category changes
      if (name === "categoryId") next.subcategoryId = "";
      // clear price if switching back to Free
      if (name === "registrationType" && value === "Free") {
        next.price = "";
      }
      // Location toggles
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
    // basic FE checks
    if (!form.title || !form.description) {
      alert("Title and description are required");
      return;
    }
    if (!form.date || !form.startTime) {
      alert("Date and start time are required");
      return;
    }
    if (form.registrationType === "Paid" && (!form.price || !form.currency)) {
      alert("Price and currency are required for paid events");
      return;
    }

    setSaving(true);
    try {
      // Convert Set → Array for audience selections
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      const payload = {
        ...form,
        coverImageBase64,
        // Include audience selections
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds
      };
      
      // Clean optional fields
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

      let data;
      if (isEditMode) {
        // Update existing event
        const response = await client.put(`/events/${id}`, payload);
        data = response.data;
         toast.success('Event updated successfully!');
      } else {
        // Create new event
        const response = await client.post("/events", payload);
        data = response.data;
        toast.success('Event created successfully!');
        navigate(`/events`);
      }


      // success
      
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  }

  if (loadingMeta) {
    return (
      <FullPageLoader
        message="Loading event form…"
        tip="Fetching categories and preferences"
      />
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

        <h1 className="text-2xl font-bold mt-3">{isEditMode ? "Edit Event" : "Create Event"}</h1>
        <p className="text-sm text-gray-600">
          {isEditMode ? "Update your event details" : "Share your event with the community"}
        </p>

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
              {/* Category (Industry) */}
           

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

          {/* ===== Share With (Audience selection) ===== */}
          <section>
            <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select who should see this event. You can choose multiple identities, categories, subcategories, and sub-subcategories.
            </p>
            <AudienceTree
              tree={audTree}
              selected={audSel}
              onChange={(next) => setAudSel(next)}
            />
          </section>

          {/* Cover image (optional) */}
          <section>
            <h2 className="font-semibold text-brand-600 mt-8">Cover Image</h2>
            <CoverImagePicker
              label="Cover Image (optional)"
              value={coverImageBase64}
              onChange={setCoverImageBase64}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={styles.primaryGhost}
              onClick={() => navigate("/events")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Event" : "Publish Event"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
