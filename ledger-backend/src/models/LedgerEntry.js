const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true  // ✅ Keep this
    },
    date: {
      type: Date,
      default: Date.now,
      index: true  // ✅ Keep this
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"]
    },
    debit: {
      type: Number,
      default: 0,
      min: [0, "Debit cannot be negative"]
    },
    credit: {
      type: Number,
      default: 0,
      min: [0, "Credit cannot be negative"]
    },
    balance: {
      type: Number,
      required: true
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [50, "Reference cannot exceed 50 characters"]
    },
    dueDate: {
      type: Date,
      index: true,  // ✅ Keep this
      sparse: true
    },
    isFinalized: {
      type: Boolean,
      default: true,
      index: true
    },
    entryType: {
      type: String,
      enum: ["purchase", "payment", "adjustment", "return"],
      default: "purchase"
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "online", null],
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ❌ REMOVED - Duplicate indexes (already defined in schema)
// ledgerEntrySchema.index({ dueDate: 1 }, { sparse: true });

// ✅ KEEP - Compound indexes for common queries
ledgerEntrySchema.index({ customer: 1, createdAt: -1 });
ledgerEntrySchema.index({ customer: 1, dueDate: 1 }, { sparse: true });

// Validate that either debit OR credit has value
ledgerEntrySchema.pre("validate", function(next) {
  if (this.debit === 0 && this.credit === 0) {
    next(new Error("Either debit or credit amount must be greater than zero"));
  }
  if (this.debit > 0 && this.credit > 0) {
    next(new Error("Cannot have both debit and credit in same entry"));
  }
  next();
});

// Update customer balance when entry is created
ledgerEntrySchema.post("save", async function(doc) {
  try {
    const Customer = mongoose.model("Customer");
    await Customer.findByIdAndUpdate(doc.customer, {
      currentBalance: doc.balance,
      lastActivity: new Date(),
      ...(doc.debit > 0 && { $inc: { totalPurchases: doc.debit } }),
      ...(doc.credit > 0 && { $inc: { totalPayments: doc.credit } })
    });
  } catch (error) {
    console.error("Error updating customer balance:", error);
  }
});

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);