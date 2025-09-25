import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import I from "../../lib/icons.jsx";
import LoginDialog from "../../components/LoginDialog.jsx";
import Input from "../../components/Input.jsx";
import GoogleCustomBtn from "../../components/GoogleBtn.jsx";
import COUNTRIES from "../../constants/countries.js";
import { toast } from "../../lib/toast";

import Header from "../../components/Header.jsx";
import { useData } from "../../contexts/DataContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DefaultLayout from "../../layout/DefaultLayout.jsx";
import Logo from '../../assets/logo.png'
import WhiteLogo from '../../assets/logo-white.png'
import Demo from '../../assets/lg-main.png'
import FeedPage from "../feed/FeedExplorePage.jsx";

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



  // Authentication form state
  const [authTab, setAuthTab] = useState("signup");
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: false
  });
  const [signupErrors, setSignupErrors] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: ""
  });
  const [acct, setAcct] = useState("individual");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);

  // Authentication form handlers
  const onAuthLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setLoginErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onAuthSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setSignupErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Labels change with account type, but variable names DO NOT change
  const labelName = acct === "company" ? "Company name" : "Name";
  const labelEmail = acct === "company" ? "Company email" : "Email Address";
  const labelPhone = acct === "company" ? "Company phone" : "Phone Number";

  function validateAuthLogin() {
    const next = { email: "", password: "" };
    if (!loginForm.email) next.email = "Email is required.";
    else if (!emailOK(loginForm.email)) next.email = "Please enter a valid email.";
    if (!loginForm.password) next.password = "Password is required.";
    setLoginErrors(next);
    return !next.email && !next.password;
  }

  function validateAuthSignup() {
    const next = {
      name: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      tos: ""
    };

    if (!signupForm.name) next.name = `${labelName} is required.`;
    if (!signupForm.email) next.email = `${labelEmail} is required.`;
    else if (!emailOK(signupForm.email)) next.email = "Please enter a valid email.";
    if (!signupForm.phone) next.phone = `${labelPhone} is required.`;
    else if (String(signupForm.phone).replace(/\D/g, "").length < 6)
      next.phone = "Please enter a valid phone number.";
    if (!signupForm.country) next.country = "Country is required.";
    if (!signupForm.password) next.password = "Password is required.";
    else if (signupForm.password.length < 6)
      next.password = "Use at least 6 characters.";
    if (!signupForm.confirmPassword) next.confirmPassword = "Please confirm password.";
    else if (signupForm.password !== signupForm.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    if (!signupForm.tos) next.tos = "You must agree to the Terms and Privacy Policy.";

    setSignupErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function onAuthLoginSubmit(e) {
    e.preventDefault();
    if (!validateAuthLogin()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      const promise = client.post("/auth/login", {
        email: loginForm.email,
        password: loginForm.password
      });

      const res = await toast.promise(
        promise,
        {
          loading: "Signing you in…",
          success: "Welcome back! 🎉",
          error: (err) => err?.response?.data?.message || "Login failed. Check your credentials."
        },
        { id: "login" }
      );

      const token = res?.data?.token;
      if (token) {
        // store under both keys for compatibility with other parts of the app
        localStorage.setItem("auth_token", token);
        localStorage.setItem("token", token);
        window.location.href="/"; // Refresh the page
      }
    } catch {
      /* toast shown by toast.promise */
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function onAuthSignupSubmit(e) {
    e.preventDefault();
    if (!validateAuthSignup()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      // Build payload with same variable names; include account type
      const payload = {
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        country: signupForm.country,
        password: signupForm.password,
        account_type: acct // "individual" | "company"
      };

      const promise = client.post("/auth/signup", payload);

      const res = await toast.promise(
        promise,
        {
          loading: "Creating your account…",
          success: "Account created! 🎉",
          error: (err) => err?.response?.data?.message || "Sign up failed."
        },
        { id: "signup" }
      );

      // After signup, go to "Email Sent" page
      const email = res?.data?.email || payload.email;
      navigate("/verify-email-sent", { state: { email } });
    } catch {
      // toast already handled
    } finally {
      setLoading(false);
    }
  }

  

  const data=useData()

  const {user,settings}=useAuth()


  


  return (
    <DefaultLayout>
     <Header page={'feed'}/>

       {settings?.hideMainFeed && <></>}

       {(user && !settings?.hideMainFeed) && <FeedPage/>}

      {/* Enhanced Landing Page - Only show when user is not logged in */}
      <section className={`relative overflow-visible ${user?.id ? "hidden" : ""}`}>

         {/* Hero Section */}
         <div className="relative bg-brand-600 overflow-hidden">
           <div className="absolute inset-0">
             <div className="absolute inset-0 bg-brand-700/20"></div>
             <div className="absolute inset-0" style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }} />
           </div>

           <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
             <div className="grid lg:grid-cols-12 gap-16 items-center">
               <div className="lg:col-span-7 text-white">
                 <div className="flex items-center gap-3 mb-8">
                   <span className="text-3xl font-bold">
                     <img src={WhiteLogo} width={110}/>
                   </span>
                 </div>

                 <h1 className="text-6xl md:text-7xl font-black leading-[0.9] mb-8">
                   <span className="block"><label className="text-accent-100">Connect. </label> Collaborate. Grow.</span>
                 
                 </h1>

                 <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
                   <strong className="text-white">54Links</strong> is where entrepreneurs, professionals, and businesses meet to build real connections, unlock new opportunities, and grow together.
Whether you're a startup founder, freelancer, or corporate leader, 54Links gives you the network you need to succeed.

                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 mb-12">
                   <button
                     onClick={() => setLoginDialogOpen(true)}
                     className="px-10 py-4 bg-white text-brand-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
                   >
                    Join the Network
                   </button>
                   <button
                     onClick={() => navigate("/people")}
                     className="px-10 py-4 border-2 border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white transition-all duration-200 text-lg"
                   >
                     Explore 
                   </button>
                 </div>

                 {/* Key Benefits */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/90">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                       <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
                       </svg>
                     </div>
                     <div>
                       <div className="font-semibold text-white">Smart Matching</div>
                       <div className="text-sm">AI-powered connections</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center">
                       <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                       </svg>
                     </div>
                     <div>
                       <div className="font-semibold text-white">Job Opportunities</div>
                       <div className="text-sm">Find your next career move</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-accent-700 rounded-lg flex items-center justify-center">
                       <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M7 4V2C7 1.45 7.45 1 8 1h8c.55 0 1 .45 1 1v2h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h4zM9 2v2h6V2H9z"/>
                       </svg>
                     </div>
                     <div>
                       <div className="font-semibold text-white">Business Marketplace</div>
                       <div className="text-sm">Buy, sell, and trade</div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="lg:col-span-5">
                 <div className="relative">
                   <div className="relative rounded-2xl overflow-hidden shadow-2xl md:scale-110">
                     <img
                       alt="Global business networking"
                       className="w-full object-cover"
                       src="https://theblackrise.com/wp-content/uploads/2023/11/AdobeStock_257397505-scaled.jpeg"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* How It Works Section */}
        <div id="features" className="py-24 bg-white">

           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-20">
               <h2 className="text-5xl font-bold text-gray-900 mb-6">
                 How <span className="text-brand-600">54Links</span> Works
               </h2>
               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join our growing business network in just 3 simple steps and start unlocking unlimited opportunities.
               </p>
             </div>

           
           <div className="grid md:grid-cols-3 gap-12">
  {/* Step 1 */}
  <div className="text-center group">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        <span className="text-3xl font-bold text-white">1</span>
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up & Create Your Profile</h3>
    <p className="text-gray-600 text-lg leading-relaxed">
      Tell us who you are, what you do, and what you're looking for. Whether you're a founder, freelancer, or job seeker — your journey starts here.
    </p>
  </div>

  {/* Step 2 */}
  <div className="text-center group">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        <span className="text-3xl font-bold text-white">2</span>
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
        </svg>
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Matched Instantly</h3>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our smart AI connects you with the right people, jobs, and businesses based on your profile and interests.
    </p>
  </div>

  {/* Step 3 */}
  <div className="text-center group">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        <span className="text-3xl font-bold text-white">3</span>
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect & Grow</h3>
    <p className="text-gray-600 text-lg leading-relaxed">
      Chat, collaborate, buy, sell, hire, or partner. 54Links helps you build meaningful relationships that drive real results.
    </p>
  </div>
</div>


           </div>
         </div>

        {/* Platform Showcase Section */}
   
   <div className="py-20 bg-gray-100">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <div className="text-center mb-12">
      <h2 className="text-5xl font-bold text-gray-900 mb-6">
        See <span className="text-brand-600">54Links</span> in Action
      </h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Experience how easy it is to find opportunities, connect with professionals,
        and grow your network — all in one powerful platform.
      </p>
    </div>

    {/* Demo Preview */}
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mx-auto max-w-5xl">
      <img
        src={Demo}
        alt="54Links Platform Interface"
        className="w-full h-auto object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

      {/* Overlay Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold">Build Meaningful Business Connections</div>
            <div className="text-white/80 max-md:hidden">
              Connect with professionals, entrepreneurs, and businesses — all in one smart, secure platform.
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-4 max-md:hidden">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="font-semibold">Discover Opportunities</div>
            <div className="text-sm text-white/80">Business & Career Growth</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="font-semibold">Connect Instantly</div>
            <div className="text-sm text-white/80">Like-minded Professionals</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="font-semibold">Smart & Effective</div>
            <div className="text-sm text-white/80">Simple. Secure. Powerful.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>




        {/* Platform Features Section */}
        <div className="py-24 bg-gray-50">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-20">
               <h2 className="text-5xl font-bold text-gray-900 mb-6">
                 Everything You Need to <span className="text-brand-600">Succeed</span>
               </h2>
               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               From career growth to business partnerships, 54Links gives you the tools, connections, and community to thrive in today’s global economy.
               </p>
             </div>

          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  {/* People Network */}
  <div
    onClick={() => navigate("/people")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-brand-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart People Network</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Connect with the right people, effortlessly. Our AI-powered matching algorithm links you with professionals, entrepreneurs, and business leaders based on your goals, interests, and location.
    </p>
    <button
      onClick={() => navigate("/people")}
      className="flex items-center text-brand-600 font-semibold"
    >
      <span>Explore Network</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>

  {/* Job Opportunities */}
  <div
    onClick={() => navigate("/jobs")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-accent-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-accent-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Job Market</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Find your next opportunity or the talent you need. Discover exclusive job openings or hire top professionals with smart filters that make matching easy.
    </p>
    <button
      onClick={() => navigate("/jobs")}
      className="flex items-center text-accent-600 font-semibold"
    >
      <span>Find Opportunities</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>

  {/* Business Marketplace */}
  <div
    onClick={() => navigate("/products")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-brand-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 4V2C7 1.45 7.45 1 8 1h8c.55 0 1 .45 1 1v2h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h4zM9 2v2h6V2H9z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Marketplace</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Buy, sell, and grow with confidence. Trade products and services with verified businesses. Support entrepreneurs, discover suppliers, and scale your network securely.
    </p>
    <button
      onClick={() => navigate("/products")}
      className="flex items-center text-brand-600 font-semibold"
    >
      <span>Explore Marketplace</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>

  {/* Events & Communities */}
  <div
    onClick={() => navigate("/events")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-accent-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-accent-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 6v2h14V6H5z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Events & Communities</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Learn. Network. Lead. Join exclusive events, conferences, and industry-specific communities. Engage with global leaders and stay ahead of the curve.
    </p>
    <button
      onClick={() => navigate("/events")}
      className="flex items-center text-accent-600 font-semibold"
    >
      <span>Join Events</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>

  {/* Tourism & Culture */}
  <div
    onClick={() => navigate("/tourism")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-brand-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Tourism & Culture</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Explore the world through business. Connect with tourism entrepreneurs, promote destinations, and celebrate cultural heritage across borders.
    </p>
    <button
      onClick={() => navigate("/tourism")}
      className="flex items-center text-brand-600 font-semibold"
    >
      <span>Explore the World</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>

  {/* Funding & Investment */}
  <div
    onClick={() => navigate("/funding")}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-accent-200 cursor-pointer"
  >
    <div className="w-16 h-16 bg-accent-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Funding & Investment</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      Fuel your ideas with funding. Access crowdfunding, connect with investors, and join a vibrant startup ecosystem.
    </p>
    <button
      onClick={() => navigate("/funding")}
      className="flex items-center text-accent-600 font-semibold"
    >
      <span>Get Funded</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  </div>
          </div>


           </div>
         </div>

              {/* Platform Benefits Section */}
              <div id="benefits" className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-20">
                    <h2 className="text-5xl font-bold text-gray-900 mb-6">
                      Why Choose <span className="text-brand-600">54Links</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                      Join a platform designed to help you build meaningful business connections and accelerate your growth
                    </p>
                  </div>

                
                <div className="grid md:grid-cols-3 gap-8">
        {/* Verified Network */}
        <div
          onClick={() => navigate("/people")}
          className="text-center cursor-pointer hover:transform hover:scale-105 transition-transform"
        >
          <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Network</h3>
          <p className="text-gray-600 leading-relaxed">
            Every member is verified, ensuring you connect with genuine professionals and businesses you can trust.
          </p>
        </div>

        {/* Smart Matching */}
        <div
          onClick={() => navigate("/people")}
          className="text-center cursor-pointer hover:transform hover:scale-105 transition-transform"
        >
          <div className="w-20 h-20 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Matching</h3>
          <p className="text-gray-600 leading-relaxed">
            Our intelligent algorithm connects you with the most relevant people and opportunities.
          </p>
        </div>

        {/* Secure & Private */}
        <div
          onClick={() => navigate("/privacy")}
          className="text-center cursor-pointer hover:transform hover:scale-105 transition-transform"
        >
          <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Private</h3>
          <p className="text-gray-600 leading-relaxed">
            Your data is protected with enterprise-grade security. You control your visibility and connections.
          </p>
        </div>
      </div>


           </div>
         </div>

        {/* Community Section */}
        <div id="community" className="py-20 bg-brand-600">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
               <h2 className="text-4xl font-bold text-white mb-6">
                 Join Our Growing Business Community
               </h2>
               <p className="text-xl text-white/90 max-w-3xl mx-auto">
                54Links is where ideas grow, partnerships form, and businesses scale.
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
               <div onClick={() => navigate("/people")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                 <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
                   </svg>
                 </div>
                 <div className="text-white font-semibold mb-2">Professional Network</div>
                 <div className="text-white/80 text-sm">Connect with verified professionals around the world.</div>
               </div>
            <div onClick={() => navigate("/events")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                 <div className="w-12 h-12 bg-accent-700 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 6v2h14V6H5z"/>
                   </svg>
                 </div>
                 <div className="text-white font-semibold mb-2">Business Events</div>
                 <div className="text-white/80 text-sm">Exclusive networking opportunities</div>
               </div>
               <div onClick={() => navigate("/people")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                 <div className="w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                   </svg>
                 </div>
                 <div className="text-white font-semibold mb-2">Smart Matching</div>
                 <div className="text-white/80 text-sm">Get connected to the right people — automatically.</div>
               </div>
             
             </div>
           </div>
         </div>

        {/* Getting Started Section */}
        <div className="py-16 bg-gray-50 hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Join our platform today and start building meaningful business connections
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div onClick={() => navigate("/signup")} className="bg-white rounded-xl p-6 shadow-sm border border-brand-100 cursor-pointer hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Profile</h3>
                  <p className="text-gray-600 text-sm">Set up your professional profile in minutes</p>
                </div>
                <div onClick={() => navigate("/people")} className="bg-white rounded-xl p-6 shadow-sm border border-accent-100 cursor-pointer hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Connections</h3>
                  <p className="text-gray-600 text-sm">Find relevant professionals and businesses</p>
                </div>
                <div onClick={() => navigate("/people")} className="bg-white rounded-xl p-6 shadow-sm border border-brand-100 cursor-pointer hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Grow Your Network</h3>
                  <p className="text-gray-600 text-sm">Build partnerships and accelerate your success</p>
                </div>
              </div>
            </div>
          </div>

         {/* Inline Login Form Section - Added after "Ready to Get Started?" */}
         <div className="py-16 bg-white">
           <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
               </h2>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Create your account and start building connections that matter.
               </p>
             </div>

             <div className="flex justify-center">
               <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6 md:p-8">
                 {/* Custom Tab Switch */}
                 <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm">
                   <button
                     onClick={() => setAuthTab("login")}
                     className={`text-center rounded-lg py-2 font-medium transition ${authTab === "login" ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
                   >
                     Sign In
                   </button>
                   <button
                     onClick={() => setAuthTab("signup")}
                     className={`text-center rounded-lg py-2 font-medium transition ${authTab === "signup" ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
                   >
                     Sign Up
                   </button>
                 </div>

                 {authTab === "login" ? (
                   <form onSubmit={onAuthLoginSubmit} className="space-y-4">
                     <Input
                       name="email"
                       label="Email Address"
                       type="email"
                       placeholder="Enter your email"
                       value={loginForm.email}
                       onChange={onAuthLoginChange}
                       error={loginErrors.email}
                       rightIcon={
                         <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                           <path d="M4 6h16v12H4z"/><path d="m22 6-10 7L2 6"/>
                         </svg>
                       }
                     />

                     {/* PASSWORD with show/hide */}
                     <Input
                       name="password"
                       label="Password"
                       type={showPwd ? "text" : "password"}
                       placeholder="Enter your password"
                       value={loginForm.password}
                       onChange={onAuthLoginChange}
                       error={loginErrors.password}
                       rightIcon={
                         <button
                           type="button"
                           onClick={() => setShowPwd((s) => !s)}
                           aria-label={showPwd ? "Hide password" : "Show password"}
                           className="p-1 text-gray-500 hover:text-gray-700"
                         >
                           {showPwd ? (
                             // eye-off
                             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                               <path d="M3 3l18 18"/>
                               <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                             </svg>
                           ) : (
                             // eye
                             <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                               <circle cx="12" cy="12" r="3"/>
                             </svg>
                           )}
                         </button>
                       }
                     />

                     <div className="flex items-center justify-between text-sm">
                       <label className="inline-flex items-center gap-2">
                         <input
                           name="remember"
                           type="checkbox"
                           checked={loginForm.remember}
                           onChange={onAuthLoginChange}
                           className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                         />
                         <span className="text-gray-600">Remember me</span>
                       </label>
                       <button
                         type="button"
                         onClick={() => navigate("/forgot")}
                         className="text-brand-500 hover:underline"
                       >
                         Forgot password?
                       </button>
                     </div>

                     <button
                       type="submit"
                       disabled={loading}
                       className="mt-1 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                       {loading && (
                         <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
                         </svg>
                       )}
                       {loading ? "Signing In..." : "Sign In"}
                     </button>

                     {/* Divider */}
                     <div className="relative my-6">
                       <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-200"></div>
                       </div>
                       <div className="relative flex justify-center">
                         <span className="bg-white px-4 text-xs uppercase tracking-wider text-gray-400">
                           or continue with
                         </span>
                       </div>
                     </div>

                     {/* Google custom button with required style */}
                     <GoogleCustomBtn page="signin" />

                     {/* Sign up link */}
                     <div className="mt-4 text-center text-sm">
                       <span className="text-gray-600">Don't have an account?</span>{" "}
                       <button
                         type="button"
                         onClick={() => setAuthTab("signup")}
                         className="text-brand-500 hover:underline font-medium"
                       >
                         Sign up
                       </button>
                     </div>
                   </form>
                 ) : (
                   /* Signup Form */
                   <form onSubmit={onAuthSignupSubmit} className="">
                     {/* Account type */}
                     <div className="flex gap-3 mb-4">
                       <button
                         type="button"
                         onClick={() => setAcct("individual")}
                         className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                           acct === "individual"
                             ? "border-brand-500 text-brand-700 bg-brand-50"
                             : "border-gray-200 text-gray-700"
                         }`}
                       >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM3 22a9 9 0 1 1 18 0Z" />
                         </svg>
                         Individual
                       </button>
                       <button
                         type="button"
                         onClick={() => setAcct("company")}
                         className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                           acct === "company"
                             ? "border-brand-500 text-brand-700 bg-brand-50"
                             : "border-gray-200 text-gray-700"
                         }`}
                       >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M3 21V3h8v6h10v12H3Z" />
                         </svg>
                         Organization
                       </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Name (dynamic label, same variable name) */}
                       <div className="md:col-span-2">
                         <Input
                           label={labelName}
                           name="name"
                           placeholder={acct === "company" ? "54Links Ltd." : "John Doe"}
                           value={signupForm.name}
                           onChange={onAuthSignupChange}
                           error={signupErrors.name}
                         />
                       </div>

                       {/* Email (dynamic label, same variable name) */}
                       <div className="md:col-span-1">
                         <Input
                           label={labelEmail}
                           name="email"
                           type="email"
                           placeholder={acct === "company" ? "contact@yourcompany.com" : "john@example.com"}
                           value={signupForm.email}
                           onChange={onAuthSignupChange}
                           error={signupErrors.email}
                         />
                       </div>

                       {/* Phone (dynamic label, same variable name) */}
                       <div className="md:col-span-1">
                         <Input
                           label={labelPhone}
                           name="phone"
                           type="tel"
                           onWheel={e => e.currentTarget.blur()}
                           placeholder={acct === "company" ? "Phone" : "Phone"}
                           value={signupForm.phone}
                           onChange={(e) => {
                             const { name, value: newValue } = e.target;
                             // Allow only one "+" and it should be at the beginning, no spaces allowed
                             const cleaned = newValue.replace(/[^+\d\-\(\)]/g, '');
                             const plusCount = (cleaned.match(/\+/g) || []).length;
                             if (plusCount > 1) {
                               // If more than one +, remove all + and add one at the beginning
                               const withoutPlus = cleaned.replace(/\+/g, '');
                               setSignupForm((f) => ({ ...f, [name]: '+' + withoutPlus }));
                             } else {
                               setSignupForm((f) => ({ ...f, [name]: cleaned }));
                             }
                             setSignupErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error while typing
                           }}
                           error={signupErrors.phone}
                         />
                       </div>

                       {/* Country */}
                       <div className="md:col-span-2 space-y-1">
                         <label className="text-sm font-medium text-gray-700">Country</label>
                         <select
                           name="country"
                           value={signupForm.country}
                           onChange={onAuthSignupChange}
                           className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                             signupErrors.country ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                           }`}
                         >
                           <option value="" disabled>Select your country</option>
                           {COUNTRIES.map((c) => (
                             <option key={c} value={c}>{c}</option>
                           ))}
                         </select>
                         {signupErrors.country && <p className="text-xs text-red-600">{signupErrors.country}</p>}
                       </div>

                       {/* Passwords with show/hide */}
                       <Input
                         label="Password"
                         name="password"
                         type={showPwd1 ? "text" : "password"}
                         placeholder="Create a strong password"
                         value={signupForm.password}
                         onChange={onAuthSignupChange}
                         error={signupErrors.password}
                         rightIcon={
                           <button
                             type="button"
                             onClick={() => setShowPwd1((s) => !s)}
                             aria-label={showPwd1 ? "Hide password" : "Show password"}
                             className="p-1 text-gray-500 hover:text-gray-700"
                           >
                             {showPwd1 ? (
                               // eye-off
                               <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                 <path d="M3 3l18 18"/>
                                 <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                               </svg>
                             ) : (
                               // eye
                               <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                                 <circle cx="12" cy="12" r="3"/>
                               </svg>
                             )}
                           </button>
                         }
                       />
                       <Input
                         label="Confirm Password"
                         name="confirmPassword"
                         type={showPwd2 ? "text" : "password"}
                         placeholder="Confirm your password"
                         value={signupForm.confirmPassword}
                         onChange={onAuthSignupChange}
                         error={signupErrors.confirmPassword}
                         rightIcon={
                           <button
                             type="button"
                             onClick={() => setShowPwd2((s) => !s)}
                             aria-label={showPwd2 ? "Hide password" : "Show password"}
                             className="p-1 text-gray-500 hover:text-gray-700"
                           >
                             {showPwd2 ? (
                               // eye-off
                               <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                 <path d="M3 3l18 18"/>
                                 <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                               </svg>
                             ) : (
                               // eye
                               <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                                 <circle cx="12" cy="12" r="3"/>
                               </svg>
                             )}
                           </button>
                         }
                       />

                       {/* TOS */}
                       <div className="md:col-span-2 flex items-start gap-3 text-sm">
                         <input
                           name="tos"
                           type="checkbox"
                           checked={signupForm.tos}
                           onChange={onAuthSignupChange}
                           className={`mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 ${
                             signupErrors.tos ? "ring-2 ring-red-400" : ""
                           }`}
                         />
                         <p className="text-gray-600">
                           I agree to the{" "}
                           <a href="/terms" target="_blank"
                   rel="noopener noreferrer" className="text-brand-600 underline">Terms of Service</a> and{" "}
                           <a href="/privacy" target="_blank"
                   rel="noopener noreferrer" className="text-brand-600 underline">Privacy Policy</a>
                         </p>
                       </div>
                       {signupErrors.tos && (
                         <div className="md:col-span-2 -mt-2">
                           <p className="text-xs text-red-600">{signupErrors.tos}</p>
                         </div>
                       )}

                       {/* Submit */}
                       <div className="md:col-span-2 space-y-4">
                         <button
                           type="submit"
                           disabled={loading}
                           className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                         >
                           {loading && (
                             <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                             </svg>
                           )}
                           {loading ? "Creating Account…" : "Create Account"}
                         </button>

                         {/* Optional Google button */}
                         <GoogleCustomBtn page="signup" />
                       </div>

                       {/* Login link */}
                       <div className="md:col-span-2 text-center text-sm mt-4">
                         <span className="text-gray-600">Already have an account?</span>{" "}
                         <button
                           type="button"
                           onClick={() => setAuthTab("login")}
                           className="text-brand-500 hover:underline font-medium"
                         >
                           Sign in
                         </button>
                       </div>
                     </div>
                   </form>
                 )}
               </div>
             </div>
           </div>
         </div>


        {/* Final CTA Section */}
        <div className="py-24 bg-brand-600 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10">
             <div className="absolute inset-0" style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }} />
           </div>

           <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
             <div className="mb-8">
               <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                 Ready to Build Your
                 <span className="block text-accent-100">
                   Global Business Network?
                 </span>
               </h2>
               <p className="text-xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
                Join our growing community of professionals and entrepreneurs using <strong>54Links</strong> to grow faster, connect smarter, and build stronger partnerships.
               </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
               <button
                 onClick={() => setLoginDialogOpen(true)}
                 className="group relative px-12 py-5 bg-white text-brand-600 font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-xl"
               >
                 <span className="relative z-10 flex items-center gap-3">
                   🚀 Start Building Connections
                   <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                   </svg>
                 </span>
                 <div className="absolute inset-0 bg-accent-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </button>
               <button
                 onClick={() => navigate("/people")}
                 className="px-12 py-5 border-2 border-white/60 text-white font-bold rounded-2xl hover:bg-white/10 hover:border-white transition-all duration-300 text-xl"
               >
                 🌍 Explore the Network
               </button>
             </div>

             {/* Trust Indicators */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/90">
               <div className="flex items-center justify-center gap-3">
                 <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                   </svg>
                 </div>
                 <div className="text-left">
                   <div className="font-bold text-white">Verified Network</div>
                   <div className="text-sm">Trusted connections only</div>
                 </div>
               </div>

               <div className="flex items-center justify-center gap-3">
                 <div className="w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                   </svg>
                 </div>
                 <div className="text-left">
                   <div className="font-bold text-white">Secure Platform</div>
                   <div className="text-sm">Enterprise-grade security</div>
                 </div>
               </div>

               <div className="flex items-center justify-center gap-3">
                 <div className="w-12 h-12 bg-accent-700 rounded-full flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4v-2z"/>
                   </svg>
                 </div>
                 <div className="text-left">
                   <div className="font-bold text-white">Global Community</div>
                   <div className="text-sm">Connections</div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* Footer */}
        <footer className="bg-brand-700 text-white py-16">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="grid md:grid-cols-4 gap-8 mb-12">
               <div className="md:col-span-2">
                 <div className="flex items-center gap-3 mb-6">
                   <span className="text-2xl font-bold text-white">54Links</span>
                 </div>
                 <p className="text-white/90 mb-6 max-w-md leading-relaxed">
                   A comprehensive business networking platform connecting entrepreneurs, professionals, and businesses. Building stronger networks through meaningful connections.
                 </p>
                 <div className="flex gap-4 hidden">
                   <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                     <span className="text-sm">📘</span>
                   </a>
                   <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                     <span className="text-sm">🐦</span>
                   </a>
                   <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                     <span className="text-sm">💼</span>
                   </a>
                   <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-500 transition-colors">
                     <span className="text-sm">📧</span>
                   </a>
                 </div>
               </div>

               <div>
                 <h3 className="text-lg font-semibold mb-4 text-accent-100">Platform</h3>
                 <ul className="space-y-3 text-white/80">
                   <li><a onClick={() => navigate("/")} className="hover:text-accent-200 transition-colors cursor-pointer">Feed</a></li>
                   <li><a onClick={() => navigate("/people")} className="hover:text-accent-200 transition-colors cursor-pointer">People</a></li>
                   <li><a onClick={() => navigate("/jobs")} className="hover:text-accent-200 transition-colors cursor-pointer">Jobs</a></li>
                   <li><a onClick={() => navigate("/events")} className="hover:text-accent-200 transition-colors cursor-pointer">Events</a></li>
                   <li><a onClick={() => navigate("/products")} className="hover:text-accent-200 transition-colors cursor-pointer">Products</a></li>
                   <li><a onClick={() => navigate("/services")} className="hover:text-accent-200 transition-colors cursor-pointer">Services</a></li>
                 </ul>
               </div>

               <div>
                 <h3 className="text-lg font-semibold mb-4 text-accent-100">Company</h3>
                 <ul className="space-y-3 text-white/80">
                   <li><a onClick={() => navigate("/terms")} className="hover:text-accent-200 transition-colors cursor-pointer">Terms of Service</a></li>
                   <li><a onClick={() => navigate("/privacy")} className="hover:text-accent-200 transition-colors cursor-pointer">Privacy Policy</a></li>
                 </ul>
               </div>
             </div>

             <div className="border-t border-white/20 pt-8">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="text-white/70 text-sm">
                   © 2025 54Links. All rights reserved. Building global business networks together.
                 </div>
                 <div className="flex items-center gap-6 text-sm text-white/70">
                   <span>🌍 Global Platform</span>
                   <span>🔒 Secure & Verified</span>
                   <span>🤝 Trusted Connections</span>
                 </div>
               </div>
             </div>
           </div>
         </footer>

      </section>


      
      {/* Login Dialog */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab="signup" // Show signup tab first when opened from signup button
      />
   
    </DefaultLayout>
  );
}
