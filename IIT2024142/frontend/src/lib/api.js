const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = `${BACKEND_URL}/api`;

export const api = {
  // Shared request handler for POST and PUT
  request: async (method, endpoint, data) => {
    const token = localStorage.getItem("token");
    const isFormData = data instanceof FormData;

    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
    };

    const options = {
      method,
      headers,
    };

    if (data !== undefined) {
      options.body = isFormData ? data : JSON.stringify(data);
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, options);

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(text || "Server returned invalid response");
    }

    if (!res.ok) {
      console.error(`API ${method} ERROR:`, result);
      throw new Error(result.message || result.error || "Something went wrong");
    }

    return result;
  },

  get: async (endpoint) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch { throw new Error(text); }

    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) throw new Error(result.message || "Failed to fetch");
    return result;
  },

  post: (endpoint, data) => api.request("POST", endpoint, data),
  put: (endpoint, data) => api.request("PUT", endpoint, data),
  delete: (endpoint) => api.request("DELETE", endpoint),
};