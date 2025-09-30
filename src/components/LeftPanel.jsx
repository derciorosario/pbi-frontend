// src/components/LeftPanel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/phone-hero.png";
import Logo from '../assets/logo.png'
import WhiteLogo from '../assets/logo-white.png'

export default function LeftPanel() {
  const navigate = useNavigate();

  return (
    <div className="to-brand-600 from-brand-600 bg-gradient-to-br h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-10">
      {/* Home button at the top */}
     
     <div className="absolute left-4 top-4">
        <h1 onClick={()=>navigate('/')} className="hover:underline cursor-pointer text-[20px]">
          <img src={WhiteLogo} width={110}/>
        </h1>
     </div>

      {/* Hero content */}
      <div className="max-w-md text-center mt-16">
        <div className="mx-auto w-[26rem] relative">
          <img
            alt="phone"
            src={hero}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
        <h1 className="mt-6 text-[2rem] md:text-[2rem] font-bold leading-tight">
         Connect. Collaborate.
          <br />
          Grow.
        </h1>
        <p className="mt-8 tracking-wide uppercase text-sm text-white/80">
          &copy; 2025 54Links
        </p>
      </div>
    </div>
  );
}
