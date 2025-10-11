import { useRef, useState } from "react";
import { toast } from "../lib/toast"; // ✅ import your toast
import { updateAvatarUrl } from "../api/profile"; // ✅ import the new API function

export default function ProfilePhoto({ avatarUrl, onChange, accountType = "individual" }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false); // ✅ loading state for upload
  const [isRemoving, setIsRemoving] = useState(false); // ✅ loading state for removal

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

  return (
    <div className="flex items-center gap-4">
      {/* Avatar with camera icon */}
      <div className="relative flex-shrink-0">
        {(isUploading || isRemoving) ? (
          <div className="h-24 w-24 flex-shrink-0 rounded-full border shadow flex items-center justify-center bg-gray-100">
            <svg className="h-6 w-6 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
            </svg>
          </div>
        ) : (
          <img
            src={avatarUrl || "https://placehold.co/100x100?text=Photo"}
            alt="Profile Photo"
            className="h-24 w-24 flex-shrink-0 rounded-full object-cover border shadow"
          />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading || isRemoving}
          className="absolute bottom-0 right-0 bg-brand-600 text-white rounded-full p-2 shadow hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Camera icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7h2l1-2h4l1 2h6l1-2h4l1 2h2v12H3V7z"
            />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isRemoving}
        />
      </div>

      {/* Text side */}
      <div>
        <p className="text-sm font-medium text-gray-900">Profile Photo</p>
        <p className="text-sm text-gray-500">
          Add a professional photo to increase your credibility
        </p>
        {/* ✅ File size note */}
        <p className="text-xs text-gray-400 mt-1">Maximum file size: 5MB</p>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading || isRemoving}
            className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Change photo"}
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading || isRemoving}
              className="text-sm px-3 py-1.5 font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? "Removing..." : "Remove photo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

