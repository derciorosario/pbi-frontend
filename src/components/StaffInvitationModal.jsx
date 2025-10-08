import React, { useState } from 'react';
import client from '../api/client';
import { toast } from '../lib/toast';
import UserSelectionModal from './UserSelectionModal';

const StaffInvitationModal = ({ isOpen, onClose, onSuccess, companyId, companyName }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);


  const handleInvite = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to invite');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending staff invitation for user:', selectedUser.id, 'with role:', role);
      const response = await client.post('/company/staff/invite', {
        staffId: selectedUser.id,
        role,
        message: message.trim() || undefined
      });

      console.log('Staff invitation response:', response.data);
     // toast.success('Staff invitation sent successfully');
      toast.dismiss()
      console.log('Toast success called for staff invitation');
      onSuccess && onSuccess(response.data.invitation);
      handleClose();
    } catch (error) {
      console.error('Error inviting staff:', error);
      toast.error(error?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setRole('');
    setMessage('');
    setShowUserSelection(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Invite Staff Member</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            {selectedUser ? (
              <div className="p-3 border border-brand-200 bg-brand-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {selectedUser.avatarUrl ? (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUserSelection(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                Click to select a user
              </button>
            )}
          </div>

          {/* Role Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Marketing Manager"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be included in the invitation email
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUser || loading}
            className={`px-4 py-2 rounded-lg ${
              selectedUser && !loading
                ? 'bg-brand-700 text-white hover:bg-brand-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>

      {/* User Selection Modal */}
      {showUserSelection && (
        <UserSelectionModal
          isOpen={showUserSelection}
          onClose={() => setShowUserSelection(false)}
          onSelect={(user) => {
            setSelectedUser(user);
            setShowUserSelection(false);
          }}
          title="Select Staff Member"
          accountType="individual"
        />
      )}
    </div>
  );
};

export default StaffInvitationModal;