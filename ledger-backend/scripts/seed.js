require("dotenv").config()
const mongoose = require("mongoose")
const User = require("../src/models/User")
const Customer = require("../src/models/Customer")
const Settings = require("../src/models/Settings")
const connectDB = require("../src/config/db")

const seedDatabase = async () => {
  try {
    await connectDB()
    
    console.log("🌱 Seeding database...")

    // Clear existing data
    await User.deleteMany({})
    await Customer.deleteMany({})
    await Settings.deleteMany({})

    // ✅ CORRECT - Pass plain text password, let model hash it!
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@ledger.com",
      password: "admin123", // PLAIN TEXT - model will hash it
      role: "admin",
      isActive: true
    })

    console.log("✅ Admin user created:", admin.email)

    const staff = await User.create({
      name: "Staff User",
      email: "staff@ledger.com",
      password: "staff123", // PLAIN TEXT - model will hash it
      role: "staff",
      isActive: true
    })

    console.log("✅ Staff user created:", staff.email)

    // Verify password works
    const testUser = await User.findOne({ email: "admin@ledger.com" }).select("+password")
    const isMatch = await testUser.comparePassword("admin123")
    console.log("🔐 Password verification:", isMatch ? "✅ OK" : "❌ FAILED")

    if (!isMatch) {
      throw new Error("Password hashing failed!")
    }

    // Create sample customers
    await Customer.create([
      {
        name: "John Doe",
        phone: "+923001234567",
        email: "john@example.com",
        address: "123 Main Street, Karachi",
        creditLimit: 50000,
        defaultDuePeriod: 30,
        smsEnabled: true,
        createdBy: admin._id,
        currentBalance: 25000,
        totalPurchases: 75000,
        totalPayments: 50000
      },
      {
        name: "Jane Smith",
        phone: "+923007654321",
        email: "jane@example.com",
        address: "456 Park Road, Lahore",
        creditLimit: 30000,
        defaultDuePeriod: 15,
        smsEnabled: true,
        createdBy: admin._id,
        currentBalance: 15000,
        totalPurchases: 45000,
        totalPayments: 30000
      },
      {
        name: "Ahmed Khan",
        phone: "+923331234567",
        email: "ahmed@example.com",
        address: "789 Business Avenue, Islamabad",
        creditLimit: 100000,
        defaultDuePeriod: 45,
        smsEnabled: false,
        createdBy: staff._id,
        currentBalance: 0,
        totalPurchases: 200000,
        totalPayments: 200000
      }
    ])

    console.log("✅ Created 3 sample customers")

    // Create default settings
    await Settings.create([
      {
        key: "sms_template_payment_received",
        value: "Dear {{customer_name}}, we have received your payment of Rs. {{amount}}. Your remaining balance is Rs. {{balance}}. Thank you.",
        type: "sms",
        description: "SMS template for payment confirmation"
      },
      {
        key: "sms_template_due_reminder",
        value: "Reminder: Your payment of Rs. {{due_amount}} is due on {{due_date}}. Kindly pay on time.",
        type: "sms",
        description: "SMS template for due reminders"
      },
      {
        key: "sms_template_overdue_notice",
        value: "Your payment of Rs. {{due_amount}} was due on {{due_date}}. Please clear it at the earliest.",
        type: "sms",
        description: "SMS template for overdue notices"
      },
      {
        key: "reminder_schedule",
        value: {
          due_reminder_days: [3, 1],
          overdue_reminder_days: [1, 3, 7],
          reminder_time: "09:00"
        },
        type: "reminder",
        description: "SMS reminder schedule configuration"
      },
      {
        key: "business_name",
        value: "Ledger Management System",
        type: "business",
        description: "Business name for SMS and receipts"
      }
    ])

    console.log("✅ Created 5 default settings")
    console.log("\n🎉 Database seeded successfully!")
    console.log("\n📝 Login Credentials:")
    console.log("Admin - admin@ledger.com / admin123")
    console.log("Staff - staff@ledger.com / staff123")
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

seedDatabase()