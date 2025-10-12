import React, { useState } from 'react';
import { Image, Heart, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PostTypeSelector from './PostTypeSelector';
import PostCreationDialog from './PostCreationDialog';

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || "";
  const second = parts[1]?.charAt(0).toUpperCase() || "";
  return first + second;
}

export default function PostComposer({typeOfPosts, from}) {
  const [postText, setPostText] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [pendingImageSelection, setPendingImageSelection] = useState(false);
  const {user} = useAuth()

  const handleInputClick = () => {
    setShowTypeSelector(true);
  };

  const handleTypeSelect = (postType) => {
    // Add triggerImageSelection flag if image selection is pending
    const enhancedPostType = pendingImageSelection
      ? { ...postType, triggerImageSelection: true }
      : postType;

    setSelectedPostType(enhancedPostType);
    setShowTypeSelector(false);
    setShowCreationDialog(true);
    setPendingImageSelection(false); // Reset the flag
  };

  const handlePhotoClick = () => {
    // Set a flag to trigger image selection after type selection
    setPendingImageSelection(true);
    setShowTypeSelector(true);
  };

  const handleCreationClose = () => {
    setShowCreationDialog(false);
    setSelectedPostType(null);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Header with Avatar and Input */}
        <div className="flex items-start gap-3 mb-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.name || "Profile"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center">
              <span className="text-brand-600 font-semibold text-lg">
                {getInitials(user?.name || "User")}
              </span>
            </div>
          )}
          <input
            type="text"
            placeholder="Share your thoughts, opportunities, or insights..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onClick={handleInputClick}
            className="flex-1 bg-gray-100 rounded-full px-6 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={handlePhotoClick}
            >
              <Image className="w-6 h-6" />
              <span className="text-sm font-medium">Photo</span>
            </button>

            {/* Main Post Type Button (Post Job Opportunity) - moved here */}
            {typeOfPosts?.find(type => type.type === 'main') && (
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                onClick={() => handleTypeSelect(typeOfPosts.find(type => type.type === 'main'))}
              >
                <span className="text-sm">
                  {typeOfPosts.find(type => type.type === 'main')?.short_label || typeOfPosts.find(type => type.type === 'main')?.label}
                </span>
              </button>
            )}

            {/* Experience Button */}
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => handleTypeSelect(typeOfPosts?.find(type => type.label === "Share Job Experience") || { label: "Share Job Experience" })}
            >
              <Heart className="w-6 h-6" />
              <span className="text-sm font-medium">Experience</span>
            </button>

            {/* Need Button */}
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => handleTypeSelect(typeOfPosts?.find(type => type.label === "Share Job Need") || { label: "Share Job Need" })}
            >
              <Search className="w-6 h-6" />
              <span className="text-sm font-medium">Need</span>
            </button>
          </div>
        </div>
       </div>

       {/* Post Type Selector Dialog */}
       <PostTypeSelector
         isOpen={showTypeSelector}
         onClose={() => setShowTypeSelector(false)}
         onTypeSelect={handleTypeSelect}
         postTypes={typeOfPosts}
       />

       {/* Post Creation Dialog */}
       <PostCreationDialog
         isOpen={showCreationDialog}
         onClose={handleCreationClose}
         postType={selectedPostType}
         from={from}
         hideHeader={true}
       />
     </div>
   );
 }