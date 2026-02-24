// save as create-new-customer.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function createAndLinkCustomer() {
  console.log("=".repeat(60));
  console.log("CREATING NEW CUSTOMER AND LINKING TO USER");
  console.log("=".repeat(60));
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    const User = require('./models/User');
    const Customer = require('./models/Customer');
    
    // User details
    const userEmail = 'eman@test.com';
    const userId = '698c2da7bee67acea8043405';
    
    // Find the user
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Create a new customer
    const newCustomer = await Customer.create({
      name: user.name || "Eman Traders",
      email: user.email,
      phone: "0300-1234567", // Set a default phone
      address: "Karachi, Pakistan", // Optional
      portalUser: user._id,
      createdBy: user._id, // Or find an admin user ID
      creditLimit: 100000,
      defaultDuePeriod: 30,
      smsEnabled: true
    });
    
    console.log(`✅ Created new customer: ${newCustomer.name}`);
    
    // Update the user
    user.linkedCustomer = newCustomer._id;
    await user.save();
    
    console.log("\n✅ SUCCESS! Created and linked:");
    console.log(`   Customer: ${newCustomer.name} (${newCustomer.email})`);
    console.log(`   Customer ID: ${newCustomer._id}`);
    console.log(`   Linked to user: ${user.email}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 NEW CUSTOMER CREATED AND LINKED!");
    console.log("=".repeat(60));
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createAndLinkCustomer();