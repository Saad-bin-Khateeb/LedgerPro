const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    type: {
      type: String,
      enum: ["sms", "reminder", "business", "system", "notification"],
      required: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    isEncrypted: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// SMS Templates
settingsSchema.statics.getSMSTemplate = async function(templateName) {
  const setting = await this.findOne({ key: `sms_template_${templateName}` });
  if (setting) {
    return setting.value;
  }
  // Return defaults
  const defaults = {
    payment_received: "Dear {{customer_name}}, we have received your payment of Rs. {{amount}}. Your remaining balance is Rs. {{balance}}. Thank you.",
    due_reminder: "Reminder: Your payment of Rs. {{due_amount}} is due on {{due_date}}. Kindly pay on time.",
    overdue_notice: "Your payment of Rs. {{due_amount}} was due on {{due_date}}. Please clear it at the earliest.",
    welcome: "Welcome {{customer_name}}! Your account has been created. Your current balance is Rs. {{balance}}."
  };
  return defaults[templateName] || "";
};

// Reminder schedules
settingsSchema.statics.getReminderSchedule = async function() {
  const setting = await this.findOne({ key: "reminder_schedule" });
  return setting ? setting.value : {
    due_reminder_days: [3, 1], // Send 3 days and 1 day before due
    overdue_reminder_days: [1, 3, 7], // Send 1, 3, 7 days after overdue
    reminder_time: "09:00" // 9 AM
  };
};

module.exports = mongoose.model("Settings", settingsSchema);