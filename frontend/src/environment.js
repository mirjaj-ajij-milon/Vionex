/**
 * Environment configuration for frontend API & WebSocket connections.
 * Automatically switches between Local Development and Production.
 *
 * In Development (`npm run dev`):
 *   Loads `.env.development` -> Uses local backend `http://localhost:8080`
 *
 * In Production (`npm run build` / Netlify):
 *   Loads `.env.production` -> Uses cloud backend `https://vionex-backend.onrender.com`
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
