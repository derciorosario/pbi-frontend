import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";

import Header from "../components/Header";
import MobileFiltersButton from "../components/MobileFiltersButton";
import TabsAndAdd from "../components/TabsAndAdd";
import PostComposer from "../components/PostComposer";
import MobileFiltersBottomSheet from "../components/MobileFiltersBottomSheet";
import ProfileCard from "../components/ProfileCard";
import QuickActions from "../components/QuickActions";
import FiltersCard from "../components/FiltersCard";
import SuggestedMatches from "../components/SuggestedMatches";
import EventCard from "../components/EventCard";
import JobCard from "../components/JobCard";
import NeedCard from "../components/NeedCard";
import MomentCard from "../components/MomentCard";
import EmptyFeedState from "../components/EmptyFeedState";
import FeedErrorRetry from "../components/FeedErrorRetry";
import { AlarmClock, Calendar, Pencil, PlusCircle, Rocket, Search, Star, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "../components/ui/FullPageLoader";
import DefaultLayout from "../layout/DefaultLayout";
import { useData } from "../contexts/DataContext";
import ProductCard from "../components/ProductCard-1";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import PageTabs from "../components/PageTabs";
import TopFilterButtons from "../components/TopFilterButtons";
import { useAuth } from "../contexts/AuthContext";

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
  const [view,setView]=useState('list')
  let view_types=['grid','list']
  const from = "products"; // Define the 'from' variable
  const {user}=useAuth()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();
  const [role, setRole] = useState();
  const [productsView,setProductsView]=useState()


  const [generalTree, setGeneralTree] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState({});
  const [selectedFilters,setSelectedFilters]=useState([])
  const [filterOptions,setFilterOptions]=useState([])

  useEffect(() => {
      (async () => {
        try {
          const { data } = await client.get("/general-categories/tree?type=product");
          setGeneralTree(data.generalCategories || []);
        } catch (err) {
          console.error("Failed to load general categories", err);
        }
      })();
  }, []);


  
    const [audienceTree, setAudienceTree] = useState([]);
    // Audience Tree
    const [audienceSelections, setAudienceSelections] = useState({
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    });
  


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
  
    // Industries
    const [selectedIndustries, setSelectedIndustries] = useState([]);
  

  // Metadados
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [goals, setGoals] = useState([]);


  // Feed
  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [totalCount, setTotalCount] = useState(0); // <-- add this
  const [showTotalCount,setShowTotalCount] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef(null);

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

    useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        // Expecting data.identities: same structure you shared
        setAudienceTree(data.identities);
      } catch (error) {
        console.error("Error loading identities:", error);
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
        tab: "products",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        productsView:productsView || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,
        role:role || undefined,

        // include ALL filters so backend can leverage them when needed:
        // products
       // price: price || undefined,
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

        // Include selected categories as IDs
        generalCategoryIds: selectedFilters.filter(id =>
          generalTree.some(category => category.id === id)
        ).join(',') || undefined,

        // Include selected subcategories as IDs
        generalSubcategoryIds: Object.keys(selectedSubcategories)
          .filter(key => selectedSubcategories[key])
          .join(',') || undefined,

        audienceIdentityIds: Array.from(audienceSelections.identityIds).join(',') || undefined,
        audienceCategoryIds: Array.from(audienceSelections.categoryIds).join(',') || undefined,
        audienceSubcategoryIds: Array.from(audienceSelections.subcategoryIds).join(',') || undefined,
        audienceSubsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds).join(',') || undefined,
        industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,

        limit: 20,
        offset: 0,
      };
      const { data } = await client.get("/feed", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
       setTotalCount(
        typeof data.total === "number"
          ? data.total
          : Array.isArray(data.items) ? data.items.length : 0
      );
      setFetchError(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
      setFetchError(true);
      // Automatic retry after 3 seconds
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 3000);
    } finally {
      setLoadingFeed(false);
    }
    data._scrollToSection('top',true);
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,role,  // NEW deps:

       audienceSelections,
       productsView,
  // price,
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
   registrationType,
   selectedSubcategories,
   selectedFilters,
   selectedIndustries,
   generalTree,
   data]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

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
          industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
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
  }, [debouncedQ, country, city, categoryId, subcategoryId, goalId, role, selectedIndustries]);

  // Handler for subcategory changes
  const handleSubcategoryChange = (subcategories) => {
    setSelectedSubcategories(subcategories);
    // No need to trigger fetchFeed here, it will be triggered by the dependency array
  };

  // Create a mapping of category IDs to names for display
  const [categoryIdToNameMap, setCategoryIdToNameMap] = useState({});

  useEffect(() => {
    // Map category IDs to names for display in buttons
    const idToNameMap = {};
    generalTree.forEach(category => {
      idToNameMap[category.id] = category.name;
    });
    setCategoryIdToNameMap(idToNameMap);

    // Set filter options as category IDs
    setFilterOptions(generalTree.map(i => i.id));
  }, [generalTree]);

  const filtersProps = {
    setShowTotalCount,
    audienceSelections,
    setAudienceSelections,
    audienceTree,
    generalTree,
    selectedFilters,
    setSelectedFilters,
    onSubcategoryChange: handleSubcategoryChange,
    query,
    setQuery,
    country,
    productsView,
    setProductsView,
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

    // industries
    selectedIndustries,
    setSelectedIndustries,

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

    if (fetchError) {
      return (
        <FeedErrorRetry
          onRetry={() => {
            setFetchError(false);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
            fetchFeed();
          }}
          message="Failed to load feed. Trying to connect..."
          buttonText="Try Again"
        />
      );
    }

    return (
      <>
        {loadingFeed && (
          <div className="min-h-[160px] grid text-gray-600">
             <CardSkeletonLoader columns={1}/>
          </div>
        )}

          {(!loadingFeed && showTotalCount) && (
            <div className="text-sm text-gray-600">
              {totalCount} result{totalCount === 1 ? "" : "s"}
            </div>
          )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

         

         
        
        <div
  className={`grid grid-cols-1 ${view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-3"} gap-6`}
>
  {items
    .filter(item => item.kind === "product")
    .map((p) => (
      <ProductCard
        key={p.id}
        item={p}
        {...p}
        matchPercentage={p.matchPercentage}
        type={view}
        onContact={() => alert(`Contact seller of ${p.title}`)}
        onSave={() => alert(`Saved ${p.title}`)}
      />
    ))}

  {items
    .filter(item => item.kind === "need")
    .map((item) => (
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
    ))}

  {items
    .filter(item => item.kind === "moment")
    .map((item) => (
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
    ))}
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
             <div className="_sticky top-0 z-10 _bg-white">
            <FiltersCard
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              generalTree={generalTree}
              {...filtersProps}
              from={"products"}
               catComponent={ <TopFilterButtons
                selected={selectedFilters}
                setSelected={setSelectedFilters}
                buttons={filterOptions}
                buttonLabels={categoryIdToNameMap}
                from={from}
                loading={loadingFeed}
              />}
            />
          </div>
           <QuickActions title="Quick Actions" items={[
            { label: "Edit Profile", Icon: Pencil, path: "/profile" },
            { label: "Add a New Product", Icon: PlusCircle, onClick: () => navigate("/products/create"),hide:user?.accountType=="individual" },
            { label: "Highlight a product", Icon: PlusCircle, onClick: () => navigate("/moment/product/create"),hide:user?.accountType=="company" },
            { label: "Find products", Icon: PlusCircle, onClick: () => navigate("/need/product/create"),hide:user?.accountType=="company" },
        
        ]} />
          <ProfileCard />
        
         
        </aside>

        <div className="lg:col-span-9 grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="flex items-center flex-wrap w-full justify-between mb-4">
             
              <PostComposer
                from="product"
                typeOfPosts={[
                  { label: "Add a New Product", Icon: Tag, hide: user?.accountType === "individual", type: "main" }, // 🏷️ Selling a product
                  { label: "Find products", Icon: Search, hide: user?.accountType === "company" }, // 🔍 Searching for products
                  { label: "Highlight a Product", Icon: Star }, // ⭐ Sharing experience
                ]}
              /> 
            </div>
            <section className="space-y-4 overflow-hidden">
              {renderMiddle()}
            </section>
          </div>
          <aside className="lg:col-span-1 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
            <SuggestedMatches loading={loadingSuggestions} matches={matches} nearby={nearby} />
          </aside>
        </div>
      </main>

      <MobileFiltersBottomSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
             selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              generalTree={generalTree}
              {...filtersProps}
              from={"products"}
               catComponent={ <TopFilterButtons
                selected={selectedFilters}
                setSelected={setSelectedFilters}
                buttons={filterOptions}
                buttonLabels={categoryIdToNameMap}
                from={from}
                loading={loadingFeed}
              />}
            />
   </DefaultLayout>
  );
}
