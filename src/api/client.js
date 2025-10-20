// src/api/client.js
import axios from "axios";
const env="dev"

export const API_URL = env=="dev"
  ? "http://localhost:5000/api"
  : env=="test"
  ? "https://54links-testserver.derflash.com/api"
  : "https://kaziwani-server.visum.co.mz/api";

const client = axios.create({
     baseURL: API_URL,
     headers: { "Content-Type": "application/json" },
 });

// Create a separate instance for file uploads
const uploadClient = axios.create({
     baseURL: API_URL,
     headers: {
      "Content-Type": "multipart/form-data",
    },
     // Don't set Content-Type - let axios set it automatically for FormData
});


// Ensure Authorization header is present on each upload request
uploadClient.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const t = getStoredToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Handle 401s globally for upload client too
uploadClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setStoredToken(null); // clears storage + axios header
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);

/** Helpers to read/write token consistently */
export function getStoredToken() {  
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    null
  );
}


export function setStoredToken(token) {
  if (!token) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    delete client.defaults.headers.common.Authorization;
    return;
  }
  localStorage.setItem("auth_token", token);
  localStorage.setItem("token", token);
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
}

// Initialize default header if a token already exists
const bootToken = getStoredToken();
if (bootToken) {
  client.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

// Ensure Authorization header is present on each request
client.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const t = getStoredToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Handle 401s globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setStoredToken(null); // clears storage + axios header
      // let the app (AuthProvider, etc.) react to logout
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);
export { uploadClient };
export default client;
