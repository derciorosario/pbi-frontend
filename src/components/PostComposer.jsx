import React, { useState, useRef, useEffect } from 'react';
import { Image, Heart, Search, X, Video, Star, ChevronDown } from 'lucide-react';
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
   const [showMoreDropdown, setShowMoreDropdown] = useState(false);
   const navigate=useNavigate()
   const {user} = useAuth()
   const data = useData()
   const moreButtonRef = useRef(null)
   const dropdownRef = useRef(null)

   // Close dropdown when clicking outside
   useEffect(() => {
     function handleClickOutside(e) {
       if (moreButtonRef.current && !moreButtonRef.current.contains(e.target) &&
           dropdownRef.current && !dropdownRef.current.contains(e.target)) {
         setShowMoreDropdown(false)
       }
     }
     document.addEventListener("mousedown", handleClickOutside)
     return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])

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
            placeholder={from=="feed" ? (user?.accountType!="company" ? 'Explore opportunities and Share insights.':'Find markets and share opportunities.') :
                         from=="job" ? (user?.accountType!="company" ? 'Explore Top Job Opportunities and insights.':'Find top talents and share insights.') :
                         from=="event" ? (user?.accountType!="company" ? 'Explore exciting events happening near you. ':'Create events and find the right people to attend.') :
                         from=="product" ? (user?.accountType!="company" ? 'Explore and enjoy products designed to meet your needs.':'Find markets and promote your products.') :
                         from=="service" ? (user?.accountType!="company" ? 'Find and explore services tailored for you.':'Find clients and promote your top services.') :
                         from=="tourism" ? (user?.accountType!="company" ? 'Explore destinations, share stories, and connect through tourism.':'Find travellers and other tourism enthusiasts and boost your sales.') :
                         from=="funding" ? (user?.accountType!="company" ? 'Explore funding opportunities that open doors to new possibilities.':'Find the right candidates and partners for your programs.') :
              
            "Share your thoughts, opportunities, or insights..."}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onClick={handleInputClick}
            className="flex-1 bg-gray-100 rounded-full px-6 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between _login_prompt">
          <div className="flex items-center gap-4 relative flex-wrap">
            {/* Show only first 2 post types */}
            {typeOfPosts?.filter(i=>!i.hide)?.slice(0, 2).map(item => (
              <button
                key={item.type || item.id}
                className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-all bg-gray-50 duration-200 font-medium px-3 py-2 rounded-full hover:bg-brand-50"
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp?.("login_prompt");
                    return;
                  }
                  handleTypeSelect(item);
                }}
              >
                <item.Icon size="20"/>
                <span className="text-sm">
                  {item.label}
                </span>
              </button>
            ))}

            {/* More button for remaining items */}
            {typeOfPosts && typeOfPosts?.filter(i=>!i.hide).length > 2 && (
              <div className="relative">
                <button
                  ref={moreButtonRef}
                  className={`flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-brand-50 ${showMoreDropdown ? 'bg-brand-50 text-brand-600' : ''}`}
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                >
                  <span className="text-sm">More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showMoreDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown for remaining items */}
                {showMoreDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50"
                  >
                    {typeOfPosts?.filter(i=>!i.hide).slice(2).map(item => (
                      <button
                        key={item.type || item.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors duration-200 flex items-center gap-2"
                        onClick={() => {
                          if (!user?.id) {
                            data._showPopUp?.("login_prompt");
                            return;
                          }
                          handleTypeSelect(item);
                          setShowMoreDropdown(false);
                        }}
                      >
                         <item.Icon size="20" className="shrink-0"/>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
       </div>

       {/* Post Type Selector Dialog */}
       <PostTypeSelector
         isOpen={showTypeSelector}
         onClose={() => setShowTypeSelector(false)}
         onTypeSelect={handleTypeSelect}
         postTypes={typeOfPosts?.filter(i=>!i.hide)}
       />

       {/* Post Creation Dialog */}
       <PostCreationDialog
         onBack={()=>{
          handleInputClick()
          setShowCreationDialog(false)
         }}
         isOpen={showCreationDialog}
         onClose={handleCreationClose}
         postType={selectedPostType}
         from={from}
         hideHeader={true}
       />
     </div>
   );
 }