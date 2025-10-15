import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import NeedCard from "../components/NeedCard";
import MomentCard from "../components/MomentCard";
import EmptyFeedState from "../components/EmptyFeedState";
import { Briefcase, FileText, Pencil, PlusCircle, Rocket, SearchIcon, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "../layout/DefaultLayout";
import { useData } from "../contexts/DataContext";
import CardSkeletonLoader from "../components/ui/SkeletonLoader";
import PageTabs from "../components/PageTabs";
import TopFilterButtons from "../components/TopFilterButtons";
import { useAuth } from "../contexts/AuthContext";
import PostComposer from "../components/PostComposer";

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
  const tabs = useMemo(() => ["Posts", "Job Seeker","Job Offers"], []);
  let view_types=['grid','list']
   const from = "jobs"; // Define the 'from' variable

  const [generalTree, setGeneralTree] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState({});

  useEffect(() => {
      (async () => {
        try {
          const { data } = await client.get("/general-categories/tree?type=job");
          setGeneralTree(data.generalCategories || []);
        } catch (err) {
          console.error("Failed to load general categories", err);
        }
      })();
  }, []);


  const navigate=useNavigate()
  const [view,setView]=useState('list')
  const data=useData()
  const {user}=useAuth()

  // Filtros compatíveis com a Home
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 400);

  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [goalId, setGoalId] = useState();

  const [audienceTree, setAudienceTree] = useState([]);
  // Audience Tree
  const [audienceSelections, setAudienceSelections] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Map button labels to identity IDs
  const getIdentityIdFromLabel = useCallback((label) => {
    if (!audienceTree.length) return null;
    for (const identity of audienceTree) {
      if (identity.name === label || identity.name.toLowerCase() === label.toLowerCase()) {
        return identity.id;
      }
    }
    return null;
  }, [audienceTree]);

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
  const [workLocation, setWorkLocation] = useState("");
  const [workSchedule, setWorkSchedule] = useState("");
  const [careerLevel, setCareerLevel] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [jobsView, setJobsView] = useState("");

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
  const [registrationType, setRegistrationType] = useState("");

  // Industries
  const [selectedIndustries, setSelectedIndustries] = useState([]);


  // Metadados
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

  // Feed
  const [items, setItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [totalCount, setTotalCount] = useState(0); // <-- add this
  const [showTotalCount,setShowTotalCount] = useState(0)

  // Sugestões
  const [matches, setMatches] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mobile filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Selected filters for TopFilterButtons
  const [selectedFilters,setSelectedFilters]=useState([])
   const [filterOptions,setFilterOptions]=useState([])
  

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

   useEffect(() => {
     (async () => {
       try {
         const { data } = await client.get("/public/identities", {
           params: { type: 'individual' } // Load identities for job seekers
         });
         // Expecting data.identities: same structure you shared
         setAudienceTree(data.identities || []);
       } catch (error) {
         console.error("Error loading identities:", error);
         setAudienceTree([]);
       }
     })();
   }, []);


  // Fetch feed (somente na aba Posts)
  const fetchFeed = useCallback(async () => {
    if (activeTab !== "Posts") return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingFeed(true);
    try {
      // PeoplePage não tem hero tabs All/Events/Jobs; aqui sempre "all"
      const params = {
        tab: "jobs",
        q: debouncedQ || undefined,
        country: country || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        goalId: goalId || undefined,

       audienceIdentityIds: Array.from(audienceSelections.identityIds).join(',') || undefined,
       audienceCategoryIds: Array.from(audienceSelections.categoryIds).join(',') || undefined,
       audienceSubcategoryIds: Array.from(audienceSelections.subcategoryIds).join(',') || undefined,
       audienceSubsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds).join(',') || undefined,
       industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,

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
        workLocation: workLocation || undefined,
        workSchedule: workSchedule || undefined,
        careerLevel: careerLevel || undefined,
        paymentType: paymentType || undefined,
        jobsView: jobsView || undefined,
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


        generalCategoryIds: selectedFilters.filter(id =>
          generalTree.some(category => category.id === id)
        ).join(',') || undefined,

        generalSubcategoryIds: Object.keys(selectedSubcategories)
          .filter(key => selectedSubcategories[key])
          .join(',') || undefined,

        limit: 40,
        offset: 0,
      };
      const { data } = await client.get("/feed", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalCount(
        typeof data.total === "number"
          ? data.total
          : Array.isArray(data.items) ? data.items.length : 0
      );
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
    } finally {
      isFetchingRef.current = false;
      setLoadingFeed(false);
    }
    data._scrollToSection('top',true);
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,
    selectedFilters,
    audienceSelections,


    // NEW deps:
    price,
    serviceType,
    priceType,
    deliveryTime,
    experienceLevel,
    locationType,
    jobType,
    workMode,
    workLocation,
    workSchedule,
    careerLevel,
    paymentType,
    jobsView,
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
    selectedIndustries,
    generalTree,
    selectedSubcategories,]);

  const isFetchingRef = useRef(false);
  const hasLoadedOnce = useRef(false);
  const lastParamsRef = useRef({});
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    const currentParams = {
      activeTab,
      debouncedQ,
      country,
      city,
      categoryId,
      subcategoryId,
      goalId,
      selectedFilters,
      audienceSelections: {
        identityIds: Array.from(audienceSelections.identityIds),
        categoryIds: Array.from(audienceSelections.categoryIds),
        subcategoryIds: Array.from(audienceSelections.subcategoryIds),
        subsubCategoryIds: Array.from(audienceSelections.subsubCategoryIds),
      },
      price,
      serviceType,
      priceType,
      deliveryTime,
      experienceLevel,
      locationType,
      jobType,
      workMode,
      workLocation,
      workSchedule,
      careerLevel,
      paymentType,
      jobsView,
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
      selectedIndustries,
      selectedSubcategories,
    };

    if (JSON.stringify(currentParams) === JSON.stringify(lastParamsRef.current)) return;
    lastParamsRef.current = currentParams;

    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      fetchFeed(); // Immediate fetch for initial load
    } else {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 200);
    }
  }, [activeTab, debouncedQ, country, city, categoryId, subcategoryId, goalId,
    selectedFilters,
    audienceSelections,
    price,
    serviceType,
    priceType,
    deliveryTime,
    experienceLevel,
    locationType,
    jobType,
    workMode,
    workLocation,
    workSchedule,
    careerLevel,
    paymentType,
    jobsView,
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
    selectedIndustries,
  jobsView,
  selectedSubcategories]);

  // Update audienceSelections when selectedFilters changes (but don't trigger fetch)
  useEffect(() => {
    if (selectedFilters.length > 0 && audienceTree.length > 0) {
      const identityIds = selectedFilters
        .map(filter => {
          const id = getIdentityIdFromLabel(filter);
          return id;
        })
        .filter(id => id !== null);

      setAudienceSelections(prev => ({
        ...prev,
        identityIds: new Set(identityIds)
      }));
    } else {
      setAudienceSelections(prev => ({
        ...prev,
        identityIds: new Set()
      }));
    }
  }, [selectedFilters, audienceTree, getIdentityIdFromLabel]);

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
          industryIds: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
          limit: 40,
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
  }, [debouncedQ, country, city, categoryId, subcategoryId, goalId, selectedIndustries]);

   const handleSubcategoryChange = (subcategories) => {
     setSelectedSubcategories(subcategories);
     // No need to trigger fetchFeed here, it will be triggered by the dependency array
   };

  const filtersProps = {
    setShowTotalCount,
    onSubcategoryChange: handleSubcategoryChange,
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
    workLocation,
    setWorkLocation,
    workSchedule,
    setWorkSchedule,
    careerLevel,
    setCareerLevel,
    paymentType,
    setPaymentType,
    jobsView,
    setJobsView,

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

    audienceSelections,
    setAudienceSelections,
    audienceTree,

    // industries
    selectedIndustries,
    setSelectedIndustries,

    onApply: () => setMobileFiltersOpen(false),
  };


  //Create a mapping of category IDs to names for display
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
    


  const renderMiddle = () => {
    if (activeTab !== "Posts") {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          {activeTab} tab uses its own API route. Render the specific list here.
        </div>
      );
    }

    return (
      <>
        {loadingFeed && (
          <div className="min-h-[160px] grid  text-gray-600">
             <CardSkeletonLoader columns={1}/>
          </div>
        )}

         {(!loadingFeed && showTotalCount) && (
            <div className="text-sm text-gray-600">
              {totalCount} result{totalCount === 1 ? "" : "s"}
            </div>
          )}

        {!loadingFeed && items.length === 0 && <EmptyFeedState activeTab="All" />}

      
        
        {!loadingFeed && (
        <div
          className={`grid grid-cols-1 ${
            view === "list" ? "sm:grid-cols-1" : "lg:grid-cols-3"
          } gap-6`}
        >
          {items?.map((item) => {

            if (item.kind === "job") {
              return (
                <JobCard
                  type={view}
                  key={`job-${item.id}`}
                  job={item}
                  matchPercentage={item.matchPercentage}
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
            return null;
          })}

          

        </div>
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
         
          <div className="_sticky top-0 z-10 _bg-white">

             {/** <FiltersCard catComponent={<TopFilterButtons from={'jobs'} loading={loadingFeed}  selected={selectedFilters} setSelected={setSelectedFilters}
                                    buttons={
                                      [
                                      "Executives",
                                      "Professionals",
                                      "Freelancers",
                                      "Students"
              ]}/>}  showAudienceFilters={true}   selectedFilters={selectedFilters} {...filtersProps} from="jobs"/> */}


              <FiltersCard
                  selectedFilters={selectedFilters}
                  setSelectedFilters={setSelectedFilters}
                  generalTree={generalTree}
                  {...filtersProps}
                  from={"jobs"}
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
              { label: "Edit Profile", Icon: Pencil, onClick: () => navigate("/profile") },
              { label: "Post Job Opportunity", Icon: PlusCircle, onClick: () => navigate("/jobs/create"),hide:user?.accountType=="individual" },
              { label: "Share Job Experience", Icon: PlusCircle, onClick: () => navigate("/moment/job/create"),hide:user?.accountType=="company" },
              { label: "Search for a job", Icon: PlusCircle, onClick: () => navigate("/need/job/create"),hide:user?.accountType=="company" },
            ]} />
           <ProfileCard />
        </aside>

    
        <div className="lg:col-span-9 grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="flex items-center flex-wrap w-full justify-between mb-4">
         

            <PostComposer from={'job'} typeOfPosts={[ { label: "Post Job Opportunity",short_label:'Post Job', Icon: Briefcase,hide:user?.accountType=="individual",type:'main'}, { label: "Share Job Experience", Icon: Star,hide:user?.accountType=="company"}, { label: "Search for a job", Icon: SearchIcon,hide:user?.accountType=="company"}, ]}/>
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
        filtersProps={filtersProps}
      />
   </DefaultLayout>
  );
}
