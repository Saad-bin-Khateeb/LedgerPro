const Settings = require("../models/Settings");
const { validationResult } = require("express-validator");

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin only)
exports.getSettings = async (req, res, next) => {
  try {
    const { type } = req.query;
    
    const filter = {};
    if (type) filter.type = type;

    const settings = await Settings.find(filter)
      .sort({ type: 1, key: 1 })
      .lean();

    // Don't return encrypted values in plain text
    const sanitizedSettings = settings.map(setting => {
      if (setting.isEncrypted) {
        return { ...setting, value: "[ENCRYPTED]" };
      }
      return setting;
    });

    res.status(200).json({
      success: true,
      settings: sanitizedSettings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Private (Admin only)
exports.getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOne({ key }).lean();

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found"
      });
    }

    // Don't return encrypted values in plain text
    if (setting.isEncrypted) {
      setting.value = "[ENCRYPTED]";
    }

    res.status(200).json({
      success: true,
      setting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update setting
// @route   PUT /api/settings/:key
// @access  Private (Admin only)
exports.upsertSetting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { key } = req.params;
    const { value, type, description, isEncrypted = false } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        key,
        value,
        type,
        description,
        isEncrypted,
        updatedBy: req.user.id,
        ...(!await Settings.findOne({ key }) && { createdBy: req.user.id })
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Setting saved successfully",
      setting: isEncrypted ? { ...setting.toObject(), value: "[ENCRYPTED]" } : setting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private (Admin only)
exports.deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOneAndDelete({ key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Setting deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get SMS templates
// @route   GET /api/settings/sms-templates
// @access  Private (Admin only)
exports.getSMSTemplates = async (req, res, next) => {
  try {
    const templates = await Settings.find({
      key: { $regex: "^sms_template_" }
    }).lean();

    const defaultTemplates = {
      payment_received: "Dear {{customer_name}}, we have received your payment of Rs. {{amount}}. Your remaining balance is Rs. {{balance}}. Thank you.",
      due_reminder: "Reminder: Your payment of Rs. {{due_amount}} is due on {{due_date}}. Kindly pay on time.",
      overdue_notice: "Your payment of Rs. {{due_amount}} was due on {{due_date}}. Please clear it at the earliest.",
      welcome: "Welcome {{customer_name}}! Your account has been created. Your current balance is Rs. {{balance}}."
    };

    const result = {};
    
    // Merge with defaults
    Object.keys(defaultTemplates).forEach(key => {
      const templateKey = `sms_template_${key}`;
      const saved = templates.find(t => t.key === templateKey);
      result[key] = saved ? saved.value : defaultTemplates[key];
    });

    res.status(200).json({
      success: true,
      templates: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update SMS template
// @route   PUT /api/settings/sms-templates/:name
// @access  Private (Admin only)
exports.updateSMSTemplate = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        message: "Template content is required"
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key: `sms_template_${name}` },
      {
        key: `sms_template_${name}`,
        value: template,
        type: "sms",
        description: `SMS template for ${name}`,
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "SMS template updated successfully",
      template: {
        name,
        value: setting.value
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reminder schedule
// @route   GET /api/settings/reminder-schedule
// @access  Private (Admin only)
exports.getReminderSchedule = async (req, res, next) => {
  try {
    const schedule = await Settings.getReminderSchedule();

    res.status(200).json({
      success: true,
      schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reminder schedule
// @route   PUT /api/settings/reminder-schedule
// @access  Private (Admin only)
exports.updateReminderSchedule = async (req, res, next) => {
  try {
    const { due_reminder_days, overdue_reminder_days, reminder_time } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key: "reminder_schedule" },
      {
        key: "reminder_schedule",
        value: {
          due_reminder_days: due_reminder_days || [3, 1],
          overdue_reminder_days: overdue_reminder_days || [1, 3, 7],
          reminder_time: reminder_time || "09:00"
        },
        type: "reminder",
        description: "SMS reminder schedule configuration",
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Reminder schedule updated successfully",
      schedule: setting.value
    });
  } catch (error) {
    next(error);
  }
};