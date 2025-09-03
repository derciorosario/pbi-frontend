// src/components/cards/ProfileCard.jsx
import React from "react";
import { styles } from "../ui/UiStyles";

export default function ProfileCard() {
  return (
    <div className="rounded-2xl bg-white border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <img src="https://i.pravatar.cc/100?img=5" alt="" className="h-12 w-12 rounded-full"/>
        <div>
          <div className="font-semibold">Sarah Johnson</div>
          <div className="text-xs text-gray-500">Tech Entrepreneur<br/>Lagos, Nigeria</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 bg-gray-50 rounded-xl text-center text-sm">
        <div className="p-3 border-r">
          <div className="text-xs text-gray-500">Profile Views</div>
          <div className="font-semibold">247</div>
        </div>
        <div className="p-3 border-r">
          <div className="text-xs text-gray-500">Connections</div>
          <div className="font-semibold">89</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500">Posts</div>
          <div className="font-semibold">23</div>
        </div>
      </div>
      <button className={`mt-4 ${styles.primaryWide}`}>Boost Your Profile</button>
    </div>
  );
}
