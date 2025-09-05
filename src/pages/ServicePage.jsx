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
import ServiceCard from "../components/ServiceCard";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("Suggested for You");
  const tabs = useMemo(() => ["Suggested for You", "Events to Attend"], []);
  const navigate=useNavigate()
  const data=useData()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();

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
        tab: "events",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,
        role:role || undefined,
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
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,role]);

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
    categories,
    countries,
    onApply: () => setMobileFiltersOpen(false),
  };

    const services = [
  {
    id: 1,
    avatar: "https://i.pravatar.cc/100?img=12",
    title: "Mobile App Development",
    description:
      "Expert iOS and Android app development with modern UI/UX design. 5+ years in fintech and e-commerce applications.",
    provider: "Kwame Asante",
    country: "Ghana",
    rating: 4.9,
    reviews: 127,
    price: "$2,500",
    priceUnit: "project",
    type: "Offering",
    tags: ["Mobile Development", "iOS", "Android"],
  },
  {
    id: 2,
    avatar: "https://i.pravatar.cc/100?img=32",
    title: "Digital Marketing Strategy",
    description:
      "Comprehensive digital marketing services including SEO, social media management, and content creation for African businesses.",
    provider: "Amara Diallo",
    country: "Senegal",
    rating: 4.8,
    reviews: 89,
    price: "$800",
    priceUnit: "month",
    type: "Offering",
    tags: ["Digital Marketing", "SEO", "Social Media"],
  },
  {
    id: 3,
    avatar: "https://i.pravatar.cc/100?img=44",
    title: "Financial Consulting",
    description:
      "Expert financial advisory services for startups and SMEs. Specializing in investment planning, modeling, and valuation.",
    provider: "Olumide Adebayo",
    country: "Nigeria",
    rating: 4.9,
    reviews: 156,
    price: "$150",
    priceUnit: "hour",
    type: "Seeking",
    tags: ["Finance", "Consulting", "Investment"],
  },
];


  const renderMiddle = () => {

    return (
            <div className="max-w-4xl mx-auto p-6 space-y-5">
        {services.map((s) => (
            <ServiceCard
            key={s.id}
            {...s}
            onDetails={() => alert(`Details of ${s.title}`)}
            onContact={() => alert(`${s.type} - Contact ${s.provider}`)}
            />
        ))}
        </div>
    )
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
          <div className="min-h-[160px] grid place-items-center text-gray-600">
             <FullPageLoader notFull={true}/>
          </div>
        )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        {!loadingFeed &&
          items.map((item) =>
            item.kind === "job" ? (
              <JobCard key={`job-${item.id}`} job={item} />
            ) : item.kind === "event" ? (
              <EventCard key={`event-${item.id}`} e={item} />
            ) : null
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
          <ProfileCard />
           <div className="_sticky top-0 z-10 bg-white">
            <FiltersCard {...filtersProps} />
          </div>
          
          <QuickActions title="Quick Actions" items={[
            { label: "Edit Profile", Icon: Pencil, path: "/profile" },
            { label: "Boost Profile", Icon: Rocket, path: "/settings" },
            { label: "Post a Service", Icon: PlusCircle, path: "/services/create" },
        ]} />
         
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-6 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-5">
          
           <div className="flex items-center justify-between gap-y-2 flex-wrap">
              <h3 className="font-semibold text-2xl mt-1">Professional Services</h3>
          
            <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab} btnClick={()=>navigate('/events/create')} />
            </div>
              {renderMiddle()}
          </section>

          <aside className="lg:col-span-2 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
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
