/**
 * Environment configuration for frontend API & WebSocket connections.
 * 
 * - Local Development: Automatically connects to `http://localhost:8080` (or `VITE_API_URL` in `.env`)
 * - Production (Vercel / Netlify): Configured via `VITE_API_URL` in your platform's Environment Variables
 */

const rawApiUrl = import.meta.env.VITE_API_URL;
const isDev = Boolean(import.meta.env.DEV);

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

let server = "http://localhost:8080";

if (rawApiUrl && rawApiUrl.trim()) {
  server = rawApiUrl.trim();
} else if (isDev || isLocalhost) {
  server = "http://localhost:8080";
} else {
  server = "https://vionex-backend.onrender.com";
}

// Strip trailing slash for clean route appending (e.g. `${server}/api/users`)
if (server.endsWith("/")) {
  server = server.replace(/\/+$/, "");
}

if (isDev && typeof window !== "undefined") {
  console.log(`[Vionex Frontend] Mode: DEVELOPMENT | Backend API: ${server}`);
}

export default server;
