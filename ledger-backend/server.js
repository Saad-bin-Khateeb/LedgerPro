require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { initCronJobs } = require("./src/utils/cronJobs");
const smsService = require("./src/services/smsService");

// Handle both MONGO_URI and MONGODB_URI
if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
  console.log("📝 Using MONGO_URI as MONGODB_URI");
}

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Name:", err.name);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});

// MongoDB connection caching for serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("✅ Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log("🔄 Connecting to MongoDB...");
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log("📊 Database:", mongoose.connection.name);
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Initialize services
async function initializeServices() {
  try {
    await connectDB();
    
    // Initialize SMS service
    try {
      smsService.initialize();
      console.log("✅ SMS service initialized");
    } catch (smsError) {
      console.error("❌ SMS service initialization failed:", smsError.message);
    }
    
    // Initialize cron jobs only in production and NOT on Vercel
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      try {
        initCronJobs();
        console.log("⏰ Cron jobs initialized");
      } catch (cronError) {
        console.error("❌ Cron jobs initialization failed:", cronError.message);
      }
    }
  } catch (error) {
    console.error("❌ Service initialization failed:", error.message);
    throw error;
  }
}

// ====================
// FOR LOCAL DEVELOPMENT
// ====================
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  
  // Initialize services before starting server
  initializeServices().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 LedgerPro Server                                     ║
║   📍 Port: ${PORT}                                          ║
║   🌍 Environment: ${process.env.NODE_ENV || "development"}                    ║
║   🔗 URL: http://localhost:${PORT}                         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
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
  }).catch(error => {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  });
}

// ====================
// FOR VERCEL (SERVERLESS)
// ====================
let vercelInitialized = false;

module.exports = async (req, res) => {
  try {
    if (!vercelInitialized) {
      console.log("🚀 Vercel function initializing...");
      await initializeServices();
      vercelInitialized = true;
      console.log("✅ Vercel function initialized");
    }
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