require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { initCronJobs } = require("./src/utils/cronJobs");
const smsService = require("./src/services/smsService");

// Handle both MONGO_URI and MONGODB_URI environment variables
if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
  console.log("📝 Using MONGO_URI as MONGODB_URI");
}

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(', '));
  if (process.env.NODE_ENV === 'production') {
    // Don't exit in production, but log error
    console.error("⚠️  Server may not function correctly");
  } else {
    process.exit(1);
  }
}

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
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
    };

    console.log("🔄 Connecting to MongoDB...");
    console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);
    if (process.env.MONGODB_URI) {
      // Log only the host part for security
      const uriParts = process.env.MONGODB_URI.split('@');
      if (uriParts.length > 1) {
        console.log("📊 Connecting to host:", uriParts[1].split('/')[0]);
      }
    }
    
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log("📊 Database:", mongoose.connection.name);
        console.log("📊 Host:", mongoose.connection.host);
        console.log("📊 Port:", mongoose.connection.port);
        
        // Initialize services after successful connection
        try {
          smsService.initialize();
          console.log("✅ SMS service initialized");
        } catch (smsError) {
          console.error("❌ SMS service initialization failed:", smsError.message);
          // Don't throw, just log - SMS can be optional
        }
        
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        if (error.name === 'MongoServerError' && error.code === 18) {
          console.error("🔐 Authentication failed - check username and password");
        } else if (error.name === 'MongoNetworkError') {
          console.error("🌐 Network error - check if MongoDB Atlas IP whitelist includes Vercel IPs");
          console.error("💡 Tip: Add 0.0.0.0/0 to MongoDB Atlas Network Access for testing");
        }
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
  
  const dbStateText = states[dbState] || "unknown";
  const isConnected = dbState === 1;
  
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      state: dbStateText,
      connected: isConnected,
      name: isConnected ? mongoose.connection.name : null,
      host: isConnected ? mongoose.connection.host : null
    },
    services: {
      sms: !!(smsService && smsService.initialize),
      cron: !!(process.env.NODE_ENV === "production" && !process.env.VERCEL)
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI || !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasTwilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      isVercel: !!process.env.VERCEL,
      vercelUrl: process.env.VERCEL_URL || null
    }
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    nodeVersion: process.version,
    memory: process.memoryUsage()
  });
});

app.get("/api/debug", (req, res) => {
  // Safely check environment variables (don't send values, just existence)
  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGO_URI: !!process.env.MONGO_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    JWT_EXPIRE: !!process.env.JWT_EXPIRE,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL
  };
  
  res.json({
    message: "Debug Information",
    environment: envCheck,
    database: {
      readyState: mongoose.connection.readyState,
      readyStateText: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown"
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
});

// For local development
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, async () => {
    try {
      await connectDB();
      console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║   🚀 Server is running on port ${PORT}                       ║
    ║   📝 Environment: ${process.env.NODE_ENV || "development"}                    ║
    ║   🔗 URL: http://localhost:${PORT}                         ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
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
      try {
        initCronJobs();
        console.log("⏰ Cron jobs initialized");
      } catch (cronError) {
        console.error("❌ Cron jobs initialization failed:", cronError.message);
        // Don't throw, cron jobs are optional
      }
    }
    
    return app(req, res);
  } catch (error) {
    console.error("❌ Vercel function error:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    // Determine if this is a MongoDB error
    const isMongoError = error.name && (
      error.name.includes('Mongo') || 
      error.name === 'MongooseError' ||
      error.name === 'MongoServerError' ||
      error.name === 'MongoNetworkError'
    );
    
    return res.status(500).json({
      error: "Internal Server Error",
      message: isMongoError ? "Database connection failed" : error.message,
      type: error.name,
      details: isMongoError ? "Please check MongoDB connection and credentials" : undefined
    });
  }
};