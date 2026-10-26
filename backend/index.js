import config from "./config/index.js";
import { connectDB } from "./config/db.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { connectToSocket } from "./controlers/socketManager.js";
import UserRoute from "./routes/user.routs.js";

const app = express();
const server = createServer(app);

// Defensive Security Hardening: Disable information leakage
app.disable("x-powered-by");

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  if (config.isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, "");
    if (config.allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    // Allow any localhost port in development
    if (config.isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview and production deployments (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
};

app.set("port", config.port);
app.use(cors(corsOptions));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Connect Socket.IO signaling with origin restrictions
const io = connectToSocket(server, config.allowedOrigins);

// Ensure MongoDB is connected before handling API routes (essential for Vercel Serverless)
app.use(async (req, res, next) => {
  // Allow health check and root landing without waiting for database
  if (req.path === "/health" || req.path === "/") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("[Vionex Backend] Database connection error:", err.message);
    return res.status(500).json({
      message: "Database connection failed. Please check MONGO_URL configuration.",
    });
  }
});


app.get("/", (req, res) => {
  res.json({
    name: "Vionex Video Calling API",
    version: "1.0.0",
    status: "healthy",
    docs: "https://github.com/mirjaj-ajij-milon/Vionex",
    health: "/health",
  });
});

app.use("/api/users", UserRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: config.env,
    timestamp: new Date().toISOString(),
    database: {
      status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      type: config.isLocalDb ? "local" : "cloud",
    },
  });
});


app.use((err, req, res, next) => {
  console.error("[Vionex Server Error]:", err.message);
  res.status(err.status || 500).json({
    message: config.isProd ? "Internal server error." : err.message,
  });
});

const start = async () => {
  try {
    await connectDB();
    server.listen(config.port, () => {
      console.log(`[Vionex Backend] Running in [${config.env.toUpperCase()}] mode on port ${config.port}`);
      console.log(`[Vionex Backend] Client origin: ${config.clientOrigin}`);
    });
  } catch (err) {
    console.error("[Vionex Backend] Failed to start server:", err.message);
    process.exit(1);
  }
};


export { app, server, io, config };
export default app;

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
if (!config.isTest && !isVercel) {
  start();
}
