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
import FeedExplorePage from "./pages/feed/FeedExplorePage";
import PeopleFeedPage2 from './pages/PeopleDiscover.jsx';
import JobsExplorePage from './pages/JobsExplorePage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import BusinessPage from './pages/BusinessPage.jsx';
import TourismPage from './pages/TourismPage.jsx';
import CompanyPage from './pages/CompaniesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import CreateEventPage from './pages/CreateEventPage.jsx';
import CreateServicePage from './pages/CreateServicePage.jsx';
import CreateServiceRequestPage from './pages/CreateServicePage.jsx';
import CreateProductPage from './pages/CreateProductPage.jsx';
import CreateTourismPostPage from './pages/CreateTourismPostPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import PeopleFeedPage from './pages/PeopleFeedPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';



function App() {


  return (
    <Router>
      <Routes>
          <Route path="/old"  element={<OldHome/>} /> 
          <Route path="/people" element={<PeopleFeedPage />} />
         <Route path="/login"  element={<Login/>} />
         <Route
          path="/dashboard"
          element={
            <OnboardingGate>
              <Home />
            </OnboardingGate>
          }
        />

         <Route
          path="/"
          element={
            <OnboardingGate>
              <Home />
            </OnboardingGate>
          }
        />


        <Route path="/feed-test"  element={<PeopleFeedPage2/>} />
         <Route path="/signup"  element={<Signup/>} />
         <Route path="*" element={<NotFound />} />
         <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
         <Route path="/verify/:token" element={<VerifyEmail />} />
         
         <Route path="/services/offer/create" element={<CreateServicePage />} />
         <Route path="/services/request/create" element={<CreateServiceRequestPage />} />
         <Route path="/products/create" element={<CreateProductPage />} />
         <Route path="/experience/create" element={<CreateTourismPostPage />} />
         <Route path="/messages" element={<MessagesPage />} />

         {/* Forgot / Reset password */}
        <Route path="/reset-success" element={<ResetSuccess />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-email-sent" element={<ResetEmailSent />} />
        <Route path="/reset/:token" element={<ResetPassword />} />

        <Route path="/onboarding/who-you-are" element={<WhoYouAre />} />
        <Route path="/onboarding/industry"    element={<Industry />} />
        <Route path="/onboarding/goals"       element={<Goals />} />

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/jobs" element={<JobsExplorePage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/tourism" element={<TourismPage />} />

        <Route path="/companies" element={<CompanyPage />} />


        <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/jobs/create" element={<CreateJobOpportunity />} />
            <Route path="/events/create" element={<CreateEventPage />} />
        </Route>

        
      </Routes>
    </Router>
  );


}


export default App;
