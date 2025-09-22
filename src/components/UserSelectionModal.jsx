import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from '../lib/toast';

const UserSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  title,
  excludeIds = [],
  accountType = 'individual'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen && searchTerm.length >= 3) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, isOpen]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await client.get(`/users/search?q=${searchTerm}`);
      console.log({response})
      const filteredUsers = response.data.filter(user =>
        !excludeIds.includes(user.id) &&
        user.accountType === "individual"
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user) => {
    setSelectedUser(user);
  };

  const handleConfirm = () => {
    if (selectedUser) {
      onSelect(selectedUser);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setUsers([]);
    setSelectedUser(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-64 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : users.length === 0 && searchTerm.length >= 3 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelect(user)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.professionalTitle && (
                        <div className="text-xs text-gray-400">{user.professionalTitle}</div>
                      )}
                      {user.city && user.country && (
                        <div className="text-xs text-gray-400">
                          {user.city}, {user.country}
                        </div>
                      )}
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="text-brand-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedUser}
            className={`px-4 py-2 rounded-lg ${
              selectedUser
                ? 'bg-brand-700 text-white hover:bg-brand-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Select User
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelectionModal;