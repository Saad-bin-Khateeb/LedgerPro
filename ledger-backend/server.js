require("dotenv").config();
const express = require("express");

const app = express();

// Minimal test endpoints
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running!", 
    env: process.env.NODE_ENV,
    hasMongo: !!process.env.MONGODB_URI || !!process.env.MONGO_URI
  });
});

app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "API test endpoint working",
    time: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// For local development
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;