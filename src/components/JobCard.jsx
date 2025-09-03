// src/components/JobCard.jsx
import React from "react";

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

export default function JobCard({ job }) {
  const tags = [
    job.jobType,
    job.workMode,
    job.categoryName,     // mostra nome da categoria (se existir)
    job.subcategoryName,  // mostra nome da subcategoria (se existir)
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
        </div>
        <button className="text-gray-400 text-[1.1rem]" aria-label="Save job">♡</button>
      </div>

      {!!tags.length && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {tags.map((t) => (
            <span key={t} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-gray-700 line-clamp-3">{job.description}</p>

      <div className="mt-3 flex justify-between text-sm text-gray-500">
        <span>
          {job.city ? `${job.city}, ` : ""}
          {job.country || "-"}
        </span>
        <span>{salaryText}</span>
      </div>

      <div className="text-xs text-gray-400 mt-2">
        {formatTimeAgo(job.timeAgo, job.createdAt)}
      </div>
    </div>
  );
}
