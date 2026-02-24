require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { initCronJobs } = require("./src/utils/cronJobs");
const smsService = require("./src/services/smsService");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Name:", err.name);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});

// MongoDB connection with proper caching for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If we already have a connection, use it
  if (cached.conn) {
    console.log("✅ Using cached MongoDB connection");
    return cached.conn;
  }

  // If no connection promise exists, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    console.log("🔄 Connecting to MongoDB...");
    console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);
    
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log("Database:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);
        
        // Initialize services after successful connection
        try {
          smsService.initialize();
          console.log("✅ SMS service initialized");
        } catch (smsError) {
          console.error("❌ SMS service initialization failed:", smsError.message);
        }
        
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Stack:", error.stack);
        cached.promise = null; // Reset promise on error
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("❌ Failed to establish MongoDB connection");
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Add test endpoint to app
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    database: {
      state: states[dbState] || "unknown",
      connected: dbState === 1
    },
    services: {
      sms: !!smsService,
      cron: !!(process.env.NODE_ENV === "production" && !process.env.VERCEL)
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      isVercel: !!process.env.VERCEL
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// For local development
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, async () => {
    try {
      await connectDB();
      console.log(`
    ======================================
    🚀 Server is running on port ${PORT}
    📝 Environment: ${process.env.NODE_ENV || "development"}
    🔗 URL: http://localhost:${PORT}
    ======================================
      `);
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION! Shutting down...");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown for SIGTERM
  process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
      console.log("💤 Process terminated!");
    });
  });
}

// For Vercel serverless deployment
module.exports = async (req, res) => {
  try {
    await connectDB();
    
    // Initialize cron jobs only in production and not in serverless
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      initCronJobs();
      console.log("⏰ Cron jobs initialized");
    }
    
    return app(req, res);
  } catch (error) {
    console.error("❌ Vercel function error:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      type: error.name
    });
  }
};