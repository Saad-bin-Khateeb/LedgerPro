const Customer = require("../models/Customer");
const LedgerEntry = require("../models/LedgerEntry");
const Payment = require("../models/Payment");
const { calculateCustomerDueSummary } = require("./dueController");

// @desc    Get My Profile
// @route   GET /api/portal/profile
// @access  Private (Customer only)
exports.getMyProfile = async (req, res, next) => {
  try {
    console.log("[PORTAL] =========================================");
    console.log("[PORTAL] getMyProfile called");
    console.log("[PORTAL] User ID from token:", req.user.id);
    console.log("[PORTAL] User email:", req.user.email);
    console.log("[PORTAL] User role:", req.user.role);
    
    // 🔴 FIX: Find customer linked to this portal user
    const customer = await Customer.findOne({ portalUser: req.user.id })
      .select("-createdBy") // Exclude createdBy field
      .lean();

    console.log("[PORTAL] Customer found in DB:", customer ? "Yes" : "No");
    
    if (!customer) {
      console.log("[PORTAL] ERROR: No customer linked to this portal user");
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
        hint: "This user account is not linked to any customer record. Please contact administrator.",
        userId: req.user.id,
        userEmail: req.user.email
      });
    }

    // Get current balance
    const LedgerEntry = require("../models/LedgerEntry");
    const lastEntry = await LedgerEntry.findOne({ customer: customer._id })
      .sort({ createdAt: -1 })
      .lean();
    
    customer.currentBalance = lastEntry ? lastEntry.balance : 0;

    console.log("[PORTAL] Customer details:");
    console.log("[PORTAL]   Name:", customer.name);
    console.log("[PORTAL]   Email:", customer.email);
    console.log("[PORTAL]   Phone:", customer.phone);
    console.log("[PORTAL]   Balance:", customer.currentBalance);
    console.log("[PORTAL] =========================================");
    
    res.status(200).json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    console.error("[PORTAL] ERROR in getMyProfile:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update My Profile
// @route   PUT /api/portal/profile
// @access  Private (Customer only)
exports.updateMyProfile = async (req, res, next) => {
  try {
    console.log("[PORTAL] updateMyProfile called");
    console.log("[PORTAL] Update data:", req.body);
    
    const { phone, address } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const customer = await Customer.findOneAndUpdate(
      { portalUser: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).select("-createdBy");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { customer }
    });
  } catch (error) {
    console.error("[PORTAL] ERROR in updateMyProfile:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get My Ledger
// @route   GET /api/portal/ledger
// @access  Private (Customer only)
exports.getMyLedger = async (req, res, next) => {
  try {
    console.log("[PORTAL] getMyLedger called");
    
    const customer = await Customer.findOne({ portalUser: req.user.id });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      LedgerEntry.find({ customer: customer._id })
        .select("-createdBy -customer")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LedgerEntry.countDocuments({ customer: customer._id })
    ]);

    console.log(`[PORTAL] Found ${entries.length} ledger entries`);
    
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
    console.error("[PORTAL] ERROR in getMyLedger:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get My Payments
// @route   GET /api/portal/payments
// @access  Private (Customer only)
exports.getMyPayments = async (req, res, next) => {
  try {
    console.log("[PORTAL] getMyPayments called");
    
    const customer = await Customer.findOne({ portalUser: req.user.id });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ customer: customer._id })
        .select("-createdBy -customer")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ customer: customer._id })
    ]);

    console.log(`[PORTAL] Found ${payments.length} payments`);
    
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
    console.error("[PORTAL] ERROR in getMyPayments:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get My Due Summary
// @route   GET /api/portal/due-summary
// @access  Private (Customer only)
// @desc    Get My Due Summary
// @route   GET /api/portal/due-summary
// @access  Private (Customer only)
exports.getMyDueSummary = async (req, res, next) => {
  try {
    console.log("[PORTAL] getMyDueSummary called");
    
    const customer = await Customer.findOne({ portalUser: req.user.id });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // ✅ FIX: calculateCustomerDueSummary is already imported at the top
    const summary = await calculateCustomerDueSummary(customer._id.toString());
    
    console.log("[PORTAL] Due summary calculated:", summary);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("[PORTAL] ERROR in getMyDueSummary:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Download My Statement
// @route   GET /api/portal/statement
// @access  Private (Customer only)
exports.downloadMyStatement = async (req, res, next) => {
  try {
    console.log("[PORTAL] downloadMyStatement called");
    
    const customer = await Customer.findOne({ portalUser: req.user.id });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const { startDate, endDate } = req.query;
    
    // Build query
    const query = { customer: customer._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await LedgerEntry.find(query)
      .sort({ date: 1 })
      .lean();

    // Dynamically require PDFKit only when needed
    let PDFDocument;
    let moment;
    try {
      PDFDocument = require("pdfkit");
      moment = require("moment");
    } catch (err) {
      console.error("[PORTAL] PDF dependencies not installed:", err.message);
      return res.status(500).json({
        success: false,
        message: "PDF generation is not configured. Please contact administrator.",
        error: "Missing dependencies: pdfkit or moment"
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ledger-${customer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`
    );
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('LEDGER STATEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(customer.name, { align: 'center' });
    doc.fontSize(10).text(`Phone: ${customer.phone}`, { align: 'center' });
    if (customer.email) {
      doc.fontSize(10).text(`Email: ${customer.email}`, { align: 'center' });
    }
    doc.moveDown();
    doc.fontSize(10).text(
      `Period: ${startDate ? moment(startDate).format('DD-MMM-YYYY') : 'All'} to ${endDate ? moment(endDate).format('DD-MMM-YYYY') : 'All'}`,
      { align: 'center' }
    );
    doc.fontSize(8).text(`Generated: ${moment().format('DD-MMM-YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 50, tableTop);
    doc.text('Description', 150, tableTop);
    doc.text('Debit', 300, tableTop, { width: 80, align: 'right' });
    doc.text('Credit', 380, tableTop, { width: 80, align: 'right' });
    doc.text('Balance', 460, tableTop, { width: 80, align: 'right' });
    
    doc.moveDown();
    let y = doc.y;
    let runningBalance = 0;
    
    // Table rows
    doc.font('Helvetica').fontSize(9);
    
    entries.forEach((entry) => {
      runningBalance = entry.balance;
      
      doc.text(moment(entry.date || entry.createdAt).format('DD-MMM-YY'), 50, y);
      doc.text(entry.description.substring(0, 30), 150, y);
      doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : '-', 300, y, { width: 80, align: 'right' });
      doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : '-', 380, y, { width: 80, align: 'right' });
      doc.text(entry.balance.toLocaleString(), 460, y, { width: 80, align: 'right' });
      
      y += 20;
      
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // Footer
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    doc.text(`Closing Balance: Rs. ${runningBalance.toLocaleString()}`, { align: 'right' });
    
    doc.end();
    
    console.log("[PORTAL] Statement generated successfully");
    
  } catch (error) {
    console.error("[PORTAL] ERROR in downloadMyStatement:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate statement"
      });
    }
  }
};