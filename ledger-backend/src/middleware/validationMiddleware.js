const { body, validationResult } = require("express-validator");

// Customer validation rules
exports.customerValidation = [
  body("name").notEmpty().withMessage("Customer name is required").trim(),
  body("phone").notEmpty().withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage("Please enter a valid phone number in E.164 format"),
  body("email").optional().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("creditLimit").optional().isFloat({ min: 0 }).withMessage("Credit limit must be a positive number"),
  body("defaultDuePeriod").optional().isInt({ min: 0, max: 365 }).withMessage("Due period must be between 0 and 365 days")
];

// Ledger entry validation rules
exports.ledgerValidation = [
  body("customer").notEmpty().withMessage("Customer is required"),
  body("description").notEmpty().withMessage("Description is required").trim(),
  body("debit").optional().isFloat({ min: 0 }).withMessage("Debit must be a positive number"),
  body("credit").optional().isFloat({ min: 0 }).withMessage("Credit must be a positive number"),
  body().custom((value, { req }) => {
    if (req.body.debit <= 0 && req.body.credit <= 0) {
      throw new Error("Either debit or credit amount must be greater than zero");
    }
    return true;
  })
];

// Payment validation rules
exports.paymentValidation = [
  body("customer").notEmpty().withMessage("Customer is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("method").isIn(["cash", "bank", "online"]).withMessage("Invalid payment method"),
  body("via").optional().isIn(["sms", "whatsapp"]).withMessage("Invalid message channel")
];

// User validation rules
exports.userValidation = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["admin", "staff", "customer"]).withMessage("Invalid role")
];

// SMS validation rules
exports.smsValidation = [
  body("customerId").notEmpty().withMessage("Customer ID is required"),
  body("message").notEmpty().withMessage("Message is required").isLength({ max: 1600 }),
  body("type").isIn(["payment", "due_reminder", "overdue", "manual"]).withMessage("Invalid SMS type"),
  body("via").optional().isIn(["sms", "whatsapp"]).withMessage("Invalid message channel")
];

// Portal access validation
exports.portalAccessValidation = [
  body("customerId").notEmpty().withMessage("Customer ID is required"),
  body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};