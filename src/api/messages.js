// src/api/messages.js
import client from "./client";

// Get all conversations for the current user
export const getConversations = () => client.get("/messages/conversations");

// Get messages for a specific conversation
export const getMessages = (conversationId, params = {}) =>
  client.get(`/messages/conversations/${conversationId}/messages`, { params });

// Get messages with a specific user
export const getMessagesWithUser = (userId, params = {}) =>
  client.get(`/messages/users/${userId}/messages`, { params });

// Send a message to a user via REST API (fallback if socket is not available)
export const sendMessage = (userId, data) => {
  if (data instanceof FormData) {
    return client.post(`/messages/users/${userId}/messages`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  return client.post(`/messages/users/${userId}/messages`, data);
};

// Mark messages as read via REST API (fallback if socket is not available)
export const markAsRead = (conversationId) =>
  client.put(`/messages/conversations/${conversationId}/read`);

// Search for users to start a conversation with
export const searchUsers = (query) =>
  client.get(`/users/search?q=${encodeURIComponent(query)}`);

// Get total unread message count
export const getUnreadCount = () =>
  client.get("/messages/unread-count");