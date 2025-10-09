import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import { getSettings, updateSettings } from "../api/settings";

export default function SettingsPage() {
  const userAuth = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
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
    { id: "privacy", label: "Privacy & Display", icon: "🔒" }
  ];

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
                     {/** <label className="flex items-center">
                        <input
                          type="radio"
                          name="contentType"
                          className="h-5 w-5 text-brand-600 focus:ring-brand-500"
                          checked={settings.contentType === "images"}
                          onChange={() => setContentType("images")}
                        />
                        <span className="ml-2 text-sm">Images only</span>
                      </label> */}
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
    </div>
  );
}