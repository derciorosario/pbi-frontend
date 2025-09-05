// src/components/JobCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MoreVertical } from "lucide-react"; // 3 dots icon

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
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const isOwner = user?.id && job?.postedByUserId && user.id === job.postedByUserId;

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
      : "—";

  return (
    <div className="rounded-2xl bg-white border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{job.title}</h3>
          <div className="text-sm text-gray-500">{job.companyName}</div>

          {/* NEW: show the creator */}
        </div>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {isOwner && (
            <>
              <button
                onClick={() => setOpenMenu((p) => !p)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            <button className="text-gray-400 text-[1.1rem]" aria-label="Save job">
              ♡
            </button>
              {openMenu && (
                <div className="absolute right-0 top-8 w-36 rounded-lg border border-gray-100 bg-white shadow-lg z-50">
                  <ul className="py-1 text-sm text-gray-700">
                    <li>
                      <button
                        onClick={() => {
                          setOpenMenu(false);
                          onEdit?.(job);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setOpenMenu(false);
                          if (
                            window.confirm("Are you sure you want to delete this job?")
                          ) {
                            onDelete?.(job);
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
          
        </div>
      </div>

      {!!tags.length && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {tags.map((t) => (
            <span
              key={t}
              className="px-2 py-1 rounded-full bg-gray-100 text-gray-600"
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
        <div>
           {job.postedByUserName && (
            <div className="text-xs text-gray-400">
              By <span className="font-medium">{job.postedByUserName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
