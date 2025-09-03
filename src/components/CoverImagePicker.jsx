// src/components/CoverImagePicker.jsx
import React, { useRef } from "react";

export default function CoverImagePicker({
  label = "Cover Image (optional)",
  value,                  // base64 string (data URL) or null
  onChange,               // (base64OrNull) => void
  accept = "image/png, image/jpeg, image/jpg",
  maxSizeMB = 10,
}) {
  const fileRef = useRef(null);

  const pick = () => fileRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxSizeMB * 1024 * 1024) {
      alert(`Max file size is ${maxSizeMB}MB`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange?.(reader.result); // data URL
    reader.readAsDataURL(f);
  };

  const remove = () => onChange?.(null);

  return (
    <div>
      <label className="text-[12px] font-medium text-gray-700">{label}</label>

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onFile}
      />

      {/* Pretty card */}
      <div className="mt-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-4">
        {!value ? (
          <div className="text-center py-10">
            <div className="mx-auto w-10 h-10 rounded-full bg-white shadow grid place-items-center">
              {/* Cloud icon */}
              <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 18H6a4 4 0 1 1 .8-7.93A5 5 0 0 1 20 9a4 4 0 0 1-1 9Zm-7-9v4H9l3 3 3-3h-3V9Z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-gray-600">Drag & drop your image here, or</p>
            <button
              type="button"
              onClick={pick}
              className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              Browse
            </button>
            <p className="mt-2 text-[11px] text-gray-400">PNG / JPG • up to {maxSizeMB}MB</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <img
              src={value}
              alt="Cover preview"
              className="w-full rounded-xl object-cover aspect-[16/9] shadow"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={pick}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                style={{ background: "#8A358A" }}
              >
                Change
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
