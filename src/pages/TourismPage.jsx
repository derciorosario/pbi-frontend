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
import { AlarmClock, Calendar, Pencil, PlusCircle, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import DefaultLayout from "../layout/DefaultLayout";
import { useData } from "../contexts/DataContext";
import ExperienceCard from "../components/ExperienceCard";
import PageTabs from "../components/PageTabs";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";

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
  const [view,setView]=useState('grid')
  let view_types=['grid','list']

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();


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
  const [goals, setGoals] = useState([]);

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
        setGoals(data.goals || [])
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    })();
  }, []);

  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    if (activeTab !== "Suggested for You") return;
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre “all”
      const params = {
        tab: "tourism",
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
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,role,  // NEW deps:
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
    goals,
    role,
    setRole,
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
    onApply: () => setMobileFiltersOpen(false),
  };



  const renderMiddle = () => {

    if (activeTab !== "Suggested for You") {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          {activeTab} tab uses its own API route. Render the specific list here.
        </div>
      );
    }

    return (
      <>
       {loadingFeed && (
               <div className="min-h-[160px] grid text-gray-600">
                                      <CardSkeletonLoader/>
                                   </div>
              )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        <PageTabs view={view} loading={loadingFeed || !items.length} setView={setView} view_types={view_types}/>  

               <div
                 className={`grid grid-cols-1 ${
                   view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-2 xl:grid-cols-3"
                 } gap-6`}
               >
                 {!loadingFeed && items.map((exp) => (
                 <ExperienceCard matchPercentage={exp.matchPercentage} type={view} key={exp.id} item={exp} />
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
            { label: "Edit Profile", Icon: Pencil, path: "/profile" },
            { hide:true, label: "Boost Profile", Icon: Rocket, path: "/settings" },
            { label: "Share experience", Icon: PlusCircle, path: "/experiences/create" }
        ]} />

          <ProfileCard />
           <div className="_sticky top-0 z-10 bg-white">
            <FiltersCard {...filtersProps} from={"tourism"} />
          </div>
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-4 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-5">
          
           <div className="flex items-center justify-between gap-y-2 flex-wrap">
              <h3 className="font-semibold text-2xl mt-1">Explore Africa’s Rich Culture & Tourism</h3>
          
            <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab} btnClick={()=>navigate('/experiences/create')} />
            </div>
              {renderMiddle()}
          </section>

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
