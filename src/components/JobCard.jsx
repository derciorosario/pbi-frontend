// src/components/JobCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { toast } from "../lib/toast";
import { Edit, MoreVertical, User } from "lucide-react"; // 3 dots icon and user icon
import I from '../lib/icons'
import styles from "../lib/styles";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
function formatTimeAgo(timeAgo, createdAt) {
  if (timeAgo) return timeAgo;
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function JobCard({ job, onEdit, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const data = useData();
  const [openMenu, setOpenMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const menuRef = useRef(null);

  const isOwner = user?.id && job?.postedByUserId && user.id === job.postedByUserId;
  
  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  // close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tags = [
    job.jobType,
    job.workMode,
    job.categoryName,
    job.subcategoryName,
  ].filter(Boolean);

  const salaryText =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.currency || "USD"} ${job.salaryMin ?? ""}${
          job.salaryMax != null ? ` - ${job.salaryMax}` : ""
        }`
      : "";

  return (
    <>
      <div  className={`rounded-2xl bg-white border p-5 shadow-sm `}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{job.title}</h3>
            {!job.make_company_name_private && <div className="text-sm text-gray-500">{job.companyName}</div>}
          </div>

          <div className="flex items-center gap-2 relative" ref={menuRef}>
              <div className="flex items-center gap-1">
             {job.postedByUserName && (
              <div className="flex items-center gap-1.5">
                {job.postedByUserAvatarUrl ? (
                  <img
                    src={job.postedByUserAvatarUrl}
                    alt={job.postedByUserName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={12} className="text-gray-500" />
                  </div>
                )}
                <span
                  className="cursor-pointer hover:text-brand-600 hover:underline"
                  onClick={() => {
                    //data._showPopUp("profile");
                    //setOpenId(job.postedByUserId);
                  }}
                >
                  {job.postedByUserName}
                </span>
              </div>
            )}
          </div>
          </div>
        </div>

        {!!tags.length && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm text-gray-700 line-clamp-3">
          {job.description}
        </p>

        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>
            {job.city ? `${job.city}, ` : ""}
            {job.country || "-"}
          </span>
          <span>{salaryText}</span>
        </div>

        <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
          <div>
             {formatTimeAgo(job.timeAgo, job.createdAt)}
          </div>
           <div className="flex items-center gap-2">
           {job.postedByUserId==user?.id &&  <button
                onClick={() => {
                 if(job.postedByUserId==user?.id) navigate('/job/'+job.id)
                }}
                className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                aria-label="Edit"
              >
                <Edit size={19}/>
              </button>}
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  
                  // Navigate to messages page with the user ID
                  navigate(`/messages?userId=${job.postedByUserId}`);
                  
                  // Show a toast notification
                  toast.success("Starting conversation with " + (job.postedByUserName || "job poster"));
                }}
                className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                aria-label="Message"
              >
                <I.msg />
              </button>
              {job.postedByUserId!=user?.id && <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  setModalOpen(true);
                }}
                className={styles.primary}
              >
                Connect
              </button>}
            </div>
       
        </div>
      </div>
      
      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={job?.postedByUserId}
        toName={job?.postedByUserName || "Job Poster"}
        onSent={onSent}
      />
      
      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />
    </>
  );
}
