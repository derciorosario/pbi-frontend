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
import ProductCard from "../components/ProductCard";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}



export default function ProductsPage() {
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

  const products = [
  {
    id: 1,
    image: "https://i.ibb.co/j5PzN9R/handbag.jpg",
    title: "Premium Leather Handbags",
    description: "Handcrafted leather bags with traditional African patterns.",
    price: 149,
    location: "Lagos, Nigeria",
    rating: 4.8,
    reviews: 24,
    featured: true,
  },
  {
    id: 2,
    image: "https://i.ibb.co/kS8n2GN/coffee.jpg",
    title: "Organic Coffee Beans",
    description: "Premium roasted coffee beans from Ethiopian highlands.",
    price: 32,
    location: "Addis Ababa",
    rating: 4.9,
    reviews: 156,
  },
  {
    id: 3,
    image: "https://i.ibb.co/pLk7Fcf/solar.jpg",
    title: "Solar Charging Station",
    description: "Portable solar-powered mobile device charging solution.",
    price: 89,
    location: "Nairobi, Kenya",
    rating: 4.7,
    reviews: 42,
  },
  {
    id: 4,
    image: "https://i.ibb.co/7V7f8Z7/kente.jpg",
    title: "Traditional Kente Cloth",
    description: "Authentic handwoven kente fabric with traditional patterns.",
    price: 75,
    location: "Accra, Ghana",
    rating: 4.6,
    reviews: 18,
  },
  {
    id: 5,
    image: "https://i.ibb.co/wKzYj2F/shea.jpg",
    title: "Organic Shea Butter Set",
    description: "Natural skincare products made from pure African shea butter.",
    price: 45,
    location: "Tamale, Ghana",
    rating: 4.8,
    reviews: 89,
  },
  {
    id: 6,
    image: "https://i.ibb.co/ygXHjD7/wooden-art.jpg",
    title: "Handcarved Wooden Art",
    description: "Beautiful handcrafted wooden sculptures and decorative pieces.",
    price: 120,
    location: "Cape Town",
    rating: 4.7,
    reviews: 31,
  },
];

  const renderMiddle = () => {

    return (
     <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2  gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            {...p}
            onContact={() => alert(`Contact seller of ${p.title}`)}
            onSave={() => alert(`Saved ${p.title}`)}
          />
        ))}
      </div>
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
            { label: "Post an Event", Icon: PlusCircle, path: "/events/create" },
            { label: "Calendar View", Icon: Calendar, path: "/calendar/create" },
            { label: "Set Reminders", Icon: AlarmClock, path: "/calendar/create" },
        ]} />
         
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-6 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-5">
          
           <div className="flex items-center justify-between gap-y-2 flex-wrap">
              <h3 className="font-semibold text-2xl mt-1">Your Path to Knowledge</h3>
          
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
