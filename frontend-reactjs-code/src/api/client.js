import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api/v1";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try refreshing once, then replay the original request.
// Without this the user gets logged out every 30 minutes.
let refreshing = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      // Share one refresh call across concurrent 401s
      refreshing ??= axios.post(`${BASE_URL}/token/refresh/`, { refresh });
      const { data } = await refreshing;
      refreshing = null;

      localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);

      original.headers.Authorization = `Bearer ${data.access}`;
      return client(original);
    } catch (e) {
      refreshing = null;
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(e);
    }
  }
);

export default client;
