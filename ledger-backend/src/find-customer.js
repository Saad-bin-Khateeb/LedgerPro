// Create this file as find-customer.js in src folder
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function findCustomer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    const Customer = require('./models/Customer');
    
    // Find customer by email (try both cases)
    const customer = await Customer.findOne({ 
      $or: [
        { email: 'Eman@test.com' },
        { email: 'eman@test.com' }
      ]
    });
    
    if (customer) {
      console.log("\n✅ CUSTOMER FOUND:");
      console.log("   ID:", customer._id);
      console.log("   Name:", customer.name);
      console.log("   Email:", customer.email);
      console.log("   Phone:", customer.phone);
      console.log("   Current portalUser:", customer.portalUser || "None");
    } else {
      console.log("\n❌ No customer found with email Eman@test.com or eman@test.com");
      
      // List all customers
      const allCustomers = await Customer.find().select('name email portalUser').limit(20);
      console.log("\nAll customers in database:");
      allCustomers.forEach((c, i) => {
        console.log(`${i+1}. ${c.name} (${c.email}) - Portal: ${c.portalUser || 'None'}`);
      });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

findCustomer();