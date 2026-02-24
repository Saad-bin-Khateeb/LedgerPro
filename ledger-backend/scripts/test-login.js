require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../src/models/User")
const connectDB = require("../src/config/db")

const testLogin = async () => {
  try {
    await connectDB()
    
    console.log("🔍 Testing login...")
    
    // Find the user
    const user = await User.findOne({ email: "admin@ledger.com" }).select("+password")
    
    if (!user) {
      console.log("❌ User not found!")
      process.exit(1)
    }
    
    console.log("✅ User found:", user.email)
    console.log("📝 User role:", user.role)
    console.log("🔑 Password in DB:", user.password)
    
    // Test password comparison
    const isMatch = await bcrypt.compare("admin123", user.password)
    console.log("🔐 Password match:", isMatch)
    
    // If password doesn't match, update it
    if (!isMatch) {
      console.log("🔄 Updating password...")
      const hashedPassword = await bcrypt.hash("admin123", 12)
      user.password = hashedPassword
      await user.save()
      console.log("✅ Password updated!")
      
      // Test again
      const newMatch = await bcrypt.compare("admin123", user.password)
      console.log("🔐 New password match:", newMatch)
    }
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testLogin()