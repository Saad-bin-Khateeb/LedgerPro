const { body } = require("express-validator");

exports.createCustomerValidator = [
  body("name")
    .notEmpty().withMessage("Customer name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters")
    .trim(),
  
  body("phone")
    .notEmpty().withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage("Please enter a valid phone number in E.164 format (e.g., +923001234567)")
    .trim(),
  
  body("email")
    .optional()
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address cannot exceed 200 characters"),
  
  body("creditLimit")
    .optional()
    .isFloat({ min: 0 }).withMessage("Credit limit must be a positive number"),
  
  body("defaultDuePeriod")
    .optional()
    .isInt({ min: 0, max: 365 }).withMessage("Due period must be between 0 and 365 days"),
  
  body("smsEnabled")
    .optional()
    .isBoolean().withMessage("SMS enabled must be a boolean")
];

exports.updateCustomerValidator = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters")
    .trim(),
  
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage("Please enter a valid phone number in E.164 format")
    .trim(),
  
  body("email")
    .optional()
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address cannot exceed 200 characters"),
  
  body("creditLimit")
    .optional()
    .isFloat({ min: 0 }).withMessage("Credit limit must be a positive number"),
  
  body("defaultDuePeriod")
    .optional()
    .isInt({ min: 0, max: 365 }).withMessage("Due period must be between 0 and 365 days"),
  
  body("smsEnabled")
    .optional()
    .isBoolean().withMessage("SMS enabled must be a boolean"),
  
  body("isActive")
    .optional()
    .isBoolean().withMessage("Is active must be a boolean")
];

exports.portalAccessValidator = [
  body("customerId")
    .notEmpty().withMessage("Customer ID is required")
    .isMongoId().withMessage("Invalid customer ID"),
  
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];