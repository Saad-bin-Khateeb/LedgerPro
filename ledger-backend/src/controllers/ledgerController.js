const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const ledgerService = require("../services/ledgerService");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Add ledger entry
// @route   POST /api/ledger
// @access  Private (Admin, Staff)
exports.addLedgerEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { customer, description, debit = 0, credit = 0, reference, dueDate } = req.body;

    const customerData = await Customer.findById(customer).session(session);
    if (!customerData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Calculate due date for debit entries
    let entryDueDate = dueDate;
    if (debit > 0 && !dueDate) {
      entryDueDate = new Date();
      entryDueDate.setDate(entryDueDate.getDate() + (customerData.defaultDuePeriod || 30));
    }

    // Check credit limit
    if (debit > 0 && customerData.creditLimit > 0) {
      const currentBalance = await ledgerService.getCurrentBalance(customer);
      const newBalance = currentBalance + debit;
      
      if (newBalance > customerData.creditLimit) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `This transaction would exceed the customer's credit limit of Rs. ${customerData.creditLimit.toLocaleString()}`,
          data: {
            currentBalance,
            creditLimit: customerData.creditLimit,
            attemptedBalance: newBalance,
            excessAmount: newBalance - customerData.creditLimit
          }
        });
      }
    }

    const entry = await ledgerService.createEntry({
      customer,
      description,
      debit,
      credit,
      reference,
      dueDate: entryDueDate,
      entryType: debit > 0 ? "purchase" : credit > 0 ? "payment" : "adjustment",
      createdBy: req.user.id
    }, session);

    await session.commitTransaction();
    session.endSession();

    await entry.populate("customer", "name phone email creditLimit defaultDuePeriod");
    await entry.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Ledger entry added successfully",
      data: { 
        entry,
        dueDate: entryDueDate,
        reminder: debit > 0 ? `Payment due by ${new Date(entryDueDate).toLocaleDateString()}` : null
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Add ledger entry error:", error);
    next(error);
  }
};

// @desc    Get all ledger entries
// @route   GET /api/ledger
// @access  Private (Admin, Staff)
exports.getAllLedgerEntries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      LedgerEntry.find()
        .populate("customer", "name phone email")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LedgerEntry.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all ledger entries error:", error);
    next(error);
  }
};

// @desc    Get customer ledger
// @route   GET /api/ledger/:customerId
// @access  Private (Admin, Staff, Customer)
exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own ledger"
        });
      }
    }

    const result = await ledgerService.getCustomerLedger(customerId, page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Get customer ledger error:", error);
    next(error);
  }
};

// 🔴 FIX: Complete getCustomerBalance function
// @desc    Get customer balance
// @route   GET /api/ledger/:customerId/balance
// @access  Private (Admin, Staff, Customer)
exports.getCustomerBalance = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    console.log(`💰 Fetching balance for customer: ${customerId}`);

    // Validate customerId
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    // Verify access for customer role
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own balance"
        });
      }
    }

    // Get customer details
    const customer = await Customer.findById(customerId).select("name creditLimit defaultDuePeriod");
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Get current balance from ledger service
    const balance = await ledgerService.getCurrentBalance(customerId);
    
    console.log(`💰 Customer ${customer.name} balance: Rs. ${balance}`);

    res.status(200).json({
      success: true,
      data: {
        customerId: customer._id,
        customerName: customer.name,
        currentBalance: balance || 0,
        creditLimit: customer.creditLimit || 0,
        availableCredit: (customer.creditLimit || 0) - Math.max(0, balance || 0),
        defaultDuePeriod: customer.defaultDuePeriod || 30
      }
    });
  } catch (error) {
    console.error("❌ Get customer balance error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer balance"
    });
  }
};

// @desc    Get overdue entries
// @route   GET /api/ledger/overdue
// @access  Private (Admin, Staff)
exports.getOverdueEntries = async (req, res, next) => {
  try {
    const overdueEntries = await LedgerEntry.find({
      debit: { $gt: 0 },
      dueDate: { $lt: new Date() },
      isFinalized: true
    })
      .populate("customer", "name phone email")
      .populate("createdBy", "name")
      .sort({ dueDate: 1 })
      .lean();

    const groupedByCustomer = {};
    overdueEntries.forEach(entry => {
      const customerId = entry.customer._id.toString();
      if (!groupedByCustomer[customerId]) {
        groupedByCustomer[customerId] = {
          customer: entry.customer,
          totalOverdue: 0,
          entries: []
        };
      }
      groupedByCustomer[customerId].totalOverdue += entry.debit;
      groupedByCustomer[customerId].entries.push(entry);
    });

    res.status(200).json({
      success: true,
      totalOverdueEntries: overdueEntries.length,
      totalOverdueAmount: overdueEntries.reduce((sum, e) => sum + e.debit, 0),
      customers: Object.values(groupedByCustomer)
    });
  } catch (error) {
    console.error("Get overdue entries error:", error);
    next(error);
  }
};