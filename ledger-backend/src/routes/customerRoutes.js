const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createCustomerPortalAccess,
  revokeCustomerPortalAccess
} = require("../controllers/customerController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", allowRoles("admin", "staff"), createCustomer);
router.get("/", allowRoles("admin", "staff"), getCustomers);
router.get("/:id", allowRoles("admin", "staff"), getCustomerById);
router.put("/:id", allowRoles("admin", "staff"), updateCustomer);
router.delete("/:id", allowRoles("admin", "staff"), deleteCustomer);

router.post(
  "/portal-access", 
  allowRoles("admin", "staff"), 
  createCustomerPortalAccess
);
router.delete(
  "/:customerId/portal-access", 
  allowRoles("admin", "staff"), 
  revokeCustomerPortalAccess
);

module.exports = router;