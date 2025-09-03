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
  const tabs = useMemo(() => ["Posts", "People", "My Connections", "News & Articles"], []);
  const navigate=useNavigate()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();

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

  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    if (activeTab !== "Posts" && activeTab !== "People") return;
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
        goalId: goalId || undefined,
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
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId]);

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
    categories,
    countries,
    onApply: () => setMobileFiltersOpen(false),
  };

  const renderMiddle = () => {
    if (activeTab !== "Posts" && activeTab !== "People") {
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

          {!loadingFeed && activeTab == "People" && items.map((item) =><PeopleProfileCard {...item}/>)}

      
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6">
        <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

        <aside className="lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <ProfileCard />
           <div className="_sticky top-0 z-10 bg-white">
            <FiltersCard {...filtersProps} />
          </div>
          
          <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Create News Post", Icon: PlusCircle, onClick: () => navigate("/news/create") },
            ]} />
         
        </aside>

    
        <div className="lg:col-span-9 grid lg:grid-cols-6 gap-6">
          <section className="lg:col-span-4 space-y-4">
            <h3 className="font-semibold text-2xl mt-1">Connect with the World</h3>
            <TabsAndAdd tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}  items={[
                { label: "Post an Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/expirience/create") },
                { label: "Create News Article", Icon: PlusCircle, onClick: () => navigate("/news/create") },
            ]} />
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
    </div>
  );
}
