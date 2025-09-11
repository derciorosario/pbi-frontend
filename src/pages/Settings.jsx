import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import { getSettings, updateSettings } from "../api/settings";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    emailFrequency: "daily" // "daily", "weekly", "monthly", "auto"
  });

  // Fetch user settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data } = await getSettings();
        if (data) {
          // Parse notifications if it's a string
          const parsedData = {
            ...data,
            notifications: typeof data.notifications === 'string'
              ? JSON.parse(data.notifications)
              : data.notifications
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
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div>
      <Header />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
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