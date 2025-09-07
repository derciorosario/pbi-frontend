import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [onlineConnections, setOnlineConnections] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { token, isAuthenticated, user } = useAuth();


  

  useEffect(() => {
    let socketInstance = null;

    // Only connect if the user is authenticated
    if (isAuthenticated && token) {
      // Create socket instance with userId instead of token
      socketInstance = io(import.meta.env.VITE_API_URL || 'https://kaziwani-server.visum.co.mz/api', {
        auth: {
          userId: user.id // Send userId directly
        }
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        setError(null);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnected(false);
        setError(err.message);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error:', err);
        setError(err.message);
      });
      
      // Listen for online connections updates
      socketInstance.on('online_connections', (connections) => {
        console.log('Received online connections:', connections);
        setOnlineConnections(connections);
      });
      
      // Listen for user status changes
      socketInstance.on('user_status_change', (data) => {
        console.log('User status changed:', data);
        // Request updated online connections when a user's status changes
        socketInstance.emit('get_online_connections');
      });
      
      // Listen for unread count updates
      socketInstance.on('unread_count_update', (data) => {
        console.log('Received unread count update:', data);
        setTotalUnreadCount(data.count);
      });
      
      // We'll handle private messages through the onPrivateMessage function
      // to avoid duplicate handlers and ensure proper message handling

      // Save socket instance
      setSocket(socketInstance);
      
      // Request online connections when connected
      socketInstance.on('connect', () => {
        socketInstance.emit('get_online_connections');
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, token]);

  // Send a private message
  const sendPrivateMessage = (receiverId, content) => {
    if (!socket || !connected) {
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      socket.emit('private_message', { receiverId, content });
      
      // Set up a one-time listener for the response
      socket.once('message_sent', (data) => {
        resolve(data);
      });
      
      socket.once('error', (err) => {
        reject(err);
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 5000);
    });
  };

  // Mark messages as read function is implemented below with unread count handling

  // Listen for private messages
  const onPrivateMessage = (callback) => {
    if (!socket || !connected) {
      return () => {}; // Return empty cleanup function
    }

    // More robust event handling - don't remove all listeners,
    // just make sure we're not adding duplicates for this specific callback
    const wrappedCallback = (data) => {
      console.log('Socket received private message:', data);
      
      // Call the provided callback with the message data
      if (callback && typeof callback === 'function') {
        callback(data);
      }
      
      // Update unread count when receiving a message
      // Check if the message is not from the current user
      if (data?.message?.senderId !== user?.id) {
        // Increment the count immediately for responsive UI
        setTotalUnreadCount(prevCount => prevCount + 1);
        
        // Also refresh from the server to ensure accuracy
        refreshUnreadCount();
      }
    };
    
    // Store the callback reference so we can remove it later
    socket.on('private_message', wrappedCallback);
    
    // Return cleanup function that specifically removes this callback
    return () => {
      socket.off('private_message', wrappedCallback);
    };
  };
  
  // Get online connected users
  const getOnlineConnections = () => {
    if (!socket || !connected) {
      return Promise.reject(new Error('Socket not connected'));
    }
    
    socket.emit('get_online_connections');
    return Promise.resolve();
  };

  // Mark messages as read and update the total unread count
  const markMessagesAsRead = (conversationId) => {
    if (!socket || !connected) {
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      socket.emit('mark_read', { conversationId });
      
      // Set up a one-time listener for the response
      socket.once('messages_marked_read', (data) => {
        // Decrease the total unread count
        setTotalUnreadCount(prevCount => {
          const newCount = Math.max(0, prevCount - data.markedCount);
          return newCount;
        });
        resolve(data);
      });
      
      socket.once('error', (err) => {
        reject(err);
      });
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        reject(new Error('Mark read timeout'));
      }, 5000);
    });
  };

  // Refresh unread counts
  const refreshUnreadCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setTotalUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Refresh unread count when connection status changes and periodically
  useEffect(() => {
    if (isAuthenticated && token) {
      // Initial refresh
      refreshUnreadCount();
      
      // Set up interval to refresh unread count every 3 seconds
      const interval = setInterval(refreshUnreadCount, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const value = {
    socket,
    connected,
    error,
    onlineConnections,
    totalUnreadCount,
    sendPrivateMessage,
    markMessagesAsRead,
    onPrivateMessage,
    getOnlineConnections,
    refreshUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};