import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import I from "../../lib/icons.jsx";
import LoginDialog from "../../components/LoginDialog.jsx";

import MobileFiltersButton from "../../components/MobileFiltersButton.jsx";
import MobileFiltersBottomSheet from "../../components/MobileFiltersBottomSheet.jsx";
import FiltersCard from "../../components/FiltersCard.jsx";
import PostComposer from "../../components/PostComposer.jsx";
import SuggestedMatches from "../../components/SuggestedMatches.jsx";
import EventCard from "../../components/EventCard.jsx";
import JobCard from "../../components/JobCard.jsx";
import NeedCard from "../../components/NeedCard.jsx";
import MomentCard from "../../components/MomentCard.jsx";
import Header from "../../components/Header.jsx";
import EmptyFeedState from "../../components/EmptyFeedState.jsx";
import FullPageLoader from "../../components/ui/FullPageLoader.jsx";
import { useData } from "../../contexts/DataContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DefaultLayout from "../../layout/DefaultLayout.jsx";
import QuickActions from "../../components/QuickActions.jsx";
import { Pencil, PlusCircle, Rocket } from "lucide-react";
import ProfileCard from "../../components/ProfileCard.jsx";
import ServiceCard from "../../components/ServiceCard.jsx";
import ProductCard from "../../components/ProductCard-1.jsx";
import ExperienceCard from "../../components/ExperienceCard.jsx";
import CrowdfundCard from "../../components/CrowdfundCard.jsx";
import PageTabs from "../../components/PageTabs.jsx";
import CardSkeletonLoader from "../../components/ui/SkeletonLoader.jsx";
import CompanyAssociationPanel from "../../components/DefaultCompanyAssociationPanel.jsx";

function useDebounce(v, ms = 400) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("All");
  const tabs = useMemo(() => ["All", "Events", "Jobs", "Needs", "Moments", "Services", "Products", "Experiences", "Funding"], []);

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

  // Industries state
  const [selectedIndustries, setSelectedIndustries] = useState([]);

  const [view, setView] = useState("list");
  let view_types = ["grid", "list"];

  const data = useData();
  const { user,settings } = useAuth();

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
            : activeTab === "Needs"
            ? "needs"
            : activeTab === "Moments"
            ? "moments"
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
          industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
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
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, role, selectedIndustries]);

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
          industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
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
  }, [debouncedQ, country, city, categoryId, subcategoryId, role, goalId, selectedIndustries]);

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
    selectedIndustries,
    setSelectedIndustries,
    onApply: () => setMobileFiltersOpen(false),
  };

  const renderItem = (item) => {
    // Render by kind while preserving order from API
    if (item.kind === "job") {
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
    if (item.kind === "need") {
      return (
        <NeedCard
          type={view}
          key={`need-${item.id}`}
          matchPercentage={item.matchPercentage}
          need={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "service") {
      return <ServiceCard type={view} key={`service-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "product") {
      return <ProductCard type={view} key={`product-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "moment") {
      return (
        <MomentCard
          type={view}
          key={`moment-${item.id}`}
          matchPercentage={item.matchPercentage}
          moment={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "tourism") {
      return <ExperienceCard type={view} key={`tourism-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "funding") {
      return <CrowdfundCard type={view} key={`funding-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    // default = event
    return <EventCard type={view} key={`event-${item.id}`} item={item} e={item} matchPercentage={item.matchPercentage} />;
  };
return (
  <DefaultLayout>
   <main className={`mx-auto ${data._openPopUps.profile ? 'relative z-50':''} max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6`}>
      <MobileFiltersButton onClick={() => setMobileFiltersOpen(true)} />

      <aside className="lg:col-span-3 hidden lg:flex flex-col space-y-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
        <div className="_sticky top-0 z-10 _bg-white">
          <FiltersCard {...filtersProps} />
        </div>

        <QuickActions
          title="Quick Actions"
          items={[
            { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
            { label: "Settings and Privacy", Icon: Pencil, onClick: () => navigate("/settings") },
            { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create"), hide:user?.accountType=="individual"},
            { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") , hide:user?.accountType=="individual"},
            { label: "Share Job Experience", Icon: PlusCircle, onClick: () => navigate("/moment/job/create"),from:'job',hide:user?.accountType=="company"},
            { label: "Search for a job", Icon: PlusCircle, onClick: () => navigate("/need/job/create"),from:'job', hide:user?.accountType=="company" },
            { label: "Share Event Experience", Icon: PlusCircle, onClick: () => navigate("/moment/event/create"),from:'event', hide:user?.accountType=="company" },
            { label: "Ask About an Event", Icon: PlusCircle, onClick: () => navigate("/need/event/create"),from:'event', hide:user?.accountType=="company" },
          ]}
        />
        <ProfileCard />
      </aside>

      <div className="lg:col-span-9 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center flex-wrap w-full justify-between mb-4">
            <PostComposer from={'feed'} typeOfPosts={[
              { label: "Post Job Opportunity", Icon: PlusCircle, hide:user?.accountType=="individual"},
              { label: "Create Event", Icon: PlusCircle, hide:user?.accountType=="individual"},
              { label: "Share Job Experience", Icon: PlusCircle, from:'job', hide:user?.accountType=="company"},
              { label: "Search for a job", Icon: PlusCircle, from:'job', hide:user?.accountType=="company" },
              { label: "Share Event Experience", Icon: PlusCircle, from:'event', hide:user?.accountType=="company" },
              { label: "Ask About an Event", Icon: PlusCircle, from:'event', hide:user?.accountType=="company" },
            ]}/>
          </div>
          <section className="space-y-4 overflow-hidden">
            {loadingFeed && <CardSkeletonLoader columns={1} />}

            {!loadingFeed && showTotalCount && (
              <div className="text-sm text-gray-600">
                {totalCount} result{totalCount === 1 ? "" : "s"}
              </div>
            )}

            {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab={activeTab} />}

            {!loadingFeed && items.length > 0 && (
              <div className={`grid grid-cols-1 ${view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-3"} gap-6`}>
                {items.map(renderItem)}
              </div>
            )}
          </section>
        </div>
        <aside className="lg:col-span-1 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <SuggestedMatches loading={loadingSuggestions} matches={matches} nearby={nearby} />
        </aside>
      </div>
    </main>

    <MobileFiltersBottomSheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} filtersProps={filtersProps} />
  </DefaultLayout>
);
}
