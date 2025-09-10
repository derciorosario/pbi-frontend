import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './pages/home/index';
import OldHome from './pages/home/index.old.jsx';
import NotFound from './pages/404';
import Login from './pages/login'
import Signup from './pages/signup'
import Dashboard from './pages/dashboard';
import VerifyEmailSent from "./pages/VerifyEmailSent.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";       // NEW
import ResetEmailSent from "./pages/ResetEmailSent.jsx";       // NEW
import ResetPassword from "./pages/ResetPassword.jsx";  
import ResetSuccess from "./pages/ResetSuccess.jsx";   
import ProfilePage from "./pages/Profile"; 
import CreateJobOpportunity from "./pages/CreateJobOpportunity";

// src/pages/onboarding/index.jsx (routes snippet)
import OnboardingGate from "./pages/onboarding/OnboardingGate";
import WhoYouAre from "./pages/onboarding/WhoYouAre";
import Industry from "./pages/onboarding/Industry";
import Goals from "./pages/onboarding/Goals";
import PeopleFeedPage2 from './pages/PeopleDiscover.jsx';
import JobsExplorePage from './pages/JobsExplorePage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import BusinessPage from './pages/BusinessPage.jsx';
import TourismPage from './pages/TourismPage.jsx';
import CompanyPage from './pages/CompaniesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import MeetingsPage from './pages/meetings/index.jsx';
import CreateEventPage from './pages/CreateEventPage.jsx';
import CreateServicePage from './pages/CreateServicePage.jsx';
import CreateServiceRequestPage from './pages/CreateServicePage.jsx';
import CreateProductPage from './pages/CreateProductPage.jsx';
import CreateTourismPostPage from './pages/CreateTourismPostPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import PeopleFeedPage from './pages/PeopleFeedPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import OneShotOnboarding from './pages/onboarding/OneShotOnboarding.jsx';
import TwoStepOnboarding from './pages/onboarding/TwoStepOnboarding.jsx';
import ProtectedRouteOnboarding from '../ProtectedRouteOnBoarding.jsx';
import ServicesPage from './pages/ServicePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CrowdfundingPage from './pages/CrowdfundingPage.jsx';
import CrowdfundForm from './components/CrowdfundForm.jsx';
import TermsOfServicePage from './pages/legal/TermsOfService.jsx';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicy.jsx';



function App() {


  return (
    <Router>
      <Routes>
        
         <Route path="/login"  element={<Login/>} />
         <Route path="/onboarding"  element={<TwoStepOnboarding/>} />
         <Route path="/onboarding-one"  element={<OneShotOnboarding/>} />
         <Route path="/signup"  element={<Signup/>} />
         <Route path="*" element={<NotFound />} />
         <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
         <Route path="/verify/:token" element={<VerifyEmail />} />
         
      
         {/* Forgot / Reset password */}
        <Route path="/reset-success" element={<ResetSuccess />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-email-sent" element={<ResetEmailSent />} />
        <Route path="/reset/:token" element={<ResetPassword />} />

        <Route path="/onboarding/who-you-are" element={<WhoYouAre />} />
        <Route path="/onboarding/industry"    element={<Industry />} />
        <Route path="/onboarding/goals"       element={<Goals />} />

        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />

        <Route element={<ProtectedRoute />}>

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jobs/create" element={<CreateJobOpportunity />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/services/create" element={<CreateServicePage />} />
            <Route path="/service/:id" element={<CreateServicePage />} />
            <Route path="/services/request/create" element={<CreateServiceRequestPage />} />
            <Route path="/products/create" element={<CreateProductPage />} />
            <Route path="/product/:id" element={<CreateProductPage />} />
            <Route path="/experiences/create" element={<CreateTourismPostPage />} />
            <Route path="/experience/:id" element={<CreateTourismPostPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/job/:id" element={<CreateJobOpportunity />} />
            <Route path="/event/:id" element={<CreateEventPage />} />
            <Route path="/fundings/create" element={<CrowdfundForm />} />
            <Route path="/funding/:id" element={<CrowdfundForm />} />
            
            
        </Route>

        <Route element={<ProtectedRouteOnboarding/>}>
            <Route path="/" element={<Home/>} />
            <Route path="/dashboard" element={<Home/>} />
            <Route path="/funding" element={<CrowdfundingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/jobs" element={<JobsExplorePage />} />
            <Route path="/tourism" element={<TourismPage />} /> 
            <Route path="/companies" element={<CompanyPage />} />
             <Route path="/people" element={<PeopleFeedPage />} />
            <Route path="/services" element={<ServicesPage/>} />
            <Route path="/products" element={<ProductsPage />} />
        </Route>

      </Routes>
    </Router>
  );


}


export default App;
