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
import citiesData from "../constants/cities.json";
import client from "../api/client.js";
const libraries = ["places"];


export default function FiltersCard({
  setShowTotalCount,
  selectedFilters = [],
  setSelectedFilters,
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
  generalTree = [],
  onSubcategoryChange,

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
  workLocation,
  setWorkLocation,
  workSchedule,
  setWorkSchedule,
  careerLevel,
  setCareerLevel,
  paymentType,
  setPaymentType,

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

  /* Industries */
  selectedIndustries = [],
  setSelectedIndustries,
}) {
  const data = useData();
  const { user } = useAuth();
  const [selectedSubcategories, setSelectedSubcategories] = useState({});

  // General Categories expand/collapse state - start expanded
  const [generalCategoriesExpanded, setGeneralCategoriesExpanded] = useState(true);

  // Individual category expand/collapse states
  const [categoryExpandedStates, setCategoryExpandedStates] = useState({});

  /** ---------- Industries ---------- */
  const [industries, setIndustries] = useState([]);
  const [industriesQuery, setIndustriesQuery] = useState("");
  const [showIndustriesDropdown, setShowIndustriesDropdown] = useState(false);
  const industriesWrapRef = useRef(null);

  /** ---------- Google Places (kept, hidden section below) ---------- */
  const inputRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAF9zZKiLS2Ep98eFCX-jA871QAJxG5des",
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

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
      setGoogleInputValue(
        `${selectedCity || ""}${selectedCountry ? ", " + selectedCountry : ""}`
      );
    });
  }, [isLoaded, setCity, setCountry]);

  const handleGoogleInputChange = (e) => {
    const value = e.target.value;
    setGoogleInputValue(value);
    const parts = value.split(",").map((p) => p.trim());
    setCity(parts[0] || undefined);
    setCountry(parts[1] || parts[0] || undefined);
  };

  /** ---------- City dropdown powered by cities.json ---------- */
  const cityWrapRef = useRef(null);
  const [cityQuery, setCityQuery] = useState(city || "");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [googleInputValue, setGoogleInputValue] = useState("");

  // When external city prop changes, keep input synced
  useEffect(() => {
    if (city !== cityQuery) setCityQuery(city || "");
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch industries on component mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const industryResponse = await client.get("/industry-categories/tree");
        setIndustries(Array.isArray(industryResponse.data?.industryCategories)
          ? industryResponse.data.industryCategories
          : []);
      } catch (error) {
        console.error('Failed to fetch industries:', error);
        setIndustries([]);
      }
    };
    fetchIndustries();
  }, []);

  // Close city dropdown on outside click or ESC
  useEffect(() => {
    const onClick = (e) => {
      if (!cityWrapRef.current) return;
      if (!cityWrapRef.current.contains(e.target)) {
        setShowCityDropdown(false);
        setCityQuery("");
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowCityDropdown(false);
        setCityQuery("");
      }
    };
    if (showCityDropdown) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showCityDropdown]);

  // Close industries dropdown on outside click or ESC
  useEffect(() => {
    const onClick = (e) => {
      if (!industriesWrapRef.current) return;
      if (!industriesWrapRef.current.contains(e.target)) {
        setShowIndustriesDropdown(false);
        setIndustriesQuery("");
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowIndustriesDropdown(false);
        setIndustriesQuery("");
      }
    };
    if (showIndustriesDropdown) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showIndustriesDropdown]);

  // Parse selected cities from comma-separated string
  const selectedCities = useMemo(() => {
    if (!city) return [];
    return String(city)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [city]);

  // Support single or multi-country (comma-separated) selection
  const selectedCountries = useMemo(() => {
    if (!country) return [];
    return String(country)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [country]);


  const toggleCity = (cityName) => {
    const set = new Set(selectedCities);
    if (set.has(cityName)) set.delete(cityName);
    else set.add(cityName);
    const next = Array.from(set);
    setCity(next.length ? next.join(", ") : undefined);
    setCityQuery("");
  };

  const toggleIndustry = (industryId) => {
    const set = new Set(selectedIndustries);
    if (set.has(industryId)) {
      set.delete(industryId);
    } else {
      set.add(industryId);
    }
    const next = Array.from(set);
    setSelectedIndustries?.(next);
    setIndustriesQuery("");

    // Force a re-render by updating local state
    setIndustries(prev => [...prev]);
  };

  const citySummary = useMemo(() => {
    if (!selectedCities.length) return "All cities";
    if (selectedCities.length <= 2) return selectedCities.join(", ");
    return `${selectedCities.length} cities selected`;
  }, [selectedCities]);

  // Filtered cities for dropdown
  const filteredCitiesForDropdown = useMemo(() => {
    let list = citiesData;

    if (selectedCountries.length > 0) {
      const setLC = new Set(selectedCountries);
      list = list.filter((c) => setLC.has(c.country.toLowerCase()));
    }

    if (cityQuery) {
      const q = cityQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.city.toLowerCase().includes(q) ||
          c.city_ascii?.toLowerCase()?.includes(q)
      );
    }

    return list.slice(0, 30);
  }, [selectedCountries, cityQuery]);

  // Industries summary
  const industriesSummary = useMemo(() => {
    if (!selectedIndustries.length) return "All industries";
    if (selectedIndustries.length <= 2) {
      const selectedNames = selectedIndustries.map(id =>
        industries.find(ind => ind.id === id)?.name
      ).filter(Boolean);
      return selectedNames.join(", ");
    }
    return `${selectedIndustries.length} industries selected`;
  }, [selectedIndustries, industries]);

  // Filtered industries for dropdown
  const filteredIndustriesForDropdown = useMemo(() => {
    let list = industries;

    if (industriesQuery) {
      const q = industriesQuery.toLowerCase();
      list = list.filter(
        (industry) => industry.name.toLowerCase().includes(q)
      );
    }

    return list.slice(0, 30);
  }, [industries, industriesQuery]);

  // Count selected general categories and subcategories
  const selectedGeneralCategoriesCount = useMemo(() => {
    const categoryCount = selectedFilters.length;
    const subcategoryCount = Object.values(selectedSubcategories).filter(Boolean).length;
    return categoryCount + subcategoryCount;
  }, [selectedFilters, selectedSubcategories]);

  // Count pill component (similar to MultiSelect.jsx)
  const CountPill = ({ count }) =>
    count > 0 ? (
      <span className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-brand-50 px-1.5 py-0.5 text-[10px] leading-none text-brand-600">
        {count}
      </span>
    ) : null;

  // Function to count selected subcategories for a specific category
  const getSelectedSubcategoriesCount = (category) => {
    if (!category.subcategories) return 0;
    return category.subcategories.filter(sub => selectedSubcategories[sub.id]).length;
  };

  // Function to toggle individual category expand/collapse
  const toggleCategoryExpanded = (categoryId) => {
    setCategoryExpandedStates(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId] // Toggle the state, default to true if undefined
    }));
  };

  /** ---------- Derived + UI helpers ---------- */
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
        // general categories
        selectedFilters.length > 0 ||
        // selected cities
        selectedCities.length > 0 ||
        // selected industries
        selectedIndustries.length > 0 ||
        // products
        (from === "products" &&
          price !== undefined &&
          price !== "" &&
          price !== null) ||
        // jobs
        (from === "jobs" && (experienceLevel || jobType || workMode || workLocation || workSchedule || careerLevel || paymentType)) ||
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
        (from === "events" && (eventType || date || registrationType)) ||
        // ✅ audience selections
        (audienceSelections &&
          (audienceSelections.identityIds?.size > 0 ||
            audienceSelections.categoryIds?.size > 0 ||
            audienceSelections.subcategoryIds?.size > 0 ||
            audienceSelections.subsubCategoryIds?.size > 0))
      ),
    [
      query,
      country,
      city,
      categoryId,
      subcategoryId,
      role,
      goalId,
      selectedFilters, // Add selectedFilters to dependency array
      selectedCities, // Add selectedCities to dependency array
      selectedIndustries, // Add selectedIndustries to dependency array
      price,
      from,
      // jobs
      jobType,
      workMode,
      workLocation,
      workSchedule,
      careerLevel,
      paymentType,
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
      // ✅ audience
      audienceSelections,
    ]
  );


  useEffect(() => {
    setShowTotalCount(hasActive);
  }, [hasActive, setShowTotalCount]);

  /** ---------- Reset + external clear orchestration ---------- */
  const handleReset = () => {
    setQuery("");
    setCountry(undefined);
    setCity(undefined);
    setCategoryId(undefined);
    setSubcategoryId(undefined);
    setRole?.(undefined);
    setGoalId?.(undefined);
    setCityQuery("");
    setGoogleInputValue("");

    // Clear general categories
    setSelectedFilters?.([]);
    setSelectedSubcategories({});

    // Close city dropdown
    setShowCityDropdown(false);

    // Products
    setPrice?.("");

    // Services
    setServiceType?.("");
    setPriceType?.("");
    setDeliveryTime?.("");
    setExperienceLevel?.("");
    setLocationType?.("");

    // Jobs
    setJobType?.("");
    setWorkMode?.("");
    setWorkLocation?.("");
    setWorkSchedule?.("");
    setCareerLevel?.("");
    setPaymentType?.("");

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

    // Industries
    setSelectedIndustries?.([]);
    setIndustriesQuery("");
    setShowIndustriesDropdown(false);
  };

  useEffect(() => {
    handleReset();

    const targetElement = selectedFilters.length
      ? document.querySelector("#secundary-filters")
      : document.querySelector("#filters");

    if (targetElement && user && 0 == 1) {
      const scrollableContainer =
        targetElement.closest(".scrollable-container") ||
        targetElement.closest('[style*="overflow"]') ||
        targetElement.parentElement;

      if (scrollableContainer) {
        const targetPosition = targetElement.offsetTop;
        scrollableContainer.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    }
  }, [data.updateData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data.filtersToClear || data.filtersToClear.length === 0) return;

    data.filtersToClear.forEach((label) => {
      switch (label) {
        case "Search":
          setQuery("");
          break;
        case "Country":
          setCountry(undefined);
          setCityQuery("");
          setGoogleInputValue("");
          break;
        case "City":
          setCity(undefined);
          setCityQuery("");
          break;
        case "Category":
          setCategoryId(undefined);
          break;
        case "Subcategory":
          setSubcategoryId(undefined);
          break;
        case "Role":
          setRole?.(undefined);
          break;
        case "Goal":
          setGoalId?.(undefined);
          break;
        // Products
        case "Price":
          setPrice?.("");
          break;
        // Jobs
        case "Experience Level":
          setExperienceLevel?.("");
          break;
        case "Job Type":
          setJobType?.("");
          break;
        case "Work Mode":
          setWorkMode?.("");
          break;
        case "Work Location":
          setWorkLocation?.("");
          break;
        case "Work Schedule":
          setWorkSchedule?.("");
          break;
        case "Career Level":
          setCareerLevel?.("");
          break;
        case "Payment Type":
          setPaymentType?.("");
          break;
        // Services
        case "Service Type":
          setServiceType?.("");
          break;
        case "Price Type":
          setPriceType?.("");
          break;
        case "Typical Delivery":
          setDeliveryTime?.("");
          break;
        case "Location Type":
          setLocationType?.("");
          break;
        // Tourism
        case "Post Type":
          setPostType?.("");
          break;
        case "Best Season to Visit":
          setSeason?.("");
          break;
        case "Budget Range":
          setBudgetRange?.("");
          break;
        // Funding
        case "Funding Goal":
          setFundingGoal?.("");
          break;
        case "Amount Raised":
          setAmountRaised?.("");
          break;
        case "Currency":
          setCurrency?.("");
          break;
        case "Deadline":
          setDeadline?.("");
          break;
        // Events
        case "Event Type":
          setEventType?.("");
          break;
        case "Date":
          setDate?.("");
          break;
        case "Registration Type":
          setRegistrationType?.("");
          break;
        // Audience
        case "Audience Interests":
          setAudienceSelections?.({
            identityIds: new Set(),
            categoryIds: new Set(),
            subcategoryIds: new Set(),
            subsubCategoryIds: new Set(),
          });
          break;
        // Industries
        case "Industries":
          setSelectedIndustries?.([]);
          break;
      }
    });

    data.setFiltersToClear([]);
  }, [data.filtersToClear]); // eslint-disable-line react-hooks/exhaustive-deps

  /** ---------- Render ---------- */
  return (
    <div
      id="filters"
      className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">Filters</h3>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActive}
          className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
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

      {/* City / Country via Google (kept but hidden) */}
      <div className="mt-3 hidden">
        <label className="text-xs text-gray-500">City / Country</label>
        {isLoaded ? (
          <input
            ref={inputRef}
            value={googleInputValue}
            onChange={handleGoogleInputChange}
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

      <div id="secundary-filters"></div>

      {/* Category (hidden for now, unchanged) */}
      <div className="mt-3 hidden">
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

      {/* Subcategory (hidden for now, unchanged) */}
      <div className="mt-3 hidden">
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

   

   

      {/* Services */}
      {isService && (
        <>
          <MultiSelect
            hide={!selectedFilters.includes("Service Type")}
            value={serviceType || ""}
            onChange={setServiceType}
            options={["Consulting", "Freelance Work", "Product/Service"]}
            label="Service Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Price Type")}
            value={priceType || ""}
            onChange={setPriceType}
            options={["Fixed Price", "Hourly"]}
            label="Price Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Typical Delivery")}
            value={deliveryTime || ""}
            onChange={setDeliveryTime}
            options={["1 Day", "3 Days", "1 Week", "2 Weeks", "1 Month"]}
            label="Typical Delivery"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Location Type")}
            value={locationType || ""}
            onChange={setLocationType}
            options={["Remote", "On-site"]}
            label="Location Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Experience Level")}
            value={experienceLevel || ""}
            onChange={setExperienceLevel}
            options={["Entry Level", "Intermediate", "Expert"]}
            label="Experience Level"
            placeholder="Any"
          />
        </>
      )}

      {/* Tourism */}
      {isTourism && (
        <>
          <MultiSelect
            hide={!selectedFilters.includes("Post Type")}
            value={postType || ""}
            onChange={setPostType}
            options={["Destination", "Experience", "Culture"]}
            label="Post Type"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Best Season to Visit")}
            value={season || ""}
            onChange={setSeason}
            options={[
              "Summer",
              "Winter",
              "All Year",
              "Rainy Season",
              "Dry Season",
            ]}
            label="Best Season to Visit"
          />

          <MultiSelect
            hide={!selectedFilters.includes("Budget Range")}
            value={budgetRange || ""}
            onChange={setBudgetRange}
            options={["$100 - $500", "$500 - $2000", "$2000+"]}
            label="Budget Range"
          />
        </>
      )}

   

      {/* People */}
      {isPeople && <></>}

      {/* Events */}
      {from === "events" && (
        <>
          <MultiSelect
            hide={!selectedFilters.includes("Event Type")}
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
            hide={!selectedFilters.includes("Registration Type")}
            value={registrationType || ""}
            onChange={setRegistrationType}
            options={["Free", "Paid"]}
            label="Registration Type"
          />

          {/* General Categories and Subcategories for Events */}
          {generalTree && generalTree.length > 0 && selectedFilters.some(filter => generalTree.some(cat => cat.id === filter)) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 block">Categories</label>
                  <CountPill count={selectedGeneralCategoriesCount} />
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralCategoriesExpanded(!generalCategoriesExpanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {generalCategoriesExpanded ? (
                    <>
                      <span>Collapse</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {generalCategoriesExpanded && (
                <div className="space-y-3">
                  {generalTree.map((category) => (
                    // Only show the category if it's in selectedFilters
                    selectedFilters.includes(category.id) && (
                      <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFilters.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add category to selectedFilters
                                  if (setSelectedFilters && !selectedFilters.includes(category.id)) {
                                    setSelectedFilters([...selectedFilters, category.id]);
                                  }
                                } else {
                                  // Remove category from selectedFilters
                                  if (setSelectedFilters) {
                                    setSelectedFilters(selectedFilters.filter(f => f !== category.id));
                                    data.setFiltersToClear([category.name]); // Keep name for UI display

                                    // Deselect all subcategories for this category
                                    const updatedSubcategories = { ...selectedSubcategories };
                                    category.subcategories?.forEach(subcategory => {
                                      const key = subcategory.id;
                                      delete updatedSubcategories[key];
                                    });
                                    setSelectedSubcategories(updatedSubcategories);

                                    // Call the callback if provided
                                    if (onSubcategoryChange) {
                                      onSubcategoryChange(updatedSubcategories);
                                    }
                                  }
                                }
                              }}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <label className="text-xs text-gray-500 block">{category.name}</label>
                            <CountPill count={getSelectedSubcategoriesCount(category)} />
                          </div>

                          {/* Individual category expand/collapse button */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1"
                            >
                              {categoryExpandedStates[category.id] !== false ? (
                                <>
                                  <span>Collapse</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Expand</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Only show subcategories if category is selected and expanded */}
                        {selectedFilters.includes(category.id) && category.subcategories && category.subcategories.length > 0 && categoryExpandedStates[category.id] !== false && (
                          <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2">
                              {category.subcategories.map((subcategory) => {
                                const subcategoryKey = subcategory.id;
                                const isChecked = selectedSubcategories[subcategoryKey] || false;

                                return (
                                  <label key={subcategory.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        // Update the selected subcategories
                                        const updatedSubcategories = {
                                          ...selectedSubcategories,
                                          [subcategoryKey]: e.target.checked
                                        };
                                        setSelectedSubcategories(updatedSubcategories);

                                        // Call the callback if provided
                                        if (onSubcategoryChange) {
                                          onSubcategoryChange(updatedSubcategories);
                                        }
                                      }}
                                    />
                                    {subcategory.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Products */}
      {from === "products" && (
        <>
          {/* General Categories and Subcategories for Products */}
          {generalTree && generalTree.length > 0 && selectedFilters.some(filter => generalTree.some(cat => cat.id === filter)) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 block">Categories</label>
                  <CountPill count={selectedGeneralCategoriesCount} />
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralCategoriesExpanded(!generalCategoriesExpanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {generalCategoriesExpanded ? (
                    <>
                      <span>Collapse</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {generalCategoriesExpanded && (
                <div className="space-y-3">
                  {generalTree.map((category) => (
                    // Only show the category if it's in selectedFilters
                    selectedFilters.includes(category.id) && (
                      <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFilters.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add category to selectedFilters
                                  if (setSelectedFilters && !selectedFilters.includes(category.id)) {
                                    setSelectedFilters([...selectedFilters, category.id]);
                                  }
                                } else {
                                  // Remove category from selectedFilters
                                  if (setSelectedFilters) {
                                    setSelectedFilters(selectedFilters.filter(f => f !== category.id));
                                    data.setFiltersToClear([category.name]); // Keep name for UI display

                                    // Deselect all subcategories for this category
                                    const updatedSubcategories = { ...selectedSubcategories };
                                    category.subcategories?.forEach(subcategory => {
                                      const key = subcategory.id;
                                      delete updatedSubcategories[key];
                                    });
                                    setSelectedSubcategories(updatedSubcategories);

                                    // Call the callback if provided
                                    if (onSubcategoryChange) {
                                      onSubcategoryChange(updatedSubcategories);
                                    }
                                  }
                                }
                              }}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <label className="text-xs text-gray-500 block">{category.name}</label>
                            <CountPill count={getSelectedSubcategoriesCount(category)} />
                          </div>

                          {/* Individual category expand/collapse button */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1"
                            >
                              {categoryExpandedStates[category.id] !== false ? (
                                <>
                                  <span>Collapse</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Expand</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Only show subcategories if category is selected and expanded */}
                        {selectedFilters.includes(category.id) && category.subcategories && category.subcategories.length > 0 && categoryExpandedStates[category.id] !== false && (
                          <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2">
                              {category.subcategories.map((subcategory) => {
                                const subcategoryKey = subcategory.id;
                                const isChecked = selectedSubcategories[subcategoryKey] || false;

                                return (
                                  <label key={subcategory.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        // Update the selected subcategories
                                        const updatedSubcategories = {
                                          ...selectedSubcategories,
                                          [subcategoryKey]: e.target.checked
                                        };
                                        setSelectedSubcategories(updatedSubcategories);

                                        // Call the callback if provided
                                        if (onSubcategoryChange) {
                                          onSubcategoryChange(updatedSubcategories);
                                        }
                                      }}
                                    />
                                    {subcategory.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Services */}
      {isService && (
        <>
          {/* General Categories and Subcategories for Services */}
          {generalTree && generalTree.length > 0 && selectedFilters.some(filter => generalTree.some(cat => cat.id === filter)) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 block">Categories</label>
                  <CountPill count={selectedGeneralCategoriesCount} />
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralCategoriesExpanded(!generalCategoriesExpanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {generalCategoriesExpanded ? (
                    <>
                      <span>Collapse</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {generalCategoriesExpanded && (
                <div className="space-y-3">
                  {generalTree.map((category) => (
                    // Only show the category if it's in selectedFilters
                    selectedFilters.includes(category.id) && (
                      <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFilters.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add category to selectedFilters
                                  if (setSelectedFilters && !selectedFilters.includes(category.id)) {
                                    setSelectedFilters([...selectedFilters, category.id]);
                                  }
                                } else {
                                  // Remove category from selectedFilters
                                  if (setSelectedFilters) {
                                    setSelectedFilters(selectedFilters.filter(f => f !== category.id));
                                    data.setFiltersToClear([category.name]); // Keep name for UI display

                                    // Deselect all subcategories for this category
                                    const updatedSubcategories = { ...selectedSubcategories };
                                    category.subcategories?.forEach(subcategory => {
                                      const key = subcategory.id;
                                      delete updatedSubcategories[key];
                                    });
                                    setSelectedSubcategories(updatedSubcategories);

                                    // Call the callback if provided
                                    if (onSubcategoryChange) {
                                      onSubcategoryChange(updatedSubcategories);
                                    }
                                  }
                                }
                              }}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <label className="text-xs text-gray-500 block">{category.name}</label>
                            <CountPill count={getSelectedSubcategoriesCount(category)} />
                          </div>

                          {/* Individual category expand/collapse button */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1"
                            >
                              {categoryExpandedStates[category.id] !== false ? (
                                <>
                                  <span>Collapse</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Expand</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Only show subcategories if category is selected and expanded */}
                        {selectedFilters.includes(category.id) && category.subcategories && category.subcategories.length > 0 && categoryExpandedStates[category.id] !== false && (
                          <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2">
                              {category.subcategories.map((subcategory) => {
                                const subcategoryKey = subcategory.id;
                                const isChecked = selectedSubcategories[subcategoryKey] || false;

                                return (
                                  <label key={subcategory.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        // Update the selected subcategories
                                        const updatedSubcategories = {
                                          ...selectedSubcategories,
                                          [subcategoryKey]: e.target.checked
                                        };
                                        setSelectedSubcategories(updatedSubcategories);

                                        // Call the callback if provided
                                        if (onSubcategoryChange) {
                                          onSubcategoryChange(updatedSubcategories);
                                        }
                                      }}
                                    />
                                    {subcategory.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Tourism */}
      {isTourism && (
        <>
          {/* General Categories and Subcategories for Tourism */}
          {generalTree && generalTree.length > 0 && selectedFilters.some(filter => generalTree.some(cat => cat.id === filter)) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 block">Categories</label>
                  <CountPill count={selectedGeneralCategoriesCount} />
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralCategoriesExpanded(!generalCategoriesExpanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {generalCategoriesExpanded ? (
                    <>
                      <span>Collapse</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {generalCategoriesExpanded && (
                <div className="space-y-3">
                  {generalTree.map((category) => (
                    // Only show the category if it's in selectedFilters
                    selectedFilters.includes(category.id) && (
                      <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFilters.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add category to selectedFilters
                                  if (setSelectedFilters && !selectedFilters.includes(category.id)) {
                                    setSelectedFilters([...selectedFilters, category.id]);
                                  }
                                } else {
                                  // Remove category from selectedFilters
                                  if (setSelectedFilters) {
                                    setSelectedFilters(selectedFilters.filter(f => f !== category.id));
                                    data.setFiltersToClear([category.name]); // Keep name for UI display

                                    // Deselect all subcategories for this category
                                    const updatedSubcategories = { ...selectedSubcategories };
                                    category.subcategories?.forEach(subcategory => {
                                      const key = subcategory.id;
                                      delete updatedSubcategories[key];
                                    });
                                    setSelectedSubcategories(updatedSubcategories);

                                    // Call the callback if provided
                                    if (onSubcategoryChange) {
                                      onSubcategoryChange(updatedSubcategories);
                                    }
                                  }
                                }
                              }}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <label className="text-xs text-gray-500 block">{category.name}</label>
                            <CountPill count={getSelectedSubcategoriesCount(category)} />
                          </div>

                          {/* Individual category expand/collapse button */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1"
                            >
                              {categoryExpandedStates[category.id] !== false ? (
                                <>
                                  <span>Collapse</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Expand</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Only show subcategories if category is selected and expanded */}
                        {selectedFilters.includes(category.id) && category.subcategories && category.subcategories.length > 0 && categoryExpandedStates[category.id] !== false && (
                          <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2">
                              {category.subcategories.map((subcategory) => {
                                const subcategoryKey = subcategory.id;
                                const isChecked = selectedSubcategories[subcategoryKey] || false;

                                return (
                                  <label key={subcategory.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        // Update the selected subcategories
                                        const updatedSubcategories = {
                                          ...selectedSubcategories,
                                          [subcategoryKey]: e.target.checked
                                        };
                                        setSelectedSubcategories(updatedSubcategories);

                                        // Call the callback if provided
                                        if (onSubcategoryChange) {
                                          onSubcategoryChange(updatedSubcategories);
                                        }
                                      }}
                                    />
                                    {subcategory.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Funding */}
      {isFunding && (
        <>
          {/* General Categories and Subcategories for Funding */}
          {generalTree && generalTree.length > 0 && selectedFilters.some(filter => generalTree.some(cat => cat.id === filter)) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 block">Categories</label>
                  <CountPill count={selectedGeneralCategoriesCount} />
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralCategoriesExpanded(!generalCategoriesExpanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {generalCategoriesExpanded ? (
                    <>
                      <span>Collapse</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Expand</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {generalCategoriesExpanded && (
                <div className="space-y-3">
                  {generalTree.map((category) => (
                    // Only show the category if it's in selectedFilters
                    selectedFilters.includes(category.id) && (
                      <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFilters.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add category to selectedFilters
                                  if (setSelectedFilters && !selectedFilters.includes(category.id)) {
                                    setSelectedFilters([...selectedFilters, category.id]);
                                  }
                                } else {
                                  // Remove category from selectedFilters
                                  if (setSelectedFilters) {
                                    setSelectedFilters(selectedFilters.filter(f => f !== category.id));
                                    data.setFiltersToClear([category.name]); // Keep name for UI display

                                    // Deselect all subcategories for this category
                                    const updatedSubcategories = { ...selectedSubcategories };
                                    category.subcategories?.forEach(subcategory => {
                                      const key = subcategory.id;
                                      delete updatedSubcategories[key];
                                    });
                                    setSelectedSubcategories(updatedSubcategories);

                                    // Call the callback if provided
                                    if (onSubcategoryChange) {
                                      onSubcategoryChange(updatedSubcategories);
                                    }
                                  }
                                }
                              }}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <label className="text-xs text-gray-500 block">{category.name}</label>
                            <CountPill count={getSelectedSubcategoriesCount(category)} />
                          </div>

                          {/* Individual category expand/collapse button */}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1"
                            >
                              {categoryExpandedStates[category.id] !== false ? (
                                <>
                                  <span>Collapse</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Expand</span>
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Only show subcategories if category is selected and expanded */}
                        {selectedFilters.includes(category.id) && category.subcategories && category.subcategories.length > 0 && categoryExpandedStates[category.id] !== false && (
                          <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2">
                              {category.subcategories.map((subcategory) => {
                                const subcategoryKey = subcategory.id;
                                const isChecked = selectedSubcategories[subcategoryKey] || false;

                                return (
                                  <label key={subcategory.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        // Update the selected subcategories
                                        const updatedSubcategories = {
                                          ...selectedSubcategories,
                                          [subcategoryKey]: e.target.checked
                                        };
                                        setSelectedSubcategories(updatedSubcategories);

                                        // Call the callback if provided
                                        if (onSubcategoryChange) {
                                          onSubcategoryChange(updatedSubcategories);
                                        }
                                      }}
                                    />
                                    {subcategory.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Audience Tree */}
      {Array.isArray(audienceTree) && audienceTree.length > 0 && selectedFilters.length > 0 && (
        <div className="mt-4">
          <label className="text-xs text-gray-500 mb-2 block">
            Audience Interests
          </label>
          <AudienceTree
            tree={audienceTree}
            shown={selectedFilters}
            from={from}
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

         {/* Products */}
   {from === "products" && (
  <div className="mt-3">
    <label className="text-xs text-gray-500">Price</label>
    <input
      type="range"
      min="0"
      max="1000"
      step="0.01"
      value={price ?? 0}
      onChange={(e) => setPrice?.(e.target.value)}
      className="mt-1 w-full cursor-pointer"
    />
    <div className="text-sm text-gray-700 mt-1">
      {price ?? "0.00"}
    </div>
  </div>
)}


         {/* Jobs */}
      {from === "jobs" && (
        <>
          {/** <MultiSelect
            value={experienceLevel || ""}
            onChange={setExperienceLevel}
            options={["Junior", "Mid-level", "Senior", "Lead"]}
            label="Experience Level"
            placeholder="Any"
          /> */}

          <MultiSelect
            hide={from!="jobs"}
            value={jobType || ""}
            onChange={setJobType}
            options={[
              "Full-time",
              "Part-time",
              "Contract",
              "Internship",
              "Temporary",
            ]}
            label="Job Type"
          />

          <MultiSelect
            value={workMode || ""}
            onChange={setWorkMode}
            options={["On-site", "Remote", "Hybrid"]}
            label="Work Mode"
          />

          <MultiSelect
            value={workLocation || ""}
            onChange={setWorkLocation}
            options={["Office", "Field", "Home", "Client Site"]}
            label="Work Location"
          />

          <MultiSelect
            value={workSchedule || ""}
            onChange={setWorkSchedule}
            options={["Regular Hours", "Flexible Hours", "Shifts", "Weekends"]}
            label="Work Schedule"
          />

          <MultiSelect
            value={careerLevel || ""}
            onChange={setCareerLevel}
            options={["Entry Level", "Mid Level", "Senior Level", "Executive"]}
            label="Career Level"
          />

          <MultiSelect
            value={paymentType || ""}
            onChange={setPaymentType}
            options={["Hourly", "Monthly", "Project-based", "Commission"]}
            label="Payment Type"
          />
        </>
      )}

      {/* Country (uses ExperienceLevelSelector) */}
      <div className="mt-3">
        <ExperienceLevelSelector
          value={country}
          onChange={(val) => {
            setCountry(val);
            // Don't auto-open city dropdown to prevent positioning conflicts
          }}
          options={COUNTRIES}
          label="Country"
          placeholder="All"
        />
      </div>

      {/* City with multi-select dropdown (like ExperienceLevelSelector) */}
      <div className="mt-3 relative" ref={cityWrapRef}>
        <label className="text-xs text-gray-500 mb-2 block">City</label>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowCityDropdown((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={showCityDropdown}
          className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <span className="truncate">{citySummary}</span>
          <svg
            className={`h-4 w-4 transition-transform ${
              showCityDropdown ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Floating list */}
        {showCityDropdown && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto"
          >
            {/* Sticky search bar */}
            <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm pr-6"
                  autoFocus
                />
                {cityQuery && (
                  <button
                    type="button"
                    onClick={() => setCityQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* City options */}
            {filteredCitiesForDropdown.length > 0 ? (
              filteredCitiesForDropdown.map((c) => {
                const checked = selectedCities.includes(c.city);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={checked}
                      onChange={() => toggleCity(c.city)}
                    />
                    <span>{c.city}, {c.country}</span>
                  </label>
                );
              })
            ) : (
              <div className="px-2 py-3 text-sm text-gray-400">
                No cities found
              </div>
            )}

            {/* Footer buttons */}
            <div className="sticky bottom-0 bg-white flex items-center justify-between gap-2 px-2 py-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setCity(undefined);
                  setCityQuery("");
                  setShowCityDropdown(false);
                }}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowCityDropdown(false)}
                className="text-xs px-2 py-1 rounded-lg bg-gray-900 text-white hover:bg-black"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Industries with multi-select dropdown */}
      <div className="mt-3 relative" ref={industriesWrapRef}>
        <label className="text-xs text-gray-500 mb-2 block">Industries</label>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowIndustriesDropdown((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={showIndustriesDropdown}
          className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <span className="truncate">{industriesSummary}</span>
          <svg
            className={`h-4 w-4 transition-transform ${
              showIndustriesDropdown ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Floating list */}
        {showIndustriesDropdown && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto"
          >
            {/* Sticky search bar */}
            <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={industriesQuery}
                  onChange={(e) => setIndustriesQuery(e.target.value)}
                  placeholder="Search industries..."
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm pr-6"
                  autoFocus
                />
                {industriesQuery && (
                  <button
                    type="button"
                    onClick={() => setIndustriesQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Industry options */}
            {filteredIndustriesForDropdown.length > 0 ? (
              filteredIndustriesForDropdown.map((industry) => {
                const isChecked = selectedIndustries.includes(industry.id);
                return (
                  <label
                    key={`${industry.id}-${isChecked}`} // Force re-render when checked state changes
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={isChecked}
                      onChange={() => toggleIndustry(industry.id)}
                    />
                    <span>{industry.name}</span>
                  </label>
                );
              })
            ) : (
              <div className="px-2 py-3 text-sm text-gray-400">
                No industries found
              </div>
            )}

            {/* Footer buttons */}
            <div className="sticky bottom-0 bg-white flex items-center justify-between gap-2 px-2 py-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedIndustries?.([]);
                  setIndustriesQuery("");
                  setShowIndustriesDropdown(false);
                }}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowIndustriesDropdown(false)}
                className="text-xs px-2 py-1 rounded-lg bg-gray-900 text-white hover:bg-black"
              >
                Done
              </button>
            </div>
          </div>
        )}
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

      {/* Hidden Goal */}
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

      {/* Hidden Role */}
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
