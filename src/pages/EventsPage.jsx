import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import client from "../api/client";

import Header from "../components/Header";
import MobileFiltersButton from "../components/MobileFiltersButton";
import TabsAndAdd from "../components/TabsAndAdd";
import MobileFiltersBottomSheet from "../components/MobileFiltersBottomSheet";
import ProfileCard from "../components/ProfileCard";
import QuickActions from "../components/QuickActions";
import FiltersCard from "../components/FiltersCard";
import SuggestedMatches from "../components/SuggestedMatches";
import EventCard from "../components/EventCard";
import JobCard from "../components/JobCard";
import NeedCard from "../components/NeedCard";
import MomentCard from "../components/MomentCard";
import EmptyFeedState from "../components/EmptyFeedState";
import FeedErrorRetry from "../components/FeedErrorRetry";
import { AlarmClock, Calendar, CalendarPlus, MessageSquare, Pencil, PlusCircle, Rocket, Search, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import DefaultLayout from "../layout/DefaultLayout";
import { useData } from "../contexts/DataContext";
import PageTabs from "../components/PageTabs";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import TopFilterButtons from "../components/TopFilterButtons";
import { useAuth } from "../contexts/AuthContext";
import PostComposer from "../components/PostComposer";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("Suggested for You");
  const tabs = useMemo(() => ["Suggested for You", "Events to Attend"], []);
  const navigate=useNavigate()
  const data=useData()
  const {user} = useAuth()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();
  const [view,setView]=useState('list')
  let view_types=['grid','list']
  const from = "events"; // Define the 'from' variable

  const [generalTree, setGeneralTree] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState({});

  const [eventsView,setEventsView]=useState('')

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

  
    const [audienceTree, setAudienceTree] = useState([]);
    // Audience Tree
    const [audienceSelections, setAudienceSelections] = useState({
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    });
  
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
    const [registrationType, setRegistrationType] = useState("");
  
    // Industries
    const [selectedIndustries, setSelectedIndustries] = useState([]);
  

  // Metadados
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [goals, setGoals] = useState([]);

  // Feed
  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [totalCount, setTotalCount] = useState(0); // <-- add this
  const [showTotalCount,setShowTotalCount] = useState(0)
  const [selectedFilters,setSelectedFilters]=useState([])
  const [filterOptions,setFilterOptions]=useState([])
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef(null);

  // Sugestões
  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mobile filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Request cancellation refs
  const abortControllerRef = useRef(null);
  const lastRequestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasLoadedOnce = useRef(false);
  const lastParamsRef = useRef({});
  const fetchTimeoutRef = useRef(null);

  // Fetch meta
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
        setCountries(data.countries || []);
        setGoals(data.goals || [])
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    })();
  }, []);

    useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        // Expecting data.identities: same structure you shared
        setAudienceTree(data.identities);
      } catch (error) {
        console.error("Error loading identities:", error);
      }
    })();
  }, []);

  // Fixed fetchFeed with request cancellation
  const fetchFeed = useCallback(async () => {
    if (activeTab !== "Suggested for You") return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Use a request ID to track the most recent request
    const requestId = Date.now();
    lastRequestIdRef.current = requestId;
    
    if (isFetchingRef.current) {
      console.log('Canceling previous request');
    }
    
    isFetchingRef.current = true;
    setLoadingFeed(true);
    
    try {
      const params = {
        tab: "events",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,
        role:role || undefined,
        // include ALL filters so backend can leverage them when needed:
        // products
        price: price || undefined,
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

        eventsView: eventsView || undefined,

        // Include selected categories as IDs
        generalCategoryIds: selectedFilters.filter(id =>
          generalTree.some(category => category.id === id)
        ).join(',') || undefined,
        
        // Include selected subcategories as IDs
        generalSubcategoryIds: Object.keys(selectedSubcategories)
          .filter(key => selectedSubcategories[key])
          .join(',') || undefined,

        audienceIdentityIds: Array.from(audienceSelections.identityIds).join(',') || undefined,
        audienceCategoryIds: Array.from(audienceSelections.categoryIds).join(',') || undefined,
        audienceSubcategoryIds: Array.from(audienceSelections.subcategoryIds).join(',') || undefined,
        audienceSubsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds).join(',') || undefined,
        industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
        limit: 20,
        offset: 0,
      };
      
      const { data } = await client.get("/feed", { 
        params,
        signal: abortControllerRef.current.signal 
      });
      
      // Only update state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalCount(
          typeof data.total === "number"
            ? data.total
            : Array.isArray(data.items) ? data.items.length : 0
        );
        setFetchError(false);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was canceled');
        return;
      }
      console.error("Failed to load feed:", error);
      // Only update state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        setItems([]);
        setFetchError(true);
        // Automatic retry after 3 seconds
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          fetchFeed();
        }, 3000);
      }
    } finally {
      // Only reset fetching state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        isFetchingRef.current = false;
        setLoadingFeed(false);
        abortControllerRef.current = null;
      }
    }
    
    if (requestId === lastRequestIdRef.current) {
      data._scrollToSection('top',true);
    }
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,role,  // NEW deps:
        audienceSelections,
    eventsView,
    price,
    serviceType,
    priceType,
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
    selectedSubcategories,
    selectedFilters,
    selectedIndustries,
    generalTree,
    data]);

  // Improved useEffect for triggering fetches
  useEffect(() => {
    const currentParams = JSON.stringify({
      activeTab,
      debouncedQ,
      country,
      city,
      categoryId,
      subcategoryId,
      goalId,
      role,
      audienceSelections: {
        identityIds: [...audienceSelections.identityIds].sort(),
        categoryIds: [...audienceSelections.categoryIds].sort(),
        subcategoryIds: [...audienceSelections.subcategoryIds].sort(),
        subsubCategoryIds: [...audienceSelections.subsubCategoryIds].sort(),
      },
      price,
      serviceType,
      priceType,
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
      eventsView,
      date,
      registrationType,
      selectedFilters: [...selectedFilters].sort(),
      selectedIndustries: [...selectedIndustries].sort(),
      selectedSubcategories: JSON.stringify(selectedSubcategories),
    });

    if (currentParams === lastParamsRef.current) return;
    lastParamsRef.current = currentParams;

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      fetchFeed();
    } else {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 300); // Slightly longer debounce for better UX
    }

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
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
    audienceSelections,
    price,
    serviceType,
    priceType,
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
    selectedFilters,
    selectedIndustries,
    selectedSubcategories,
    fetchFeed,
  ]);

  // Fetch suggestions (sempre mostramos na direita)
  useEffect(() => {
    (async () => {
      setLoadingSuggestions(true);
      try {
        const params = {
          q: debouncedQ || undefined,
          country: country || undefined,
          city: city || undefined,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          goalId: goalId || undefined,
          role:role || undefined,
          industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
          limit: 40,
        };
        const { data } = await client.get("/feed/suggestions", { params });
        setMatches(data.matches || []);
        setNearby(data.nearby || []);
      } catch (e) {
        console.error("Failed to load suggestions:", e);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [debouncedQ, country, city, categoryId, subcategoryId, goalId, role, selectedIndustries]);

   // State declarations moved to the top of the component
   
   // Handler for subcategory changes
   const handleSubcategoryChange = (subcategories) => {
     setSelectedSubcategories(subcategories);
     // No need to trigger fetchFeed here, it will be triggered by the dependency array
   };
   
   const filtersProps = {
    setShowTotalCount,
    audienceSelections,
    setAudienceSelections,
    audienceTree,
    generalTree,
    selectedFilters,
    setSelectedFilters,
    onSubcategoryChange: handleSubcategoryChange,

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
    goals,
    role,
    setRole,
    setGoalId,
    categories,
    countries,

    // products
    price,
    setPrice,

    // services
    serviceType,
    setServiceType,
    priceType,
    setPriceType,
    deliveryTime,
    setDeliveryTime,

    eventsView,
    setEventsView,

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

    // industries
    selectedIndustries,
    setSelectedIndustries,

    onApply: () => setMobileFiltersOpen(false),
  };

   
   // Create a mapping of category IDs to names for display
   const [categoryIdToNameMap, setCategoryIdToNameMap] = useState({});
   
   useEffect(() => {
     // Map category IDs to names for display in buttons
     const idToNameMap = {};
     generalTree.forEach(category => {
       idToNameMap[category.id] = category.name;
     });
     setCategoryIdToNameMap(idToNameMap);
     
     // Set filter options as category IDs
     setFilterOptions(generalTree.map(i => i.id));
   }, [generalTree]);
  

  const renderMiddle = () => {
    if (activeTab !== "Suggested for You") {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          {activeTab} tab uses its own API route. Render the specific list here.
        </div>
      );
    }

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
        {loadingFeed && (
          <div className="min-h-[160px] grid text-gray-600">
             <CardSkeletonLoader columns={1}/>
          </div>
        )}

          {(!loadingFeed && showTotalCount) && (
            <div className="text-sm text-gray-600">
              {totalCount} result{totalCount === 1 ? "" : "s"}
            </div>
          )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        

        
            
          {!loadingFeed && (
               <div
                 className={`grid grid-cols-1 ${
                   view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-3"
                 } gap-6`}
               >
                 {items?.map((item) => {
                   if (item.kind === "event") {
                     return <EventCard type={view} key={`event-${item.id}`} matchPercentage={item.matchPercentage} e={item} />;
                   }
                   if (item.kind === "need") {
                     return (
                       <NeedCard
                         type={view}
                         key={`need-${item.id}`}
                         matchPercentage={item.matchPercentage}
                         need={{
                           ...item,
                           categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
                           subcategoryName: categories
                             .find((c) => String(c.id) === String(item.categoryId))
                             ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
                         }}
                       />
                     );
                   }
                   if (item.kind === "moment") {
                     return (
                       <MomentCard
                         type={view}
                         key={`moment-${item.id}`}
                         matchPercentage={item.matchPercentage}
                         moment={{
                           ...item,
                           categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
                           subcategoryName: categories
                             .find((c) => String(c.id) === String(item.categoryId))
                             ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
                         }}
                       />
                     );
                   }
                   if (item.kind === "job") {
                     return <JobCard key={`job-${item.id}`} job={item} />;
                   }
                   return null;
                 })}
               </div>
          )}

      </>
    );
  };

  return (
   <DefaultLayout>
     <Header />
      <main className={`mx-auto ${data._openPopUps.profile ? 'relative z-50':''} max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6`}>
        <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

        <aside className="lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
         <div className="_sticky top-0 z-10 _bg-white">
              
              <FiltersCard
                  selectedFilters={selectedFilters}
                  setSelectedFilters={setSelectedFilters}
                  generalTree={generalTree}
                  {...filtersProps}
                  from={"events"}
                  catComponent={ <TopFilterButtons
                  selected={selectedFilters}
                  setSelected={setSelectedFilters}
                  buttons={filterOptions}
                  buttonLabels={categoryIdToNameMap}
                  from={from}
                  loading={loadingFeed}
              />}
            /> 
          </div>

          <QuickActions title="Quick Actions" items={[
            { label: "Edit Profile", Icon: Pencil,onClick: () => navigate("/profile") },
            { label: "Host an Event", Icon: PlusCircle, onClick: () => navigate("/events/create"),hide:user?.accountType=="individual" },
            { label: "Highlight an event", Icon: PlusCircle, onClick: () => navigate("/moment/event/create"),hide:user?.accountType=="company"},
            { label: "Find events", Icon: PlusCircle, onClick: () => navigate("/need/event/create"),hide:user?.accountType=="company"},
          ]} />

          <ProfileCard />
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="flex items-center flex-wrap w-full justify-between mb-4">
             
             <PostComposer
                from="event"
                typeOfPosts={[
                  { label: "Host an Event", Icon: CalendarPlus, hide: user?.accountType === "individual", type: "main" },
                  { label: "Find events", Icon: Search, hide: user?.accountType === "company" },
                  { label: "Highlight an event", Icon: Star},
                ]}
              />

            </div>
            <section className="space-y-4 overflow-hidden">
              {renderMiddle()}
            </section>
          </div>
          <aside className="lg:col-span-1 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            <SuggestedMatches loading={loadingSuggestions} matches={matches} nearby={nearby} />
          </aside>
        </div>
      </main>

      <MobileFiltersBottomSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
          selectedFilters={selectedFilters}
                  setSelectedFilters={setSelectedFilters}
                  generalTree={generalTree}
                  {...filtersProps}
                  from={"events"}
                  catComponent={ <TopFilterButtons
                  selected={selectedFilters}
                  setSelected={setSelectedFilters}
                  buttons={filterOptions}
                  buttonLabels={categoryIdToNameMap}
                  from={from}
                  loading={loadingFeed}
              />}
            /> 
   </DefaultLayout>
  );
}