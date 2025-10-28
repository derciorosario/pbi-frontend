// src/components/ProfilePhotoUpload.jsx
import { useRef, useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { updateAvatarUrl, updateCoverImage } from "../api/profile";
import { Camera } from "lucide-react";
import ImageCropper from "./ImageCropper";

export default function ProfilePhoto({ avatarUrl, coverImage, onChange, type = "avatar" }) {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  // Aspect ratios based on image type
  const cropConfig = {
    avatar: {
      aspect: 1, // Square for avatar
      minWidth: 100,
      minHeight: 100,
      maxWidth: 800,
      maxHeight: 800,
    },
    cover: {
      aspect: 16 / 9, // Wide aspect ratio for cover
      minWidth: 800,
      minHeight: 450,
      maxWidth: 1920,
      maxHeight: 1080,
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show cropper instead of uploading directly
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob) => {
    setShowCropper(false);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', croppedImageBlob);

      if (type === "avatar") {
        await updateAvatarUrl(formData);
        toast.success("Profile photo updated successfully!");
      } else if (type === "cover") {
        await updateCoverImage(formData);
        toast.success("Cover image updated successfully!");
      }

      // Create object URL for immediate preview
      const objectUrl = URL.createObjectURL(croppedImageBlob);
      onChange(objectUrl);
      
      setCroppedImage(objectUrl);

    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      toast.error(`Failed to upload ${type === "avatar" ? "profile photo" : "cover image"}. Please try again.`);
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoving(true);
    setShowOptions(false);
    try {
      if (type === "avatar") {
        await updateAvatarUrl({ avatarUrl: null });
        toast.success("Profile photo removed successfully!");
      } else if (type === "cover") {
        await updateCoverImage({ coverImage: null });
        toast.success("Cover image removed successfully!");
      }

      onChange(null);
      setCroppedImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error(`Failed to remove ${type}:`, error);
      toast.error(`Failed to remove ${type === "avatar" ? "profile photo" : "cover image"}. Please try again.`);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleChangePhoto = () => {
    setShowOptions(false);
    fileInputRef.current?.click();
  };

  const handleButtonClick = () => {
    const currentImage = type === "avatar" ? avatarUrl : coverImage;
    if (currentImage) {
      setShowOptions(!showOptions);
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || isRemoving}
      />

      {/* Camera button */}
      <div
        onClick={handleButtonClick}
        className={`bg-brand-600 rounded-full p-1 flex cursor-pointer hover:opacity-60 transition-opacity ${
          type === "avatar" 
            ? "absolute -bottom-1 -right-2 max-md:right-auto max-md:left-0" 
            : "absolute top-2 right-2"
        }`}
      >
        <div className="flex items-center gap-2">
          {type !== "avatar" && !coverImage && <span className="text-white">Add</span>}
          <Camera size={18} className="text-white"/>
          {(isUploading || isRemoving) && (
            <span className="text-white text-xs">
              {isUploading ? "Uploading..." : "Removing..."}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Options dropdown */}
        {showOptions && (type === "avatar" ? avatarUrl : coverImage) && (
          <div ref={dropdownRef} className={`absolute bg-white border border-gray-200 rounded-md shadow-lg z-50 ${
            type === "avatar" 
              ? "top-full right-0 mt-2 w-48" 
              : "top-full right-0 mt-2 w-48"
          }`}>
            <div className="py-1">
              <button
                onClick={handleChangePhoto}
                disabled={isUploading || isRemoving}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Change Image
              </button>
              <button
                onClick={handleRemovePhoto}
                disabled={isUploading || isRemoving}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
              >
                {isRemoving ? "Removing..." : "Remove Image"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          config={cropConfig[type]}
          type={type}
        />
      )}
    </div>
  );
}