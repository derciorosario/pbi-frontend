// src/components/ServiceCard.jsx
import React from "react";
import { MapPin, User, Star } from "lucide-react";

export default function ServiceCard({
  avatar,
  title,
  description,
  provider,
  country,
  rating,
  reviews,
  price,
  priceUnit,
  type, // "Offering" | "Seeking"
  tags = [],
  onDetails,
  onContact,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-5">
      {/* Left: Avatar */}
      <div className="flex-shrink-0">
        <img
          src={avatar}
          alt={provider}
          className="h-14 w-14 rounded-full object-cover border"
        />
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="text-brand-600 font-semibold">
            {price}
            {priceUnit && <span className="text-sm font-normal">/{priceUnit}</span>}
          </div>
        </div>

        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User size={14} /> {provider}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {country}
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-medium">
            <Star size={14} fill="currentColor" /> {rating} ({reviews})
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onDetails}
          className="rounded-lg border border-brand-600 text-brand-600 px-3 py-1.5 text-sm font-medium hover:bg-brand-50"
        >
          View Details
        </button>
        <button
          onClick={onContact}
          className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-700"
        >
          {type === "Seeking" ? "Apply" : "Contact"}
        </button>
      </div>
    </div>
  );
}
