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
import PeopleProfileCard from "./PeopleCards";
import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../contexts/AuthContext";
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
        setGoals(data.goals || []);
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    })();
  }, []);

  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre “all”
      const params = {
        tab: "all",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId:goalId || undefined,
        role:role || undefined,
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
      const { data } = await client.get(activeTab == "Posts" ? "/feed" : '/people', { params });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
    } finally {
      setLoadingFeed(false);
    }
    data._scrollToSection('top',true);
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,role,showPendingRequests,  // NEW deps:
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
          role:role || undefined,
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
  }, [debouncedQ, country, city, categoryId, subcategoryId, goalId,role]);

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
        

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        {/** <PageTabs view={view} loading={loadingFeed} setView={setView} view_types={view_types}/>  

 */}
        
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

        <aside className="lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { hide:true, label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
              { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
              { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/expirience/create") },
             ]} />
          <ProfileCard />
           <div className="_sticky top-0 z-10 bg-white">
            <FiltersCard {...filtersProps} from={"people"}/>
          </div>
         
        </aside>
    <div className="lg:col-span-9 grid lg:grid-cols-4 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-4">
           <div className="flex items-center justify-between gap-x-2 flex-wrap ">
             <h3 className="font-semibold text-2xl mt-1">Connect with the World</h3>
            
            <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab}  items={[
                { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/expirience/create") },
               ]} />
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
