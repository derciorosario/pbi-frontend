import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import { getSettings, updateSettings } from "../api/settings";
import { requestAccountDeletion } from "../api/auth";

export default function SettingsPage() {
  const userAuth = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      jobOpportunities: {
        email: true
      },
      connectionInvitations: {
        email: true
      },
      connectionRecommendations: {
        email: true
      },
      connectionUpdates: {
        email: true
      },
      messages: {
        email: true
      },
      meetingRequests: {
        email: true
      }
    },
    emailFrequency: "daily", // "daily", "weekly", "monthly", "auto"
    hideMainFeed: false,
    connectionsOnly: false,
    contentType: "all", // "all", "text", "images"
    bidirectionalMatch: true, // Enable/disable bidirectional matching
    bidirectionalMatchFormula: "reciprocal" // "simple" or "reciprocal"
  });

  // Fetch user settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data } = await getSettings();
        if (data) {
          // Parse notifications if it's a string
          const parsedNotifications = typeof data.notifications === 'string'
            ? JSON.parse(data.notifications)
            : data.notifications;

          // Merge with defaults, ensuring all required properties exist
          const parsedData = {
            // Default structure
            notifications: {
              jobOpportunities: { email: true },
              connectionInvitations: { email: true },
              connectionRecommendations: { email: true },
              connectionUpdates: { email: true },
              messages: { email: true },
              meetingRequests: { email: true }
            },
            emailFrequency: "daily",
            hideMainFeed: false,
            connectionsOnly: false,
            contentType: "all",
            bidirectionalMatch: true,
            bidirectionalMatchFormula: "reciprocal",
            // Override with user's saved data
            ...data,
            notifications: parsedNotifications || parsedData.notifications
          };
          setSettings(parsedData);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        // If there's an error, we'll just use the default settings
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      // Prepare settings for API - stringify notifications if needed
      const settingsToSave = {
        ...settings,
        notifications: typeof settings.notifications === 'string'
          ? settings.notifications
          : JSON.stringify(settings.notifications)
      };
      await updateSettings(settingsToSave);
      toast.success("Settings saved successfully");
      // Update the auth context with the new settings
      userAuth.setSettings(settingsToSave);
      
      console.log({settingsToSave})
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  console.log({set:userAuth.settings})

  // Toggle a notification setting
  const toggleNotification = (category, type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [type]: !prev.notifications[category][type]
        }
      }
    }));
  };

  // Set email frequency
  const setEmailFrequency = (frequency) => {
    setSettings(prev => ({
      ...prev,
      emailFrequency: frequency
    }));
  };

  // Toggle hide main feed
  const toggleHideMainFeed = () => {
    setSettings(prev => ({
      ...prev,
      hideMainFeed: !prev.hideMainFeed
    }));
  };

  // Toggle connections only
  const toggleConnectionsOnly = () => {
    setSettings(prev => ({
      ...prev,
      connectionsOnly: !prev.connectionsOnly
    }));
  };

  // Set content type
  const setContentType = (contentType) => {
    setSettings(prev => ({
      ...prev,
      contentType: contentType
    }));
  };

  // Toggle bidirectional matching
  const toggleBidirectionalMatch = () => {
    setSettings(prev => ({
      ...prev,
      bidirectionalMatch: !prev.bidirectionalMatch
    }));
  };

  // Set bidirectional match formula
  const setBidirectionalMatchFormula = (formula) => {
    setSettings(prev => ({
      ...prev,
      bidirectionalMatchFormula: formula
    }));
  };

  // Handle account deletion request
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await requestAccountDeletion({ email: userAuth.user.email });
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error requesting account deletion:", error);
      toast.error("Failed to send deletion email. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "privacy", label: "Privacy & Display", icon: "🔒" },
    { id: "account", label: "Account", icon: "👤" }
  ];

  console.log({activeTab})

  return (
    <div>
      <Header />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand-100 text-brand-700 border border-brand-200"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                <p className="text-gray-500 mb-6">Choose how and when you want to be notified</p>

                <div className="space-y-6">
                  {/* Job Opportunities */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Job opportunity recommendations</h3>
                        <p className="text-sm text-gray-500">Get notified about job opportunities that match your profile</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.jobOpportunities.email}
                          onChange={() => toggleNotification("jobOpportunities", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Connection Invitations */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Invitation to connect</h3>
                        <p className="text-sm text-gray-500">Get notified when someone invites you to connect</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.connectionInvitations.email}
                          onChange={() => toggleNotification("connectionInvitations", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Connection Recommendations */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">New connection recommendations</h3>
                        <p className="text-sm text-gray-500">Get notified about people you might want to connect with</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.connectionRecommendations.email}
                          onChange={() => toggleNotification("connectionRecommendations", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Connection Updates */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Updates from people and companies you're connected with</h3>
                        <p className="text-sm text-gray-500">Get notified about updates from your connections</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.connectionUpdates.email}
                          onChange={() => toggleNotification("connectionUpdates", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">New message notifications</h3>
                        <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.messages.email}
                          onChange={() => toggleNotification("messages", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Meeting Requests */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Meeting request notifications</h3>
                        <p className="text-sm text-gray-500">Get notified about meeting requests and updates</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.notifications.meetingRequests.email}
                          onChange={() => toggleNotification("meetingRequests", "email")}
                        />
                        <span className="ml-2 text-sm">Email notifications</span>
                      </label>
                    </div>
                  </div>

                  {/* Email Frequency */}
                  <div>
                    <div className="mb-2">
                      <h3 className="font-medium">Choose email frequency</h3>
                      <p className="text-sm text-gray-500">How often would you like to receive email notifications?</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="emailFrequency"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.emailFrequency === "daily"}
                          onChange={() => setEmailFrequency("daily")}
                        />
                        <span className="ml-2 text-sm">Daily</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="emailFrequency"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.emailFrequency === "weekly"}
                          onChange={() => setEmailFrequency("weekly")}
                        />
                        <span className="ml-2 text-sm">Weekly</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="emailFrequency"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.emailFrequency === "monthly"}
                          onChange={() => setEmailFrequency("monthly")}
                        />
                        <span className="ml-2 text-sm">Monthly</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="emailFrequency"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.emailFrequency === "auto"}
                          onChange={() => setEmailFrequency("auto")}
                        />
                        <span className="ml-2 text-sm">Let the platform decide</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Privacy & Display</h2>
                <p className="text-gray-500 mb-6">Control your privacy settings and display preferences</p>

                <div className="space-y-6">
                  {/* Hide Main Feed */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Hide main feed content</h3>
                        <p className="text-sm text-gray-500">Hide posts and content from the main feed while keeping access to other features</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.hideMainFeed}
                          onChange={toggleHideMainFeed}
                        />
                        <span className="ml-2 text-sm">Hide main feed</span>
                      </label>
                    </div>
                  </div>

                  {/* Connections Only */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">Show only posts from my connections</h3>
                        <p className="text-sm text-gray-500">Only display posts from people and companies you're connected with</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.connectionsOnly}
                          onChange={toggleConnectionsOnly}
                        />
                        <span className="ml-2 text-sm">Connections only</span>
                      </label>
                    </div>
                  </div>

                  {/* Content Type */}
                  <div className="border-b pb-4">
                    <div className="mb-2">
                      <h3 className="font-medium">Content type preference</h3>
                      <p className="text-sm text-gray-500">Choose what type of content you want to see in your feed</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="contentType"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.contentType === "all"}
                          onChange={() => setContentType("all")}
                        />
                        <span className="ml-2 text-sm">All content (text and images)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="contentType"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.contentType === "text"}
                          onChange={() => setContentType("text")}
                        />
                        <span className="ml-2 text-sm">Text only</span>
                      </label>
                    </div>
                  </div>

                  {/* Bidirectional Matching */}
                  <div className="border-b pb-4">
                    <div className="mb-2">
                      <h3 className="font-medium">Connection matching preferences</h3>
                      <p className="text-sm text-gray-500">Control how the platform matches you with potential connections</p>
                    </div>

                    {/* Enable/Disable Bidirectional Matching */}
                    <div className="mt-3 mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500"
                          checked={settings.bidirectionalMatch}
                          onChange={toggleBidirectionalMatch}
                        />
                        <span className="ml-2 text-sm">Enable bidirectional matching</span>
                      </label>
                      <p className="text-xs text-gray-400 mt-1 ml-7">
                        When enabled, the system considers both your interests and what others are looking for, creating more balanced matches
                      </p>
                    </div>

                    {/* Matching Formula Selection */}
                    {settings.bidirectionalMatch && (
                      <div className="mt-4">
                        <div className="mb-2">
                          <h4 className="font-medium text-sm">Matching formula</h4>
                          <p className="text-xs text-gray-500">Choose how to combine your match score with others' perspectives</p>
                        </div>
                        <div className="mt-3 space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="bidirectionalFormula"
                              className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                              checked={settings.bidirectionalMatchFormula === "simple"}
                              onChange={() => setBidirectionalMatchFormula("simple")}
                            />
                            <div className="ml-2">
                              <span className="text-sm font-medium">Simple Average</span>
                              <p className="text-xs text-gray-400">
                                Calculates the average of both match directions. Example: If you match them 80% but they match you 60%, the final score is 70%. <span className="text-gray-600">(80% + 60%) / 2 = 70%</span>.
                              </p>
                            </div>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="bidirectionalFormula"
                              className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                              checked={settings.bidirectionalMatchFormula === "reciprocal"}
                              onChange={() => setBidirectionalMatchFormula("reciprocal")}
                            />
                            <div className="ml-2">
                              <span className="text-sm font-medium">Weighted Reciprocal</span>
                              <p className="text-xs text-gray-400">
                                Prioritizes your own assessment (70%) while considering their perspective (30%). Example: If you match them 80% but they match you 60%, the final score is 74%. <span className="text-gray-600">(80%×0.7 + 60%×0.3) = 74%</span>.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Formula Explanation Box */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-sm text-blue-900 mb-2">How Matching Works</h5>
                          <div className="text-xs text-blue-800 space-y-1">
                            <p><strong>Unidirectional (one-way):</strong> Only considers if others match what you're looking for</p>
                            <p><strong>Bidirectional (two-way):</strong> Considers both directions - if you match their needs AND they match yours</p>
                            <p><strong>Why it matters:</strong> Bidirectional matching helps ensure mutual interest and reduces unwanted connection requests</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Account Management</h2>
                <p className="text-gray-500 mb-6">Manage your account settings and data</p>

                <div className="space-y-6">
                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        Account Information
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Your current account details</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 mb-1">Name</span>
                        <span className="text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                          {userAuth.user.name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 mb-1">Email</span>
                        <span className="text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                          {userAuth.user.email}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 mb-1">Account Type</span>
                        <span className="text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200 capitalize">
                          {userAuth.user.accountType}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 mb-1">Member Since</span>
                        <span className="text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                          {new Date(userAuth.user.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border border-red-200 rounded-2xl p-6 bg-red-50">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">⚠️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-800">Danger Zone</h3>
                        <p className="text-sm text-red-600 mt-1">Irreversible actions that will affect your account</p>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-white rounded-xl p-5 border border-red-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-red-800">Delete Account</h4>
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                              Permanent
                            </span>
                          </div>
                          <p className="text-sm text-red-600 mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <div className="space-y-1 text-xs text-red-500">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              <span>All your posts, connections, and profile data will be removed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              <span>This action is permanent and cannot be reversed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              <span>You'll need to create a new account to use the platform again</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2 min-w-[140px] justify-center"
                          >
                            <span>🗑️</span>
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ onClose, onConfirm, loading }) {
  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Confirm Account Deletion</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          
          <p className="mb-6 text-gray-600">
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </p>
          
          <div className="space-y-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6">
            <p className="font-medium">This will permanently:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Delete your profile and all personal information</li>
              <li>Remove all your posts, connections, and messages</li>
              <li>Cancel any pending meetings or requests</li>
              <li>Remove your access to the platform</li>
            </ul>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending Email...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Modal Component
function SuccessModal({ onClose }) {
  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Deletion Email Sent</h2>
            <p className="text-gray-600 mb-4">
              We've sent a confirmation email to your inbox with a link to permanently delete your account.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the account deletion link in the email</li>
                <li>Confirm deletion on the following page</li>
                <li>Your account will be permanently deleted</li>
              </ol>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              The deletion link will expire in 24 hours for security reasons.
            </p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}