const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,  // ✅ This creates the index - DON'T add another
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Please enter a valid phone number in E.164 format"
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,  // ✅ Allow null/undefined but ensure uniqueness when provided
      unique: true,
      validate: {
        validator: function(v) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: "Please enter a valid email"
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"]
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, "Credit limit cannot be negative"]
    },
    defaultDuePeriod: {
      type: Number,
      default: 30,
      min: [0, "Due period cannot be negative"],
      max: [365, "Due period cannot exceed 365 days"]
    },
    smsEnabled: {
      type: Boolean,
      default: true
    },
    // Denormalized fields for performance
    currentBalance: {
      type: Number,
      default: 0
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalPayments: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    // Link to User account (if customer has portal access)
    portalUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      sparse: true,
      unique: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ❌ REMOVED - Duplicate indexes (already defined with unique: true)
// customerSchema.index({ phone: 1 }, { unique: true });
// customerSchema.index({ email: 1 }, { sparse: true, unique: true });
// customerSchema.index({ portalUser: 1 }, { sparse: true, unique: true });

// ✅ KEEP - Compound indexes for common queries
customerSchema.index({ createdBy: 1, createdAt: -1 });
customerSchema.index({ currentBalance: -1 });
customerSchema.index({ lastActivity: -1 });

// Virtual for days since last activity
customerSchema.virtual("daysSinceLastActivity").get(function() {
  if (!this.lastActivity) return null;
  return Math.floor((Date.now() - this.lastActivity) / (1000 * 60 * 60 * 24));
});

// Update timestamps on save
customerSchema.pre("save", function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model("Customer", customerSchema);