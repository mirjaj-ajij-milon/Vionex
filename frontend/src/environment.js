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
  server = "https://vionex-rho.vercel.app";
}

if (server.endsWith("/")) {
  server = server.replace(/\/+$/, "");
}

export default server;
