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
import Header from "../components/Header";

/* ---------------- Shared styles ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white " +
    "bg-gradient-to-r from-[#6B21A8] via-[#3730A3] to-[#1E3A8A] " +
    "hover:opacity-90 transition",
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      from: "them",
      text: "Hi! I saw your post about the fintech consulting opportunity. I have 8+ years of experience in financial services across Africa.",
      time: "10:30 AM",
    },
    {
      from: "me",
      text: "That's great! I'd love to hear more about your experience. Do you have expertise in mobile payment systems?",
      time: "10:32 AM",
    },
    {
      from: "them",
      text: "Absolutely! I've worked on implementing mobile payment solutions in Nigeria, Kenya, and Ghana. I can share some case studies if you're interested.",
      time: "10:35 AM",
    },
    {
      from: "me",
      text: "Perfect! That's exactly what we need. When would be a good time for a video call to discuss this further?",
      time: "10:38 AM",
    },
    {
      from: "them",
      text: "Great opportunity! When can we discuss this further?",
      time: "Just now",
    },
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
      <Header/>

      {/* ===== Content ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Conversations */}
        <aside className="w-80 border-r bg-white p-4 flex flex-col">
          <input
            placeholder="Search conversations..."
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
          />
          <div className="flex gap-4 mt-3 text-sm">
            <button className="font-medium text-indigo-700">All</button>
            <button className="text-gray-500">Unread</button>
            <button className="text-gray-500">Groups</button>
          </div>
          {/* Conversations list ... (unchanged) */}
        </aside>

        {/* Chat Window */}
        <section className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b bg-white px-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Marcus Johnson</h2>
              <p className="text-xs text-green-600">
                Online • Business Consultant
              </p>
            </div>
            <button className="text-gray-500">⋮</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.from === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    m.from === "me"
                      ? "text-white bg-gradient-to-r bg-brand-500"
                      : "bg-white border"
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
            <button
              onClick={handleSend}
              className={`${styles.primary} p-2 rounded-xl`}
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
