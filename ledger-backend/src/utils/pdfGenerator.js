const PDFDocument = require("pdfkit");
const moment = require("moment");

/**
 * Generate PDF receipt
 * @param {Object} payment - Payment object
 * @param {Object} customer - Customer object
 * @returns {PDFDocument} PDF document
 */
const generateReceiptPDF = (payment, customer) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("PAYMENT RECEIPT", { align: "center" });
  doc.moveDown();
  
  // Receipt number
  doc.fontSize(14).font("Helvetica-Bold").text(`Receipt #: ${payment.receiptNumber}`, { align: "right" });
  doc.fontSize(10).font("Helvetica").text(`Date: ${moment(payment.receivedDate).format("DD-MMM-YYYY HH:mm")}`, { align: "right" });
  doc.moveDown(2);

  // Customer info
  doc.fontSize(12).font("Helvetica-Bold").text("Customer Information");
  doc.fontSize(10).font("Helvetica").text(`Name: ${customer.name}`);
  doc.fontSize(10).font("Helvetica").text(`Phone: ${customer.phone}`);
  if (customer.email) {
    doc.fontSize(10).font("Helvetica").text(`Email: ${customer.email}`);
  }
  doc.moveDown(2);

  // Payment details
  doc.fontSize(12).font("Helvetica-Bold").text("Payment Details");
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Description", 50, tableTop);
  doc.text("Amount", 400, tableTop, { width: 100, align: "right" });
  doc.moveDown();
  
  doc.font("Helvetica");
  doc.text(`Payment via ${payment.method.toUpperCase()}`, 50, doc.y);
  doc.text(`Rs. ${payment.amount.toLocaleString()}`, 400, doc.y - 12, { width: 100, align: "right" });
  
  if (payment.reference) {
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Reference: ${payment.reference}`, 50, doc.y);
  }

  if (payment.notes) {
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Notes: ${payment.notes}`, 50, doc.y);
  }

  doc.moveDown(2);

  // Total
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Total Amount:", 300, doc.y);
  doc.text(`Rs. ${payment.amount.toLocaleString()}`, 400, doc.y - 12, { width: 100, align: "right" });
  doc.moveDown(2);

  // Footer
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();
  
  doc.fontSize(10).font("Helvetica").text("This is a computer generated receipt.", 50, doc.y, { align: "center" });
  doc.fontSize(8).text(`Generated on: ${moment().format("DD-MMM-YYYY HH:mm:ss")}`, { align: "center" });

  return doc;
};

/**
 * Generate statement PDF
 * @param {Object} customer - Customer object
 * @param {Array} entries - Ledger entries
 * @param {Object} options - Options (startDate, endDate, etc.)
 * @returns {PDFDocument} PDF document
 */
const generateStatementPDF = (customer, entries, options = {}) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const { startDate, endDate } = options;

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("LEDGER STATEMENT", { align: "center" });
  doc.moveDown();
  doc.fontSize(16).text(customer.name, { align: "center" });
  doc.fontSize(10).text(`Phone: ${customer.phone}`, { align: "center" });
  if (customer.email) {
    doc.fontSize(10).text(`Email: ${customer.email}`, { align: "center" });
  }
  doc.moveDown();
  
  doc.fontSize(10).text(
    `Period: ${startDate ? moment(startDate).format("DD-MMM-YYYY") : "All"} to ${endDate ? moment(endDate).format("DD-MMM-YYYY") : "All"}`,
    { align: "center" }
  );
  doc.fontSize(8).text(`Generated: ${moment().format("DD-MMM-YYYY HH:mm:ss")}`, { align: "center" });
  doc.moveDown(2);

  // Table headers
  const tableTop = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Date", 50, tableTop);
  doc.text("Description", 120, tableTop);
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
    doc.text(entry.description.substring(0, 30), 120, y);
    doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : "-", 300, y, { width: 80, align: "right" });
    doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : "-", 380, y, { width: 80, align: "right" });
    doc.text(entry.balance.toLocaleString(), 460, y, { width: 80, align: "right" });
    
    y += 20;
    
    // Add new page if needed
    if (y > 700) {
      doc.addPage();
      y = 50;
      
      // Repeat headers on new page
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, y);
      doc.text("Description", 120, y);
      doc.text("Debit", 300, y, { width: 80, align: "right" });
      doc.text("Credit", 380, y, { width: 80, align: "right" });
      doc.text("Balance", 460, y, { width: 80, align: "right" });
      doc.font("Helvetica").fontSize(9);
      y += 20;
    }
  });

  // Summary
  doc.moveDown(2);
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text(`Closing Balance: Rs. ${runningBalance.toLocaleString()}`, 350, doc.y, { width: 200, align: "right" });
  
  return doc;
};

module.exports = {
  generateReceiptPDF,
  generateStatementPDF
};