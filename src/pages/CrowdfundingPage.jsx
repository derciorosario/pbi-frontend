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
import CrowdfundCard from "../components/CrowdfundCard";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function CrowdfundingPage() {
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
        tab: "funding",
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
          <div className="min-h-[160px] grid place-items-center text-gray-600">
             <FullPageLoader notFull={true}/>
          </div>
        )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

        {!loadingFeed &&
          items.map((p) => (
          <CrowdfundCard key={p.id} item={p} />
        ))}
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
            { label: "Post an Funding Project", Icon: PlusCircle, path: "/funding/create" }
          ]} />
         
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-6 gap-6">
          <section className="lg:col-span-4 space-y-4 mt-5">
          
           <div className="flex items-center justify-between gap-y-2 flex-wrap">
              <h3 className="font-semibold text-2xl mt-1">Your Path to Knowledge</h3>
          
            <TabsAndAdd tabs={[]} activeTab={activeTab} setActiveTab={setActiveTab} btnClick={()=>navigate('/fundings/create')} />
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
