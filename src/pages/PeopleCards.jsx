// src/components/PeopleProfileCard.jsx
import React, { useState } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import ConnectionRequestModal from "../components/ConnectionRequestModal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* --- Small reusable subcomponents --- */
const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs font-medium">
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
  id,
  avatarUrl,
  name,
  role,
  city,
  country,
  email,
  about, // <-- new field
  lookingFor,
  goals = [],
  cats = [],
  onConnect,
  onMessage,
  connectionStatus,
}) {
  const location = [city, country].filter(Boolean).join(", ");
  const [showFullAbout, setShowFullAbout] = useState(false);
  const { user } = useAuth();
  const data = useData();
  const [requestPending, setRequestPending] = useState(false);
  const navigate = useNavigate();

  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function onSent() {
    setRequestPending(true);
  }

  function renderConnectButton() {
    if (connectionStatus == "outgoing_pending" || requestPending) {
      return (
        <button className="inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-yellow-100 text-yellow-700 cursor-default">
          Pending Request
        </button>
      );
    } else if (connectionStatus == "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="inline-flex cursor-pointer justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-brand-100 text-brand-600"
        >
          <ExternalLink size={20} className="mr-2" />
          Respond
        </button>
      );
    } else if (connectionStatus == "connected") {
      return (
        <button className="inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    } else {
      return (
        <button
          onClick={() => {
            if (!user) {
              data._showPopUp("login_prompt");
              return;
            }
            setModalOpen(true);
          }}
          className="inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
        >
          Connect
        </button>
      );
    }
  }

  const DotMenu = () => (
    <button
      onClick={() => {
        setOpenId(id);
        data._showPopUp("profile");
      }}
      className="grid _profile shrink-0 place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-600 transition-colors"
      title="View profile"
    >
      <I.see />
    </button>
  );

  const MAX_CHARS = 150;
  const isLong = about && about.length > MAX_CHARS;
  const displayedAbout = !about
    ? ""
    : showFullAbout
    ? about
    : about.slice(0, MAX_CHARS) + (isLong ? "..." : "");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-soft p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex ${
            !location || !role ? "items-center" : "items-start"
          } gap-4`}
        >
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
              className="ml-1 text-brand-600 font-medium text-sm hover:underline"
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
        {renderConnectButton()}

        <button
          onClick={() => {
            if (!user) {
              data._showPopUp("login_prompt");
            }
          }}
          className="inline-flex _login_prompt justify-center items-center rounded-xl px-5 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
        >
          Message
        </button>
      </div>

      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={id}
        toName={name}
        onSent={onSent}
      />

      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => {
          setOpenId(null);
        }}
        onSent={onSent}
      />
    </div>
  );
}
