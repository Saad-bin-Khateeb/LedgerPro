const { body } = require("express-validator");

exports.createLedgerEntryValidator = [
  body("customer")
    .notEmpty().withMessage("Customer is required")
    .isMongoId().withMessage("Invalid customer ID"),
  
  body("description")
    .notEmpty().withMessage("Description is required")
    .trim()
    .isLength({ max: 200 }).withMessage("Description cannot exceed 200 characters"),
  
  body("debit")
    .optional()
    .isFloat({ min: 0 }).withMessage("Debit must be a positive number"),
  
  body("credit")
    .optional()
    .isFloat({ min: 0 }).withMessage("Credit must be a positive number"),
  
  body()
    .custom((value, { req }) => {
      const debit = parseFloat(req.body.debit) || 0;
      const credit = parseFloat(req.body.credit) || 0;
      
      if (debit <= 0 && credit <= 0) {
        throw new Error("Either debit or credit amount must be greater than zero");
      }
      
      if (debit > 0 && credit > 0) {
        throw new Error("Cannot have both debit and credit in the same entry");
      }
      
      return true;
    }),
  
  body("reference")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Reference cannot exceed 50 characters"),
  
  body("dueDate")
    .optional()
    .isISO8601().withMessage("Invalid due date format")
    .toDate(),
  
  body("entryType")
    .optional()
    .isIn(["purchase", "payment", "adjustment", "return"]).withMessage("Invalid entry type")
];

exports.getLedgerValidator = [
  body("customerId")
    .optional()
    .isMongoId().withMessage("Invalid customer ID")
];