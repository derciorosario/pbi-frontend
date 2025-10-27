import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import I from "../../lib/icons.jsx";
import LoginDialog from "../../components/LoginDialog.jsx";

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
import { CalendarDays, Briefcase, Wrench, Package, Map, PiggyBank, Pencil, PlusCircle, Rocket, ChevronRight } from "lucide-react";
import ProfileCard from "../../components/ProfileCard.jsx";
import ServiceCard from "../../components/ServiceCard.jsx";
import ProductCard from "../../components/ProductCard-1.jsx";
import ExperienceCard from "../../components/ExperienceCard.jsx";
import CrowdfundCard from "../../components/CrowdfundCard.jsx";
import PageTabs from "../../components/PageTabs.jsx";
import CardSkeletonLoader from "../../components/ui/SkeletonLoader.jsx";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

// Small section header with icon + count
function SectionHeader({ icon: Icon, title, subtitle, count, onSeeMore }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-brand-600" />}
          <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
            {title}
          </h3>
          <button
            onClick={onSeeMore}
            className="ml-2 text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 px-0 py-0.5"
            type="button"
          >
            See more <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}

// Grid/List wrapper per section
function SectionGrid({ children, list, wide }) {
  return (
    <div
      className={
        "grid grid-cols-1 gap-6" +
        (list ? " sm:grid-cols-1" : wide ? " sm:grid-cols-3" : " sm:grid-cols-2")
      }
    >
      {children}
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("All");
  const tabs = useMemo(() => ["All", "Events", "Jobs", "Services", "Products", "Experiences", "Funding"], []);

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
  const [totalCount, setTotalCount] = useState(0);
  const [showTotalCount, setShowTotalCount] = useState(0);

  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [audienceTree, setAudienceTree] = useState([]);
  const [audienceSelections, setAudienceSelections] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  const [view, setView] = useState("grid");
  let view_types = ["grid", "list"];

  const data = useData();
  const { user } = useAuth();

  // Titles and icons per kind
  const KIND_META = {
    event: { title: "Events", icon: CalendarDays, subtitle: "Discover amazing events happening out there.", tab: "Events", path: "/events" },
    job: { title: "Jobs", icon: Briefcase, subtitle: "Find Your Next Opportunity", tab: "Jobs", path: "/jobs" },
    service: { title: "Services", icon: Wrench, subtitle: "Professional Services", tab: "Services", path: "/services" },
    product: { title: "Products", icon: Package, subtitle: "Find and engage with innovative products", tab: "Products", path: "/products" },
    tourism: { title: "Experiences", icon: Map, subtitle: "Discover amazing destinations", tab: "Experiences", path: "/experiences" },
    funding: { title: "Opportunities", icon: PiggyBank, subtitle: "Raise funds or back bold ideas", tab: "Funding", path: "/funding" },
  };

  // Group items by kind so the frontend is structured
  const groups = useMemo(() => {
    const g = { event: [], job: [], service: [], product: [], tourism: [], funding: [] };
    (items || []).forEach((it) => {
      if (g[it.kind]) g[it.kind].push(it);
    });
    return g;
  }, [items]);

  // Which sections to show (order). If tab != All, show only that tab's section
  const sectionOrder = ["event", "job", "service", "product", "tourism", "funding"];
  const visibleSections = useMemo(() => {
    if (activeTab === "All") return sectionOrder.filter((k) => (groups[k] || []).length > 0);
    const map = {
      Events: "event",
      Jobs: "job",
      Services: "service",
      Products: "product",
      Experiences: "tourism",
      Funding: "funding",
    };
    const key = map[activeTab] || "event";
    return (groups[key] || []).length ? [key] : [];
  }, [activeTab, groups]);

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
          activeTab === "Events"
            ? "events"
            : activeTab === "Jobs"
            ? "jobs"
            : activeTab === "Services"
            ? "services"
            : activeTab === "Products"
            ? "products"
            : activeTab === "Experiences"
            ? "tourism"
            : activeTab === "Funding"
            ? "funding"
            : "all";

        const params = {
          tab: tabParam,
          q: debouncedQ || undefined,
          country: country || undefined,
          city: city || undefined,
          goalId: goalId || undefined,
          role: role || undefined,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          limit: 20,
          offset: 0,
        };

        const { data } = await client.get("/feed", { params });
        setItems(data.items || []);
        setTotalCount(typeof data.total === "number" ? data.total : Array.isArray(data.items) ? data.items.length : 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingFeed(false);
      }

      data._scrollToSection("top", true);
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
          goalId: goalId || undefined,
          role: role || undefined,
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
    categories,
    countries,
    role,
    setGoalId,
    setRole,
    goalId,
    goals,
    onApply: () => setMobileFiltersOpen(false),
  };

  const renderSection = (kindKey) => {
    const itemsOfKind = groups[kindKey] || [];
    if (!itemsOfKind.length) return null;
    const meta = KIND_META[kindKey];

    const handleSeeMore = () => {
      // Navigate to dedicated page for this section, carrying over current filters
      try {
        const qs = new URLSearchParams();
        if (debouncedQ) qs.set('q', debouncedQ);
        if (country) qs.set('country', country);
        if (city) qs.set('city', city);
        if (categoryId) qs.set('categoryId', categoryId);
        if (subcategoryId) qs.set('subcategoryId', subcategoryId);
        const search = qs.toString();
        navigate(search ? `${meta.path}?${search}` : meta.path);
      } catch {
        // fallback: still switch tab if navigation fails
        setActiveTab(meta.tab);
      }
    };

    return (
      <section key={kindKey} id={`section-${kindKey}`} className="mt-10 first:mt-0 scroll-mt-24">
        <SectionHeader icon={meta.icon} title={meta.title} subtitle={meta.subtitle} count={itemsOfKind.length} onSeeMore={handleSeeMore} />
        <SectionGrid list={view === "list"} wide={!user}>
          {itemsOfKind.slice(0, 4).map((item) => {
            if (kindKey === "job") {
              return (
                <JobCard
                  type={view}
                  key={`job-${item.id}`}
                  matchPercentage={item.matchPercentage}
                  job={{
                    ...item,
                    categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
                    subcategoryName: categories
                      .find((c) => String(c.id) === String(item.categoryId))
                      ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
                  }}
                />
              );
            }
            if (kindKey === "service") {
              return <ServiceCard type={view} key={`service-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
            }
            if (kindKey === "product") {
              return <ProductCard type={view} key={`product-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
            }
            if (kindKey === "tourism") {
              return <ExperienceCard type={view} key={`tourism-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
            }
            if (kindKey === "funding") {
              return <CrowdfundCard type={view} key={`funding-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
            }
            return <EventCard type={view} key={`event-${item.id}`} item={item} e={item} matchPercentage={item.matchPercentage} />;
          })}
        </SectionGrid>
      </section>
    );
  };

  return (
    <>
      <main id="explore" className={`mx-auto ${data._openPopUps.profile ? "relative z-50" : ""} max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative`}>
        <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

        <div className="grid lg:grid-cols-12 gap-6">
          {user && (
            <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
              <div className="_sticky top-0 mb-2">
                <FiltersCard {...filtersProps} />
              </div>
              <QuickActions
                title="Quick Actions"
                items={[
                  { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
                  { hide: true, label: "Boost Profile", Icon: Rocket, onClick: () => navigate("/settings") },
                  { label: "Share a Job Opening", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                ]}
              />
              <ProfileCard />
            </aside>
          )}

          <section className={`${user ? "lg:col-span-8" : "lg:col-span-12"} sprace-y-4`}>
            <section className="lg:col-span-4 space-y-4 flex items-center justify-between gap-y-2 flex-wrap mb-3">
              <PageTabs page={"feed"} view={view} setView={setView} view_types={view_types} />
              <TabsAndAdd
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                items={[
                  { label: "Share a Job Opening", Icon: PlusCircle, onClick: () => navigate("/jobs/create") },
                  { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") },
                  { label: "Share an Experience", Icon: PlusCircle, onClick: () => navigate("/experiences/create") },
                  { label: "Post a Product", Icon: PlusCircle,  onClick: () => navigate("/products/create") },
                  { label: "Post a Service", Icon: PlusCircle,onClick: () => navigate("/services/create") },
                  { label: "Post a Funding Project or Opportunity", Icon: PlusCircle, onClick: () => navigate("/funding/create")}
                ]}
              />
            </section>

            {loadingFeed && <CardSkeletonLoader columns={user ? 2 : 3} />}

            {!loadingFeed && showTotalCount && (
              <div className="text-sm text-gray-600">{totalCount} result{totalCount === 1 ? "" : "s"}</div>
            )}

            {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab={activeTab} />}

            {!loadingFeed && visibleSections.map(renderSection)}
          </section>

          <aside className={`${user ? "lg:col-span-3" : "lg:col-span-4"} hidden sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto`}>
            {loadingSuggestions ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">Loading suggestions…</div>
            ) : (
              <SuggestedMatches matches={matches} nearby={nearby} />
            )}
          </aside>
        </div>
      </main>

      <MobileFiltersBottomSheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} filtersProps={filtersProps} />
    </>
  );
}
