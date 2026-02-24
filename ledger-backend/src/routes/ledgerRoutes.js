const express = require("express");
const router = express.Router();

const {
  addLedgerEntry,
  getCustomerLedger,
  getAllLedgerEntries,
  getCustomerBalance,
  getOverdueEntries
} = require("../controllers/ledgerController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);

// ✅ ORDER IS CRITICAL - More specific routes first

// GET /api/ledger/overdue - Get overdue entries
router.get("/overdue", allowRoles("admin", "staff"), getOverdueEntries);

// 🔴 FIX: This must come BEFORE /:customerId
// GET /api/ledger/:customerId/balance - Get customer balance
router.get("/:customerId/balance", allowRoles("admin", "staff", "customer"), getCustomerBalance);

// GET /api/ledger - Get all ledger entries
router.get("/", allowRoles("admin", "staff"), getAllLedgerEntries);

// GET /api/ledger/:customerId - Get customer ledger (THIS MUST BE LAST)
router.get("/:customerId", allowRoles("admin", "staff", "customer"), getCustomerLedger);

// POST /api/ledger - Add ledger entry
router.post("/", allowRoles("admin", "staff"), addLedgerEntry);

module.exports = router;