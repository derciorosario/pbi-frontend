import React, { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { getAdminSettings, updateAdminSettings } from "../api/admin";

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'connections', label: 'Users Connected to Poster' },
  { value: 'newUsers', label: 'New Users Only' },
  { value: 'matchingInterests', label: 'Users with Matching Interests' }
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
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

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

  const handleAudienceOptionChange = (option, checked) => {
    const currentOptions = settings.newPostNotificationSettings.audienceOptions || [];
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
      newPostNotificationSettings: {
        ...prev.newPostNotificationSettings,
        audienceOptions: newOptions
      }
    }));
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      newPostNotificationSettings: {
        ...prev.newPostNotificationSettings,
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

  const { newPostNotificationSettings } = settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Notification Center</h1>
        <p className="text-sm text-gray-500">Configure how users receive notifications for new posts</p>
      </div>

      {/* Settings Form */}
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

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}