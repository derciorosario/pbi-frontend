import React from "react";
import hero from "../assets/phone-hero.png";

export default function LeftPanel() {
  return (
    <div className="left-gradient h-full text-white relative overflow-hidden flex items-center justify-center p-10">
      <div className="max-w-md text-center">
        <div className="mx-auto w-80 h-80 relative">
          <img alt="phone" src={hero} className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        <h1 className="mt-6 text-[2rem] md:text-[2rem] font-bold leading-tight">
          One African, One Market,<br/>One App
        </h1>
        <p className="mt-8 tracking-wide uppercase text-sm text-white/80">
          PanAfrican Business Initiative
        </p>
      </div>
    </div>
  );
}
