const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
  getSettings,
  getSettingByKey,
  upsertSetting,
  deleteSetting,
  getSMSTemplates,
  updateSMSTemplate,
  getReminderSchedule,
  updateReminderSchedule
} = require("../controllers/settingsController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(allowRoles("admin"));

// Get all settings
router.get("/", getSettings);

// Get SMS templates
router.get("/sms-templates", getSMSTemplates);

// Update SMS template
router.put(
  "/sms-templates/:name",
  body("template").notEmpty().withMessage("Template content is required"),
  updateSMSTemplate
);

// Get reminder schedule
router.get("/reminder-schedule", getReminderSchedule);

// Update reminder schedule
router.put("/reminder-schedule", updateReminderSchedule);

// Get setting by key
router.get("/:key", getSettingByKey);

// Create/Update setting
router.put(
  "/:key",
  body("value").notEmpty().withMessage("Value is required"),
  body("type").isIn(["sms", "reminder", "business", "system", "notification"]).withMessage("Invalid setting type"),
  upsertSetting
);

// Delete setting
router.delete("/:key", deleteSetting);

module.exports = router;