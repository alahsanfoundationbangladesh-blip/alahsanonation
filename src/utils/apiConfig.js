/**
 * API configuration for Vercel and hosting environments.
 * Requests to /api are handled by Vercel Serverless Functions (/api/index.js).
 * Automatic rewrites also support /.netlify/functions/api for backward compatibility.
 */
export const API_BASE = "/api";

export const getApiUrl = (action) => {
  if (!action) return API_BASE;
  return `${API_BASE}?action=${encodeURIComponent(action)}`;
};
