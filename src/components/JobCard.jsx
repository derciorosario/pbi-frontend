// src/components/JobCard.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { toast } from "../lib/toast";
import { Edit, Eye, MapPin, Clock, User as UserIcon, Share2, MessageCircle } from "lucide-react";
import I from "../lib/icons";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import JobDetails from "./JobDetails";

function computeTimeAgo(explicit, createdAt) {
  if (explicit) return explicit;
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function JobCard({
  job,
  onEdit,
  onDelete,
  type = "grid",        // "grid" | "list"
  matchPercentage = 20, // show % chip
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const data = useData();

  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // connect modal
  const [openId, setOpenId] = useState(null);        // profile modal
  const [connectionStatus, setConnectionStatus] = useState(job?.connectionStatus || "none");
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false); // job details modal

  const menuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // reserved for future dropdown
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = user?.id && job?.postedByUserId && user.id === job.postedByUserId;
  const isList = type === "list";

  const imageUrl = job?.coverImage || job?.image || null;

  const allTags = [job?.jobType, job?.workMode, job?.categoryName, job?.subcategoryName].filter(Boolean);
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const salaryText =
    job?.salaryMin != null || job?.salaryMax != null
      ? `${job?.currency || "USD"} ${job?.salaryMin ?? ""}${job?.salaryMax != null ? ` - ${job?.salaryMax}` : ""}`
      : "";

  const timeAgo = useMemo(() => computeTimeAgo(job?.timeAgo, job?.createdAt), [job?.timeAgo, job?.createdAt]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  }

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  const containerLayout = isList
    ? "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch"
    : "flex flex-col";

  return (
    <>
      <div
        className={`${containerBase} ${containerLayout} ${!isList && isHovered ? "transform -translate-y-1" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={menuRef}
      >
        {/* IMAGE SIDE */}
        {isList ? (
          <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={job?.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audience on IMAGE when there IS image */}
                {Array.isArray(job?.audienceCategories) && job.audienceCategories.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {job.audienceCategories.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // clean placeholder (no text / no icon)
              <div className="absolute inset-0 w-full h-full bg-gray-100" />
            )}

            {/* Quick actions on image */}
            <div className="absolute top-3 right-3 flex gap-2">
             
               <button
              onClick={() => {
                if (isOwner) navigate(`/job/${job.id}`);
                else setJobDetailsOpen(true);
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
              aria-label={isOwner ? "Edit job" : "View job"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/jobs?view=${job.id}`;
                  if (navigator.share) {
                    navigator.share({ title: job.title, text: job.description, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label="Share job"
              >
                <Share2 size={16} className="text-gray-600" />
              </button>

            </div>
          </div>
        ) : (
          // GRID IMAGE
          <div className="relative overflow-hidden">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={job?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audience on IMAGE when there IS image */}
                {Array.isArray(job?.audienceCategories) && job.audienceCategories.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {job.audienceCategories.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // clean placeholder (no text / no icon)
              <div className="w-full h-48 bg-gray-100" />
            )}

            {/* View & Share */}
            <div className="absolute top-4 right-4 flex gap-2">
             
              <button
              onClick={() => {
                if (isOwner) navigate(`/job/${job.id}`);
                else setJobDetailsOpen(true);
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
              aria-label={isOwner ? "Edit job" : "View job"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/jobs?view=${job.id}`;
                  if (navigator.share) {
                    navigator.share({ title: job.title, text: job.description, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share job"
              >
                <Share2
                  size={16}
                  className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200"
                />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Title + company */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 truncate mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
              {job?.title}
            </h3>

            {/* Company (privacy respected) */}
            {!job?.make_company_name_private && (
              <p className="text-sm text-gray-600 font-medium">{job?.companyName}</p>
            )}

            {/* audienceCategories HERE ONLY if there is NO image */}
            {!imageUrl && Array.isArray(job?.audienceCategories) && job.audienceCategories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {job.audienceCategories.map((c) => (
                  <span
                    key={c.id || c.name}
                    className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <p className={`mt-2 text-sm text-gray-600 leading-relaxed ${isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"}`}>
            {job?.description}
          </p>

          {/* Salary */}
          {salaryText && (
            <div className={`${isList ? "mt-2 mb-2" : "mt-2 mb-3"}`}>
              <span className="text-2xl font-bold text-gray-700">{salaryText}</span>
            </div>
          )}

          {/* Meta (poster + match + time + location) */}
          <div className={`${isList ? "mb-2" : "mb-3"} space-y-2`}>
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={() => {
                  if (job?.postedByUserId) {
                    setOpenId(job.postedByUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {job?.postedByUserAvatarUrl ? (
                  <img
                    src={job.postedByUserAvatarUrl}
                    alt={job?.postedByUserName || "User"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{job?.postedByUserName || "User"}</span>
                </div>
              </div>

              {/* Match % chip */}
              {matchPercentage !== undefined && matchPercentage !== null && (
                <div className="flex items-center gap-1">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      matchPercentage >= 80
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : matchPercentage >= 60
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {matchPercentage}% match
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {job?.city ? `${job.city}, ` : ""}
                {job?.country || "-"}
              </span>
            </div>
          </div>

          {/* Tags (show 2) with "+X more" tooltip if applicable */}
          {!!visibleTags.length && (
            <div className={`${isList ? "mb-3" : "mb-4"} flex flex-wrap gap-2`}>
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {t}
                </span>
              ))}

              {extraCount > 0 && (
                <div className="relative inline-block group/tagmore">
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`job-tags-more-${job.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`job-tags-more-${job.id}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                    opacity-0 invisible transition-opacity duration-200
                    group-hover/tagmore:opacity-100 group-hover/tagmore:visible
                    focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                  >
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {allTags.slice(2).map((tag, i) => (
                        <span key={i} className="inline-block">
                          {tag}
                          {i < allTags.length - 3 ? "," : ""}
                        </span>
                      ))}
                    </div>
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                      border-l-4 border-r-4 border-t-4
                      border-l-transparent border-r-transparent border-t-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center gap-2 mt-auto pt-2 ${isList ? "justify-end md:justify-start" : ""}`}>
            <button
              onClick={() => {
                if (isOwner) navigate(`/job/${job.id}`);
                else setJobDetailsOpen(true);
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit job" : "View job"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>

            <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                navigate(`/messages?userId=${job.postedByUserId}`);
                toast.success("Starting conversation with " + (job.postedByUserName || "job poster"));
              }}
              className={`${
                type === "grid" ? "flex-1" : ""
              } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              <span>Message</span>
            </button>

            {!isOwner && renderConnectButton()}
          </div>
        </div>

        {!isList && <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />}
      </div>

      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={job?.postedByUserId}
        toName={job?.postedByUserName || "Job Poster"}
        onSent={onSent}
      />

      <ProfileModal userId={openId} isOpen={!!openId} onClose={() => setOpenId(null)} onSent={onSent} />

      {/* Job Details Modal */}
      <JobDetails
        jobId={job?.id}
        isOpen={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
      />
    </>
  );

  function renderConnectButton() {
    const status = connectionStatus || job?.connectionStatus || "none";

    if (status === "connected") {
      return <button className="rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default">Connected</button>;
    }
    if (status === "pending_outgoing" || status === "outgoing_pending") {
      return <button className="rounded-xl px-4 py-2.5 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default">Pending</button>;
    }
    if (status === "pending_incoming" || status === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-100 text-brand-600 hover:bg-brand-200"
        >
          Respond
        </button>
      );
    }
    if (!user?.id) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
        >
          Connect
        </button>
      );
    }
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}
