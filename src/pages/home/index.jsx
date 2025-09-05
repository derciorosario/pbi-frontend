import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import I from "../../lib/icons.jsx";

import MobileFiltersButton from "../../components/MobileFiltersButton.jsx";
import MobileFiltersBottomSheet from "../../components/MobileFiltersBottomSheet.jsx";
import FiltersCard from "../../components/FiltersCard.jsx";
import TabsAndAdd from "../../components/TabsAndAdd.jsx";
import SuggestedMatches from "../../components/SuggestedMatches.jsx";
import EventCard from "../../components/EventCard.jsx";
import JobCard from "../../components/JobCard.jsx";
import Header from "../../components/Header.jsx";
import EmptyFeedState from "../../components/EmptyFeedState.jsx";
import FullPageLoader from "../../components/ui/FullPageLoader.jsx";
import { useData } from "../../contexts/DataContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DefaultLayout from "../../layout/DefaultLayout.jsx";
import QuickActions from "../../components/QuickActions.jsx";
import { Pencil, PlusCircle, Rocket } from "lucide-react";
import ProfileCard from "../../components/ProfileCard.jsx";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function HomePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const tabs = useMemo(() => ["All", "Events", "Job Opportunities"], []);

  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [goals, setGoals] = useState([]);

  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const data=useData()

  const {user}=useAuth()

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
        setCountries(data.countries || []);
        setGoals(data.goals || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingFeed(true);
      try {
        const tabParam =
          activeTab === "Events" ? "events" : activeTab === "Job Opportunities" ? "jobs" : "all";

        const params = {
          tab: tabParam,
          q: debouncedQ || undefined,
          country: country || undefined,
          city: city || undefined,
          goalId:goalId || undefined,
          role:role || undefined,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          limit: 20,
          offset: 0,
        };

        const { data } = await client.get("/feed", { params });
        setItems(data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFeed(false);
      }
    })();
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, role]);

  useEffect(() => {
    (async () => {
      setLoadingSuggestions(true);
      try {
        const params = {
          q: debouncedQ || undefined,
          country: country || undefined,
          city: city || undefined,
          goalId:goalId || undefined,
          role:role || undefined,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          limit: 10,
        };
        const { data } = await client.get("/feed/suggestions", { params });
        setMatches(data.matches || []);
        setNearby(data.nearby || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [debouncedQ, country, city, categoryId, subcategoryId, role, goalId]);

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
    categories,
    countries,
    role,
    setGoalId,
    setRole,
    goalId,
    goals,
    onApply: () => setMobileFiltersOpen(false),
  };

  return (
    <DefaultLayout>
     <Header page={'feed'}/>

      <section className={`relative overflow-visible ${user?.id ? "hidden" : ""}`}>
  {/* Hero Gradient */}
  <div className="relative bg-gradient-to-r  from-[#004182]  to-[#0a66c2]








">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 text-white">
          <h1 className="text-[42px] md:text-6xl font-extrabold leading-[1.05]">
            Connect
            <br />
            Globally
          </h1>
          <p className="mt-5 max-w-xl text-white/90 text-lg">
            The largest Pan-African networking platform for professionals,
            freelancers, and entrepreneurs. Discover opportunities, connect with
            talent, and grow your business.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="rounded-xl px-6 py-3 font-semibold text-brand-600 bg-white shadow-sm"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate("/people")}
              className="rounded-xl px-6 py-3 font-semibold border border-white/60 text-white hover:bg-white/10"
            >
              <a>Explore</a>
            </button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <img
            alt="networking"
            className="w-full rounded-[28px] object-cover aspect-[16/9] shadow-xl"
            src="https://theblackrise.com/wp-content/uploads/2023/11/AdobeStock_257397505-scaled.jpeg"
          />
        </div>
      </div>
    </div>
  </div>

  {/* Hero Filters: Tabs + Country / City / Category + Search */}
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-30">
    <div className="-mt-10 md:-mt-14 lg:-mt-16 w-full lg:w-[720px] relative z-30">
      <div className="rounded-[22px] bg-white shadow-xl ring-1 ring-black/5 p-4 md:p-5 relative z-30">
        {/* Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 border-b">
          {["All", "Events", "Job Opportunities"].map((tab) => (
            <button
              key={tab}
              className={`pb-3 relative ${
                activeTab === tab ? "text-gray-900" : "hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute left-0 -bottom-[1px] h-[3px] w-full rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>

        {/* Three controls: Country, City, Category */}
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-gray-500">Country</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={country || ""}
              onChange={(e) => setCountry(e.target.value || undefined)}
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-gray-500">City</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="City"
              value={city || ""}
              onChange={(e) => setCity(e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-500">Category</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={categoryId || ""}
              onChange={(e) => {
                const v = e.target.value || "";
                setCategoryId(v || undefined);
                setSubcategoryId(undefined);
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search row */}
        <div className="mt-3">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-2">
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search by skills, location, or interest..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-semibold shadow bg-brand-600 hover:bg-brand-700">
              <I.search /> Search
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-[22px] h-6 bg-black/0 shadow-[0_20px_35px_-25px_rgba(0,0,0,0.35)] relative z-20" />
    </div>
  </div>
</section>


      <main id="explore" className={`mx-auto ${data._openPopUps.profile ? 'relative z-50':''} max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative`}>
        <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

        <div className="grid lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <ProfileCard />
            <div className="_sticky top-0 mb-2">
              <FiltersCard {...filtersProps} />
            </div>
             <QuickActions title="Quick Actions" items={[
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
              { label: "Post an Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
            ]} />

          </aside>

          <section className="lg:col-span-6 space-y-4">

          <section className="lg:col-span-4 space-y-4">
            <h3 className="font-semibold text-2xl mt-1">Connect with the World</h3>
           
              <TabsAndAdd tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}  items={[
                { label: "Post an Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/expirience/create") },
                { label: "Create News Article", Icon: PlusCircle, onClick: () => navigate("/news/create") },
            ]} />
          </section>
            
            {loadingFeed && (
              <FullPageLoader notFull={true}/>
            )}

           {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab={activeTab} />}


            {!loadingFeed &&
              items.map((item) => {
                if (item.kind === "job") {
                  return (
                    <JobCard
                      key={`job-${item.id}`}
                      job={{
                        ...item,
                        categoryName:
                          categories.find((c) => String(c.id) === String(item.categoryId))?.name,
                        subcategoryName:
                          categories
                            .find((c) => String(c.id) === String(item.categoryId))
                            ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
                      }}
                    />
                  );
                }
                return <EventCard key={`event-${item.id}`} e={item} />;
              })}
          </section>

          <aside className="lg:col-span-3 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
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
