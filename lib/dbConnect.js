// lib\dbConnect.js

import mongoose from "mongoose";

// Get the connection URI from the environment variables.
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// Use a global variable to cache the connection during development
let cached = global.mongoose;

if (!cached) {
  // If no cache exists, create one.
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Return the cached connection if it exists.
  if (cached.conn) {
    return cached.conn;
  }
  // If no promise exists, create one to connect with Mongoose.
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).then((mongoose) => {
      return mongoose;
    });
  }
  // Cache the connection.
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
