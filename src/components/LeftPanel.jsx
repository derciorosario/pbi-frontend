// src/components/LeftPanel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/phone-hero.png";

export default function LeftPanel() {
  const navigate = useNavigate();

  return (
    <div className="to-brand-600 from-brand-600 bg-gradient-to-br h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-10">
      {/* Home button at the top */}
      <div
        className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold bg-brand-500">
          P
        </div>
        <div className="leading-tight">
          <div className="font-semibold">54LINKS</div>
          <div className="text-[11px] text-white/70 -mt-1">
            Business Initiative
          </div>
        </div>
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
          One African, One Market,
          <br />
          One App
        </h1>
        <p className="mt-8 tracking-wide uppercase text-sm text-white/80">
          &copy; 2025 PBI
        </p>
      </div>
    </div>
  );
}
