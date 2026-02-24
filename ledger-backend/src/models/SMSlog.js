const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [1600, "Message cannot exceed 1600 characters"]
    },
    type: {
      type: String,
      enum: ["payment", "due_reminder", "overdue", "manual", "welcome"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "rejected"],
      default: "pending",
      index: true
    },
    via: {
      type: String,
      enum: ["sms", "whatsapp"],
      default: "sms"
    },
    twilioSid: {
      type: String,
      unique: true,  // ✅ This creates the index - DON'T add another
      sparse: true
    },
    twilioStatus: {
      type: String
    },
    errorMessage: {
      type: String
    },
    cost: {
      type: Number,
      default: 0
    },
    segments: {
      type: Number,
      default: 1
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    deliveredAt: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// ❌ REMOVED - Duplicate indexes (already defined in schema)
// smsLogSchema.index({ twilioSid: 1 }, { unique: true, sparse: true });

// ✅ KEEP - Compound indexes for analytics
smsLogSchema.index({ customer: 1, sentAt: -1 });
smsLogSchema.index({ type: 1, status: 1 });
smsLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model("SMSLog", smsLogSchema);