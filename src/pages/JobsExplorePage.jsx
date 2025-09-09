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
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import DefaultLayout from "../layout/DefaultLayout";
import { useData } from "../contexts/DataContext";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import PageTabs from "../components/PageTabs";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function PeopleFeedPage() {
  const [activeTab, setActiveTab] = useState("Posts");
  const tabs = useMemo(() => ["Posts", "Job Seeker","Job Offers"], []);
  let view_types=['grid','list']
  const navigate=useNavigate()
  const [view,setView]=useState('grid')
  const data=useData()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();

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
  const [registrationType, setRegistrationType] = useState("Free");


  // Metadados
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

  // Feed
  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Sugestões
  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mobile filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch meta
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
        setCountries(data.countries || []);
     
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

  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    if (activeTab !== "Posts") return;
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre “all”
      const params = {
        tab: "jobs",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,

        identityIds: Array.from(audienceSelections.identityIds).join(',') || undefined,
        audienceCategoryIds: Array.from(audienceSelections.categoryIds).join(',') || undefined,
        audienceSubcategoryIds: Array.from(audienceSelections.subcategoryIds).join(',') || undefined,
        audienceSubsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds).join(',') || undefined,
      

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
      const { data } = await client.get("/feed", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
      
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
    } finally {
      setLoadingFeed(false);
    }
    data._scrollToSection('top',true);
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, 

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
    registrationType,]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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
          limit: 10,
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
  }, [debouncedQ, country, city, categoryId, subcategoryId, goalId]);

  const filtersProps = {
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

    categories,
    countries,

    audienceSelections,
    setAudienceSelections,
    audienceTree,

    onApply: () => setMobileFiltersOpen(false),
  };

  const renderMiddle = () => {
    if (activeTab !== "Posts") {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          {activeTab} tab uses its own API route. Render the specific list here.
        </div>
      );
    }

    return (
      <>
        {loadingFeed && (
          <div className="min-h-[160px] grid  text-gray-600">
             <CardSkeletonLoader/>
          </div>
        )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        <PageTabs view={view} loading={loadingFeed || !items.length} setView={setView} view_types={view_types}/>

      
        
        {!loadingFeed && (
        <div
          className={`grid grid-cols-1 ${
            view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-2 xl:grid-cols-3"
          } gap-6`}
        >
          {items?.map((item) =>
            item.kind === "job" ? (
              <JobCard type={view}  key={`job-${item.id}`} job={item} matchPercentage={item.matchPercentage} />
            ) : item.kind === "event" ? (
              <EventCard key={`event-${item.id}`} e={item} />
            ) : null
          )}
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
           <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { hide:true, label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
            ]} />
          <ProfileCard />
          <div className="_sticky top-0 z-10 bg-white">
            <FiltersCard {...filtersProps} from="jobs"/>
          </div>
         
        </aside>

    
        <div className="lg:col-span-9 grid lg:grid-cols-4 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-4">
            <div className="flex items-center justify-between gap-y-2 flex-wrap">
              <h3 className="font-semibold text-2xl mt-1">Find Your Next Opportunity</h3>
            <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab}  btnClick={()=>navigate('/jobs/create')} />
            </div>
            {renderMiddle()}
          </section>

          {/**<aside className="lg:col-span-2 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            {loadingSuggestions ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                Loading suggestions…
              </div>
            ) : (
              <SuggestedMatches matches={matches} nearby={nearby} />
            )}
          </aside> */}
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
