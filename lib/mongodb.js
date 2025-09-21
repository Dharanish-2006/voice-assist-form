// lib/mongodb.js
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI; // Add this to your .env.local

if (!MONGO_URI) {
  throw new Error("Please define MONGO_URI in .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
