/**
 * Environment configuration for frontend API & WebSocket connections.
 * 
 * Supports:
 * - Render Backend (Full Stack: REST API + Persistent WebSocket Signaling)
 * - Vercel Backend (REST API) + Dedicated Signaling Server (Render/Railway)
 * - Local Development (http://localhost:8080)
 */

const DEFAULT_PRODUCTION_API = "https://vionex-rho.vercel.app";

const isLocalUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(url.trim());
};

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
const isDev = Boolean(import.meta.env.DEV);

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

let server = DEFAULT_PRODUCTION_API;

if (isDev || isLocalhost) {
  // Local development / local preview
  if (rawApiUrl && rawApiUrl.trim()) {
    server = rawApiUrl.trim();
  } else {
    server = "http://localhost:8080";
  }
} else {
  // Production / Deployed environment (Netlify, Vercel, etc.)
  if (rawApiUrl && rawApiUrl.trim() && !isLocalUrl(rawApiUrl)) {
    server = rawApiUrl.trim();
  } else {
    server = DEFAULT_PRODUCTION_API;
  }
}

if (server.endsWith("/")) {
  server = server.replace(/\/+$/, "");
}

// Socket server: Use VITE_SOCKET_URL if explicitly provided; otherwise defaults to server
export const socketServer =
  rawSocketUrl &&
  rawSocketUrl.trim() &&
  (!isLocalUrl(rawSocketUrl) || isLocalhost || isDev)
    ? rawSocketUrl.trim().replace(/\/+$/, "")
    : server;

export default server;
