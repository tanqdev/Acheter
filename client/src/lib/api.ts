const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// Local development uses Vite's same-origin proxy so session cookies are
// consistently sent with every request. Deployments can provide VITE_API_URL.
export const API_URL = configuredApiUrl || "/api";
