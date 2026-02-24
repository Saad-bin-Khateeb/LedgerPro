// save as link-existing-customer.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function linkExistingCustomer() {
  console.log("=".repeat(60));
  console.log("LINKING EXISTING CUSTOMER TO USER");
  console.log("=".repeat(60));
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    const User = require('./models/User');
    const Customer = require('./models/Customer');
    
    // User details
    const userEmail = 'eman@test.com';
    const userId = '698c2da7bee67acea8043405';
    
    // List customers for selection
    console.log("\n📋 AVAILABLE CUSTOMERS:");
    const customers = await Customer.find().select('name email phone portalUser').limit(20);
    
    customers.forEach((c, i) => {
      console.log(`${i+1}. ${c.name} (Email: ${c.email || 'Not set'}) - Portal: ${c.portalUser || 'None'}`);
    });
    
    // Choose a customer (let's use the first one - John Traders)
    const selectedCustomer = customers[0]; // John Traders
    console.log(`\n🔗 Selected customer: ${selectedCustomer.name}`);
    
    // Find the user
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Update the customer
    selectedCustomer.email = user.email; // Set email
    selectedCustomer.portalUser = user._id; // Link to user
    await selectedCustomer.save();
    
    // Update the user
    user.linkedCustomer = selectedCustomer._id;
    await user.save();
    
    console.log("\n✅ SUCCESS! Customer updated:");
    console.log(`   Name: ${selectedCustomer.name}`);
    console.log(`   Email set to: ${selectedCustomer.email}`);
    console.log(`   portalUser: ${selectedCustomer.portalUser}`);
    
    console.log(`\n✅ User updated:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   linkedCustomer: ${user.linkedCustomer}`);
    
    console.log("\n" + "=".repeat(60));
    console.log(`🎉 ${selectedCustomer.name} is now linked to ${user.email}`);
    console.log("=".repeat(60));
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

linkExistingCustomer();