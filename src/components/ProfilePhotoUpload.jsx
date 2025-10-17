// src/components/ProfilePhotoUpload.jsx
import { useRef, useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { updateAvatarUrl, updateCoverImage } from "../api/profile"; // Add updateCoverImage import
import { Camera } from "lucide-react";

export default function ProfilePhoto({ avatarUrl, coverImage, onChange, type = "avatar" }) {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

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

  const handleFileChange = async (e) => {
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

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result;
        onChange(base64Url); // update local state immediately

        try {
          if (type === "avatar") {
            await updateAvatarUrl({ avatarUrl: base64Url });
            toast.success("Profile photo updated successfully!");
          } else if (type === "cover") {
            await updateCoverImage({ coverImage: base64Url });
            toast.success("Cover image updated successfully!");
          }
        } catch (error) {
          console.error(`Failed to save ${type}:`, error);
          toast.error(`Failed to save ${type === "avatar" ? "profile photo" : "cover image"}. Please try again.`);
          // Revert local state on error
          onChange(type === "avatar" ? avatarUrl : coverImage);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to read file:", error);
      toast.error("Failed to process image. Please try again.");
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoving(true);
    setShowOptions(false);
    try {
      onChange(null); // update local state immediately

      try {
        if (type === "avatar") {
          await updateAvatarUrl({ avatarUrl: null });
          toast.success("Profile photo removed successfully!");
        } else if (type === "cover") {
          await updateCoverImage({ coverImage: null });
          toast.success("Cover image removed successfully!");
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error(`Failed to remove ${type}:`, error);
        toast.error(`Failed to remove ${type === "avatar" ? "profile photo" : "cover image"}. Please try again.`);
        // Revert local state on error
        onChange(type === "avatar" ? avatarUrl : coverImage);
      }
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
    console.log({currentImage})
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
        onChange={handleFileChange}
        disabled={isUploading || isRemoving}
      />

      {/* Camera button - position differently based on type */}
   
       <div
        onClick={handleButtonClick}
        className={`bg-brand-600 rounded-full p-1 flex cursor-pointer hover:opacity-60 transition-opacity ${
          type === "avatar" 
            ? "absolute -bottom-1 -right-2 max-md:right-auto max-md:left-0" 
            : "absolute top-2 right-2"
        }`}
      >
       <div className="flex items-center gap-2">
         {type!="avatar" && !coverImage &&  <span className="text-white">Add</span>}
        <Camera size={18} className="text-white"/>
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
    </div>
  );
}