const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const moment = require("moment");

class ReportService {
  /**
   * Generate customer ledger statement PDF
   */
  async generateLedgerStatement(customerId, startDate, endDate) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const query = { customer: customerId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await LedgerEntry.find(query)
      .sort({ date: 1 })
      .populate("createdBy", "name")
      .lean();

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    
    // Header
    doc.fontSize(20).text("LEDGER STATEMENT", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(customer.name, { align: "center" });
    doc.fontSize(12).text(`Phone: ${customer.phone}`, { align: "center" });
    if (customer.email) {
      doc.fontSize(12).text(`Email: ${customer.email}`, { align: "center" });
    }
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${startDate ? moment(startDate).format("DD-MMM-YYYY") : "All"} to ${endDate ? moment(endDate).format("DD-MMM-YYYY") : "All"}`);
    doc.fontSize(12).text(`Generated: ${moment().format("DD-MMM-YYYY HH:mm")}`);
    doc.moveDown(2);

    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Date", 50, tableTop);
    doc.text("Description", 150, tableTop);
    doc.text("Debit", 300, tableTop, { width: 80, align: "right" });
    doc.text("Credit", 380, tableTop, { width: 80, align: "right" });
    doc.text("Balance", 460, tableTop, { width: 80, align: "right" });
    
    doc.moveDown();
    let y = doc.y;
    
    // Table rows
    doc.font("Helvetica").fontSize(9);
    let runningBalance = 0;
    
    entries.forEach((entry) => {
      runningBalance = entry.balance;
      
      doc.text(moment(entry.date).format("DD-MMM-YY"), 50, y);
      doc.text(entry.description.substring(0, 30), 150, y);
      doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : "-", 300, y, { width: 80, align: "right" });
      doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : "-", 380, y, { width: 80, align: "right" });
      doc.text(entry.balance.toLocaleString(), 460, y, { width: 80, align: "right" });
      
      y += 20;
      
      // Add new page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // Footer with totals
    doc.moveDown(2);
    doc.font("Helvetica-Bold");
    doc.text(`Closing Balance: ${runningBalance.toLocaleString()}`, { align: "right" });
    
    return doc;
  }

  /**
   * Generate aging report Excel
   */
  async generateAgingReport() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Ledger Management System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Aging Report");
    
    // Columns
    worksheet.columns = [
      { header: "Customer Name", key: "name", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Current Balance", key: "balance", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "0-30 Days", key: "age0_30", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "31-60 Days", key: "age31_60", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "61-90 Days", key: "age61_90", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "90+ Days", key: "age90", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "Total Overdue", key: "overdue", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "Last Activity", key: "lastActivity", width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    const ledgerService = require("./ledgerService");
    const customers = await Customer.find({ currentBalance: { $gt: 0 } }).lean();

    for (const customer of customers) {
      const summary = await ledgerService.calculateDueSummary(customer._id);
      
      worksheet.addRow({
        name: customer.name,
        phone: customer.phone,
        balance: customer.currentBalance,
        age0_30: summary.aging["0-30"],
        age31_60: summary.aging["31-60"],
        age61_90: summary.aging["61-90"],
        age90: summary.aging["90+"],
        overdue: summary.overdueAmount,
        lastActivity: customer.lastActivity ? moment(customer.lastActivity).format("DD-MMM-YYYY") : "-"
      });
    }

    return workbook;
  }

  /**
   * Generate payment summary report
   */
  async generatePaymentReport(startDate, endDate) {
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
      { header: "Amount", key: "amount", width: 15, style: { numFmt: "#,##0.00" } },
      { header: "Method", key: "method", width: 15 },
      { header: "Reference", key: "reference", width: 20 },
      { header: "Received By", key: "receivedBy", width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };

    let totalAmount = 0;

    payments.forEach(payment => {
      worksheet.addRow({
        receiptNumber: payment.receiptNumber || "-",
        date: moment(payment.receivedDate).format("DD-MMM-YYYY"),
        customer: payment.customer?.name || "Unknown",
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference || "-",
        receivedBy: payment.createdBy?.name || "System"
      });
      totalAmount += payment.amount;
    });

    // Add summary row
    worksheet.addRow({});
    worksheet.addRow({
      customer: "TOTAL",
      amount: totalAmount
    });
    worksheet.getRow(worksheet.rowCount).font = { bold: true };

    return workbook;
  }
}

module.exports = new ReportService();