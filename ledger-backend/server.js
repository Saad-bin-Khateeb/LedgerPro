require("dotenv").config();
const express = require("express");

const app = express();

// Simple test endpoint
app.get("/", (req, res) => {
  res.json({ message: "Root endpoint working" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API test endpoint working" });
});

// For Vercel
module.exports = app;

// For local development
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}