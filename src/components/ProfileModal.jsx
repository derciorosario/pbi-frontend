// src/components/ProfileModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  X,
  Briefcase,
  CalendarDays,
  Star,
  Hash,
  User2,
  Target,
  Globe2,
  Layers,
  Languages,
  ExternalLink,
} from "lucide-react";
import client from "../api/client";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

function fmtLoc(city, country) {
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}

function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mt-5 text-left">
      <div className="flex items-center gap-2 mb-2">
        {Icon ? <Icon size={16} className="text-brand-600" /> : null}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ProfileModal({ userId, isOpen, onClose, onSent }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [crOpen, setCrOpen] = useState(false);
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  function openCR() {
    if (!user) {
      data._showPopUp("login_prompt");
      return;
    }
    setCrOpen(true);
  }

  const languages = useMemo(() => {
    if (!Array.isArray(profile?.languages)) return [];
    return profile.languages
      .map((l) => (typeof l === "string" ? { name: l } : l))
      .filter(Boolean);
  }, [profile]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await client.get(`/users/${userId}/public`);
        if (mounted) setProfile(data);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, userId]);

  function renderConnectButton() {
    if (profile.connectionStatus == "outgoing_pending") {
      return (
        <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default">
          Pending request
        </button>
      );
    } else if (profile.connectionStatus == "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="flex-1 items-center flex justify-center rounded-lg px-4 py-2 text-sm font-medium bg-brand-100 text-brand-600 cursor-pointer"
        >
          <ExternalLink size={20} className="mr-2" />
          Respond
        </button>
      );
    } else if (profile.connectionStatus == "connected") {
      return (
        <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    } else {
      return (
        <button
          onClick={openCR}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
        >
          Connect
        </button>
      );
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed z-[99] _profile inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Profile</div>
          <button
            onClick={() => {
              onClose();
              data._closeAllPopUps();
            }}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading && (
            <div className="text-sm text-gray-600">Loading profile…</div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && profile && (
            <>
              {/* Header */}
              <div className="flex items-start gap-4">
                <img
                  src={
                    profile.avatarUrl ||
                    (profile.email
                      ? `https://i.pravatar.cc/150?u=${encodeURIComponent(
                          profile.email
                        )}`
                      : "https://i.pravatar.cc/150")
                  }
                  alt={profile.name}
                  className="h-20 w-20 rounded-full border-4 border-white shadow-md object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{profile.name}</h2>
                    {profile.primaryIdentity && (
                      <Chip tone="brand">{profile.primaryIdentity}</Chip>
                    )}
                    {profile.experienceLevel && (
                      <Chip tone="gray">{profile.experienceLevel}</Chip>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {profile.title || "—"}
                  </p>
                  {(profile.city || profile.country) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {fmtLoc(profile.city, profile.country)}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-brand-600">
                        {profile.connections ?? 0}
                      </p>
                      <p className="text-gray-500 text-xs">Connections</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-brand-600">
                        {profile.projects ?? 0}
                      </p>
                      <p className="text-gray-500 text-xs">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-brand-600">
                        {profile.rating ?? "—"}
                      </p>
                      <p className="text-gray-500 text-xs">Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* About */}
              {profile.about && (
                <Section title="About" icon={User2}>
                  <p className="text-sm text-gray-700">{profile.about}</p>
                </Section>
              )}

              {/* Looking For */}
              {Array.isArray(profile.lookingFor) &&
                profile.lookingFor.length > 0 && (
                  <Section title="Looking For" icon={Target}>
                    <div className="flex flex-wrap gap-2">
                      {profile.lookingFor.map((g, i) => (
                        <Chip key={`${g}-${i}`} tone="green">
                          {g}
                        </Chip>
                      ))}
                    </div>
                  </Section>
                )}

              {/* Categories */}
              {(profile.cats?.length || profile.subs?.length) ? (
                <Section title="Expertise & Interests" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {(profile.cats || []).map((c) => (
                      <Chip key={`cat-${c}`} tone="brand">
                        {c}
                      </Chip>
                    ))}
                    {(profile.subs || []).map((s) => (
                      <Chip key={`sub-${s}`} tone="gray">
                        {s}
                      </Chip>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Skills */}
              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <Section title="Skills" icon={Hash}>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => (
                      <Chip key={`${s}-${i}`} tone="gray">
                        {s}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <Section title="Languages" icon={Languages}>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((l, i) => (
                      <Chip key={`${l.name}-${i}`} tone="gray">
                        {l.name}
                        {l.level ? ` • ${l.level}` : ""}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Recent Activity */}
              {(profile.recent?.jobs?.length || profile.recent?.events?.length) ? (
                <Section title="Recent Activity" icon={Star}>
                  <div className="space-y-3">
                    {(profile.recent.jobs || []).map((j) => (
                      <div key={`job-${j.id}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{j.title}</div>
                          <div className="text-[11px] text-gray-500">
                            {timeAgo(j.createdAt)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {j.companyName || "—"} • {fmtLoc(j.city, j.country)}
                        </div>
                        {(j.categoryName || j.subcategoryName) && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {j.categoryName && (
                              <Chip tone="brand">{j.categoryName}</Chip>
                            )}
                            {j.subcategoryName && (
                              <Chip tone="gray">{j.subcategoryName}</Chip>
                            )}
                          </div>
                        )}
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <Briefcase size={14} /> Job
                        </div>
                      </div>
                    ))}
                    {(profile.recent.events || []).map((e) => (
                      <div key={`event-${e.id}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{e.title}</div>
                          <div className="text-[11px] text-gray-500">
                            {timeAgo(e.createdAt)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fmtLoc(e.city, e.country)}
                        </div>
                        {(e.categoryName || e.subcategoryName) && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {e.categoryName && (
                              <Chip tone="brand">{e.categoryName}</Chip>
                            )}
                            {e.subcategoryName && (
                              <Chip tone="gray">{e.subcategoryName}</Chip>
                            )}
                          </div>
                        )}
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <CalendarDays size={14} /> Event
                          {e.registrationType === "Paid" &&
                          typeof e.price !== "undefined" ? (
                            <span className="ml-2">
                              • {e.currency || ""}
                              {e.price}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Meta */}
              <div className="mt-6 text-xs text-gray-500">
                Member since{" "}
                {new Date(profile.memberSince).toLocaleDateString()} •{" "}
                {timeAgo(profile.memberSince)}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {renderConnectButton()}
                <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors">
                  Message
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConnectionRequestModal
        open={crOpen}
        onClose={() => setCrOpen(false)}
        toUserId={userId}
        toName={profile?.name}
        onSent={() => {
          setProfile({ ...profile, connectionStatus: "outgoing_pending" });
          onSent();
        }}
      />
    </div>
  );
}
