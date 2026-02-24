const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getMyLedger,
  getMyPayments,
  getMyDueSummary,
  downloadMyStatement
} = require("../controllers/customerPortalController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ============================================
// PUBLIC TEST ROUTE (no authentication needed)
// ============================================
router.get("/test", (req, res) => {
  console.log("✅ /api/portal/test route hit - Portal API is working");
  res.json({ 
    message: "Customer Portal API is working",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/profile",
      "/ledger", 
      "/payments",
      "/due-summary",
      "/statement"  // ✅ Updated endpoint name
    ]
  });
});

// ============================================
// ALL ROUTES BELOW REQUIRE AUTHENTICATION
// ============================================

// Apply authentication to all following routes
router.use(protect);

// Apply customer role restriction to all following routes
router.use(allowRoles("customer"));

// Debug middleware - logs all portal requests
router.use((req, res, next) => {
  console.log(`[PORTAL] ${req.method} ${req.originalUrl}`);
  console.log(`[PORTAL] User: ${req.user?.id} (${req.user?.email})`);
  console.log(`[PORTAL] User role: ${req.user?.role}`);
  next();
});

// ============================================
// PROTECTED CUSTOMER PORTAL ROUTES
// ============================================

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/ledger", getMyLedger);
router.get("/payments", getMyPayments);
router.get("/due-summary", getMyDueSummary);
router.get("/statement", downloadMyStatement);  // ✅ Fixed: changed from "/statement/download"

module.exports = router;