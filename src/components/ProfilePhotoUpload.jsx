import { useRef, useState, useEffect } from "react";
import { toast } from "../lib/toast"; // ✅ import your toast
import { updateAvatarUrl } from "../api/profile"; // ✅ import the new API function
import { Camera } from "lucide-react";

export default function ProfilePhoto({ avatarUrl, onChange }) {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false); // ✅ loading state for upload
  const [isRemoving, setIsRemoving] = useState(false); // ✅ loading state for removal
  const [showOptions, setShowOptions] = useState(false); // ✅ state for options menu

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

    // ✅ Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB."); // 🔥 show toast
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset file input
      }
      return;
    }

    setIsUploading(true); // ✅ start uploading
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result;
        onChange(base64Url); // update local state immediately

        // ✅ Auto-save the avatar URL
        try {
          await updateAvatarUrl({ avatarUrl: base64Url });
          toast.success("Profile photo updated successfully!");
        } catch (error) {
          console.error("Failed to save avatar:", error);
          toast.error("Failed to save profile photo. Please try again.");
          // Revert local state on error
          onChange(avatarUrl);
        } finally {
          setIsUploading(false); // ✅ stop uploading
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to read file:", error);
      toast.error("Failed to process image. Please try again.");
      setIsUploading(false); // ✅ stop uploading on error
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoving(true); // ✅ start removing
    setShowOptions(false); // Close options menu
    try {
      onChange(null); // update local state immediately

      // ✅ Auto-save the avatar URL removal
      await updateAvatarUrl({ avatarUrl: null });
      toast.success("Profile photo removed successfully!");

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // clears file input
      }
    } catch (error) {
      console.error("Failed to remove avatar:", error);
      toast.error("Failed to remove profile photo. Please try again.");
      // Revert local state on error
      onChange(avatarUrl);
    } finally {
      setIsRemoving(false); // ✅ stop removing
    }
  };

  const handleChangePhoto = () => {
    setShowOptions(false); // Close options menu
    fileInputRef.current?.click();
  };

  const handleButtonClick = () => {
    if (avatarUrl) {
      setShowOptions(!showOptions); // Toggle options menu
    } else {
      fileInputRef.current?.click(); // Directly open file input
    }
  };

  return (
    <div>
      {/* Avatar with camera icon */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading || isRemoving}
      />

      {/* Camera button */}
      <div
        onClick={handleButtonClick}
        className="bg-brand-600 absolute -bottom-1 -right-2 rounded-full p-1 flex cursor-pointer hover:opacity-60 transition-opacity"
      >
        <Camera size={18} className="text-white"/>
      </div>

      <div className="relative">
        
      {/* Options dropdown */}
      {showOptions && avatarUrl && (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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


