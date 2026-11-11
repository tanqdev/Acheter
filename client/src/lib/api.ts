const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const API_URL = configuredApiUrl || "http://localhost:5000/api";
