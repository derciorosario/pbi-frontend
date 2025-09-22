// src/api/admin.js
import client from "./client";
import * as XLSX from 'xlsx';

/**
 * Get all users with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for name or email
 * @param {string} params.accountType - Filter by account type (individual, company, admin, or all)
 * @param {string} params.isVerified - Filter by verification status (true, false, or empty for all)
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (ASC or DESC)
 * @returns {Promise} - Promise with users data
 */
export const getAllUsers = (params = {}) => {
  return client.get("/admin/users", { params });
};

/**
 * Get a single user by ID
 * @param {string} id - User ID
 * @returns {Promise} - Promise with user data
 */
export const getUserById = (id) => {
  return client.get(`/admin/users/${id}`);
};

/**
 * Update a user
 * @param {string} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise} - Promise with update result
 */
export const updateUser = (id, userData) => {
  return client.put(`/admin/users/${id}`, userData);
};

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise} - Promise with delete result
 */
export const deleteUser = (id) => {
  return client.delete(`/admin/users/${id}`);
};

/**
 * Toggle user suspension status
 * @param {string} id - User ID
 * @param {boolean} suspended - Whether to suspend (true) or unsuspend (false) the user
 * @returns {Promise} - Promise with toggle result
 */
export const toggleUserSuspension = (id, suspended) => {
  return client.put(`/admin/users/${id}/suspension`, { suspended });
};

/**
 * Export users data
 * @param {Object} params - Query parameters
 * @param {string} params.format - Export format (json or csv)
 * @param {Object} params.filters - Filters to apply
 * @returns {Promise} - Promise with exported data
 */
export const exportUsers = (params = {}) => {
  return client.get("/admin/users/export", {
    params,
    responseType: ['csv', 'excel'].includes(params.format) ? 'blob' : 'json'
  });
};

/**
 * Download users data as Excel directly from frontend
 * @param {Array} users - Array of user objects to export
 * @returns {Promise} - Promise that resolves when download starts
 */
export const downloadUsersDataAsExcel = async (users) => {
  try {
    // Format the data for Excel export
    const formattedData = users.map(user => ({
      'ID': user.id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Account Type': user.accountType,
      'Status': user.isVerified ? 'Active' : 'Suspended',
      'Provider': user.provider,
      'Country': user.country || '',
      'City': user.city || '',
      'Professional Title': user.professionalTitle || user.profile?.professionalTitle || '',
      'Experience Level': user.experienceLevel || user.profile?.experienceLevel || '',
      'Created At': new Date(user.createdAt).toLocaleString(),
      'Updated At': new Date(user.updatedAt).toLocaleString()
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Autosize columns
    const cols = Object.keys(formattedData[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...formattedData.map(r => String(r[k] ?? '').length)) + 2
    }));
    worksheet['!cols'] = cols;

    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate XLSX file
    const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create a blob from the XLSX data
    const blob = new Blob([xlsxData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Create a link element and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw error;
  }
};

/**
 * Download exported users data as a file
 * @param {Object} params - Query parameters
 * @param {string} params.format - Export format (json or csv)
 * @param {Object} params.filters - Filters to apply
 * @returns {Promise} - Promise that resolves when download starts
 */
export const downloadUsersData = async (params = {}) => {
  try {
    const format = params.format || 'csv';
    
    // For Excel format, we'll get CSV data and convert it to XLSX
    const actualFormat = format === 'excel' ? 'csv' : format;
    const response = await exportUsers({ ...params, format: actualFormat });
    
    if (format === 'excel') {
      // Convert CSV to XLSX using the xlsx library
      const csvData = response.data;

      // Parse CSV data properly handling quoted fields
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
          const char = line[i];

          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i += 2;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current);
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }

        // Add the last field
        result.push(current);
        return result;
      };

      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        data.push(row);
      }
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      // Generate XLSX file
      const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create a blob from the XLSX data
      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users-export.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } else {
      // Handle JSON and CSV formats as before
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      
      // Create a blob from the response data
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(response.data, null, 2) : response.data],
        { type: mimeType }
      );
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-export.${format}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }
    
    return true;
  } catch (error) {
    console.error('Error downloading users data:', error);
    throw error;
  }
};

/**
 * Get content for moderation (with pagination and filtering)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.contentType - Content type (job, comment, etc.)
 * @param {string} params.moderationStatus - Filter by moderation status
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (ASC or DESC)
 * @returns {Promise} - Promise with content data
 */
export const getContentForModeration = (params = {}) => {
  return client.get("/admin/moderation/content", { params });
};

/**
 * Update content moderation status
 * @param {string} id - Content ID
 * @param {string} contentType - Content type (job, comment, etc.)
 * @param {string} moderationStatus - New moderation status
 * @returns {Promise} - Promise with update result
 */
export const updateModerationStatus = (id, contentType, moderationStatus) => {
  return client.put(`/admin/moderation/content/${id}/status`, { contentType, moderationStatus });
};

/**
 * Get moderation statistics
 * @returns {Promise} - Promise with moderation stats
 */
export const getModerationStats = () => {
  return client.get("/admin/moderation/stats");
};

/**
 * Get comprehensive dashboard statistics
 * @returns {Promise} - Promise with dashboard stats
 */
export const getDashboardStats = () => {
  return client.get("/admin/dashboard/stats");
};

/**
 * Get recent activity for dashboard
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise} - Promise with recent activities
 */
export const getRecentActivity = (limit = 10) => {
  return client.get("/admin/dashboard/activity", { params: { limit } });
};

/**
 * Get user growth data for charts
 * @param {number} days - Number of days to look back
 * @returns {Promise} - Promise with growth data
 */
export const getUserGrowthData = (days = 30) => {
  return client.get("/admin/dashboard/growth", { params: { days } });
};