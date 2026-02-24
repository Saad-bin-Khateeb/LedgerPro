const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },
    method: {
      type: String,
      enum: ["cash", "bank", "online"],
      required: [true, "Payment method is required"]
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [50, "Reference cannot exceed 50 characters"]
    },
    receiptNumber: {
      type: String,
      unique: true,  // ✅ This creates the index - DON'T add another
      sparse: true
    },
    receivedDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"]
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
      index: true
    },
    smsSent: {
      type: Boolean,
      default: false
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
// paymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });

// ✅ KEEP - Compound indexes for common queries
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ method: 1, status: 1 });

// Generate receipt number before save
paymentSchema.pre("save", async function(next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await mongoose.model("Payment").countDocuments();
    this.receiptNumber = `RCP-${year}${month}-${(count + 1).toString().padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);