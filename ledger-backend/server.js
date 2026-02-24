require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const { initCronJobs } = require("./src/utils/cronJobs");
const smsService = require("./src/services/smsService");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to MongoDB (important for serverless)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB connected");
    
    // Initialize SMS service only once
    smsService.initialize();
    
    // Initialize cron jobs only in production and not in serverless
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      initCronJobs();
      console.log("⏰ Cron jobs initialized");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, async () => {
    await connectDB();
    console.log(`
    ======================================
    🚀 Server is running on port ${PORT}
    📝 Environment: ${process.env.NODE_ENV || "development"}
    🔗 URL: http://localhost:${PORT}
    ======================================
    `);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION! Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);
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
  await connectDB();
  return app(req, res);
};