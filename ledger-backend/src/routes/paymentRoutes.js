const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
  recordPayment,
  getPaymentsByCustomer,
  getPaymentsByCustomerId,
  getAllPayments,
  getPaymentById,
  getPaymentReceipt,
  voidPayment
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// All payment routes require authentication
router.use(protect);

// Validation rules
const paymentValidation = [
  body("customer").notEmpty().withMessage("Customer is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("method").isIn(["cash", "bank", "online"]).withMessage("Invalid payment method")
];

// POST /api/payments - Record payment (Admin, Staff)
router.post("/", allowRoles("admin", "staff"), paymentValidation, recordPayment);

// GET /api/payments - Get all payments OR filter by customer (Admin, Staff)
router.get("/", allowRoles("admin", "staff"), (req, res, next) => {
  if (req.query.customer) {
    return getPaymentsByCustomerId(req, res, next);
  }
  return getAllPayments(req, res, next);
});

// GET /api/payments/customer/:customerId - Get payments by customer (Admin, Staff, Customer)
router.get("/customer/:customerId", allowRoles("admin", "staff", "customer"), getPaymentsByCustomer);

// GET /api/payments/:paymentId - Get payment by ID (Admin, Staff, Customer)
router.get("/:paymentId", allowRoles("admin", "staff", "customer"), getPaymentById);

// GET /api/payments/:paymentId/receipt - Get payment receipt (Admin, Staff, Customer)
router.get("/:paymentId/receipt", allowRoles("admin", "staff", "customer"), getPaymentReceipt);

// PUT /api/payments/:paymentId/void - Void payment (Admin only)
router.put("/:paymentId/void", allowRoles("admin"), voidPayment);

module.exports = router;