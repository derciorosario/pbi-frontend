import { useRef } from "react";

export default function ProfilePhoto({ avatarUrl, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result); // returns the image as base64
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange(null); // clears the photo
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // clears file input
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Avatar with camera icon */}
      <div className="relative">
        <img
          src={avatarUrl || "https://placehold.co/100x100?text=Photo"}
          alt="Profile Photo"
          className="h-24 w-24 rounded-full object-cover border shadow"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="absolute bottom-0 right-0 bg-brand-600 text-white rounded-full p-2 shadow hover:bg-brand-700"
        >
          {/* Camera icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2l1-2h4l1 2h6l1-2h4l1 2h2v12H3V7z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Text side */}
      <div>
        <p className="text-sm font-medium text-gray-900">Profile Photo</p>
        <p className="text-sm text-gray-500">
          Add a professional photo to increase your credibility
        </p>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Change photo
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-sm px-3 py-1.5 font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
