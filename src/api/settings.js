// src/api/settings.js
import client from './client';

/**
 * Get user settings
 * @returns {Promise} Promise that resolves to user settings
 */
export const getSettings = () => {
  return client.get('/user/settings');
};

/**
 * Update user settings
 * @param {Object} settings - User settings to update
 * @returns {Promise} Promise that resolves to updated user settings
 */
export const updateSettings = (settings) => {
  return client.put('/user/settings', settings);
};