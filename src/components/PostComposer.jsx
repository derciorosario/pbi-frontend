import React, { useState } from 'react';
import { Image, Heart, Search, X, Video, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PostTypeSelector from './PostTypeSelector';
import PostCreationDialog from './PostCreationDialog';
import { useNavigate } from 'react-router-dom';

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
  const navigate=useNavigate()
  const {user} = useAuth()
  const data = useData()

  const handleInputClick = () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
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
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    // Set a flag to trigger image selection after type selection
    setPendingImageSelection(true);
    setShowTypeSelector(true);
  };

  const handleVideoClick = () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    // Show alert for upcoming feature
    alert("Feature will be available soon. Try adding a photo");
  };

  const handleCreationClose = () => {
    setShowCreationDialog(false);
    setSelectedPostType(null);
  };

  return (
    <div className="w-full _login_prompt">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Header with Avatar and Input */}
        <div className="flex items-start gap-3 mb-4">
          <div className=" cursor-pointer" onClick={() => {
            if (!user?.id) {
              data._showPopUp?.("login_prompt");
              return;
            }
            navigate('/profile');
          }}>
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
          </div>
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
        <div className="flex items-center justify-between _login_prompt">
          <div className="flex items-center gap-6">
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={handlePhotoClick}
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium max-md:hidden">Photo</span>
            </button>

            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={handleVideoClick}
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium max-md:hidden">Video</span>
            </button>

          

            {/* Experience Button */}
            {user?.accountType!="company" &&<button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp?.("login_prompt");
                  return;
                }
                handleTypeSelect(typeOfPosts?.find(type => type.label === "Share Job Experience") || { label: "Share Job Experience" });
              }}
            >
              <Star className="w-5 h-5" />
              <span className="text-sm font-medium max-md:hidden">Experience</span>
            </button>}

            {/* Need Button */}
            {user?.accountType!="company" && <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp?.("login_prompt");
                  return;
                }
                handleTypeSelect(typeOfPosts?.find(type => type.label === "Share Job Need") || { label: "Share Job Need" });
              }}
            >
              <Search className="w-5 h-5" />
              <span className="text-sm font-medium max-md:hidden">Need</span>
            </button>}


              {/* Main Post Type Button (Post Job Opportunity) - moved here */}
            {typeOfPosts?.find(type => type.type === 'main') && (
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp?.("login_prompt");
                    return;
                  }
                  handleTypeSelect(typeOfPosts.find(type => type.type === 'main'));
                }}
              >
                <span className="text-sm">
                  {typeOfPosts.find(type => type.type === 'main')?.short_label || typeOfPosts.find(type => type.type === 'main')?.label}
                </span>
              </button>
            )}

            
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