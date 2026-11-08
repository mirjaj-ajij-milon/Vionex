/**
 * Environment configuration for frontend API & WebSocket connections.
 * 
 * Main Production Backend: Vercel (https://vionex-rho.vercel.app)
 * Local Development: http://localhost:8080 (or custom VITE_API_URL)
 * 
 * Legacy Render URLs (onrender.com) are strictly filtered out to prevent
 * accidental connection to deprecated/inactive Render backend instances.
 */

const MAIN_VERCEL_BACKEND = "https://vionex-rho.vercel.app";

const isRenderUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /render\.com/i.test(url);
};

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

let server = MAIN_VERCEL_BACKEND;

if (isDev || isLocalhost) {
  // Local development / local preview
  if (rawApiUrl && rawApiUrl.trim() && !isRenderUrl(rawApiUrl)) {
    server = rawApiUrl.trim();
  } else {
    server = "http://localhost:8080";
  }
} else {
  // Production / Deployed environment (Netlify, Vercel, etc.)
  if (
    rawApiUrl &&
    rawApiUrl.trim() &&
    !isRenderUrl(rawApiUrl) &&
    !isLocalUrl(rawApiUrl)
  ) {
    server = rawApiUrl.trim();
  } else {
    server = MAIN_VERCEL_BACKEND;
  }
}

if (server.endsWith("/")) {
  server = server.replace(/\/+$/, "");
}

export const socketServer =
  rawSocketUrl &&
  rawSocketUrl.trim() &&
  !isRenderUrl(rawSocketUrl) &&
  (!isLocalUrl(rawSocketUrl) || isLocalhost || isDev)
    ? rawSocketUrl.trim().replace(/\/+$/, "")
    : server;

export default server;
