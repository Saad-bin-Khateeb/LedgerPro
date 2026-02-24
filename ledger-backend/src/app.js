const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorMiddleware");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dueRoutes = require("./routes/dueRoutes");
const customerPortalRoutes = require("./routes/customerPortalRoutes");
const smsRoutes = require("./routes/smsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Connect to database
connectDB();

// ====================
// GLOBAL MIDDLEWARE
// ====================

// Security headers
app.use(helmet());

// CORS - Restrict in production
if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }));
} else {
  app.use(cors());
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?._id
  });
  next();
});

// ====================
// HEALTH CHECK
// ====================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ====================
// MOUNT ROUTES
// ====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/due", dueRoutes);
app.use("/api/portal", customerPortalRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// API documentation route
app.get("/api", (req, res) => {
  res.json({
    message: "Ledger Management System API",
    version: "2.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      customers: "/api/customers",
      ledger: "/api/ledger",
      payments: "/api/payments",
      due: "/api/due",
      portal: "/api/portal",
      sms: "/api/sms",
      reports: "/api/reports",
      settings: "/api/settings",
      health: "/health"
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;