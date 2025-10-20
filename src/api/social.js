// src/api/social.js
import client from "./client";

// LIKES
export const toggleLike = (targetType, targetId) => 
  client.post("/likes", { targetType, targetId });

export const getLikeStatus = (targetType, targetId) => 
  client.get(`/likes/${targetType}/${targetId}`);

// COMMENTS
export const createComment = (targetType, targetId, text, parentCommentId = null) => 
  client.post("/comments", { targetType, targetId, text, parentCommentId });

export const getComments = (targetType, targetId) => 
  client.get(`/comments/${targetType}/${targetId}`);

export const updateComment = (commentId, text) => 
  client.put(`/comments/${commentId}`, { text });

export const deleteComment = (commentId) => 
  client.delete(`/comments/${commentId}`);

// REPOSTS
export const createRepost = (targetType, targetId, comment = null) => 
  client.post("/reposts", { targetType, targetId, comment });

export const getReposts = (targetType, targetId) => 
  client.get(`/reposts/${targetType}/${targetId}`);

export const getLikes = (targetType, targetId) => {
  return client.get(`/likes/${targetType}/${targetId}/users`);
};

export const deleteRepost = (repostId) => 
  client.delete(`/reposts/${repostId}`);

// REPORTS
export const reportContent = (targetType, targetId, category, description) => 
  client.post("/reports", { targetType, targetId, category, description });

