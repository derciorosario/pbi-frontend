import React, { useRef, useEffect, useState, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import I from "../lib/icons.jsx";
import AudienceTree from "./AudienceTree.jsx";
import MultiSelect from "./MultiSelect.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import ExperienceLevelSelector from "./ExperienceLevelSelector.jsx";
import COUNTRIES from "../constants/countries";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const libraries = ["places"];

export default function FiltersCard({
  selectedFilters=[],
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

  /* Audience Tree */
  audienceTree = [],
  audienceSelections = {
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  },
  setAudienceSelections = () => {},


}) {

  const data=useData()
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const {user}=useAuth()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAF9zZKiLS2Ep98eFCX-jA871QAJxG5des",
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
  const isPeople = from === "people";

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
        (from === "products" &&
          price !== undefined &&
          price !== "" &&
          price !== null) ||
        // jobs
        (from === "jobs" && (experienceLevel || jobType || workMode)) ||
        // services
        (isService &&
          (serviceType ||
            priceType ||
            deliveryTime ||
            experienceLevel ||
            locationType)) ||
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

    // Audience Tree
    setAudienceSelections?.({
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    });
  };


  useEffect(() => {


    handleReset()

    // Find the element to scroll to
    const targetElement = selectedFilters.length ? document.querySelector('#secundary-filters') : document.querySelector('#filters');
    
    if (targetElement && user) {
      // Find the parent scrollable container - this should be replaced with the actual container ID or class
      // For example: const scrollableContainer = document.querySelector('.scrollable-container');
      // If you don't know the container, you can try to find a parent with overflow
      const scrollableContainer = targetElement.closest('.scrollable-container') ||
                                  targetElement.closest('[style*="overflow"]') ||
                                  targetElement.parentElement;
      
      if (scrollableContainer) {
        // Get the position of the target element relative to the scrollable container
        const targetPosition = targetElement.offsetTop // - scrollableContainer.offsetTop;
        
        // Scroll the container to the target position
        scrollableContainer.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }

    console.log(1)
  }, [data.updateData]);

  return (
    <div id="filters" className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
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
      <div className="mt-3 hidden">
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

      <div>
        <ExperienceLevelSelector
            value={country}
            onChange={setCountry}
            options={COUNTRIES}
            label="Country"
            placeholder="All"
       />
      </div>


       <div className="mt-3">
        <label className="text-xs text-gray-500">City</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input
            className="w-full text-sm outline-none"
            placeholder="Type name of the city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>
      
      <div id="secundary-filters"></div>

      {/* Category */}
      <div className="mt-3 hidden">{/**hide for now */}
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
      <div className="mt-3 hidden">{/*** Hide for now */}
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
         
           <MultiSelect
            hide={!selectedFilters.includes('Experience Level')}
            value={experienceLevel || ""}
            onChange={setExperienceLevel}
            options={["Junior", "Mid-level", "Senior", "Lead"]}
            label="Experience Level"
            placeholder="Any"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Job Type')}
            value={jobType || ""}
            onChange={setJobType}
            options={["Full-time", "Part-time", "Contract", "Internship", "Temporary"]}
            label="Job Type"
          />

          <MultiSelect
           hide={!selectedFilters.includes('Work Mode')}
            value={workMode || ""}
            onChange={setWorkMode}
            options={["On-site", "Remote", "Hybrid"]}
            label="Work Mode"
          />
        </>
      )}

      {/* Services (all full-width selects/inputs, no grids) */}
      {isService && (
        <>
          <MultiSelect
            hide={!selectedFilters.includes('Service Type')}
            value={serviceType || ""}
            onChange={setServiceType}
            options={["Consulting", "Freelance Work", "Product/Service"]}
            label="Service Type"
          />

          <MultiSelect
           hide={!selectedFilters.includes('Price Type')}
            value={priceType || ""}
            onChange={setPriceType}
            options={["Fixed Price", "Hourly"]}
            label="Price Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Typical Delivery')}
            value={deliveryTime || ""}
            onChange={setDeliveryTime}
            options={["1 Day", "3 Days", "1 Week", "2 Weeks", "1 Month"]}
            label="Typical Delivery"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Location Type')}
            value={locationType || ""}
            onChange={setLocationType}
            options={["Remote", "On-site"]}
            label="Location Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Experience Level')}
            value={experienceLevel || ""}
            onChange={setExperienceLevel}
            options={["Entry Level", "Intermediate", "Expert"]}
            label="Experience Level"
            placeholder="Any"
          />
        </>
      )}

      {/* Tourism (full-width selects only) */}
      {isTourism && (
        <>
          <MultiSelect 
            hide={!selectedFilters.includes('Post Type')}
            value={postType || ""}
            onChange={setPostType}
            options={["Destination", "Experience", "Culture"]}
            label="Post Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Best Season to Visit')}
            value={season || ""}
            onChange={setSeason}
            options={["Summer", "Winter", "All Year", "Rainy Season", "Dry Season"]}
            label="Best Season to Visit"
          />

          <MultiSelect
            hide={!selectedFilters.includes('Budget Range')}
            value={budgetRange || ""}
            onChange={setBudgetRange}
            options={["$100 - $500", "$500 - $2000", "$2000+"]}
            label="Budget Range"
          />
        </>
      )}

      {/* Funding */}
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
        <>
        
         {/**<MultiSelect
            hide={!selectedFilters.includes('Experience Level')}
            value={experienceLevel || ""}
            _hide={true}
            onChange={setExperienceLevel}
            options={[
              "Junior",
              "Mid",
              "Senior",
              "Lead",
              "Director",
              "C-level",
            ]}
            label="Experience Level"
            placeholder="Any"
          />  */}

        </>
      )}

      

      {/* Events */}
      {from === "events" && (
        <>
          <MultiSelect
            hide={!selectedFilters.includes('Event Type')}
            value={eventType || ""}
            onChange={setEventType}
            options={["Workshop", "Conference", "Networking"]}
            label="Event Type"
          />

          <div className="mt-3 hidden">
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              value={date || ""}
              onChange={(e) => setDate?.(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <MultiSelect
            hide={!selectedFilters.includes('Registration Type')}
            value={registrationType || ""}
            onChange={setRegistrationType}
            options={["Free", "Paid"]}
            label="Registration Type"
          />
        </>
      )}


      
          {/* Audience Tree */}
          {Array.isArray(audienceTree) && audienceTree.length > 0 && (
            <div className={`mt-4 ${!audienceTree.some(i=>selectedFilters.includes(i.name)) ? 'hidden':''}`}>
              <label className="text-xs text-gray-500 mb-2 block">
                Audience Interests
              </label>
              <AudienceTree
                tree={audienceTree}
                shown={selectedFilters}
                selected={
                  audienceSelections || {
                    identityIds: new Set(),
                    categoryIds: new Set(),
                    subcategoryIds: new Set(),
                    subsubCategoryIds: new Set(),
                  }
                }
                onChange={setAudienceSelections}
              />
            </div>
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
