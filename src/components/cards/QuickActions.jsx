// src/components/cards/QuickActions.jsx
import React from "react";
import { Pencil, Rocket, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold">Quick Actions</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        <li onClick={()=>navigate('/profile')}>
          <span className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <Pencil size={16} className="text-[#8a358a]" /> Edit Profile
          </span>
        </li>
        <li onClick={()=>navigate('/settings')}>
          <span className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <Rocket size={16} className="text-[#8a358a]" /> Boost Profile
          </span>
        </li>
        <li onClick={()=>navigate('/news/create')}>
          <span className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <PlusCircle size={16} className="text-[#8a358a]" /> Create News Post
          </span>
        </li>
      </ul>
    </div>
  );
}
