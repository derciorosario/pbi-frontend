// Authentication API functions
import  api  from "./client";

// Request account deletion email
export const requestAccountDeletion = (data) =>
  api.post("/auth/delete-account", data);

// Confirm account deletion with token
export const confirmAccountDeletion = (token) =>
  api.post(`/auth/delete-account/${token}`);

// Login
export const login = (credentials) =>
  api.post("/auth/login", credentials);

// Register
export const register = (userData) =>
  api.post("/auth/signup", userData);

// Verify email
export const verifyEmail = (token) =>
  api.get(`/auth/verify/${token}`);

// Resend verification
export const resendVerification = (email) =>
  api.post("/auth/resend-verification", { email });

// Forgot password
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

// Reset password
export const resetPassword = (data) =>
  api.post("/auth/reset-password", data);

// Google login
export const googleLogin = (data) =>
  api.post("/auth/google", data);

// Check Google user status
export const checkGoogleUserStatus = (accessToken) =>
  api.post("/auth/google/check-status", { accessToken });

// Get company token for switching accounts
export const getCompanyToken = (companyId) =>
  api.post("/auth/company-token", { companyId });