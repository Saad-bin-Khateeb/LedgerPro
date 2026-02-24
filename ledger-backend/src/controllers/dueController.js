const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

// Helper: days between two dates
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(date2 - date1) / oneDay);
}

// Calculate due summary for one customer
async function calculateCustomerDueSummary(customerId) {
  console.log(`[calculateDueSummary] START - customerId: ${customerId}`);

  try {
    // Validate customerId
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error(`Invalid customerId format: ${customerId}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all ledger entries for this customer
    const entries = await LedgerEntry.find({ 
      customer: new mongoose.Types.ObjectId(customerId) 
    })
      .sort({ createdAt: 1 })
      .lean();

    console.log(`[calculateDueSummary] Found ${entries.length} entries`);

    if (entries.length === 0) {
      return {
        currentBalance: 0,
        totalDue: 0,
        overdueAmount: 0,
        dueToday: 0,
        dueThisWeek: 0,
        aging: { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
      };
    }

    let runningBalance = 0;
    const unpaidDebits = [];

    // Process entries in order
    for (const entry of entries) {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);

      // Track unpaid debits with due dates
      if (entry.debit > 0 && entry.dueDate) {
        unpaidDebits.push({
          amount: entry.debit,
          dueDate: new Date(entry.dueDate),
          remaining: entry.debit,
        });
      }

      // Apply credits to oldest debits first
      if (entry.credit > 0) {
        let creditLeft = entry.credit;
        for (const debit of unpaidDebits) {
          if (creditLeft <= 0) break;
          if (debit.remaining > 0) {
            const applied = Math.min(creditLeft, debit.remaining);
            debit.remaining -= applied;
            creditLeft -= applied;
          }
        }
      }
    }

    let overdueAmount = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    // Calculate due amounts
    for (const debit of unpaidDebits) {
      if (debit.remaining <= 0) continue;

      const daysPast = daysBetween(debit.dueDate, today);

      if (debit.dueDate < today) {
        overdueAmount += debit.remaining;
        if (daysPast <= 30) aging["0-30"] += debit.remaining;
        else if (daysPast <= 60) aging["31-60"] += debit.remaining;
        else if (daysPast <= 90) aging["61-90"] += debit.remaining;
        else aging["90+"] += debit.remaining;
      } else {
        // Check if due today (compare dates without time)
        const dueDateStr = debit.dueDate.toDateString();
        const todayStr = today.toDateString();
        
        if (dueDateStr === todayStr) {
          dueToday += debit.remaining;
        } else if (debit.dueDate <= weekFromNow) {
          dueThisWeek += debit.remaining;
        }
      }
    }

    const totalDue = Math.max(0, runningBalance);

    console.log(`[calculateDueSummary] DONE - totalDue: ${totalDue}, overdue: ${overdueAmount}`);

    return {
      currentBalance: runningBalance,
      totalDue,
      overdueAmount,
      dueToday,
      dueThisWeek,
      aging,
      lastActivity: entries[entries.length - 1]?.createdAt,
    };
  } catch (error) {
    console.error(`[calculateDueSummary] ERROR for ${customerId}:`, error.message);
    console.error(error.stack);
    throw error;
  }
}

// Get list of customers with due
async function getDueCustomersList() {
  console.log("[getDueCustomersList] START");

  const customers = await Customer.find()
    .select("_id name phone")
    .lean();

  console.log(`[getDueCustomersList] Found ${customers.length} customers`);

  const result = [];

  for (const cust of customers) {
    if (!cust._id) {
      console.warn("[getDueCustomersList] Skipping customer without _id");
      continue;
    }

    try {
      const summary = await calculateCustomerDueSummary(cust._id.toString());
      if (summary.totalDue > 0) {
        result.push({
          _id: cust._id.toString(),
          name: cust.name || "Unknown",
          phone: cust.phone || "",
          ...summary,
        });
      }
    } catch (err) {
      console.warn(`[getDueCustomersList] Failed for ${cust._id}: ${err.message}`);
    }
  }

  result.sort((a, b) => b.overdueAmount - a.overdueAmount || b.totalDue - a.totalDue);

  console.log(`[getDueCustomersList] Returning ${result.length} customers with due`);

  return result;
}

// @desc    Get customer due summary
// @route   GET /api/due/:customerId
// @access  Private (Admin, Staff, Customer)
exports.getCustomerDueSummary = async (req, res, next) => {
  try {
    console.log(`[getCustomerDueSummary] Requested for: ${req.params.customerId}`);

    const { customerId } = req.params;

    // Validate customerId
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format"
      });
    }

    // If user is customer, verify they can only access their own due summary
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ portalUser: req.user.id });
      if (!customer || customer._id.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own due summary"
        });
      }
    }

    const data = await calculateCustomerDueSummary(customerId);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("[getCustomerDueSummary] ERROR:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to get customer due summary",
      error: error.message,
    });
  }
};

// @desc    Get all customers with due
// @route   GET /api/due
// @access  Private (Admin, Staff)
exports.getCustomersWithDue = async (req, res, next) => {
  try {
    const dueCustomers = await getDueCustomersList();
    res.status(200).json({
      success: true,
      customers: dueCustomers
    });
  } catch (error) {
    console.error("[getCustomersWithDue] ERROR:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers with due",
      error: error.message,
    });
  }
};

// @desc    Get global due totals
// @route   GET /api/due/totals
// @access  Private (Admin, Staff)
exports.getGlobalDueTotals = async (req, res, next) => {
  try {
    console.log("[getGlobalDueTotals] START");

    const dueCustomers = await getDueCustomersList();

    const totals = {
      totalDue: 0,
      overdueAmount: 0,
      dueToday: 0,
      dueThisWeek: 0,
      aging: { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
      customerCount: dueCustomers.length,
    };

    dueCustomers.forEach((c) => {
      totals.totalDue += Number(c.totalDue || 0);
      totals.overdueAmount += Number(c.overdueAmount || 0);
      totals.dueToday += Number(c.dueToday || 0);
      totals.dueThisWeek += Number(c.dueThisWeek || 0);
      if (c.aging) {
        Object.keys(totals.aging).forEach((k) => {
          totals.aging[k] += Number(c.aging[k] || 0);
        });
      }
    });

    console.log("[getGlobalDueTotals] SUCCESS - totals:", totals);

    res.status(200).json({
      success: true,
      data: totals
    });
  } catch (error) {
    console.error("[getGlobalDueTotals] ERROR:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to calculate global due totals",
      error: error.message,
    });
  }
};

module.exports.calculateCustomerDueSummary = calculateCustomerDueSummary;