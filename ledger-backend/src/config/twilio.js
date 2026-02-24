const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsFrom = process.env.TWILIO_SMS_FROM;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

// Initialize Twilio client only if credentials exist
let client = null;
try {
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized successfully");
  } else {
    console.log("⚠️ Twilio credentials not found - SMS will be disabled");
  }
} catch (error) {
  console.error("❌ Failed to initialize Twilio client:", error.message);
}

module.exports = {
  client,
  smsFrom,
  whatsappFrom
};