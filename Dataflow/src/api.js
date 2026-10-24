// Use the deployed API by default so the hosted frontend remains usable even
// when a platform-specific build variable was not configured.
export const API_URL = (import.meta.env.VITE_API_URL || "https://flowbi-api.onrender.com").replace(/\/+$/, "");
