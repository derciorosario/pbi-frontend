// src/components/ExperienceDetails.jsx
import React, { useState, useEffect } from "react";
import {
  MapPin,
  X,
  User2,
  Clock,
  MessageCircle,
  Share2,
  Tag,
  DollarSign,
  Layers,
  Calendar,
  Globe,
  Compass,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import client from "../api/client";

/* -------------------------------- utils --------------------------------- */
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

function fmtLoc(location, country) {
  if (location && country) return `${location}, ${country}`;
  return location || country || "";
}

function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] ${tones[tone] || tones.gray}`}>
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

/* ------------------------------ ExperienceDetails ----------------------------- */
export default function ExperienceDetails({ experienceId, isOpen, onClose }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState(null);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch experience details from API
  useEffect(() => {
    if (!isOpen || !experienceId) return;
    
    let mounted = true;
    
    async function fetchExperienceDetails() {
      setLoading(true);
      setError("");
      
      try {
        const { data } = await client.get(`/tourism/${experienceId}`);
        if (mounted) setExperience(data);
      } catch (err) {
        console.error("Error fetching experience details:", err);
        if (mounted) setError("Failed to load experience details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchExperienceDetails();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, experienceId]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  function openConnectionRequest() {
    if (!user) return data._showPopUp("login_prompt");
    setModalOpen(true);
  }

  // Handle image navigation
  function nextImage() {
    if (!experience?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % experience.images.length);
  }

  function prevImage() {
    if (!experience?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + experience.images.length) % experience.images.length);
  }

  if (!isOpen) return null;

  // Get the current image URL
  const imageUrl = experience?.images?.[currentImageIndex] || null;

  // Format author initials
  const initials = (experience?.author?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Experience Details</div>
          <button
            onClick={() => {
              onClose();
              data._closeAllPopUps?.();
            }}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-600">Loading experience details...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !experience ? (
            <div className="text-sm text-gray-600">No experience details available.</div>
          ) : (
            <>
              {/* Experience Images */}
              {experience.images?.length > 0 && (
                <div className="relative mb-6">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={experience.title}
                      className="w-full h-64 object-cover bg-gray-50 rounded-lg"
                    />
                    
                    {/* Image navigation controls */}
                    {experience.images.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                        <button 
                          onClick={prevImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &larr;
                        </button>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                          {currentImageIndex + 1} / {experience.images.length}
                        </div>
                        <button 
                          onClick={nextImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experience Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{experience.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(experience.createdAt)}</span>
                    {experience.location && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>{fmtLoc(experience.location, experience.country)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Type */}
              <div className="flex flex-wrap gap-2 mt-4">
                {experience.postType && (
                  <Chip tone="brand">{experience.postType}</Chip>
                )}
              </div>

              {/* Author */}
              <Section title="Author" icon={User2}>
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200 cursor-pointer"
                  onClick={() => {
                    if (experience?.authorUserId) {
                      data._showPopUp("profile");
                      data._setProfileUserId?.(experience.authorUserId);
                    }
                  }}
                >
                  {experience.author?.avatarUrl ? (
                    <img
                      src={experience.author.avatarUrl}
                      alt={experience.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{experience.author?.name || "Experience Author"}</div>
                    <div className="text-xs text-gray-500">View profile</div>
                  </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Description" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {experience.description || "No description provided."}
                </p>
              </Section>

              {/* Location */}
              {(experience.location || experience.country) && (
                <Section title="Location" icon={MapPin}>
                  <p className="text-sm text-gray-700">
                    {fmtLoc(experience.location, experience.country)}
                  </p>
                </Section>
              )}

              {/* Season */}
              {experience.season && (
                <Section title="Best Season to Visit" icon={Calendar}>
                  <p className="text-sm text-gray-700">{experience.season}</p>
                </Section>
              )}

              {/* Budget Range */}
              {experience.budgetRange && (
                <Section title="Budget Range" icon={Wallet}>
                  <p className="text-sm text-gray-700">{experience.budgetRange}</p>
                </Section>
              )}

              {/* Tags */}
              {experience.tags?.length > 0 && (
                <Section title="Tags" icon={Tag}>
                  <div className="flex flex-wrap gap-2">
                    {experience.tags.map((tag, index) => (
                      <Chip key={`tag-${index}`} tone="gray">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Categories */}
              {experience.audienceCategories?.length > 0 && (
                <Section title="Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {experience.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Subcategories */}
              {experience.audienceSubcategories?.length > 0 && (
                <Section title="Subcategories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {experience.audienceSubcategories.map((subcategory, index) => (
                      <Chip key={`subcat-${index}`} tone="gray">
                        {subcategory.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Identities */}
              {experience.audienceIdentities?.length > 0 && (
                <Section title="Target Audience" icon={User2}>
                  <div className="flex flex-wrap gap-2">
                    {experience.audienceIdentities.map((identity, index) => (
                      <Chip key={`identity-${index}`} tone="blue">
                        {identity.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {/* Connect */}
                {experience.authorUserId !== user?.id && (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      setModalOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <User2 size={18} />
                    Connect
                  </button>
                )}

                {/* Share */}
                <button
                  onClick={() => {
                    // Share functionality
                    const shareUrl = `${window.location.origin}/experience/${experience.id}`;
                    if (navigator.share) {
                      navigator.share({
                        title: experience.title,
                        text: experience.description,
                        url: shareUrl,
                      }).catch(err => console.error('Error sharing:', err));
                    } else {
                      // Fallback
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard");
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>

                {/* Message */}
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    onClose();
                    navigate(`/messages?userId=${experience.authorUserId}`);
                    toast.success(
                      "Starting conversation with " + (experience.author?.name || "experience author")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={experience?.authorUserId}
        toName={experience?.author?.name || "Experience Author"}
        onSent={onSent}
      />
    </div>
  );
}