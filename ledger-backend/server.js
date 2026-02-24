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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ======================================
  🚀 Server is running on port ${PORT}
  📝 Environment: ${process.env.NODE_ENV || "development"}
  🔗 URL: http://localhost:${PORT}
  ======================================
  `);
  
  // Initialize SMS service
  smsService.initialize();
  
  // Initialize cron jobs
  if (process.env.NODE_ENV === "production") {
    initCronJobs();
    console.log("⏰ Cron jobs initialized");
  }
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