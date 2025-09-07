// src/pages/MessagesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Send,
  User,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import Header from "../components/Header";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import * as messageApi from "../api/messages";
import client from "../api/client";
import { toast } from "../lib/toast";
import DefaultLayout from "../layout/DefaultLayout";
import FullPageLoader from "../components/ui/FullPageLoader";

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    connected,
    sendPrivateMessage,
    onPrivateMessage,
    markMessagesAsRead,
    onlineConnections,
    getOnlineConnections,
    refreshUnreadCount
  } = useSocket();
  
  // State
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  
  // User search state
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  
  // Search users function
  const searchUsers = async (query) => {
    if (!query || query.length < 3) {
      setUserSearchResults([]);
      return;
    }
    
    try {
      setUserSearchLoading(true);
      const { data } = await messageApi.searchUsers(query);
      setUserSearchResults(data);
    } catch (error) {
      console.error("Failed to search users:", error);
      toast.error("Failed to search users");
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };
  
  // Extract userId from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    
    if (userId) {
      setSelectedUserId(userId);
      
      // Clear the URL parameter after setting the selectedUserId
      navigate('/messages', { replace: true });
    }
  }, [location.search, navigate]);
  
  // Request online connections periodically
  useEffect(() => {
    if (connected) {
      // Initial request
      getOnlineConnections();
      
      // Set up interval to refresh online connections
      const interval = setInterval(() => {
        getOnlineConnections();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [connected, getOnlineConnections]);
  
  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        const { data } = await messageApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }
    
    loadConversations();
  }, []);
  
  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeConversation) return;
      
      try {
        setLoading(true);
        const { data } = await messageApi.getMessages(activeConversation.id);
        setMessages(data);
        
        // Mark messages as read
        if (connected) {
          markMessagesAsRead(activeConversation.id)
            .then(() => refreshUnreadCount())
            .catch(console.error);
        } else {
          messageApi.markAsRead(activeConversation.id)
            .then(() => refreshUnreadCount())
            .catch(console.error);
        }
        
        // Update unread count in conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === activeConversation.id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    
    loadMessages();
    
    // Set up polling for messages every 2 seconds
    // This runs alongside socket connection as a fallback
    const pollInterval = setInterval(async () => {
      if (!activeConversation) return;
      
      try {
        console.log("Polling for new messages...");
        const { data } = await messageApi.getMessages(activeConversation.id);
        
        // Compare with current messages to avoid unnecessary updates
        if (data.length !== messages.length) {
          console.log(`Found ${data.length} messages, currently have ${messages.length}`);
          setMessages(data);
          
          // Mark as read
          if (connected) {
            markMessagesAsRead(activeConversation.id)
              .then(() => refreshUnreadCount())
              .catch(console.error);
          } else {
            messageApi.markAsRead(activeConversation.id)
              .then(() => refreshUnreadCount())
              .catch(console.error);
          }
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 2000);
    
    // Clean up interval on unmount or when conversation changes
    return () => {
      clearInterval(pollInterval);
    };
  }, [activeConversation, connected, markMessagesAsRead, messages.length]);
  
  // Load messages with a specific user
  useEffect(() => {
    async function loadMessagesWithUser() {
      if (!selectedUserId) return;
      
      try {
        setLoading(true);
        const { data } = await messageApi.getMessagesWithUser(selectedUserId);
        
        // Get user details if name is missing
        let userName = data.conversation.otherUser?.name;
        if (!userName || userName === "User") {
          try {
            // Use the API client for consistency
            const { data: userData } = await client.get(`/users/${selectedUserId}/public`);
            userName = userData.name || "User";
          } catch (userError) {
            console.error("Failed to fetch user details:", userError);
          }
        }
        
        // Set active conversation
        setActiveConversation({
          id: data.conversation.id,
          otherUser: {
            id: selectedUserId,
            name: userName || "User",
            avatarUrl: data.conversation.otherUser?.avatarUrl
          }
        });
        
        setMessages(data.messages);
        setSelectedUserId(null);
      } catch (error) {
        console.error("Failed to load messages with user:", error);
        toast.error("Failed to load conversation");
        setSelectedUserId(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadMessagesWithUser();
  }, [selectedUserId]);
  
  // Function to handle real-time messages
  const handleNewMessage = (data) => {
    console.log("Processing new real-time message in handler:", data);
    const { message } = data;
    
    if (!message) return;
    
    // If this message belongs to the active conversation
    if (activeConversation && (
        // Message from other user to current user
        (message.senderId === activeConversation.otherUser.id && message.receiverId === user.id) ||
        // Message from current user to other user
        (message.senderId === user.id && message.receiverId === activeConversation.otherUser.id)
    )) {
      
      // Add the message to the messages list
      setMessages(prev => {
        // Check if the message is already in the list to avoid duplicates
        const messageExists = prev.some(m => m.id === message.id);
        if (messageExists) {
          console.log("Duplicate message detected, not adding:", message.id);
          return prev;
        }
        
        console.log("Adding new real-time message to messages array:", message);
        return [...prev, message];
      });
      
      // Mark as read immediately
      if (connected) {
        markMessagesAsRead(activeConversation.id)
          .then(() => refreshUnreadCount())
          .catch(console.error);
      }
    }
    
    // Always update the conversations list for any new message
    setConversations(prev => {
      const updatedConversations = [...prev];
      // Find the conversation by its ID first
      let conversationIndex = updatedConversations.findIndex(
        c => c.id === message.conversationId
      );
      
      // If not found by ID, try to find by matching sender and receiver
      if (conversationIndex < 0) {
        conversationIndex = updatedConversations.findIndex(c =>
          // Current user is receiver, other user is sender
          (c.otherUser.id === message.senderId && message.receiverId === user.id) ||
          // Current user is sender, other user is receiver
          (c.otherUser.id === message.receiverId && message.senderId === user.id)
        );
      }
      
      console.log("Updating conversation for message:", message.id,
                  "ConversationIndex:", conversationIndex);
      
      if (conversationIndex >= 0) {
        // Update existing conversation
        const updatedConversation = {
          ...updatedConversations[conversationIndex],
          lastMessage: message.content,
          lastMessageTime: message.createdAt
        };
        
        // Only increment unread count if it's not the active conversation
        if (!activeConversation ||
            (activeConversation.id !== updatedConversation.id && message.senderId !== user.id)) {
          updatedConversation.unreadCount =
            (updatedConversations[conversationIndex].unreadCount || 0) + 1;
          
          console.log("Incrementing unread count for conversation:",
                      updatedConversation.id,
                      "New count:", updatedConversation.unreadCount);
        }
        
        // Remove the conversation from its current position
        updatedConversations.splice(conversationIndex, 1);
        // Add it to the top of the list
        updatedConversations.unshift(updatedConversation);
      } else if (message.conversationId) {
        // New conversation
        updatedConversations.unshift({
          id: message.conversationId,
          otherUser: message.senderId === user.id ?
            { id: message.receiverId, name: "User" } :
            message.sender || { id: message.senderId, name: "User" },
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.senderId === user.id ? 0 : 1
        });
      }
      
      return updatedConversations;
    });
  };

  // Listen for new messages
  useEffect(() => {
    // Always set up socket listener even if not connected
    // This way it will work if connection is established later
    console.log("Setting up socket message listener, activeConversation:",
                activeConversation?.id, "user:", user?.id, "connected:", connected);
    
    // Set up the message listener
    const cleanup = onPrivateMessage(handleNewMessage);
    
    // Return cleanup function to remove listener when component unmounts or dependencies change
    return () => {
      console.log("Cleaning up socket message listener");
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [onPrivateMessage, activeConversation?.id, user?.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Refresh conversations list periodically
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const { data } = await messageApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to refresh conversations:", error);
      }
    }, 3000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Send message
  async function handleSend() {
    if (!newMessage.trim() || !activeConversation) return;
    
    const content = newMessage.trim();
    setNewMessage("");
    
    try {
      // Optimistically add message to UI
      const tempId = Date.now().toString();
      const tempMessage = {
        id: tempId,
        content,
        senderId: user.id,
        receiverId: activeConversation.otherUser.id,
        createdAt: new Date().toISOString(),
        read: false,
        pending: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Send via socket if connected, otherwise use REST API
      try {
        if (connected) {
          console.log("Sending message via socket to:", activeConversation.otherUser.id);
          await sendPrivateMessage(activeConversation.otherUser.id, content);
          console.log("Message sent successfully via socket");
        } else {
          console.log("Socket not connected, sending message via REST API");
          await messageApi.sendMessage(activeConversation.otherUser.id, content);
          console.log("Message sent successfully via REST API");
        }
      } catch (sendError) {
        console.error("Error sending message:", sendError);
        // If socket send fails, try REST API as fallback
        if (connected) {
          console.log("Socket send failed, trying REST API as fallback");
          await messageApi.sendMessage(activeConversation.otherUser.id, content);
        } else {
          // Re-throw the error if REST API also failed
          throw sendError;
        }
      }
      
      // Update conversation in list
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          c => c.id === activeConversation.id
        );
        
        if (conversationIndex >= 0) {
          // Move to top and update last message
          const conversation = updatedConversations[conversationIndex];
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift({
            ...conversation,
            lastMessage: content,
            lastMessageTime: new Date().toISOString()
          });
        }
        
        return updatedConversations;
      });
      
      // Remove pending status from message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, pending: false } 
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  }
  
  // Format date
  function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  }
  
  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading && conversations.length === 0) {
    return <FullPageLoader />;
  }

  return (
    <DefaultLayout>
      <Header/>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-10rem)]">
          <div className="flex h-full">
            {/* Sidebar Conversations */}
            <aside className={`w-80 border-r ${activeConversation && 'hidden md:block'}`}>
              {/* Total Unread Messages Badge */}
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0) > 0 && (
                <div className="absolute top-4 right-4 bg-brand-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)}
                </div>
              )}
              <div className="p-4 border-b">
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="w-full py-2 px-4 bg-brand-500 text-white rounded-xl flex items-center justify-center gap-2 mb-3"
                >
                  <Plus size={16} />
                  <span>New Message</span>
                </button>
                <div className="relative">
                  <input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm w-full"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <button className="font-medium text-brand-600">All</button>
                  <button className="text-gray-500">Unread</button>
                </div>
              </div>
              
              {/* Online Connected Users */}
              {onlineConnections.length > 0 && (
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Online Connections</h3>
                  <div className="flex flex-wrap gap-2">
                    {onlineConnections.map((connection) => (
                      <div
                        key={connection.userId}
                        onClick={() => setSelectedUserId(connection.userId)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        {connection.user.avatarUrl ? (
                          <div className="relative">
                            <img
                              src={connection.user.avatarUrl}
                              alt={connection.user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white"></span>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                              <User size={16} />
                            </div>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white"></span>
                          </div>
                        )}
                        <span className="text-sm font-medium">{connection.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="overflow-y-auto h-[calc(100vh-22rem)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No conversations yet
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        activeConversation?.id === conv.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 relative">
                        {conv.otherUser.avatarUrl ? (
                          <div className="relative">
                            <img
                              src={conv.otherUser.avatarUrl}
                              alt={conv.otherUser.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            {onlineConnections.some(c => c.userId === conv.otherUser.id) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white"></span>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                              <User size={20} />
                            </div>
                            {onlineConnections.some(c => c.userId === conv.otherUser.id) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white"></span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{conv.otherUser.name}</h3>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-brand-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Chat Window */}
            {activeConversation ? (
              <section className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-14 border-b px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      className="md:hidden p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setActiveConversation(null)}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    
                    {activeConversation.otherUser.avatarUrl ? (
                      <div className="relative">
                        <img
                          src={activeConversation.otherUser.avatarUrl}
                          alt={activeConversation.otherUser.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        {onlineConnections.some(c => c.userId === activeConversation.otherUser.id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white"></span>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        {onlineConnections.some(c => c.userId === activeConversation.otherUser.id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white"></span>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{activeConversation.otherUser.name}</h2>
                        {onlineConnections.some(c => c.userId === activeConversation.otherUser.id) && (
                          <span className="text-xs text-green-500 font-medium">Online</span>
                        )}
                      </div>
                      {activeConversation.otherUser.professionalTitle && (
                        <p className="text-xs text-gray-600">
                          {activeConversation.otherUser.professionalTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-20rem)]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.senderId === user.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        {m.senderId !== user.id && (
                          <div className="flex-shrink-0 mr-2">
                            {m.sender?.avatarUrl ? (
                              <img
                                src={m.sender.avatarUrl}
                                alt={m.sender.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            m.senderId === user.id
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100"
                          } ${m.pending ? "opacity-70" : ""}`}
                        >
                          {m.content}
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-400">
                            <span>{formatMessageTime(m.createdAt)}</span>
                            {m.senderId === user.id && (
                              m.read ? <CheckCheck size={12} /> : <Check size={12} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3 flex items-center gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="p-2 rounded-xl bg-brand-500 text-white disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </section>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="mb-2 mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Send size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">Your Messages</h3>
                  <p className="mt-1">Select a conversation or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">New Message</h3>
              <button
                onClick={() => setShowUserSearch(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      searchUsers(e.target.value);
                    } else {
                      setUserSearchResults([]);
                    }
                  }}
                  className="rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm w-full"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {userSearchLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand-500 border-r-transparent"></div>
                  </div>
                ) : (
                  <>
                    {userSearchResults.length > 0 ? (
                      userSearchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setShowUserSearch(false);
                            setUserSearchQuery("");
                            setUserSearchResults([]);
                          }}
                          className="p-3 border-b last:border-0 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                        >
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                              <User size={20} />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            {user.professionalTitle && (
                              <p className="text-xs text-gray-500">{user.professionalTitle}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      userSearchQuery.length > 2 ? (
                        <p className="text-center py-4 text-gray-500">No users found</p>
                      ) : (
                        <p className="text-center py-4 text-gray-500">Type at least 3 characters to search</p>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
