// ledger-backend/api/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

// Import your main app
const app = require("../src/app");

// MongoDB connection caching
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) throw new Error("MongoDB URI not provided");
    
    cached.promise = mongoose.connect(mongoURI, {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(mongoose => mongoose);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("❌ Vercel function error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      type: error.name
    });
  }
};