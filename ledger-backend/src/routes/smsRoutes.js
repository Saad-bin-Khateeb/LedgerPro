const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
  getSMSLogs,
  getSMSLogsByCustomer,
  sendManualSMS,
  sendDueReminders,
  smsWebhook,
  getSMSStats
} = require("../controllers/smsController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Public webhook for Twilio
router.post("/webhook", smsWebhook);

// Protected routes
router.use(protect);
router.use(allowRoles("admin", "staff"));

// Validation rules
const smsValidation = [
  body("customerId").notEmpty().withMessage("Customer ID is required"),
  body("message").notEmpty().withMessage("Message is required").isLength({ max: 1600 }),
  body("type").isIn(["payment", "due_reminder", "overdue", "manual"]).withMessage("Invalid SMS type")
];

// Get all SMS logs
router.get("/", getSMSLogs);

// Get SMS logs by customer
router.get("/customer/:customerId", getSMSLogsByCustomer);

// Get SMS statistics
router.get("/stats", getSMSStats);

// Send manual SMS/WhatsApp
router.post("/send", smsValidation, sendManualSMS);

// Send due reminders to all eligible customers
router.post("/send-reminders", sendDueReminders);

module.exports = router;