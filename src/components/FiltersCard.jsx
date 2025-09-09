import React, { useRef, useEffect, useState, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import I from "../lib/icons.jsx";

const libraries = ["places"];


export default function FiltersCard({
  from,
  query,
  setQuery,
  country,
  setCountry,
  city,
  setCity,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  setRole,
  setGoalId,
  categories = [],
  goals = [],
  goalId,
  role,

  /* Products */
  price,
  setPrice,

  /* Services */
  serviceType,
  setServiceType,
  priceType,
  setPriceType,
  deliveryTime,
  setDeliveryTime,

  /* Tourism */
  postType,
  setPostType,
  season,
  setSeason,
  budgetRange,
  setBudgetRange,

  /* Funding */
  fundingGoal,
  setFundingGoal,
  amountRaised,
  setAmountRaised,
  currency,
  setCurrency,
  deadline,
  setDeadline,

  /* Shared (Jobs, Services, People) */
  experienceLevel,
  setExperienceLevel,
  locationType,
  setLocationType,

  /* Jobs */
  jobType,
  setJobType,
  workMode,
  setWorkMode,

  /* Events */
  eventType,
  setEventType,
  date,
  setDate,
  registrationType,
  setRegistrationType,
}) {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAF9zZKiLS2Ep98eFCX-jA871QAJxG5des", // Replace with your Google API key
    libraries,
  });

  // Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["(cities)"] }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const selectedCity = place.address_components.find((c) =>
        c.types.includes("locality")
      )?.long_name;

      const selectedCountry = place.address_components.find((c) =>
        c.types.includes("country")
      )?.long_name;

      setCity(selectedCity);
      setCountry(selectedCountry);
      setInputValue(
        `${selectedCity || ""}${selectedCountry ? ", " + selectedCountry : ""}`
      );
    });
  }, [isLoaded, setCity, setCountry]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const parts = value.split(",").map((p) => p.trim());
    setCity(parts[0] || undefined);
    setCountry(parts[1] || parts[0] || undefined);
  };

  const currentCategory = categories.find(
    (c) => String(c.id) === String(categoryId)
  );
  const visibleSubs = currentCategory?.subcategories || [];

  const roles = [
    "Entrepreneur",
    "Seller",
    "Buyer",
    "Job Seeker",
    "Professional",
    "Partnership",
    "Investor",
    "Event Organizer",
    "Government Official",
    "Traveler",
    "NGO",
    "Support Role",
    "Freelancer",
    "Student",
  ];

  const isService = from === "service" || from === "services";
  const isTourism = from === "tourism";
  const isFunding = from === "funding";
  const isPeople  = from === "people";

  const hasActive = useMemo(
    () =>
      !!(
        (query && query.trim()) ||
        country ||
        city ||
        categoryId ||
        subcategoryId ||
        role ||
        goalId ||
        // products
        (from === "products" && price !== undefined && price !== "" && price !== null) ||
        // jobs
        (from === "jobs" && (experienceLevel || jobType || workMode)) ||
        // services
        (isService &&
          (serviceType || priceType || deliveryTime || experienceLevel || locationType)) ||
        // tourism
        (isTourism && (postType || season || budgetRange)) ||
        // funding
        (isFunding && (fundingGoal || amountRaised || currency || deadline)) ||
        // people
        (isPeople && experienceLevel) ||
        // events
        (from === "events" && (eventType || date || registrationType))
      ),
    [
      query,
      country,
      city,
      categoryId,
      subcategoryId,
      role,
      goalId,
      price,
      from,
      // jobs
      jobType,
      workMode,
      // shared
      experienceLevel,
      locationType,
      // services
      isService,
      serviceType,
      priceType,
      deliveryTime,
      // tourism
      isTourism,
      postType,
      season,
      budgetRange,
      // funding
      isFunding,
      fundingGoal,
      amountRaised,
      currency,
      deadline,
      // people
      isPeople,
      // events
      eventType,
      date,
      registrationType,
    ]
  );

  const handleReset = () => {
    setQuery("");
    setCountry(undefined);
    setCity(undefined);
    setCategoryId(undefined);
    setSubcategoryId(undefined);
    setRole?.(undefined);
    setGoalId?.(undefined);
    setInputValue("");

    // Products
    setPrice?.("");

    // Services
    setServiceType?.("");
    setPriceType?.("");
    setDeliveryTime?.("");
    // Shared reset (also used by People & Jobs)
    setExperienceLevel?.("");
    setLocationType?.("");

    // Jobs
    setJobType?.("");
    setWorkMode?.("");

    // Tourism
    setPostType?.("");
    setSeason?.("");
    setBudgetRange?.("");

    // Funding
    setFundingGoal?.("");
    setAmountRaised?.("");
    setCurrency?.("");
    setDeadline?.("");

    // Events
    setEventType?.("");
    setDate?.("");
    setRegistrationType?.("");
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">Filters</h3>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActive}
          className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition
            ${
              hasActive
                ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                : "border-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          aria-disabled={!hasActive}
          title="Reset all filters"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div className="mt-3">
        <label className="text-xs text-gray-500">Search</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input
            className="w-full text-sm outline-none"
            placeholder="Title, keywords…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* City / Country */}
      <div className="mt-3">
        <label className="text-xs text-gray-500">City / Country</label>
        {isLoaded ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type city or country"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        ) : (
          <input
            disabled
            placeholder="Loading..."
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* Category */}
      <div className="mt-3">
        <label className="text-xs text-gray-500">Category</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={categoryId || ""}
          onChange={(e) => {
            const val = e.target.value || "";
            setCategoryId(val || undefined);
            setSubcategoryId(undefined);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      <div className="mt-3">
        <label className="text-xs text-gray-500">Subcategory</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={subcategoryId || ""}
          onChange={(e) => setSubcategoryId(e.target.value || undefined)}
          disabled={!categoryId}
        >
          <option value="">All subcategories</option>
          {visibleSubs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products */}
      {from === "products" && (
        <div className="mt-3">
          <label className="text-xs text-gray-500">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price ?? ""}
            onChange={(e) => setPrice?.(e.target.value)}
            placeholder="0.00"
            className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      )}

      {/* Jobs */}
      {from === "jobs" && (
        <>
          <div className="mt-3">
            <label className="text-xs text-gray-500">Experience Level</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={experienceLevel || ""}
              onChange={(e) => setExperienceLevel?.(e.target.value)}
            >
              <option value="">All levels</option>
              <option>Junior</option>
              <option>Mid-level</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Job Type</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={jobType || ""}
              onChange={(e) => setJobType?.(e.target.value)}
            >
              <option value="">All job types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Temporary</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Work Mode</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={workMode || ""}
              onChange={(e) => setWorkMode?.(e.target.value)}
            >
              <option value="">All modes</option>
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
        </>
      )}

      {/* Services (all full-width selects/inputs, no grids) */}
      {isService && (
        <>
          <div className="mt-4">
            <label className="text-xs text-gray-500">Service Type</label>
            <select
              value={serviceType || ""}
              onChange={(e) => setServiceType?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Consulting</option>
              <option>Freelance Work</option>
              <option>Product/Service</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Price Type</label>
            <select
              value={priceType || ""}
              onChange={(e) => setPriceType?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Fixed Price</option>
              <option>Hourly</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Typical Delivery</label>
            <select
              value={deliveryTime || ""}
              onChange={(e) => setDeliveryTime?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>1 Day</option>
              <option>3 Days</option>
              <option>1 Week</option>
              <option>2 Weeks</option>
              <option>1 Month</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Location Type</label>
            <select
              value={locationType || ""}
              onChange={(e) => setLocationType?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Remote</option>
              <option>On-site</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Experience Level</label>
            <select
              value={experienceLevel || ""}
              onChange={(e) => setExperienceLevel?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Entry Level</option>
              <option>Intermediate</option>
              <option>Expert</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>
        </>
      )}

      {/* Tourism (full-width selects only) */}
      {isTourism && (
        <>
          <div className="mt-4">
            <label className="text-xs text-gray-500">Post Type</label>
            <select
              value={postType || ""}
              onChange={(e) => setPostType?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Destination</option>
              <option>Experience</option>
              <option>Culture</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Best Season to Visit</label>
            <select
              value={season || ""}
              onChange={(e) => setSeason?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>Summer</option>
              <option>Winter</option>
              <option>All Year</option>
              <option>Rainy Season</option>
              <option>Dry Season</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Budget Range</label>
            <select
              value={budgetRange || ""}
              onChange={(e) => setBudgetRange?.(e.target.value)}
              className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Any</option>
              <option>$100 - $500</option>
              <option>$500 - $2000</option>
              <option>$2000+</option>
            </select>
            <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
              <I.chevron />
            </span>
          </div>
        </>
      )}

      {/* Funding (already inputs/selects full-width) */}
      {isFunding && (
        <>
          <div className="mt-4">
            <label className="text-xs text-gray-500">Funding Goal</label>
            <input
              type="number"
              min="0"
              value={fundingGoal ?? ""}
              onChange={(e) => setFundingGoal?.(e.target.value)}
              placeholder="e.g., 50000"
              className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Amount Raised</label>
            <input
              type="number"
              min="0"
              value={amountRaised ?? ""}
              onChange={(e) => setAmountRaised?.(e.target.value)}
              placeholder="e.g., 25000"
              className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

        

          <div className="mt-3">
            <label className="text-xs text-gray-500">Deadline</label>
            <input
              type="date"
              value={deadline || ""}
              onChange={(e) => setDeadline?.(e.target.value)}
              className="mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </>
      )}

      {/* People */}
      {isPeople && (
        <div className="mt-4">
          <label className="text-xs text-gray-500">Experience Level</label>
          <select
            value={experienceLevel || ""}
            onChange={(e) => setExperienceLevel?.(e.target.value)}
            className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Any</option>
            <option>Junior</option>
            <option>Mid</option>
            <option>Senior</option>
            <option>Lead</option>
            <option>Director</option>
            <option>C-level</option>
          </select>
          <span className="pointer-events-none absolute right-2 bottom-3 hidden sm:block">
            <I.chevron />
          </span>
        </div>
      )}

      {/* Events */}
      {from === "events" && (
        <>
          <div className="mt-3">
            <label className="text-xs text-gray-500">Event Type</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={eventType || ""}
              onChange={(e) => setEventType?.(e.target.value)}
            >
              <option value="">All event types</option>
              <option>Workshop</option>
              <option>Conference</option>
              <option>Networking</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              value={date || ""}
              onChange={(e) => setDate?.(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500">Registration Type</label>
            <select
              value={registrationType}
              onChange={(e) => setRegistrationType?.(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value={""}>All</option>
              <option>Free</option>
              <option>Paid</option>
            </select>
          </div>
        </>
      )}

      {/* Hidden (unchanged) */}
      <div className="mt-3 hidden">
        <label className="text-xs text-gray-500">Goal</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={goalId || ""}
          onChange={(e) => setGoalId(e.target.value || undefined)}
        >
          <option value="">All goals</option>
          {goals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 hidden">
        <label className="text-xs text-gray-500">Role</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={role || ""}
          onChange={(e) => setRole(e.target.value || undefined)}
        >
          <option value="">All roles</option>
          {roles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
