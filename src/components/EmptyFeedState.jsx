import React from "react";
import { useNavigate } from "react-router-dom";

function EmptyFeedState({ activeTab }) {
  const navigate = useNavigate();

  const title =
    activeTab === "Events"
      ? "No events found"
      : activeTab === "Job Opportunities"
      ? "No job opportunities found"
      : "No results found";

  const desc =
    activeTab === "Events"
      ? "We couldn’t find events that match your filters."
      : activeTab === "Job Opportunities"
      ? "We couldn’t find job opportunities that match your filters."
      : "We couldn’t find any items that match your filters.";

  const chips =
    activeTab === "Events"
      ? ["This week", "Free", "Online", "Networking", "Technology"]
      : activeTab === "Job Opportunities"
      ? ["Remote", "Junior", "Senior", "Technology", "Finance"]
      : ["Technology", "Finance", "Lagos", "Accra", "Remote"];

  return (
    <div className="rounded-2xl border bg-white p-8 text-gray-700">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon container */}
        <div className="h-16 w-16 rounded-2xl grid place-items-center bg-brand-50">
          <svg
            className="h-8 w-8 text-brand-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-3.5-3.5" />
          </svg>
        </div>

        {/* Title & description */}
        <h3 className="text-lg font-semibold text-brand-600">{title}</h3>
        <p className="text-sm text-gray-500 max-w-md">{desc}</p>
        <br />
        <br />
        <br />
      </div>
    </div>
  );
}

export default EmptyFeedState;
