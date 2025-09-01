import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './pages/home/index';
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

// src/pages/onboarding/index.jsx (routes snippet)
import OnboardingGate from "./pages/onboarding/OnboardingGate";
import WhoYouAre from "./pages/onboarding/WhoYouAre";
import Industry from "./pages/onboarding/Industry";
import Goals from "./pages/onboarding/Goals";

function App() {


  return (
    <Router>
      <Routes>
         {/**<Route path="/map"  element={<ProtectedRoute redirectTo="/login"><Map/></ProtectedRoute>} /> */}
         <Route path="/"  element={<Home/>} />
         <Route path="/login"  element={<Login/>} />
         <Route
  path="/dashboard"
  element={
    <OnboardingGate>
      <Dashboard />
    </OnboardingGate>
  }
/>
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

      

      </Routes>
    </Router>
  );


}


export default App;
