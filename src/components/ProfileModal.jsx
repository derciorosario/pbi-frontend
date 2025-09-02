// src/components/ProfileModal.jsx
import React from "react";
import { MapPin, X } from "lucide-react";

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

    const profile = {
    name: "Sarah Johnson",
    title: "Tech Entrepreneur & Investor",
    location: "Lagos, Nigeria",
    connections: 245,
    projects: 18,
    rating: 4.8,
    expertise: ["Technology", "Fintech", "Investment"],
    lookingFor: ["Partnership", "Startups"],
    about:
      "Passionate entrepreneur with 8+ years in fintech. Founded 2 successful startups and actively investing in African tech ecosystem.",
    avatar: "https://i.pravatar.cc/150?img=32",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header with Close */}
        <div className="bg-[#8A358A] p-4 flex justify-end items-center">
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 text-center overflow-y-auto">
          <img
            src={profile?.avatar || "https://i.pravatar.cc/150"}
            alt={profile?.name}
            className="h-24 w-24  rounded-full mx-auto border-4 border-white  shadow-md"
          />
          <h2 className="mt-3 text-lg font-semibold">{profile?.name}</h2>
          <p className="text-sm text-gray-600">{profile?.title}</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <MapPin size={14} /> {profile?.location}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 text-sm">
            <div>
              <p className="font-semibold">{profile?.connections || 0}</p>
              <p className="text-gray-500 text-xs">Connections</p>
            </div>
            <div>
              <p className="font-semibold">{profile?.projects || 0}</p>
              <p className="text-gray-500 text-xs">Projects</p>
            </div>
            <div>
              <p className="font-semibold">{profile?.rating || "—"}</p>
              <p className="text-gray-500 text-xs">Rating</p>
            </div>
          </div>

          {/* Expertise */}
          {profile?.expertise && (
            <div className="mt-5">
              <h3 className="font-medium text-sm mb-2">Expertise</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.expertise.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-purple-100 text-[#8A358A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {profile?.lookingFor && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Looking For</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.lookingFor.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {profile?.about && (
            <p className="mt-5 text-sm text-gray-600 text-left">{profile.about}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-[#8A358A] text-white hover:bg-[#7A2F7A]">
              Connect
            </button>
            <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              Message
            </button>
          </div>

          <button className="mt-4 text-sm text-[#8A358A] hover:underline">
            See complete profile
          </button>
        </div>
      </div>
    </div>
  );
}
