// src/components/CoverImagePicker.jsx
import React, { useRef, useState, useImperativeHandle, forwardRef } from "react";

const CoverImagePicker = forwardRef(function CoverImagePicker({
  label = "Cover Image (optional)",
  value,                  // filename or null
  onChange,               // (filenameOrNull) => void
  accept = "image/png, image/jpeg, image/jpg",
  maxSizeMB = 5,
  preview = null,         // URL for preview (if already uploaded)
}, ref) {
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(preview);

  const pick = () => fileRef.current?.click();

  // Expose pick method to parent components
  useImperativeHandle(ref, () => ({
    pick
  }));

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxSizeMB * 1024 * 1024) {
      alert(`Max file size is ${maxSizeMB}MB`);
      e.target.value = "";
      return;
    }
    
    // Store the file for later upload
    setSelectedFile(f);
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(f);
    setPreviewUrl(objectUrl);
    
    // Pass the file to parent component
    onChange?.(f);
  };

  const remove = () => {
    onChange?.(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  console.log({previewUrl,value})

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
      <div className="mt-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-4 hover:border-brand-400 transition-colors">
        {!value ? (
          <div className="text-center py-10">
            <div className="mx-auto w-10 h-10 rounded-full bg-white shadow grid place-items-center">
              {/* Cloud icon */}
              <svg className="h-6 w-6 text-brand-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 18H6a4 4 0 1 1 .8-7.93A5 5 0 0 1 20 9a4 4 0 0 1-1 9Zm-7-9v4H9l3 3 3-3h-3V9Z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Drag & drop your image here, or
            </p>
            <button
              type="button"
              onClick={pick}
              className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              Browse
            </button>
            <p className="mt-2 text-[11px] text-gray-400">
              PNG / JPG • up to {maxSizeMB}MB
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            <img
              src={previewUrl || value}
              alt="Cover preview"
              className="w-full max-w-md rounded-xl object-contain aspect-[16/6] shadow max-h-32"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={pick}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                Change
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CoverImagePicker;
