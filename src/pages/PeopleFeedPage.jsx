import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import client from "../api/client";

import Header from "../components/Header";
import MobileFiltersButton from "../components/MobileFiltersButton";
import MobileSearchBar from "../components/MobileSearchBar";
import TabsAndAdd from "../components/TabsAndAdd";
import MobileFiltersBottomSheet from "../components/MobileFiltersBottomSheet";
import ProfileCard from "../components/ProfileCard";
import QuickActions from "../components/QuickActions";
import FiltersCard from "../components/FiltersCard";
import SuggestedMatches from "../components/SuggestedMatches";
import EventCard from "../components/EventCard";
import JobCard from "../components/JobCard";
import EmptyFeedState from "../components/EmptyFeedState";
import FeedErrorRetry from "../components/FeedErrorRetry";
import { Pencil, PlusCircle, Rocket, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import PeopleProfileCard from "./PeopleCards";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import PageTabs from "../components/PageTabs";
import TopFilterButtons from "../components/TopFilterButtons";
import CompanySkeletonLoader from "../components/ui/CompanySkeletonLoader";

/*function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}*/

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Immediate update for empty values
    if (value === '') {
      setDebouncedValue(value);
      return;
    }

    // Debounce for non-empty values
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}


export default function PeopleFeedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("People");
  const data = useData();

  const tabs = useMemo(() => {
    const base = ["Posts", "People", "News & Articles"];
    if (user) base.splice(2, 0, "My Connections"); // insert before News
    return base;
  }, [user]);

  const navigate = useNavigate();
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();
  const [goals, setGoals] = useState([]);
  const [view, setView] = useState("grid");
  let view_types = ["grid", "list"];
  const { pathname } = useLocation();

  const currentPage = pathname.includes("/people") ? "people" : "companies";

  const [viewOnlyConnections,setViewOnlyConnections]=useState(false)

  // ---- NEW: all filter states ----
  // Products
  const [price, setPrice] = useState("");

  // Services
  const [serviceType, setServiceType] = useState("");
  const [priceType, setPriceType] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  // Shared (Jobs, Services, People)
  const [experienceLevel, setExperienceLevel] = useState("");
  const [locationType, setLocationType] = useState("");

  // Jobs
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");

  // Tourism
  const [postType, setPostType] = useState("");
  const [season, setSeason] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  // Funding
  const [fundingGoal, setFundingGoal] = useState("");
  const [amountRaised, setAmountRaised] = useState("");
  const [currency, setCurrency] = useState("");
  const [deadline, setDeadline] = useState("");

  // Events
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [registrationType, setRegistrationType] = useState("Free");

  // Industries
  const [selectedIndustries, setSelectedIndustries] = useState([]);

  // Audience Tree
  const [audienceSelections, setAudienceSelections] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Metadados
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [audienceTree, setAudienceTree] = useState([]);

  // Feed
  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [totalCount, setTotalCount] = useState(0); // <-- add this
  const [showTotalCount, setShowTotalCount] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef(null);

  // Sugestões
  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mobile filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Selected filters for TopFilterButtons
  const [selectedFilters, setSelectedFilters] = useState([]);
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const currentOffsetRef = useRef(0);

  // Map button labels to identity IDs
  const getIdentityIdFromLabel = useCallback(
    (label) => {
      if (!audienceTree.length) return null;
      for (const identity of audienceTree) {
        if (
          identity.name === label ||
          identity.name.toLowerCase() === label.toLowerCase()
        ) {
          return identity.id;
        }
      }
      return null;
    },
    [audienceTree]
  );

  // Fetch meta
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
        setCountries(data.countries || []);
        setGoals(data.goals || []);
        // (audience tree comes from /public/identities below)
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {

      let type = currentPage == "people" ? "individual" : "company";
      try {
        const { data } = await client.get("/public/identities", {
          params: { type },
        });
        // Expecting data.identities: same structure you shared
        setAudienceTree(data.identities);
      } catch (error) {
        console.error("Error loading identities:", error);
      }

    })();
  }, [currentPage]);

  const isFetchingRef = useRef(false);
  const hasLoadedOnce = useRef(false);
  const lastParamsRef = useRef({});
  const fetchTimeoutRef = useRef(null);

  const fetchFeed = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre "all"
      const params = {
        accountType: currentPage == "people" ? "individual" : "company",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,
        role: role || undefined,

        // Add audience selections to the API request
        identityIds:
          Array.from(audienceSelections.identityIds).join(",") || undefined,
        audienceCategoryIds:
          Array.from(audienceSelections.categoryIds).join(",") || undefined,
        audienceSubcategoryIds:
          Array.from(audienceSelections.subcategoryIds).join(",") || undefined,
        audienceSubsubCategoryIds:
          Array.from(audienceSelections.subsubCategoryIds).join(",") ||
          undefined,
        industryIds:
          selectedIndustries.length > 0
            ? selectedIndustries.join(",")
            : undefined,
        connectionStatus:
          activeTab == "My Connections" && showPendingRequests
            ? "outgoing_pending,incoming_pending"
            : activeTab == "My Connections" && !showPendingRequests
            ? "connected"
            : null,

        // include ALL filters so backend can leverage them when needed:
        // products
        price: price || undefined,

        viewOnlyConnections,
        // services
        serviceType: serviceType || undefined,
        priceType: priceType || undefined,
        deliveryTime: deliveryTime || undefined,
        // shared
        experienceLevel: experienceLevel || undefined,
        locationType: locationType || undefined,
        // jobs
        jobType: jobType || undefined,
        workMode: workMode || undefined,
        // tourism
        postType: postType || undefined,
        season: season || undefined,
        budgetRange: budgetRange || undefined,
        // funding
        fundingGoal: fundingGoal || undefined,
        amountRaised: amountRaised || undefined,
        currency: currency || undefined,
        deadline: deadline || undefined,
        // events
        eventType: eventType || undefined,
        date: date || undefined,
        registrationType: registrationType || undefined,

        limit: 10,
        offset: 0,
      };
      const { data } = await client.get("/people", { params });
      const incomingItems = Array.isArray(data.items) ? data.items : [];
      setItems(incomingItems);
      setTotalCount(
        typeof data.total === "number"
          ? data.total
          : Array.isArray(data.items)
          ? data.items.length
          : 0
      );
      // Set whether more pages exist
      setHasMore(
        typeof data.total === "number"
          ? incomingItems.length < data.total
          : incomingItems.length === 10
      );
      currentOffsetRef.current = incomingItems.length;
      setHasFetchedOnce(true);
      setFetchError(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
      setFetchError(true);
      setHasFetchedOnce(true);
      // Automatic retry after 3 seconds
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 3000);
    } finally {
      isFetchingRef.current = false;
      setLoadingFeed(false);
    }
    data._scrollToSection("top", true);
  }, [
    activeTab,
    debouncedQ,
    country,
    city,
    categoryId,
    subcategoryId,
    goalId,
    role,
    showPendingRequests,
    audienceSelections,
    price,
    serviceType,
    priceType,
    viewOnlyConnections,
    deliveryTime,
    experienceLevel,
    locationType,
    jobType,
    workMode,
    postType,
    season,
    budgetRange,
    fundingGoal,
    amountRaised,
    currency,
    deadline,
    eventType,
    date,
    registrationType,
    selectedIndustries,
    currentPage,
    data,
  ]);

  // Infinite scroll: fetch next page
  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || loadingFeed || loadingMore || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    try {
      // Same params as initial fetch, but advance offset
      const params = {
        accountType: currentPage == "people" ? "individual" : "company",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,
        role: role || undefined,

        // Add audience selections to the API request
        identityIds:
          Array.from(audienceSelections.identityIds).join(",") || undefined,
        audienceCategoryIds:
          Array.from(audienceSelections.categoryIds).join(",") || undefined,
        audienceSubcategoryIds:
          Array.from(audienceSelections.subcategoryIds).join(",") || undefined,
        audienceSubsubCategoryIds:
          Array.from(audienceSelections.subsubCategoryIds).join(",") ||
          undefined,
        industryIds:
          selectedIndustries.length > 0
            ? selectedIndustries.join(",")
            : undefined,
        connectionStatus:
          activeTab == "My Connections" && showPendingRequests
            ? "outgoing_pending,incoming_pending"
            : activeTab == "My Connections" && !showPendingRequests
            ? "connected"
            : null,

        // include ALL filters so backend can leverage them when needed:
        // products
        price: price || undefined,

        viewOnlyConnections,
        // services
        serviceType: serviceType || undefined,
        priceType: priceType || undefined,
        deliveryTime: deliveryTime || undefined,
        // shared
        experienceLevel: experienceLevel || undefined,
        locationType: locationType || undefined,
        // jobs
        jobType: jobType || undefined,
        workMode: workMode || undefined,
        // tourism
        postType: postType || undefined,
        season: season || undefined,
        budgetRange: budgetRange || undefined,
        // funding
        fundingGoal: fundingGoal || undefined,
        amountRaised: amountRaised || undefined,
        currency: currency || undefined,
        deadline: deadline || undefined,
        // events
        eventType: eventType || undefined,
        date: date || undefined,
        registrationType: registrationType || undefined,

        limit: 10,
        offset: currentOffsetRef.current,
      };
      const { data } = await client.get("/people", { params });
      const incomingItems = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => [...prev, ...incomingItems]);
      currentOffsetRef.current += incomingItems.length;
      setHasMore(incomingItems.length === 10);
      setFetchError(false);
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [
    activeTab,
    debouncedQ,
    country,
    city,
    categoryId,
    subcategoryId,
    goalId,
    role,
    showPendingRequests,
    audienceSelections,
    price,
    serviceType,
    priceType,
    viewOnlyConnections,
    deliveryTime,
    experienceLevel,
    locationType,
    jobType,
    workMode,
    postType,
    season,
    budgetRange,
    fundingGoal,
    amountRaised,
    currency,
    deadline,
    eventType,
    date,
    registrationType,
    selectedIndustries,
    currentPage,
    items.length,
    loadingFeed,
    loadingMore,
    hasMore,
  ]);

  // Trigger fetches (initial + debounced updates)
  useEffect(() => {
    const currentParams = {
      activeTab,
      debouncedQ,
      country,
      city,
      categoryId,
      subcategoryId,
      goalId,
      role,
      showPendingRequests,
      audienceSelections: {
        identityIds: Array.from(audienceSelections.identityIds),
        categoryIds: Array.from(audienceSelections.categoryIds),
        subcategoryIds: Array.from(audienceSelections.subcategoryIds),
        subsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds),
      },
      price,
      serviceType,
      priceType,
      viewOnlyConnections,
      deliveryTime,
      experienceLevel,
      locationType,
      jobType,
      workMode,
      postType,
      season,
      budgetRange,
      fundingGoal,
      amountRaised,
      currency,
      deadline,
      eventType,
      date,
      registrationType,
      selectedIndustries,
    };

    if (JSON.stringify(currentParams) === JSON.stringify(lastParamsRef.current))
      return;
    lastParamsRef.current = currentParams;

    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      // Immediate fetch for initial load
      fetchFeed();
    } else {
      // Debounced re-fetch
      clearTimeout(fetchTimeoutRef.current);
      setLoadingFeed(true);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 100);
    }

    // Cleanup: ONLY clear the timeout.
    // DO NOT flip loadingFeed to false here (that caused the blank gap).
    return () => {
      clearTimeout(fetchTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [
    activeTab,
    debouncedQ,
    country,
    city,
    categoryId,
    subcategoryId,
    goalId,
    role,
    showPendingRequests,
    audienceSelections,
    price,
    serviceType,
    priceType,
    viewOnlyConnections,
    deliveryTime,
    experienceLevel,
    locationType,
    jobType,
    workMode,
    postType,
    season,
    budgetRange,
    fundingGoal,
    amountRaised,
    currency,
    deadline,
    eventType,
    date,
    registrationType,
    selectedIndustries,
    fetchFeed,
  ]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!hasMore) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchMore();
        }
      },
      { root: null, rootMargin: "3000px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreRef, hasMore, fetchMore]);

  // Update audienceSelections when selectedFilters changes (but don't trigger fetch)
  useEffect(() => {
    if (selectedFilters.length > 0 && audienceTree.length > 0) {
      const identityIds = selectedFilters
        .map((filter) => {
          const id = getIdentityIdFromLabel(filter);
          return id;
        })
        .filter((id) => id !== null);

      setAudienceSelections((prev) => ({
        ...prev,
        identityIds: new Set(identityIds),
      }));
    } else {
      setAudienceSelections((prev) => ({
        ...prev,
        identityIds: new Set(),
      }));
    }
  }, [selectedFilters, audienceTree, getIdentityIdFromLabel]);

  const filtersProps = {
    setShowTotalCount,
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
    goalId,
    setGoalId,
    goals,
    role,
    setRole,

    // products
    price,
    setPrice,

    // services
    serviceType,
    setServiceType,
    priceType,
    setPriceType,
    viewOnlyConnections,
    setViewOnlyConnections,
    deliveryTime,
    setDeliveryTime,

    // shared
    experienceLevel,
    setExperienceLevel,
    locationType,
    setLocationType,

    // jobs
    jobType,
    setJobType,
    workMode,
    setWorkMode,

    // tourism
    postType,
    setPostType,
    season,
    setSeason,
    budgetRange,
    setBudgetRange,

    // funding
    fundingGoal,
    setFundingGoal,
    amountRaised,
    setAmountRaised,
    currency,
    setCurrency,
    deadline,
    setDeadline,

    // events
    eventType,
    setEventType,
    date,
    setDate,
    registrationType,
    setRegistrationType,

    // Audience Tree props
    audienceTree,
    audienceSelections,
    setAudienceSelections,

    // industries
    selectedIndustries,
    setSelectedIndustries,

    categories,
    countries,
    onApply: () => setMobileFiltersOpen(false),
  };

  const renderMiddle = () => {
    const showSkeleton = loadingFeed || (!hasFetchedOnce && items.length === 0);

    if (fetchError) {
      return (
        <FeedErrorRetry
          onRetry={() => {
            setFetchError(false);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
            fetchFeed();
          }}
          message="Failed to load feed. Trying to connect..."
          buttonText="Try Again"
        />
      );
    }

    return (
      <>
        {showSkeleton && (
          <div className="min-h-[160px] grid text-gray-600">
            {currentPage=="companies" ?  <CompanySkeletonLoader/> : <CardSkeletonLoader /> }
          </div>
        )}

        {!showSkeleton && showTotalCount ? (
          <div className="text-sm text-gray-600">
            {totalCount} result{totalCount === 1 ? "" : "s"}
          </div>
        ) : null}

        {!showSkeleton && hasFetchedOnce && items.length === 0 && (
          <EmptyFeedState activeTab="All" />
        )}

        <div
          className={`grid grid-cols-1 mt-3 ${
            currentPage!="people" ? "sm:grid-cols-1" : "lg:grid-cols-2 xl:grid-cols-3"
          } gap-6`}
        >
          {!showSkeleton &&
            items.map((item) => (
              <PeopleProfileCard
                type={currentPage=="people" ? "grid" : "list"}
                key={item.id || item.userId || item.profileId || Math.random()}
                tyle={'list'} /* preserving your prop name as-is */
                {...item}
                matchPercentage={item.matchPercentage}
              />
            ))}
        </div>
        {!showSkeleton && hasMore && (
          <div ref={loadMoreRef} className="h-10 w-full">
            {loadingMore && (
              <div className="text-center text-sm text-gray-500 py-4">Loading more…</div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <DefaultLayout>
      <Header />
      <main
        className={`mx-auto ${
          data._openPopUps.profile ? "relative z-50" : ""
        } max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6`}
      >
        <MobileSearchBar
          query={query}
          setQuery={setQuery}
          placeholder={currentPage != "people" ? "Search for companies" :"Search for people..."}
          onFilterClick={() => setMobileFiltersOpen(true)}
        />

        <aside className="scrollable-container lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <div className="_sticky top-0 z-10 _bg-white">
            <FiltersCard
              {...filtersProps}
              selectedFilters={selectedFilters}
              from={"people"}
              showAudienceFilters={true}
              isFromCompany={currentPage=="companies"}
              catComponent={   <TopFilterButtons isFromCompany={currentPage=="companies"}
              from={"people"}
              loading={loadingFeed} 
              selected={selectedFilters}
              setSelected={setSelectedFilters}
              buttons={
                currentPage == "people"
                  ? [
                      "Entrepreneurs",
                      "Business Owners / Businesses",
                      "Social Entrepreneurs",
                      "Professionals",
                      "Freelancers",
                      "Students",
                      "Government Officials",
                      "Investors",
                      "Executives",
                    ]
                  : [
                      "Companies",
                      "NGOs/NPOs",
                      "Government / Public Sector",
                      "Educational & Research",
                      "Healthcare",
                      "International / Intergovernmental",
                      "Hybrid / Special",
                    ]
              }
            />
           }

           
            />
          </div>

          {/**   <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { hide:true, label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Share a Job Opening", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
              { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
              { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/experiences/create") },
             ]} />
          <ProfileCard /> */}
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-4 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-4 w-full overflow-hidden">
         
            <div className="flex items-center justify-end gap-x-2 flex-wrap ">
              {/**  <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab}  items={[
                    { label: "Share a Job Opening", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                    { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                    { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/experiences/create") },
                  ]} /> */}
            </div>

            {activeTab === "My Connections" && (
              <div className="mb-3">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Connection Requests
                    </h4>
                    <p className="text-xs text-gray-500">
                      View pending requests you sent or received
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPendingRequests(!showPendingRequests)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm border ${
                      showPendingRequests
                        ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {showPendingRequests ? "Showing Pending" : "Show Pending"}
                  </button>
                </div>
              </div>
            )}

            {renderMiddle()}
          </section>

          <aside className="lg:col-span-2 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto hidden">
            {loadingSuggestions ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                Loading suggestions…
              </div>
            ) : (
              <SuggestedMatches matches={matches} nearby={nearby} />
            )}
          </aside>
        </div>
      </main>

      <MobileFiltersBottomSheet
        isOpen={mobileFiltersOpen}
              onClose={() => setMobileFiltersOpen(false)}
              {...filtersProps}
              selectedFilters={selectedFilters}
              from={"people"}
              isFromCompany={currentPage=="companies"}
              showAudienceFilters={true}
              catComponent={   <TopFilterButtons
              from={"people"}
              isFromCompany={currentPage=="companies"}
              loading={loadingFeed}
              selected={selectedFilters}
              setSelected={setSelectedFilters}
              buttons={
                currentPage == "people"
                  ? [
                      "Entrepreneurs",
                      "Business Owners / Businesses",
                      "Social Entrepreneurs",
                      "Professionals",
                      "Freelancers",
                      "Students",
                      "Government Officials",
                      "Investors",
                      "Executives",
                    ]
                  : [
                      "Companies",
                      "NGOs/NPOs",
                      "Government / Public Sector",
                      "Educational & Research",
                      "Healthcare",
                      "International / Intergovernmental",
                      "Hybrid / Special",
                    ]
              }
            />
           }

      />
    </DefaultLayout>
  );
}
