// src/components/QuickActionsPanel.jsx
import { X } from "lucide-react";
import React, { useState } from "react";

/* brand */
const BRAND = "#8A358A";

/* tiny inline icons */
const I = {
  chevron: ({open}) => (
    <svg
      className={`h-4 w-4 transform transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  bell:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/></svg>,
  users:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM2 20a6 6 0 0 1 12 0v1H2Z"/></svg>,
  chat:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  plus:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>,
  calendar:() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M7 2h2v3H7zm8 0h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"/></svg>,
  check:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white"><path d="M9 16.2 4.8 12l-1.8 1.8L9 20l12-12-1.8-1.8z"/></svg>,
  close:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  pin:    () => <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>,
};

/* helpers */
const Section = ({title, icon, children, right}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          {icon}{title}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <I.chevron open={open}/>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

const Counter = ({n}) => (
  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6B6B] px-1.5 text-[11px] font-semibold text-white">
    {n}
  </span>
);

const CircleBtn = ({children, className="", style, ...rest}) => (
  <button
    className={`h-8 w-8 grid place-items-center rounded-full shadow-sm ${className}`}
    style={style}
    {...rest}
  >
    {children}
  </button>
);

/* component */
export default function QuickActionsPanel() {
  return (
    <aside className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm mb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <I.bell />
          <h3 className="text-lg font-semibold text-gray-900">My Hub</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">Stay connected and organized</p>
      </div>

      {/* Connection Requests */}
      <Section
        title="Connection Requests"
        icon={<I.users />}
        right={<Counter n={3} />}
      >
        {[
          {name:"Sarah Johnson", title:"Tech Entrepreneur", img:"https://i.pravatar.cc/80?img=65"},
          {name:"Michael Chen", title:"Investor", img:"https://i.pravatar.cc/80?img=12"},
        ].map((p)=>(
          <div key={p.name} className="flex items-center justify-between mb-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <img src={p.img} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0"/>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-gray-900 truncate">{p.name}</div>
                <div className="text-xs text-gray-500 truncate">{p.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CircleBtn style={{background: BRAND}}><I.check/></CircleBtn>
              <CircleBtn className="border border-gray-200 text-gray-500 bg-white"><X size={18}/></CircleBtn>
            </div>
          </div>
        ))}
      </Section>

      {/* Recent Chats */}
      <Section
        title="Recent Chats"
        icon={<I.chat />}
        right={
          <button className="h-7 w-7 grid place-items-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
            <I.plus/>
          </button>
        }
      >
        {[
          {name:"Emma Wilson", msg:"Great! Let's schedule a call...", time:"2m", img:"https://i.pravatar.cc/80?img=57", online:true},
          {name:"David Rodriguez", msg:"Thanks for connecting!", time:"1h", img:"https://i.pravatar.cc/80?img=33", online:false},
        ].map(c=>(
          <div
            key={c.name}
            className="flex items-center justify-between mb-3 rounded-lg px-2 py-1 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img src={c.img} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0"/>
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${c.online?"bg-emerald-500":"bg-gray-300"}`}/>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                <div className="text-xs text-gray-500 truncate">{c.msg}</div>
              </div>
            </div>
            <span className="text-[11px] text-gray-400">{c.time}</span>
          </div>
        ))}
      </Section>

      {/* Upcoming Meetings */}
      <Section
        title="Upcoming Meetings"
        icon={<I.calendar />}
        right={<Counter n={2} />}
      >
        {/* Meeting 1 */}
        <div className="rounded-xl border border-gray-200 bg-white mb-3">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-800">Partnership Discussion</div>
              <span className="rounded-full bg-orange-100 text-orange-700 text-[11px] px-2 py-0.5">Today</span>
            </div>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
              <I.pin/> with John Smith • 3:00 PM
            </div>
          </div>
          <div className="p-3 pt-0">
            <button
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{background: BRAND}}
            >
              Join Meeting
            </button>
          </div>
        </div>

        {/* Meeting 2 */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-800">Investment Pitch</div>
              <span className="rounded-full bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5">Tomorrow</span>
            </div>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
              <I.pin/> with Sarah Lee • 11:00 AM
            </div>
          </div>
          <div className="p-3 pt-0">
            <button
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{background: BRAND}}
            >
              Join Meeting
            </button>
          </div>
        </div>
      </Section>
    </aside>
  );
}
