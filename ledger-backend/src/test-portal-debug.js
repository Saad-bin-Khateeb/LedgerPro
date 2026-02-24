const axios = require('axios');

async function debugPortal() {
  console.log("=".repeat(70));
  console.log("DEBUGGING CUSTOMER PORTAL - STEP BY STEP");
  console.log("=".repeat(70));
  
  // Your customer token from localStorage
  const customerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGMyZGE3YmVlNjdhY2VhODA0MzQwNSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc3MDc5NDQzOSwiZXhwIjoxNzcxMzk5MjM5fQ.8bvu0TBgT7EUuopIwsS01LxBBC2x4NFnvhfz2Fp0VBc";
  
  const config = {
    headers: { 
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  // Step 1: Test public route
  console.log("\n1️⃣  Testing PUBLIC route /api/portal/test");
  try {
    const testRes = await axios.get('http://localhost:5000/api/portal/test');
    console.log("   ✅ SUCCESS:", testRes.data.message);
  } catch (error) {
    console.log("   ❌ FAILED:", error.message);
    return;
  }
  
  // Step 2: Test protected route
  console.log("\n2️⃣  Testing PROTECTED route /api/portal/profile");
  try {
    const profileRes = await axios.get('http://localhost:5000/api/portal/profile', config);
    console.log("   ✅ SUCCESS - Status:", profileRes.status);
    console.log("   Data received:", Object.keys(profileRes.data));
    if (profileRes.data.name) {
      console.log("   Customer name:", profileRes.data.name);
    }
  } catch (error) {
    console.log("   ❌ FAILED");
    console.log("   Status code:", error.response?.status);
    console.log("   Error message:", error.response?.data?.message);
    console.log("   Full error:", error.response?.data);
    
    // Decode token to see what's in it
    console.log("\n   🔍 Analyzing your token...");
    const tokenParts = customerToken.split('.');
    if (tokenParts[1]) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log("   Token payload:");
        console.log("     User ID:", payload.id);
        console.log("     Role:", payload.role);
        console.log("     Issued at:", new Date(payload.iat * 1000).toLocaleString());
        console.log("     Expires at:", new Date(payload.exp * 1000).toLocaleString());
      } catch (e) {
        console.log("   Cannot decode token:", e.message);
      }
    }
  }
  
  // Step 3: Check server health
  console.log("\n3️⃣  Checking server health");
  try {
    const healthRes = await axios.get('http://localhost:5000/');
    console.log("   ✅ Server is running");
    console.log("   Available endpoints:", Object.keys(healthRes.data.endpoints));
  } catch (error) {
    console.log("   ❌ Server not responding:", error.message);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("NEXT STEPS:");
  console.log("=".repeat(70));
  console.log("1. Check your server console logs for [AUTH], [ROLE], [PORTAL] messages");
  console.log("2. Look for error messages in the logs");
  console.log("3. If user is not linked to customer, use admin panel to create portal access");
  console.log("4. Make sure the user has role: 'customer' (lowercase)");
}

debugPortal();