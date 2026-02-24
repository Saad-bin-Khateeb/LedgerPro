const { body } = require("express-validator");

exports.recordPaymentValidator = [
  body("customer")
    .notEmpty().withMessage("Customer is required")
    .isMongoId().withMessage("Invalid customer ID"),
  
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  
  body("method")
    .notEmpty().withMessage("Payment method is required")
    .isIn(["cash", "bank", "online"]).withMessage("Invalid payment method"),
  
  body("reference")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Reference cannot exceed 50 characters"),
  
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  
  body("via")
    .optional()
    .isIn(["sms", "whatsapp"]).withMessage("Invalid message channel"),
  
  body("receivedDate")
    .optional()
    .isISO8601().withMessage("Invalid date format")
    .toDate()
];

exports.voidPaymentValidator = [
  body("reason")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Reason cannot exceed 200 characters")
];