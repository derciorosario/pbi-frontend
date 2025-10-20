// src/components/LikesDialog.jsx
import React, { useState, useEffect } from "react";
import { X, User as UserIcon, MapPin, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as socialApi from "../api/social";
import { API_URL } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

function LikesDialog({ open, onClose, entityType, entityId }) {
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {user}=useAuth()

  useEffect(() => {
    if (open && entityType && entityId) {
      fetchLikes();
    }
  }, [open, entityType, entityId]);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await socialApi.getLikes(entityType, entityId);
      setLikes(response.data.likes || []);
    } catch (err) {
      console.error("Error fetching likes:", err);
      setError("Failed to load likes");
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId, e) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Likes {!loading ? `(${likes.length})`:''}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-500">
              {error}
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No likes yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={(e) => handleUserClick(like.user.id, e)}
                >
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {like.user.avatarUrl ? (
                        <div className={`w-12 h-12 ${
                          like.user.accountType === "company" ? "rounded" : "rounded-full"
                        } overflow-hidden border border-gray-200`}>
                          <img
                            src={like.user.avatarUrl}
                            alt={like.user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 ${
                          like.user.accountType === "company" ? "rounded" : "rounded-full"
                        } bg-gray-200 flex items-center justify-center border border-gray-200`}>
                          <UserIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                         {like.user.name} {like.user?.id==user?.id ? `(You)` : ''}
                        </h3>
                        {like.user.accountType === "company" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                            Company
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-0.5">
                        {like.user.professionalTitle && (
                          <span>{like.user.professionalTitle}</span>
                        )}
                        {like.user.companyName && like.user.professionalTitle && " • "}
                        {like.user.companyName && (
                          <span>{like.user.companyName}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Globe size={10} />
                        <span>Liked {new Date(like.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikesDialog;