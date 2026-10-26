import test from "node:test";
import assert from "node:assert/strict";

const resolveBackendUrl = ({ envUrl, isDev, isLocalhost }) => {
  let server = "http://localhost:8080";
  if (envUrl && envUrl.trim()) {
    server = envUrl.trim();
  } else if (isDev || isLocalhost) {
    server = "http://localhost:8080";
  } else {
    server = "https://vionex-backend.onrender.com";
  }
  return server.replace(/\/+$/, "");
};

test("server URL trailing slash normalization test", () => {
  assert.equal(
    resolveBackendUrl({ envUrl: "https://vionex-backend.onrender.com/", isDev: false }),
    "https://vionex-backend.onrender.com"
  );
  assert.equal(
    resolveBackendUrl({ envUrl: "http://localhost:8080/", isDev: true }),
    "http://localhost:8080"
  );
});

test("environment resolver correctly picks local backend in development", () => {
  const result = resolveBackendUrl({ envUrl: "http://localhost:8080", isDev: true, isLocalhost: true });
  assert.equal(result, "http://localhost:8080");
});

test("environment resolver correctly picks production backend in production", () => {
  const result = resolveBackendUrl({ envUrl: "https://vionex-backend.onrender.com", isDev: false, isLocalhost: false });
  assert.equal(result, "https://vionex-backend.onrender.com");
});
