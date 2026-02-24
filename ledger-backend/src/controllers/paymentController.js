const Payment = require("../models/Payment");
const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const sendSMS = require("../utils/sendSMS");
const smsTemplates = require("../config/smsTemplates");
const mongoose = require("mongoose");

// Helper: get last balance
const getLastBalance = async (customerId) => {
  const lastEntry = await LedgerEntry
    .findOne({ customer: customerId })
    .sort({ createdAt: -1 });

  return lastEntry ? lastEntry.balance : 0;
};

// @desc    Record payment
// @route   POST /api/payments
// @access  Private (Admin, Staff)
exports.recordPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, amount, method, reference, via, notes } = req.body;

    if (!customer || !amount || !method) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "Customer, amount, and method are required" 
      });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false,
        message: "Amount must be greater than zero" 
      });
    }

    // Get customer data
    const customerData = await Customer.findById(customer).session(session);
    if (!customerData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Generate receipt number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await Payment.countDocuments();
    const receiptNumber = `RCP-${year}${month}-${(count + 1).toString().padStart(6, "0")}`;

    // Save payment with transaction
    const [payment] = await Payment.create([{
      customer,
      amount,
      method,
      reference,
      notes,
      receiptNumber,
      createdBy: req.user.id,
      status: "completed"
    }], { session });

    // Create ledger credit entry
    const lastBalance = await getLastBalance(customer);
    const newBalance = lastBalance - amount;

    await LedgerEntry.create([{
      customer,
      description: `Payment received (${method})${reference ? ` - Ref: ${reference}` : ""}`,
      credit: amount,
      balance: newBalance,
      reference: receiptNumber,
      entryType: "payment",
      paymentMethod: method,
      createdBy: req.user.id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send SMS/WhatsApp if enabled (outside transaction)
    let smsStatus = { success: false, message: "SMS disabled" };
    if (customerData.smsEnabled && customerData.phone) {
      try {
        const message = await smsTemplates.paymentReceived(
          customerData.name,
          amount,
          newBalance
        );

        const smsResult = await sendSMS({
          to: customerData.phone,
          message,
          customerId: customer,
          type: "payment",
          via: via || "sms"
        });

        smsStatus = {
          success: smsResult.success,
          message: smsResult.success 
            ? `${via === "whatsapp" ? "WhatsApp" : "SMS"} sent successfully` 
            : `${via === "whatsapp" ? "WhatsApp" : "SMS"} failed: ${smsResult.error}`
        };
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        smsStatus = { success: false, message: "SMS sending failed" };
      }
    }

    // Populate for response
    await payment.populate("customer", "name phone");
    await payment.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        smsStatus
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Payment error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (Admin, Staff)
exports.getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find()
        .populate("customer", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get payments by customer ID (route param)
// @route   GET /api/payments/customer/:customerId
// @access  Private (Admin, Staff, Customer)
exports.getPaymentsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check access for customer role
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own payments"
        });
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find({ customer: customerId })
        .populate("customer", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ customer: customerId })
    ]);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get payments by customer error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get payments by customer ID (query param)
// @route   GET /api/payments?customer=:customerId
// @access  Private (Admin, Staff)
exports.getPaymentsByCustomerId = async (req, res, next) => {
  try {
    const { customer } = req.query;
    
    if (!customer) {
      return res.status(400).json({ 
        success: false,
        message: "Customer ID is required" 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ customer })
        .populate("customer", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ customer })
    ]);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get payments by customer ID error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:paymentId
// @access  Private (Admin, Staff, Customer)
exports.getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("customer", "name phone email address")
      .populate("createdBy", "name");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Check access for customer role
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== payment.customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own payments"
        });
      }
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get payment receipt
// @route   GET /api/payments/:paymentId/receipt
// @access  Private (Admin, Staff, Customer)
exports.getPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("customer")
      .populate("createdBy", "name");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Check access for customer role
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== payment.customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    // Generate receipt data
    const receipt = {
      receiptNumber: payment.receiptNumber,
      date: payment.receivedDate,
      customerName: payment.customer.name,
      customerPhone: payment.customer.phone,
      customerAddress: payment.customer.address,
      amount: payment.amount,
      amountInWords: numberToWords(payment.amount),
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      receivedBy: payment.createdBy?.name || "System"
    };

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error("Get payment receipt error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Void payment (Admin only)
// @route   PUT /api/payments/:paymentId/void
// @access  Private (Admin only)
exports.voidPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status === "refunded") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Payment is already voided"
      });
    }

    // Update payment status
    payment.status = "refunded";
    payment.notes = payment.notes 
      ? `${payment.notes} | Voided: ${reason || "No reason provided"}`
      : `Voided: ${reason || "No reason provided"}`;
    await payment.save({ session });

    // Create reversing ledger entry
    const lastBalance = await getLastBalance(payment.customer);
    const newBalance = lastBalance + payment.amount;

    await LedgerEntry.create([{
      customer: payment.customer,
      description: `Payment voided (${payment.receiptNumber}) - ${reason || ""}`,
      debit: payment.amount,
      balance: newBalance,
      reference: payment.receiptNumber,
      entryType: "adjustment",
      createdBy: req.user.id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Payment voided successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Void payment error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Helper function to convert number to words (simplified)
function numberToWords(num) {
  // This is a simplified version - consider using a library for production
  return `${num.toLocaleString()} Rupees`;
}