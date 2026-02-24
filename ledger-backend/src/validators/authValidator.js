const { body } = require("express-validator");

exports.registerValidator = [
  body("name")
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters")
    .trim(),
  
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage("Password must contain at least one letter and one number"),
  
  body("role")
    .optional()
    .isIn(["admin", "staff", "customer"]).withMessage("Invalid role")
];

exports.loginValidator = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("Password is required")
];

exports.updatePasswordValidator = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),
  
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage("Password must contain at least one letter and one number")
];

exports.forgotPasswordValidator = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail()
];

exports.resetPasswordValidator = [
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage("Password must contain at least one letter and one number")
];