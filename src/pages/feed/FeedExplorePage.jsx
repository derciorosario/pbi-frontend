import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import { Briefcase, CalendarPlus, DollarSign, HelpCircle, MapPin, MessageSquare, Pencil, PlusCircle, Rocket, Search, Star, Tag, Users, Building, Camera, FileText, Globe, Heart, Home, Mail, Phone, Settings, Shield, ShoppingCart, Truck, User, Video, Zap } from "lucide-react";
import ProfileCard from "../../components/ProfileCard.jsx";
import ServiceCard from "../../components/ServiceCard.jsx";
import ProductCard from "../../components/ProductCard-1.jsx";
import ExperienceCard from "../../components/ExperienceCard.jsx";
import CrowdfundCard from "../../components/CrowdfundCard.jsx";
import PageTabs from "../../components/PageTabs.jsx";
import CardSkeletonLoader from "../../components/ui/SkeletonLoader.jsx";
import CompanyAssociationPanel from "../../components/DefaultCompanyAssociationPanel.jsx";
import FeedErrorRetry from "../../components/FeedErrorRetry";

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
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef(null);
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const currentOffsetRef = useRef(0);

  // Request cancellation refs
  const abortControllerRef = useRef(null);
  const lastRequestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasLoadedOnce = useRef(false);
  const lastParamsRef = useRef({});
  const fetchTimeoutRef = useRef(null);

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

  // Fixed fetchFeed with request cancellation
  const fetchFeed = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Use a request ID to track the most recent request
    const requestId = Date.now();
    lastRequestIdRef.current = requestId;

    if (isFetchingRef.current) {
      console.log('Canceling previous request');
    }

    isFetchingRef.current = true;
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
        limit: 5,
        offset: 0,
      };

      const { data } = await client.get("/feed", {
        params,
        signal: abortControllerRef.current.signal
      });

      // Only update state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        const incomingItems = Array.isArray(data.items) ? data.items : [];
        setItems(incomingItems);
        setTotalCount(
          typeof data.total === "number"
            ? data.total
            : incomingItems.length
        );
        // Set whether more pages exist
        setHasMore(
          typeof data.total === "number"
            ? incomingItems.length < data.total
            : incomingItems.length === 5
        );
        currentOffsetRef.current = incomingItems.length;
        setFetchError(false);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was canceled');
        return;
      }
      console.error("Failed to load feed:", error);
      // Only update state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        setItems([]);
        setFetchError(true);
        // Automatic retry after 3 seconds
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          fetchFeed();
        }, 3000);
      }
    } finally {
      // Only reset fetching state if this is the most recent request
      if (requestId === lastRequestIdRef.current) {
        isFetchingRef.current = false;
        setLoadingFeed(false);
        abortControllerRef.current = null;
      }
    }
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId, role, selectedIndustries]);

  // Infinite scroll: fetch next page
  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || loadingFeed || loadingMore || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
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
        limit: 5,
        offset: currentOffsetRef.current,
      };

      const { data } = await client.get("/feed", { params });
      const incomingItems = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => [...prev, ...incomingItems]);
      currentOffsetRef.current += incomingItems.length;
      setHasMore(incomingItems.length === 5);
      setFetchError(false);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [
    activeTab,
    debouncedQ,
    country,
    city,
    categoryId,
    subcategoryId,
    goalId,
    role,
    selectedIndustries,
    items.length,
    loadingFeed,
    loadingMore,
    hasMore,
  ]);

  // Improved useEffect for triggering fetches
  useEffect(() => {
    const currentParams = JSON.stringify({
      activeTab,
      debouncedQ,
      country,
      city,
      categoryId,
      subcategoryId,
      goalId,
      role,
      selectedIndustries: [...selectedIndustries].sort(),
    });

    if (currentParams === lastParamsRef.current) return;
    lastParamsRef.current = currentParams;

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      fetchFeed();
    } else {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 300); // Slightly longer debounce for better UX
    }

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [
    activeTab,
    debouncedQ,
    country,
    city,
    categoryId,
    subcategoryId,
    goalId,
    role,
    selectedIndustries,
    fetchFeed,
  ]);

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

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!hasMore) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchMore();
        }
      },
      { root: null, rootMargin: "700px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreRef, hasMore, fetchMore]);

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
            { label: "Share a Job Opening", Icon: PlusCircle, onClick: () => navigate("/jobs/create"), hide:user?.accountType=="individual"},
            { label: "Create an Event", Icon: PlusCircle, onClick: () => navigate("/events/create") , hide:user?.accountType=="individual"},
            { label:  user?.accountType=="company" ? "Share an experience":  "Highlight a career progress", Icon: PlusCircle, onClick: () => navigate("/moment/job/create"),from:'job',hide:user?.accountType=="company"},
            { label: "Find Jobs", Icon: PlusCircle, onClick: () => navigate("/need/job/create"),from:'job', hide:user?.accountType=="company" },
            { label: "Highlight an event", Icon: PlusCircle, onClick: () => navigate("/moment/event/create"),from:'event', hide:user?.accountType=="company" },
            { label: "Ask About an Event", Icon: PlusCircle, onClick: () => navigate("/need/event/create"),from:'event', hide:user?.accountType=="company" },
          ]}
        />
        <ProfileCard />
      </aside>

      <div className="lg:col-span-9 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center flex-wrap w-full justify-between mb-4">

            
          
          <PostComposer
            from="feed"
            typeOfPosts={[
              { label: "Share a job opening", Icon: Briefcase, from: "job", hide: user?.accountType === "individual" },
              { label: "Host an event", Icon: CalendarPlus, from: "event", hide: user?.accountType === "individual" },
              { label: "Add new product", Icon: Tag, from: "product", hide: user?.accountType === "individual" },
              { label: "Add new service", Icon: Building, from: "service", hide: user?.accountType === "individual" },
              { label: "Post a tourism attraction", Icon: MapPin, from: "tourism", hide: user?.accountType === "individual" },
              { label: "Publish an opportunity", Icon: DollarSign, from: "funding", hide: user?.accountType === "individual" },
              { label: "Share work experience", Icon: Star, from: "job", hide: user?.accountType === "individual" },
              { label: "Highlight an event", Icon: Video, from: "event", hide: user?.accountType === "individual" },
              { label: "Highlight a product", Icon: Truck, from: "product", hide: user?.accountType === "individual" },
              { label: "Highlight a service", Icon: Mail, from: "service", hide: user?.accountType === "individual" },
              { label: "Highlight a tourism attraction", Icon: Home, from: "tourism", hide: user?.accountType === "individual" },
              { label: "Highlight an opportunity", Icon: Zap, from: "funding", hide: user?.accountType === "individual" },
              { label: "Find jobs", Icon: Search, from: "job", hide: user?.accountType === "company" },
              { label: "Find events", Icon: HelpCircle, from: "event", hide: user?.accountType === "company" },
              { label: "Find Products", Icon: ShoppingCart, from: "product", hide: user?.accountType === "company" },
              { label: "Find Services", Icon: Settings, from: "service", hide: user?.accountType === "company" },
              { label: "Explore tourism attractions", Icon: Globe, from: "tourism", hide: user?.accountType === "company" },
              { label: "Explore funding opportunities", Icon: FileText, from: "funding", hide: user?.accountType === "company" },
              { label: "Highlight a career progress", Icon: User, from: "job", hide: user?.accountType === "company" },
              { label: "Highlight an event", Icon: MessageSquare, from: "event", hide: user?.accountType === "company" },
              { label: "Highlight a product", Icon: Camera, from: "product", hide: user?.accountType === "company" },
              { label: "Highlight a service", Icon: Phone, from: "service", hide: user?.accountType === "company" },
              { label: "Share tourism experiences", Icon: Heart, from: "tourism", hide: user?.accountType === "company" },
              { label: "Highlight a funding opportunity", Icon: Shield, from: "funding", hide: user?.accountType === "company" },
            ]}
          />
          </div>
          <section className="space-y-4 overflow-hidden">
            {fetchError && (
              <FeedErrorRetry
                onRetry={() => {
                  setFetchError(false);
                  if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = null;
                  if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
                  fetchTimeoutRef.current = null;
                  fetchFeed();
                }}
                message="Failed to load feed. Please try again."
                buttonText="Try Again"
              />
            )}

            {loadingFeed && (
              <div className="min-h-[160px] grid text-gray-600">
                <CardSkeletonLoader columns={1} />
              </div>
            )}

            {!fetchError && !loadingFeed && showTotalCount && (
              <div className="text-sm text-gray-600">
                {totalCount} result{totalCount === 1 ? "" : "s"}
              </div>
            )}

            {!fetchError && !loadingFeed && items.length === 0 && <EmptyFeedState activeTab={activeTab} />}

            {!fetchError && !loadingFeed && items.length > 0 && (
              <>
                <div className={`grid grid-cols-1 ${view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-3"} gap-6`}>
                  {items.map(renderItem)}
                </div>
                {!loadingFeed && hasMore && (
                  <div ref={loadMoreRef} className="h-10 w-full">
                    {loadingMore && (
                      <div className="text-center text-sm text-gray-500 py-4">Loading more…</div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
        <aside className="lg:col-span-1 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <SuggestedMatches loading={loadingSuggestions} matches={matches} nearby={nearby} />
        </aside>
      </div>
    </main>

    <MobileFiltersBottomSheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}
    
    {...filtersProps} />
  </DefaultLayout>
);
}
