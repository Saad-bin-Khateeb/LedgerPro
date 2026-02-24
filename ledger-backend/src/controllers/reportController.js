const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const moment = require("moment");

// @desc    Generate ledger statement PDF
// @route   GET /api/reports/ledger/:customerId
// @access  Private (Admin, Staff)
exports.generateLedgerStatement = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Build query
    const query = { customer: customerId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await LedgerEntry.find(query)
      .sort({ date: 1 })
      .lean();

    // Create PDF with proper settings
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: `Ledger Statement - ${customer.name}`,
        Author: 'LedgerPro',
        Subject: 'Customer Ledger Statement',
        Keywords: 'ledger, statement, customer',
        CreationDate: new Date()
      }
    });

    // Set response headers - CRITICAL for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ledger-${customer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${moment().format('YYYY-MM-DD')}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Pipe the PDF to response
    doc.pipe(res);

    // ========== HEADER SECTION ==========
    // Company Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1e3a8a')
       .text('LEDGER STATEMENT', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Customer Info Box
    doc.rect(50, doc.y, 500, 80)
       .fillAndStroke('#f3f4f6', '#d1d5db');
    
    doc.fillColor('#111827')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(customer.name, 70, doc.y - 70);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Phone: ${customer.phone || 'N/A'}`, 70, doc.y - 50)
       .text(`Email: ${customer.email || 'N/A'}`, 70, doc.y - 35);
    
    doc.moveDown(4);
    
    // Date Range Box
    doc.rect(350, doc.y - 65, 200, 50)
       .fillAndStroke('#e0f2fe', '#7dd3fc');
    
    doc.fillColor('#0369a1')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('PERIOD', 360, doc.y - 55);
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#0c4a6e')
       .text(
         `${startDate ? moment(startDate).format('DD MMM YYYY') : 'All Time'} - ${endDate ? moment(endDate).format('DD MMM YYYY') : 'Present'}`,
         360,
         doc.y - 40,
         { width: 180 }
       );
    
    doc.moveDown(2);
    
    // Generated Date
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor('#6b7280')
       .text(`Generated on: ${moment().format('DD MMM YYYY, hh:mm A')}`, { align: 'right' });
    
    doc.moveDown(2);

    // ========== TABLE HEADER ==========
    const tableTop = doc.y;
    
    // Table Header Background
    doc.rect(50, tableTop - 5, 500, 25)
       .fill('#2563eb');
    
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold');
    
    doc.text('Date', 60, tableTop);
    doc.text('Description', 150, tableTop);
    doc.text('Debit', 300, tableTop, { width: 80, align: 'right' });
    doc.text('Credit', 380, tableTop, { width: 80, align: 'right' });
    doc.text('Balance', 460, tableTop, { width: 80, align: 'right' });
    
    doc.moveDown();
    let y = doc.y;
    let rowCount = 0;
    let runningBalance = 0;

    // ========== TABLE ROWS ==========
    doc.fillColor('#111827')
       .font('Helvetica')
       .fontSize(9);

    for (const entry of entries) {
      rowCount++;
      runningBalance = entry.balance;
      
      // Alternate row colors
      if (rowCount % 2 === 0) {
        doc.rect(50, y - 12, 500, 20)
           .fill('#f9fafb');
        doc.fillColor('#111827');
      }

      // Date
      doc.text(moment(entry.date || entry.createdAt).format('DD/MM/YY'), 60, y - 8);
      
      // Description (truncate if too long)
      const description = entry.description.length > 35 
        ? entry.description.substring(0, 32) + '...' 
        : entry.description;
      doc.text(description, 150, y - 8, { width: 140 });
      
      // Debit
      if (entry.debit > 0) {
        doc.fillColor('#dc2626')
           .text(`Rs. ${entry.debit.toLocaleString()}`, 300, y - 8, { width: 80, align: 'right' })
           .fillColor('#111827');
      } else {
        doc.text('-', 300, y - 8, { width: 80, align: 'right' });
      }
      
      // Credit
      if (entry.credit > 0) {
        doc.fillColor('#059669')
           .text(`Rs. ${entry.credit.toLocaleString()}`, 380, y - 8, { width: 80, align: 'right' })
           .fillColor('#111827');
      } else {
        doc.text('-', 380, y - 8, { width: 80, align: 'right' });
      }
      
      // Balance
      if (entry.balance > 0) {
        doc.fillColor('#b45309')
           .text(`Rs. ${entry.balance.toLocaleString()}`, 460, y - 8, { width: 80, align: 'right' })
           .fillColor('#111827');
      } else {
        doc.fillColor('#059669')
           .text(`Rs. ${entry.balance.toLocaleString()}`, 460, y - 8, { width: 80, align: 'right' })
           .fillColor('#111827');
      }
      
      y += 20;
      
      // Add new page if needed
      if (y > 700 && entries.length - rowCount > 0) {
        doc.addPage();
        y = 50;
        
        // Repeat table header on new page
        doc.rect(50, y - 5, 500, 25)
           .fill('#2563eb');
        
        doc.fillColor('#ffffff')
           .fontSize(10)
           .font('Helvetica-Bold');
        
        doc.text('Date', 60, y);
        doc.text('Description', 150, y);
        doc.text('Debit', 300, y, { width: 80, align: 'right' });
        doc.text('Credit', 380, y, { width: 80, align: 'right' });
        doc.text('Balance', 460, y, { width: 80, align: 'right' });
        
        y += 25;
        doc.fillColor('#111827')
           .font('Helvetica')
           .fontSize(9);
      }
    }

    // ========== SUMMARY SECTION ==========
    doc.moveDown(2);
    
    // Summary Box
    doc.rect(350, y + 10, 200, 80)
       .fillAndStroke('#fef3c7', '#fcd34d');
    
    doc.fillColor('#92400e')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('SUMMARY', 360, y + 20);
    
    doc.fontSize(10)
       .font('Helvetica');
    
    // Total Debits
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    doc.fillColor('#1f2937')
       .text('Total Debits:', 360, y + 45);
    doc.fillColor('#dc2626')
       .text(`Rs. ${totalDebit.toLocaleString()}`, 480, y + 45, { align: 'right', width: 60 });
    
    // Total Credits
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    doc.fillColor('#1f2937')
       .text('Total Credits:', 360, y + 65);
    doc.fillColor('#059669')
       .text(`Rs. ${totalCredit.toLocaleString()}`, 480, y + 65, { align: 'right', width: 60 });
    
    // Closing Balance
    doc.fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('Closing Balance:', 360, y + 90);
    doc.fillColor(runningBalance > 0 ? '#b45309' : '#059669')
       .text(`Rs. ${runningBalance.toLocaleString()}`, 480, y + 90, { align: 'right', width: 60 });

    // ========== FOOTER ==========
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(
         'This is a computer generated statement and does not require a signature.',
         50,
         doc.page.height - 50,
         { align: 'center', width: 500 }
       );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("❌ Generate ledger statement error:", error);
    
    // Make sure to end the response if error occurs
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate PDF"
      });
    }
  }
};

// @desc    Generate aging report Excel
// @route   GET /api/reports/aging
// @access  Private (Admin, Staff)
exports.generateAgingReport = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "LedgerPro";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Aging Report");
    
    // Columns
    worksheet.columns = [
      { header: "Customer Name", key: "name", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Current Balance", key: "balance", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "0-30 Days", key: "age0_30", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "31-60 Days", key: "age31_60", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "61-90 Days", key: "age61_90", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "90+ Days", key: "age90", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "Total Overdue", key: "overdue", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Last Activity", key: "lastActivity", width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    const { calculateCustomerDueSummary } = require("./dueController");
    const customers = await Customer.find({ currentBalance: { $gt: 0 } }).lean();

    for (const customer of customers) {
      const summary = await calculateCustomerDueSummary(customer._id);
      
      worksheet.addRow({
        name: customer.name,
        phone: customer.phone,
        balance: customer.currentBalance || 0,
        age0_30: summary.aging["0-30"] || 0,
        age31_60: summary.aging["31-60"] || 0,
        age61_90: summary.aging["61-90"] || 0,
        age90: summary.aging["90+"] || 0,
        overdue: summary.overdueAmount || 0,
        lastActivity: customer.lastActivity ? moment(customer.lastActivity).format("DD-MMM-YYYY") : "-"
      });
    }

    // Add totals row
    const totalRow = worksheet.addRow({
      name: "TOTAL",
      balance: customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0),
      overdue: customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0)
    });
    totalRow.font = { bold: true };
    totalRow.getCell("name").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=aging-report-${moment().format("YYYY-MM-DD")}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Generate aging report error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate aging report"
    });
  }
};

// @desc    Generate payment report Excel
// @route   GET /api/reports/payments
// @access  Private (Admin, Staff)
exports.generatePaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const query = {
      status: "completed",
      receivedDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const payments = await Payment.find(query)
      .populate("customer", "name phone")
      .populate("createdBy", "name")
      .sort({ receivedDate: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payment Report");

    worksheet.columns = [
      { header: "Receipt #", key: "receiptNumber", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 30 },
      { header: "Amount", key: "amount", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Method", key: "method", width: 15 },
      { header: "Reference", key: "reference", width: 20 },
      { header: "Received By", key: "receivedBy", width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    let totalAmount = 0;

    payments.forEach(payment => {
      worksheet.addRow({
        receiptNumber: payment.receiptNumber || "-",
        date: moment(payment.receivedDate).format("DD-MMM-YYYY"),
        customer: payment.customer?.name || "Unknown",
        amount: payment.amount || 0,
        method: payment.method || "-",
        reference: payment.reference || "-",
        receivedBy: payment.createdBy?.name || "System"
      });
      totalAmount += payment.amount || 0;
    });

    // Add summary row
    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
      customer: "TOTAL",
      amount: totalAmount
    });
    summaryRow.font = { bold: true };
    summaryRow.getCell("customer").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payment-report-${moment(startDate).format("YYYY-MM-DD")}-to-${moment(endDate).format("YYYY-MM-DD")}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Generate payment report error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate payment report"
    });
  }
};

// @desc    Generate customer summary report Excel
// @route   GET /api/reports/customers
// @access  Private (Admin, Staff)
exports.generateCustomerReport = async (req, res, next) => {
  try {
    const customers = await Customer.find()
      .select("name phone email currentBalance totalPurchases totalPayments creditLimit lastActivity createdAt")
      .populate("createdBy", "name")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer Report");

    worksheet.columns = [
      { header: "Customer Name", key: "name", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Current Balance", key: "balance", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Total Purchases", key: "purchases", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Total Payments", key: "payments", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Credit Limit", key: "creditLimit", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "Available Credit", key: "availableCredit", width: 18, style: { numFmt: "#,##0.00" } },
      { header: "Last Activity", key: "lastActivity", width: 20 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Created By", key: "createdBy", width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    customers.forEach(customer => {
      worksheet.addRow({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "-",
        balance: customer.currentBalance || 0,
        purchases: customer.totalPurchases || 0,
        payments: customer.totalPayments || 0,
        creditLimit: customer.creditLimit || 0,
        availableCredit: (customer.creditLimit || 0) - Math.max(0, customer.currentBalance || 0),
        lastActivity: customer.lastActivity ? moment(customer.lastActivity).format("DD-MMM-YYYY") : "-",
        createdAt: moment(customer.createdAt).format("DD-MMM-YYYY"),
        createdBy: customer.createdBy?.name || "System"
      });
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      name: "TOTAL",
      balance: customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0),
      purchases: customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0),
      payments: customers.reduce((sum, c) => sum + (c.totalPayments || 0), 0),
      creditLimit: customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0)
    });
    totalRow.font = { bold: true };
    totalRow.getCell("name").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer-report-${moment().format("YYYY-MM-DD")}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Generate customer report error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate customer report"
    });
  }
};