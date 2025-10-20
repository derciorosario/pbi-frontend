// src/components/CoverImagePicker.jsx
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Image as ImageIcon, Video, Upload, X } from "lucide-react";

const CoverImagePicker = forwardRef(function CoverImagePicker({
  label = "Add some visual flair 🎨",
  value,                  // filename or null
  onChange,               // (fileOrNull) => void
  accept = "image/png, image/jpeg, image/jpg, video/mp4, video/mov, video/avi, video/webm",
  maxSizeMB = 50,
  preview = null,         // URL for preview (if already uploaded)
  canSelectBothVideoAndImage = false, // If true, allow both; if false, only one type
  selectedMediaType = null, // Track what type is currently selected: 'image', 'video', or null
}, ref) {
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(preview);
  const [mediaType, setMediaType] = useState(selectedMediaType); // 'image', 'video', or null
  const [isDragging, setIsDragging] = useState(false);


  console.log({preview,previewUrl})
 const pick = () => {
  // Reset to accept both types when using the general "Choose File" button
  if (fileRef.current) {
    fileRef.current.accept = "image/png, image/jpeg, image/jpg, image/gif, image/webp, video/mp4, video/mov, video/avi, video/webm, video/quicktime";
    fileRef.current.click();
  }
};
  // Expose pick method to parent components
  useImperativeHandle(ref, () => ({
    pick
  }));

  // Update preview when prop changes
  useEffect(() => {
    if (preview) {
      setPreviewUrl(preview);
    }
  }, [preview]);

  // Update mediaType when selectedMediaType prop changes
  useEffect(() => {
    if (selectedMediaType) {
      setMediaType(selectedMediaType);
    }
  }, [selectedMediaType]);

  const handleFileSelection = (f) => {
    if (!f) return;
    
    if (f.size > maxSizeMB * 1024 * 1024) {
      alert(`File too big! Keep it under ${maxSizeMB}MB`);
      return;
    }

    // Determine media type
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Store the file for later upload
    setSelectedFile(f);
    setMediaType(isImage ? 'image' : 'video');
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(f);
    setPreviewUrl(objectUrl);
    
    // Pass the file and type to parent component
    onChange?.(f, isImage ? 'image' : 'video');
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    handleFileSelection(f);
    e.target.value = ""; // Reset input
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const remove = () => {
    onChange?.(null, null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickImage = () => {
    if (fileRef.current) {
      fileRef.current.accept = "image/png, image/jpeg, image/jpg, image/gif, image/webp";
      fileRef.current.click();
    }
  };

  const pickVideo = () => {
    if (fileRef.current) {
      fileRef.current.accept = "video/mp4, video/mov, video/avi, video/webm, video/quicktime";
      fileRef.current.click();
    }
  };

  const replaceWithOtherType = (newType) => {
    // Clear current selection first
    remove();
    // Then trigger the picker for the new type
    setTimeout(() => {
      if (newType === 'image') {
        pickImage();
      } else {
        pickVideo();
      }
    }, 100);
  };

  // Determine accept string based on current selection and canSelectBothVideoAndImage
  const getAcceptString = () => {
    if (canSelectBothVideoAndImage) {
      return "image/png, image/jpeg, image/jpg, image/gif, image/webp, video/mp4, video/mov, video/avi, video/webm, video/quicktime";
    }
    
    // If we already have a media type selected, restrict to that type
    if (mediaType === 'image') {
      return "image/png, image/jpeg, image/jpg, image/gif, image/webp";
    } else if (mediaType === 'video') {
      return "video/mp4, video/mov, video/avi, video/webm, video/quicktime";
    }
    
    // No selection yet, allow both but will enforce single type on selection
    return "image/png, image/jpeg, image/jpg, image/gif, image/webp, video/mp4, video/mov, video/avi, video/webm, video/quicktime";
  };

  const getFileTypeText = () => {
    if (canSelectBothVideoAndImage) {
      return "PNG, JPG, GIF, WEBP, MP4, MOV, AVI • Max 50MB";
    }
    
    if (mediaType === 'image') {
      return "PNG, JPG, GIF, WEBP • Max 5MB";
    } else if (mediaType === 'video') {
      return "MP4, MOV, AVI, WEBM • Max 50MB";
    }
    
    return "PNG, JPG, GIF, WEBP, MP4, MOV, AVI • Max 50MB";
  };

  const getMaxSize = () => {
    if (mediaType === 'image') return 5;
    if (mediaType === 'video') return 50;
    return maxSizeMB;
  };

  return (
    <div>
      <label className="text-[12px] font-medium text-gray-700">{label}</label>

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept={getAcceptString()}
        className="hidden"
        onChange={onFile}
      />

      {/* Pretty card */}
      <div 
        className={`mt-2 rounded-2xl border border-dashed transition-colors ${
          isDragging 
            ? 'border-brand-400 bg-brand-50/60' 
            : 'border-gray-300 bg-gray-50/60 hover:border-brand-400'
        } p-4`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!previewUrl && !value ? (
          <div className="text-center py-8">
            <div className="flex justify-center gap-4 mb-4">
              {(!mediaType || mediaType === 'image') && (
                <button
                  type="button"
                  onClick={pickImage}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/80 border border-gray-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer"
                >
                  <ImageIcon className="h-8 w-8 text-brand-600" />
                {/***  <span className="text-xs text-gray-600">Image</span> */}
                </button>
              )}
              
              {(!mediaType || mediaType === 'video') && (
                <button
                  type="button"
                  onClick={pickVideo}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/80 border border-gray-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer"
                >
                  <Video className="h-8 w-8 text-brand-600" />
                 {/** <span className="text-xs text-gray-600">Video</span> */}
                </button>
              )}
            </div>
          
            
            <p className="text-sm text-gray-600">
              {isDragging ? 'Drop your file here!' : `Drag & drop your ${canSelectBothVideoAndImage ? 'image or video' : mediaType || 'media'} here, or`}
            </p>
            <button
              type="button"
              onClick={pick}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </button>
            <p className="mt-3 text-[11px] text-gray-400">
              {getFileTypeText()}
            </p>
            {!canSelectBothVideoAndImage && mediaType && (
              <p className="mt-2 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded-full inline-block">
                Currently: {mediaType} only
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {mediaType === 'image' || (!mediaType && (previewUrl?.includes('data:image') || value?.includes('image'))) ? (
              <div className="relative">
                <img
                  src={previewUrl || value}
                  alt="Cover preview"
                  className="w-full max-w-md rounded-xl object-contain aspect-[16/6] shadow max-h-32"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Image
                </div>
              </div>
            ) : (
              <div className="relative">
                <video
                  src={previewUrl || value}
                  controls
                  className="w-full max-w-md rounded-xl object-contain aspect-[16/6] shadow max-h-32 bg-black"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Video
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3">
              {!canSelectBothVideoAndImage && mediaType ? (
                <>
                  {mediaType === 'image' ? (
                    <>
                      <button
                        type="button"
                        onClick={pickImage}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={() => replaceWithOtherType('video')}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border border-gray-200 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      >
                        <Video className="h-4 w-4" />
                        Upload Video 
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={pickVideo}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                      >
                        <Video className="h-4 w-4" />
                        Replace Video
                      </button>
                      <button
                        type="button"
                        onClick={() => replaceWithOtherType('image')}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border border-gray-200 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload Image 
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={pick}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Change {mediaType || 'Media'}
                </button>
              )}
              
              <button
                type="button"
                onClick={remove}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border border-gray-200 bg-white text-gray-700 hover:border-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              >
                <X className="h-4 w-4" />
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