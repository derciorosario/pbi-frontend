import axios from "axios";

const client = axios.create({
  baseURL: 'http://18.170.141.120:8005/api',
  headers: { "Content-Type": "application/json" }
});

// Add token automatically if present
client.interceptors.request.use((config) => {
   const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
   if (token) config.headers.Authorization = `Bearer ${token}`;
   return config;
});

// Handle 401s globally (optional)
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(err);
  }
);

export default client;
