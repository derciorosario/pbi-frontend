import React, { useState, useMemo } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "./ProfileModal.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";

function avatarSrc(item, idx = 0) {
  if (item?.avatarUrl) return item.avatarUrl;
  if (item?.avatar) return item.avatar;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function Avatar({ item, idx = 0, size = "md", className = "" }) {
  const src = avatarSrc(item, idx);
  const initials = getInitials(item?.name);

  // If we have a valid avatar source, show the image
  if (src) {
    return (
      <img
        alt=""
        className={`${size === "sm" ? "h-9 w-9" : "h-10 w-10"} rounded-full object-cover flex-shrink-0 ${className}`}
        src={src}
      />
    );
  }

  // Otherwise, show initials with consistent brand colors like PeopleCards.jsx
  return (
    <div
      className={`${size === "sm" ? "h-9 w-9" : "h-10 w-10"} rounded-full flex-shrink-0 flex items-center justify-center font-semibold ${className}`}
      style={{
        backgroundColor: "#f3f4f6", // bg-gray-100
        color: "#374151" // text-gray-700
      }}
      title={item?.name || "Unknown"}
    >
      {initials}
    </div>
  );
}

// Clamp & clean match percentage to 0–100; return null if invalid
function getMatchPct(u) {
  const v = Number(u?.matchPercentage);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Skeleton Loader Components
const MatchCardSkeleton = () => (
  <div className="rounded-xl border border-gray-100 p-3 relative animate-pulse">
    {/* Match percentage skeleton */}
    <div className="inline-block mb-1 bg-gray-200 rounded-full px-2 py-0.5 text-[11px] w-16 h-5"></div>
    
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar skeleton */}
        <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="min-w-0 flex-1">
          {/* Name skeleton */}
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          {/* Title/location skeleton */}
          <div className="h-3 bg-gray-200 rounded mb-1 w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      {/* View profile button skeleton */}
      <div className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-gray-200"></div>
    </div>

    {/* Categories skeleton */}
    <div className="mt-2 flex flex-wrap gap-1">
      <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      <div className="h-5 bg-gray-200 rounded-full w-24"></div>
    </div>

    {/* Buttons skeleton */}
    <div className="mt-3 flex items-center gap-2">
      <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const NearbyCardSkeleton = () => (
  <div className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0 animate-pulse">
    {/* Match percentage skeleton */}
    <div className="inline-block mb-2 bg-gray-200 rounded-full px-2 py-0.5 text-[11px] w-16 h-5"></div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar skeleton */}
        <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="min-w-0 flex-1">
          {/* Name skeleton */}
          <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
          {/* Title/location skeleton */}
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
      {/* Connect button skeleton */}
      <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
    </div>

    {/* Categories skeleton */}
    <div className="mt-2 flex flex-wrap gap-1">
      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      <div className="h-5 bg-gray-200 rounded-full w-20"></div>
    </div>
  </div>
);

export default function SuggestedMatches({ 
  matches = [], 
  nearby = [], 
  loading = false 
}) {
  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState({ id: null, name: "" });
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local overlay of statuses (so we can flip to "pending" instantly)
  const initial = useMemo(() => {
    const m = {};
    [...matches, ...nearby].forEach(
      (u) => (m[u.id] = u.connectionStatus || "none")
    );
    return m;
  }, [matches, nearby]);

  const [statusById, setStatusById] = useState(initial);

  function openModal(id, name) {
    setTarget({ id, name });
    setModalOpen(true);
  }
  function onSent() {
    setStatusById((prev) => ({
      ...prev,
      [openId || target.id]: "pending_outgoing",
    }));
  }

  const renderConnectButton = (u) => {
    const s = statusById[u.id] || u.connectionStatus || "none";

    if (s === "connected") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    }
    if (s === "pending_outgoing") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-yellow-100 text-yellow-700 cursor-default">
          Pending
        </button>
      );
    }
    if (s === "pending_incoming") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-brand-100 text-brand-500 cursor-default">
          Respond
        </button>
      );
    }
    if (s === "unauthenticated") {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-gray-100 border  border-gray-200 text-gray-700 hover:border-brand-500 hover:text-brand-500"
          title="Sign in to send a request"
        >
          Connect
        </button>
      );
    }

    return (
      <button
        onClick={() => openModal(u.id, u.name)}
        className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-gray-100 border  border-gray-200 text-gray-700 hover:border-brand-500 hover:text-brand-500"
      >
        Connect
      </button>
    );
  };


 
  return (
    <>
      <div className="space-y-4">
        {/* Matches */}
        <div className={`rounded-lg bg-white border border-gray-100 shadow p-4 ${!user ? 'hidden':''}`}>
          <h3 className="font-semibold">
            Connection Suggestions ({loading ? "..." : matches.length})
          </h3>
          <div className="mt-4 space-y-3">
            {loading ? (
              // Skeleton loaders for matches
              <>
                <MatchCardSkeleton />
              </>
            ) : (
              // Actual match content
              <>
                {matches.map((s, idx) => {
                  const pct = getMatchPct(s);
                  return (
                    <div
                      key={s.id || s.name || idx}
                      className="rounded-xl border border-gray-100 p-3 relative"
                    >
                      {pct !== null && (
                        <span
                          className="inline-flex mb-1 items-center bg-gray-100 rounded-full text-gray-600  border border-gray-200 px-2 py-0.5 text-[11px] font-semibold "
                          title={`${pct}% match`}
                        >
                          {pct}% match
                        </span>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar item={s} idx={idx} size="md" />
                          <div className="min-w-0">
                            <div
                              className="font-medium truncate max-w-[160px]"
                              title={s.name}
                            >
                              {s.name}
                            </div>
                            <div
                              className="text-xs text-gray-500 truncate max-w-[200px]"
                              title={`${
                                s.title || s.role
                              } ${
                                s.city || s.country
                                  ? `• ${s.city ? s.city : ""}${
                                      s.city && s.country ? ", " : ""
                                    }${s.country || ""}`
                                  : ""
                              }`}
                            >
                              {s.title || s.role}
                              {s.city || s.country ? (
                                <>
                                  {" "}• {s.city ? `${s.city}` : ""}
                                  {s.city && s.country ? ", " : ""}
                                  {s.country ? `${s.country}` : ""}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              navigate('/profile/'+s.id)
                            }}
                            className="grid absolute top-2 right-2 _profile shrink-0 place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                            title="View profile"
                          >
                            <I.see />
                          </button>
                        </div>
                      </div>

                      {Array.isArray(s.cats) && s.cats.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.cats
                            .filter((_, i) => i <= 2)
                            .map((c) => (
                              <span
                                key={c}
                                className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full truncate max-w-[120px]"
                                title={c}
                              >
                                {c}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* tiny progress bar for visual cue */}
                      {pct !== null && (
                        <div className="mt-2 hidden">
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-brand-500 rounded-full"
                              style={{ width: `${pct}%` }}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="sr-only">{pct}% match</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {renderConnectButton(s)}
                        <button
                          onClick={() => {
                            if (!user?.id) {
                              data._showPopUp("login_prompt");
                              return;
                            }
                            navigate(`/messages?userId=${s.id}`);
                            toast.success("Starting conversation with " + s.name);
                          }}
                          className="flex-1 _login_prompt rounded-lg px-3 py-1.5 text-sm border border-gray-200 text-gray-700 bg-white hover:border-brand-500 hover:text-brand-500"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  );
                })}
                {matches.length === 0 && (
                  <div className="text-sm text-gray-500 border rounded-xl p-3">
                    No suggestions right now.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Nearby */}
        <div className="rounded-lg bg-white border border-gray-100 shadow p-4">
          <h3 className="font-semibold">Nearby Professionals</h3>
          <div className="mt-3 space-y-3">
            {loading ? (
              // Skeleton loaders for nearby professionals
              <>
                <NearbyCardSkeleton />
              </>
            ) : (
              // Actual nearby content
              <>
                {nearby.map((p, idx) => {
                  const pct = getMatchPct(p);
                  return (
                    <div
                      key={p.id || p.name || idx}
                      className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0"
                    >
                      <div>
                        {pct !== null && (
                          <span
                            className="inline-flex mb-2 items-center rounded-full bg-gray-100  text-gray-600  border border-gray-200 px-2 py-0.5 text-[11px] font-semibold"
                            title={`${pct}% match`}
                          >
                            {pct}% match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar item={p} idx={idx} size="sm" />
                          <div className="min-w-0">
                            <div
                              className="text-sm font-medium truncate max-w-[160px]"
                              title={p.name}
                            >
                              {p.name}
                            </div>
                            <div
                              className="text-xs text-gray-500 truncate max-w-[200px]"
                              title={`${
                                p.professionalTitle
                              }`}
                            >
                              {p.professionalTitle}
                             
                            </div>

                            <div title={`${p.location}`} className="text-xs text-gray-500 truncate max-w-[200px]">
                             {p.location ? (
                                <>
                                  {p.location}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderConnectButton(p)}
                        </div>
                      </div>

                      {Array.isArray(p.cats) && p.cats.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.cats
                            .filter((_, i) => i <= 2)
                            .map((c) => (
                              <span
                                key={c}
                                className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full truncate max-w-[120px]"
                                title={c}
                              >
                                {c}
                              </span>
                            ))}
                        </div>
                      )}

                      {pct !== null && (
                        <div className="mt-2 hidden">
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-brand-500 rounded-full"
                              style={{ width: `${pct}%` }}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="sr-only">{pct}% match</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {nearby.length === 0 && (
                  <div className="text-sm text-gray-500 border rounded-xl p-3">
                    No nearby profiles for these filters.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={target.id}
        toName={target.name}
        onSent={onSent}
      />
    </>
  );
}