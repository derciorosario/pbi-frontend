// src/components/ProductCard.jsx
import React from "react";
import { MapPin, Star, Heart } from "lucide-react";

export default function ProductCard({
  image,
  title,
  description,
  price,
  currency = "$",
  location,
  rating,
  reviews,
  featured,
  onContact,
  onSave,
}) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Product image */}
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-44 object-cover"
        />
        {/* Save button */}
        <button
          onClick={onSave}
          className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
        >
          <Heart size={18} className="text-gray-600" />
        </button>
        {/* Featured badge */}
        {featured && (
          <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>

        {/* Price */}
        <div className="mt-2 font-semibold text-brand-600">
          {currency}{price}
        </div>

        {/* Meta info */}
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {location}
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Star size={14} fill="currentColor" /> {rating} ({reviews})
          </span>
        </div>

        {/* Action button */}
        <button
          onClick={onContact}
          className="mt-4 w-full rounded-lg bg-brand-600 text-white px-3 py-2 text-sm font-medium hover:bg-brand-700"
        >
          Contact
        </button>
      </div>
    </div>
  );
}
