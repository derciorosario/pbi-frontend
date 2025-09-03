// src/components/PeopleProfileCard.jsx
import React, { useState } from "react";

/* --- Small reusable subcomponents --- */
const DotMenu = () => (
  <button
    className="h-9 w-9 grid place-items-center rounded-lg text-purple-400 hover:bg-purple-50"
    aria-label="More"
  >
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  </button>
);

const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-purple-100/70 text-[#8A358A] px-3 py-1 text-xs font-medium">
    {children}
  </span>
);

function avatarSrc({ avatarUrl, email, name }) {
  if (avatarUrl) return avatarUrl;
  if (email) return `https://i.pravatar.cc/100?u=${encodeURIComponent(email)}`;
  if (name) return `https://i.pravatar.cc/100?u=${encodeURIComponent(name)}`;
  return "https://placehold.co/100x100?text=User";
}

/* --- Main Card --- */
export default function PeopleProfileCard({
  avatarUrl,
  name,
  role,
  city,
  country,
  email,
  about,       // <-- new field
  lookingFor,
  goals = [],
  cats = [],
  onConnect,
  onMessage,
}) {
  const location = [city, country].filter(Boolean).join(", ");
  const [showFullAbout, setShowFullAbout] = useState(false);

  const MAX_CHARS = 150;
  const isLong = about && about.length > MAX_CHARS;
  const displayedAbout =
    !about ? "" : showFullAbout ? about : about.slice(0, MAX_CHARS) + (isLong ? "..." : "");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <img
            src={avatarSrc({ avatarUrl, email, name })}
            alt={name}
            className="h-14 w-14 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 truncate">
              {name}
            </div>
            {role && (
              <div className="text-sm text-gray-600 truncate">{role}</div>
            )}
            {location && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
                </svg>
                {location}
              </div>
            )}
          </div>
        </div>
        <DotMenu />
      </div>

      {/* About */}
      {about && (
        <div className="mt-4 text-[15px] leading-relaxed text-gray-700">
          {displayedAbout}
          {isLong && (
            <button
              onClick={() => setShowFullAbout(!showFullAbout)}
              className="ml-1 text-[#8A358A] font-medium text-sm hover:underline"
            >
              {showFullAbout ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Looking For */}
      {lookingFor && (
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
          Looking for: <span className="font-medium">{lookingFor}</span>
        </p>
      )}

      {/* Tags (Goals + Categories) */}
      {(!!goals.length || !!cats.length) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {goals.map((g) => (
            <Tag key={`goal-${g}`}>{g}</Tag>
          ))}
          {cats.map((c) => (
            <Tag key={`cat-${c}`}>{c}</Tag>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConnect}
          className="inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "#8A358A" }}
        >
          Connect
        </button>
        <button
          onClick={onMessage}
          className="inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-700"
        >
          Message
        </button>
      </div>
    </div>
  );
}
