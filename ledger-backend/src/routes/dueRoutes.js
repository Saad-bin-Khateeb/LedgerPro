const express = require("express");
const router = express.Router();

const {
  getCustomerDueSummary,
  getCustomersWithDue,
  getGlobalDueTotals,
} = require("../controllers/dueController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/totals", allowRoles("admin", "staff"), getGlobalDueTotals);
router.get("/", allowRoles("admin", "staff"), getCustomersWithDue);
router.get("/:customerId", allowRoles("admin", "staff"), getCustomerDueSummary);

module.exports = router;