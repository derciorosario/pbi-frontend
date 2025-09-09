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
import { Pencil, PlusCircle, Rocket } from "lucide-react";
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

export default function HomePage() {
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("All");
  const tabs = useMemo(() => ["All", "Events", "Jobs","Services","Products"], []);

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

  const [view,setView]=useState('grid')
  let view_types=['grid','list']
  

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
          activeTab === "Events" ? "events" : activeTab === "Jobs" ? "jobs" : activeTab === "Services" ?  "service" :  activeTab === "Products" ? "product" : "all";
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

      data._scrollToSection('top',true);
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

      {/* Enhanced Landing Page - Only show when user is not logged in */}
      <section className={`relative overflow-visible ${user?.id ? "hidden" : ""}`}>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#004182] via-[#0a66c2] to-[#1e40af] overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Africa's Premier Business Network
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6">
                  Where African
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Business Meets
                  </span>
                  <span className="block">Opportunity</span>
                </h1>

                <p className="text-xl text-white/90 leading-relaxed mb-8 max-w-2xl">
                  Join the largest Pan-African ecosystem connecting entrepreneurs, professionals, and businesses across 54 nations.
                  Discover opportunities, build partnerships, and accelerate your growth in Africa's most dynamic marketplace.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <button
                    onClick={() => setLoginDialogOpen(true)}
                    className="group relative px-8 py-4 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <span className="relative z-10">Start Your Journey</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                  <button
                    onClick={() => navigate("/people")}
                    className="px-8 py-4 border-2 border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white transition-all duration-200"
                  >
                    Explore Network
                  </button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-green-400 rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-purple-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-sm">50K+ Active Members</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-white">54 Countries</span> Connected
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative">
                  <img
                    alt="African business network"
                    className="w-full rounded-2xl object-cover shadow-2xl"
                    src="https://theblackrise.com/wp-content/uploads/2023/11/AdobeStock_257397505-scaled.jpeg"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Trusted by 10K+</div>
                        <div className="text-sm text-gray-600">Businesses & Professionals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From job opportunities to business partnerships, our comprehensive platform provides all the tools
                and connections you need to thrive in Africa's growing economy.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* People Network */}
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">People Network</h3>
                <p className="text-gray-600 mb-4">
                  Connect with professionals, entrepreneurs, and business leaders across Africa. Build meaningful relationships that drive success.
                </p>
                <div className="text-sm text-blue-600 font-medium">Smart matching algorithm →</div>
              </div>

              {/* Job Opportunities */}
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Opportunities</h3>
                <p className="text-gray-600 mb-4">
                  Access exclusive job opportunities from top African companies. Find your dream career or discover talented professionals for your team.
                </p>
                <div className="text-sm text-green-600 font-medium">Remote & On-site options →</div>
              </div>

              {/* Business Marketplace */}
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 4V2C7 1.45 7.45 1 8 1h8c.55 0 1 .45 1 1v2h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h4zM9 2v2h6V2H9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Marketplace</h3>
                <p className="text-gray-600 mb-4">
                  Buy, sell, and discover products and services from African businesses. Support local entrepreneurship and grow your business network.
                </p>
                <div className="text-sm text-purple-600 font-medium">Products & Services →</div>
              </div>

              {/* Events & Networking */}
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 6v2h14V6H5z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Events & Networking</h3>
                <p className="text-gray-600 mb-4">
                  Attend exclusive business events, conferences, and networking sessions. Connect with industry leaders and expand your professional circle.
                </p>
                <div className="text-sm text-orange-600 font-medium">Virtual & In-person →</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-brand-600 mb-2">50K+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-brand-600 mb-2">54</div>
                <div className="text-gray-600">African Countries</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-brand-600 mb-2">10K+</div>
                <div className="text-gray-600">Businesses Connected</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-brand-600 mb-2">500+</div>
                <div className="text-gray-600">Events Hosted</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-r from-brand-600 to-brand-700">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your African Business Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of African professionals, entrepreneurs, and businesses who are already
              building stronger networks and discovering new opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setLoginDialogOpen(true)}
                className="px-8 py-4 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Join Our Community
              </button>
              <button
                onClick={() => navigate("/people")}
                className="px-8 py-4 border-2 border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                Browse Network
              </button>
            </div>
          </div>
        </div>

      </section>


      <main id="explore" className={`mx-auto ${data._openPopUps.profile ? 'relative z-50':''} max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative`}>
      </main>
      
      {/* Login Dialog */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab="signup" // Show signup tab first when opened from signup button
      />
   
    </DefaultLayout>
  );
}
