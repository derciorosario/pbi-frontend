// src/pages/MessagesPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  Bell,
  Search,
  Send,
} from "lucide-react";

/* ---------------- Shared styles ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A]",
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { from: "them", text: "Hi! I saw your post about the fintech consulting opportunity. I have 8+ years of experience in financial services across Africa.", time: "10:30 AM" },
    { from: "me", text: "That's great! I'd love to hear more about your experience. Do you have expertise in mobile payment systems?", time: "10:32 AM" },
    { from: "them", text: "Absolutely! I've worked on implementing mobile payment solutions in Nigeria, Kenya, and Ghana. I can share some case studies if you're interested.", time: "10:35 AM" },
    { from: "me", text: "Perfect! That's exactly what we need. When would be a good time for a video call to discuss this further?", time: "10:38 AM" },
    { from: "them", text: "Great opportunity! When can we discuss this further?", time: "Just now" },
  ]);

  const [newMessage, setNewMessage] = useState("");

  function handleSend() {
    if (!newMessage.trim()) return;
    setMessages([...messages, { from: "me", text: newMessage, time: "Now" }]);
    setNewMessage("");
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900 flex flex-col">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">PANAFRICAN</div>
              <div className="text-[11px] text-gray-500 -mt-1">Business Initiative</div>
            </div>
          </div>

          {/* Navbar */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
            <a onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Home size={16}/> Feed</a>
            <a onClick={() => navigate("/people")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Users size={16}/> People</a>
            <a onClick={() => navigate("/jobs")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Briefcase size={16}/> Jobs</a>
            <a onClick={() => navigate("/events")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Calendar size={16}/> Events</a>
            <a onClick={() => navigate("/business")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Building2 size={16}/> Services</a>
            <a onClick={() => navigate("/tourism")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><MapPin size={16}/> Tourism</a>
          </nav>

          {/* Search + Notifications + Profile */}
          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search size={16} className="text-gray-500" />
              <input className="w-full bg-transparent outline-none text-sm" placeholder="Search people, jobs, events..." />
            </div>
            <button className="relative">
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">2</span>
              <Bell size={18} className="text-gray-600" />
            </button>
            <button className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">AB</button>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Conversations */}
        <aside className="w-80 border-r bg-white p-4 flex flex-col">
          <input
            placeholder="Search conversations..."
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
          />
          <div className="flex gap-4 mt-3 text-sm">
            <button className="font-medium text-[#8A358A]">All</button>
            <button className="text-gray-500">Unread</button>
            <button className="text-gray-500">Groups</button>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 text-sm">
            {[
              { name: "Marcus Johnson", msg: "Great opportunity! When can we discuss this further?", time: "2m", unread: 2, img: "https://i.pravatar.cc/100?img=11" },
              { name: "Sarah Williams", msg: "Thanks for connecting! I'd love to collaborate on...", time: "15m", unread: 0, img: "https://i.pravatar.cc/100?img=12" },
              { name: "Tech Entrepreneurs Group", msg: "Ahmed: Anyone interested in fintech startup?", time: "1h", unread: 5, img: "https://i.pravatar.cc/100?img=13" },
              { name: "David Chen", msg: "Perfect! Let's schedule a call for next week", time: "3h", unread: 0, img: "https://i.pravatar.cc/100?img=14" },
              { name: "Amina Hassan", msg: "Looking forward to the event in Lagos!", time: "1d", unread: 0, img: "https://i.pravatar.cc/100?img=15" },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <img src={c.img} className="h-10 w-10 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.msg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{c.unread}</span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <section className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b bg-white px-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Marcus Johnson</h2>
              <p className="text-xs text-green-600">Online • Business Consultant</p>
            </div>
            <button className="text-gray-500">⋮</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    m.from === "me" ? "bg-[#8A358A] text-white" : "bg-white border"
                  }`}
                >
                  {m.text}
                  <div className="mt-1 text-[10px] text-gray-400">{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t bg-white p-4 flex items-center gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <button onClick={handleSend} className={`${styles.primary} p-2 rounded-xl`}>
              <Send size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
