const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const localApiUrl =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : undefined;

// Keep browser cookies bound to the same local hostname used by the app.
// Deployments should provide VITE_API_URL, or serve their API under /api.
export const API_URL = configuredApiUrl || localApiUrl || "/api";
