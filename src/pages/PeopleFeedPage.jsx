import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import EmptyFeedState from "../components/EmptyFeedState";
import { Pencil, PlusCircle, Rocket } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import PeopleProfileCard from "./PeopleCards";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import PageTabs from "../components/PageTabs";
import TopFilterButtons from "../components/TopFilterButtons";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function PeopleFeedPage() {
  const {user}=useAuth()
  const [activeTab, setActiveTab] = useState("People");
  const data=useData()
  
  const tabs = useMemo(() => {
    const base = ["Posts", "People", "News & Articles"];
    if (user) base.splice(2, 0, "My Connections"); // insert before News
    return base;
  }, [user]);

  const navigate=useNavigate()
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
  const [view,setView]=useState('grid')
  let view_types=['grid','list']
  const {pathname}=useLocation()


  const currentPage=pathname.includes('/people')  ? 'people': 'companies'

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
  const [showTotalCount,setShowTotalCount] = useState(0)

  // Sugestões
  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mobile filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Selected filters for TopFilterButtons
  const [selectedFilters,setSelectedFilters]=useState([])

  // Map button labels to identity IDs
  const getIdentityIdFromLabel = useCallback((label) => {
    if (!audienceTree.length) return null;
    for (const identity of audienceTree) {
      if (identity.name === label || identity.name.toLowerCase() === label.toLowerCase()) {
        return identity.id;
      }
    }
    return null;
  }, [audienceTree]);

  // Fetch meta
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
        setCountries(data.countries || []);
        setGoals(data.goals || []);
        
        // Set audience tree data for AudienceTree component
        // This assumes the API returns identities with categories and subcategories
       
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let type=currentPage=="people" ? 'individual' :'company'
      try {
        const { data } = await client.get("/public/identities", {
        params: { type }
        });
        // Expecting data.identities: same structure you shared
        setAudienceTree(data.identities);
      } catch (error) {
        console.error("Error loading identities:", error);
      }
    })();
  }, [currentPage]);

  // Use a ref to track if we're in the middle of updating audience selections
  const isUpdatingAudienceRef = React.useRef(false);

  useEffect(() => {
    // Only fetch if we're not in the middle of an audience update
    if (!isUpdatingAudienceRef.current) {
      fetchFeed();
    }
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, role, showPendingRequests,
    selectedFilters,
    audienceSelections,
    // NEW deps:
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
    selectedIndustries]);

  // Update audienceSelections when selectedFilters changes
  useEffect(() => {
    // Set the ref to true to prevent double fetching
    isUpdatingAudienceRef.current = true;

    if (selectedFilters.length > 0 && audienceTree.length > 0) {
      const identityIds = selectedFilters
        .map(filter => {
          const id = getIdentityIdFromLabel(filter);
          return id;
        })
        .filter(id => id !== null);

      setAudienceSelections(prev => ({
        ...prev,
        identityIds: new Set(identityIds)
      }));
    } else {
      setAudienceSelections(prev => ({
        ...prev,
        identityIds: new Set()
      }));
    }

    // Reset the ref after the state update
    setTimeout(() => {
      isUpdatingAudienceRef.current = false;
    }, 0);
  }, [selectedFilters, audienceTree, getIdentityIdFromLabel]);

  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre “all”
      const params = {
        accountType: currentPage=="people" ? 'individual' :'company',
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId:goalId || undefined,
        role:role || undefined,
        
        // Add audience selections to the API request
        identityIds: Array.from(audienceSelections.identityIds).join(',') || undefined,
        audienceCategoryIds: Array.from(audienceSelections.categoryIds).join(',') || undefined,
        audienceSubcategoryIds: Array.from(audienceSelections.subcategoryIds).join(',') || undefined,
        audienceSubsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds).join(',') || undefined,
        industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
        connectionStatus:activeTab=="My Connections" && showPendingRequests ? 'outgoing_pending,incoming_pending' :  activeTab=="My Connections" && !showPendingRequests ? 'connected' : null,

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

        limit: 20,
        offset: 0,
      };
      const { data } = await client.get('/people', { params });
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalCount(
        typeof data.total === "number"
          ? data.total
          : Array.isArray(data.items) ? data.items.length : 0
      ); 
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
    } finally {
      setLoadingFeed(false);
    }
    data._scrollToSection('top',true);
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, role, showPendingRequests,
    // Audience selections
    audienceSelections,
    // NEW deps:
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
    selectedIndustries,]);


  // Fetch suggestions (sempre mostramos na direita)

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
   
    return (
      <>
        {loadingFeed && (
         <div className="min-h-[160px] grid text-gray-600">
          <CardSkeletonLoader/>
        </div>
                   
        )}
        


          {(!loadingFeed && showTotalCount) && (
            <div className="text-sm text-gray-600">
              {totalCount} result{totalCount === 1 ? "" : "s"}
            </div>
          )}

          
          {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}


          <div
                           className={`grid grid-cols-1 mt-3 ${
                             view == "list" ? "sm:grid-cols-1" : "lg:grid-cols-2 xl:grid-cols-3"
                           } gap-6`}
                         >
                           {!loadingFeed && items.map((item) => (
                              <PeopleProfileCard tyle={view} {...item}  matchPercentage={item.matchPercentage}/>
                            ))
                          }

          </div>

      
      </>
    );
  };

  return (
    <DefaultLayout>
      
      <Header />

      <main className={`mx-auto ${data._openPopUps.profile ? 'relative z-50':''} max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6`}>
        <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

        <aside  className="scrollable-container lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <div className="_sticky top-0 z-10 _bg-white">
            <FiltersCard selectedFilters={selectedFilters} {...filtersProps} from={"people"}/>
          </div>
       
       {/**   <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { hide:true, label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
              { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
              { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/experiences/create") },
             ]} />
          <ProfileCard /> */}
         
        </aside>
    <div className="lg:col-span-9 grid lg:grid-cols-4 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-4 w-full overflow-hidden">
         
             <TopFilterButtons from={"people"} selected={selectedFilters} setSelected={setSelectedFilters}
                buttons={
                currentPage == "people"
                  ? [
                      "Entrepreneur (Startups)",
                      "Established Entrepreneurs / Businesses",
                      "Social Entrepreneurs",
                      "Professional",
                      "Freelancers",
                      "Students",
                      "Government Officials",
                      "Investor",
                    ]
                  : [
                    "Business & Technology",
                    "Health & Insurance",
                    "Finance & Banking",
                    "Retail & Consumer Goods",
                    "Energy & Utilities",
                    "Real Estate & Construction",
                    "Media & Entertainment",
                    "Non-Profit Organizations",
                    "Government & Public Sector",
                    "Educational & Research Organizations",
                    "Healthcare Organizations",
                    "International & Intergovernmental Organizations",
                    "Hybrid / Special Organizations"
                  ]

              }/>
              <div className="flex items-center justify-end gap-x-2 flex-wrap ">
              {/**  <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab}  items={[
                    { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                    { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                    { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/experiences/create") },
                  ]} /> */}
           </div>

          {activeTab === "My Connections" && (
          <div className="mb-3">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">Connection Requests</h4>
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
        filtersProps={filtersProps}
      />
  
    </DefaultLayout>
  );
}
