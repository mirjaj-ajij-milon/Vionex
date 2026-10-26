import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// 1. Load .env file for local development (in production cloud hosts like Vercel/Render, variables are provided via process.env)
const envPath = path.resolve(rootDir, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// 2. Determine active NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
process.env.NODE_ENV = nodeEnv;

export const isDev = nodeEnv === "development";
export const isProd = nodeEnv === "production";
export const isTest = nodeEnv === "test";

// Raw configurations
const rawClientOrigin = (
  process.env.CLIENT_ORIGIN ||
  (isDev ? "http://localhost:5173" : "https://vionex.netlify.app")
).replace(/\/+$/, "");

// Port
const port = parseInt(process.env.PORT, 10) || 8080;

// Mongo URL (Local fallback in dev, empty check in prod)
const mongoUrl =
  process.env.MONGO_URL ||
  (isDev ? "mongodb://127.0.0.1:27017/vionex" : "");

// Determine if connecting to a local DB instance
const isLocalDb = Boolean(
  mongoUrl &&
    (mongoUrl.includes("localhost") ||
      mongoUrl.includes("127.0.0.1") ||
      mongoUrl.startsWith("mongodb://127.0.0.1") ||
      mongoUrl.startsWith("mongodb://localhost"))
);

// Mongoose connection options:
// Local MongoDB standardly runs WITHOUT TLS, while Atlas requires TLS.
// Omit tls: true for local databases to prevent ECONNRESET connection failure.
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  ...(isLocalDb ? {} : { tls: true }),
};

// CORS allowed origins
const allowedOrigins = [
  rawClientOrigin,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

export const config = {
  env: nodeEnv,
  isDev,
  isProd,
  isTest,
  port,
  mongoUrl,
  isLocalDb,
  mongooseOptions,
  clientOrigin: rawClientOrigin,
  allowedOrigins,
  turn: {
    url: process.env.TURN_URL || "",
    username: process.env.TURN_USERNAME || "",
    credential: process.env.TURN_CREDENTIAL || "",
  },
};

export default config;
