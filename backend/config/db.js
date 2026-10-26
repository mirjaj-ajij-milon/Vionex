import mongoose from "mongoose";
import config from "./index.js";

/**
 * Global cache object for MongoDB connection in serverless (Vercel) & traditional Node environments.
 * Prevents multiple connections during serverless cold/warm starts.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with caching support.
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = config.mongoUrl;
    if (!mongoUri) {
      console.warn(
        `[Vionex Backend] MONGO_URL not defined for ${config.env} environment. Skipping database connection.`
      );
      return null;
    }

    cached.promise = mongoose.connect(mongoUri, config.mongooseOptions).then((mongooseInstance) => {
      console.log(
        `[Vionex Backend] MongoDB connected successfully (${config.isLocalDb ? "Local MongoDB" : "Production Atlas Cluster"})`
      );
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
