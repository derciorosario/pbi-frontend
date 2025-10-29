import React, { useState, useEffect, useRef } from "react";
import { toast } from "../lib/toast";
import { getAdminSettings, updateAdminSettings } from "../api/admin";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import client from "../api/client";
import { X } from "lucide-react";

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'connections', label: 'Users Connected to Poster' },
  { value: 'newUsers', label: 'New Users Only' },
  { value: 'matchingInterests', label: 'Users with Matching Interests' }
];

const CUSTOM_NOTIFICATION_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'selectedUsers', label: 'Selected Users' },
  { value: 'newUsers', label: 'New Users Only' }
];

export default function AdminNotificationCenter() {
  const [settings, setSettings] = useState({
    newPostNotificationSettings: {
      enabled: true,
      audienceType: 'all',
      audienceOptions: ['all'],
      excludeCreator: true,
      emailSubject: 'New {{postType}} posted by {{authorName}} on 54Links',
      emailTemplate: 'new-post'
    },
    customNotificationSettings: {
      enabled: true,
      audienceType: 'all',
      audienceOptions: ['all'],
      selectedUsers: [],
      message: '',
      emailSubject: 'Important Update from 54Links',
      emailTemplate: 'custom-notification'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('new-posts');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const userSearchRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // User search functions
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      return;
    }

    setUserLoading(true);
    try {
      const { data } = await client.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      // Filter out already selected users
      const filteredResults = data.filter(user =>
        !selectedUsers.some(selected => selected.id === user.id)
      );
      setUserResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserResults([]);
    } finally {
      setUserLoading(false);
    }
  };

  // Handle clicking outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setUserResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserInputChange = (e) => {
    const value = e.target.value;
    setUserQuery(value);

    // Debounce search
    clearTimeout(window.userSearchTimeout);
    window.userSearchTimeout = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setSettings(prev => ({
        ...prev,
        customNotificationSettings: {
          ...prev.customNotificationSettings,
          selectedUsers: newSelectedUsers.map(u => u.id)
        }
      }));
    }
    setUserQuery("");
    setUserResults([]);
  };

  const handleRemoveUser = (userId) => {
    const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    setSettings(prev => ({
      ...prev,
      customNotificationSettings: {
        ...prev.customNotificationSettings,
        selectedUsers: newSelectedUsers.map(u => u.id)
      }
    }));
  };

  // Load selected users when settings load
  useEffect(() => {
    const loadSelectedUsers = async () => {
      if (settings.customNotificationSettings.selectedUsers?.length > 0) {
        try {
          // Load user details for selected users
          const userPromises = settings.customNotificationSettings.selectedUsers.map(id =>
            client.get(`/users/${id}`).catch(() => ({ data: { id, name: 'Unknown User' } }))
          );
          const userResponses = await Promise.all(userPromises);
          const users = userResponses.map(res => res.data);
          setSelectedUsers(users);
        } catch (error) {
          console.error("Error loading selected users:", error);
          // Fallback to basic user objects
          setSelectedUsers(settings.customNotificationSettings.selectedUsers.map(id => ({ id, name: 'Unknown User' })));
        }
      } else {
        setSelectedUsers([]);
      }
    };

    loadSelectedUsers();
  }, [settings.customNotificationSettings.selectedUsers]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getAdminSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading admin settings:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAdminSettings(settings);
      toast.success("Notification settings saved successfully");
    } catch (error) {
      console.error("Error saving admin settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAudienceOptionChange = (option, checked, isCustom = false) => {
    const settingsKey = isCustom ? 'customNotificationSettings' : 'newPostNotificationSettings';
    const currentOptions = settings[settingsKey].audienceOptions || [];
    let newOptions;

    if (checked) {
      newOptions = [...currentOptions, option];
    } else {
      newOptions = currentOptions.filter(opt => opt !== option);
    }

    // Ensure at least one option is selected
    if (newOptions.length === 0) {
      newOptions = ['all'];
    }

    setSettings(prev => ({
      ...prev,
      [settingsKey]: {
        ...prev[settingsKey],
        audienceOptions: newOptions
      }
    }));
  };

  const handleSettingChange = (field, value, isCustom = false) => {
    const settingsKey = isCustom ? 'customNotificationSettings' : 'newPostNotificationSettings';
    setSettings(prev => ({
      ...prev,
      [settingsKey]: {
        ...prev[settingsKey],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  const { newPostNotificationSettings, customNotificationSettings } = settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Notification Center</h1>
        <p className="text-sm text-gray-500">Configure notifications and send custom messages to users</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex">
          <button
            onClick={() => setActiveTab('new-posts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'new-posts'
                ? 'bg-brand-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            New Post Notifications
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'custom'
                ? 'bg-brand-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Custom Notifications
          </button>
        </div>
      </div>

      {/* New Post Notifications Tab */}
      {activeTab === 'new-posts' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">New Post Notifications</h3>
                <p className="text-sm text-gray-500">Send email notifications when users post new content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={newPostNotificationSettings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {newPostNotificationSettings.enabled && (
              <>
                {/* Audience Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Who receives notifications?</h3>
                  <p className="text-sm text-gray-500 mb-4">Select which users should receive notifications for new posts</p>

                  <div className="space-y-3">
                    {AUDIENCE_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                          checked={newPostNotificationSettings.audienceOptions?.includes(option.value) || false}
                          onChange={(e) => handleAudienceOptionChange(option.value, e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Users will receive notifications if they match ANY of the selected criteria above.
                  </p>
                </div>

                {/* Exclude Creator */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    checked={newPostNotificationSettings.excludeCreator}
                    onChange={(e) => handleSettingChange('excludeCreator', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">Exclude the post creator from receiving notifications</span>
                </div>

                {/* Email Subject Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject Template
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={newPostNotificationSettings.emailSubject}
                    onChange={(e) => handleSettingChange('emailSubject', e.target.value)}
                    placeholder="New {{postType}} posted by {{authorName}} on 54Links"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {'{postType}'}, {'{authorName}'}, {'{title}'}
                  </p>
                </div>

                {/* Email Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={newPostNotificationSettings.emailTemplate}
                    onChange={(e) => handleSettingChange('emailTemplate', e.target.value)}
                  >
                    <option value="new-post">New Post Template</option>
                    <option value="custom">Custom Template (coming soon)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Custom Notifications Tab */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Custom Notifications</h3>
                <p className="text-sm text-gray-500">Send custom notifications to users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={customNotificationSettings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked, true)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {customNotificationSettings.enabled && (
              <>
                {/* Audience Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Who receives notifications?</h3>
                  <p className="text-sm text-gray-500 mb-4">Select which users should receive this custom notification</p>

                  <div className="space-y-3">
                    {CUSTOM_NOTIFICATION_AUDIENCE_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                          checked={customNotificationSettings.audienceOptions?.includes(option.value) || false}
                          onChange={(e) => handleAudienceOptionChange(option.value, e.target.checked, true)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Selected Users Section - only show when "selectedUsers" is checked */}
                  {customNotificationSettings.audienceOptions?.includes('selectedUsers') && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Specific Users
                      </label>

                      {/* Selected users chips */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedUsers.map((user) => (
                            <div
                              key={user.id}
                              className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-medium"
                            >
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              {user.name || user.email}
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-brand-500 hover:text-brand-700"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User search input */}
                      <div ref={userSearchRef} className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            value={userQuery}
                            onChange={handleUserInputChange}
                            placeholder="Search users by name or email..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          {userLoading && (
                            <div className="absolute right-3 top-2.5">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                            </div>
                          )}
                        </div>

                        {/* Search results */}
                        {userResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {userResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                              >
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {user.email}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Users will receive notifications if they match ANY of the selected criteria above.
                  </p>
                </div>

                {/* Message Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={customNotificationSettings.message || ''}
                    onChange={(value) => handleSettingChange('message', value, true)}
                    placeholder="Enter your custom notification message..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header', 'bold', 'italic', 'underline',
                      'color', 'background',
                      'list', 'bullet',
                      'link'
                    ]}
                    className="bg-white rounded-xl border border-gray-200"
                    style={{ minHeight: '120px' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be sent as both email and in-app notification.
                  </p>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={customNotificationSettings.emailSubject}
                    onChange={(e) => handleSettingChange('emailSubject', e.target.value, true)}
                    placeholder="Important Update from 54Links"
                  />
                </div>

                {/* Send Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // TODO: Implement send notification logic
                      toast.success("Custom notification sent successfully!");
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Send Notification
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm">
            {activeTab === 'new-posts' ? (
              <>
                <div className="font-medium text-gray-900 mb-2">Email Subject:</div>
                <div className="text-gray-700 mb-4">
                  {newPostNotificationSettings.emailSubject
                    .replace('{{postType}}', 'job')
                    .replace('{{authorName}}', 'John Doe')}
                </div>

                <div className="font-medium text-gray-900 mb-2">Selected Audience:</div>
                <div className="text-gray-700">
                  {newPostNotificationSettings.audienceOptions?.length > 0
                    ? newPostNotificationSettings.audienceOptions
                        .map(opt => AUDIENCE_OPTIONS.find(o => o.value === opt)?.label)
                        .filter(Boolean)
                        .join(', ')
                    : 'None selected'}
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-gray-900 mb-2">Email Subject:</div>
                <div className="text-gray-700 mb-4">
                  {customNotificationSettings.emailSubject}
                </div>

                <div className="font-medium text-gray-900 mb-2">Message Preview:</div>
                <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: customNotificationSettings.message || 'No message content' }} />

                <div className="font-medium text-gray-900 mb-2">Selected Audience:</div>
                <div className="text-gray-700">
                  {customNotificationSettings.audienceOptions?.length > 0
                    ? customNotificationSettings.audienceOptions
                        .map(opt => CUSTOM_NOTIFICATION_AUDIENCE_OPTIONS.find(o => o.value === opt)?.label)
                        .filter(Boolean)
                        .join(', ')
                    : 'None selected'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}