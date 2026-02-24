const express = require("express");
const router = express.Router();

const {
  generateLedgerStatement,
  generateAgingReport,
  generatePaymentReport,
  generateCustomerReport
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(allowRoles("admin", "staff"));

// Generate ledger statement PDF
router.get("/ledger/:customerId", generateLedgerStatement);

// Generate aging report Excel
router.get("/aging", generateAgingReport);

// Generate payment report Excel
router.get("/payments", generatePaymentReport);

// Generate customer summary report Excel
router.get("/customers", generateCustomerReport);

module.exports = router;