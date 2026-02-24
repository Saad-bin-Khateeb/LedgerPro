const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");
const ledgerService = require("./ledgerService");
const smsService = require("./smsService");
const AuditLog = require("../models/AuditLog");

class PaymentService {
  /**
   * Record a payment with transaction
   */
  async recordPayment(paymentData, userId, session = null) {
    const { customer, amount, method, reference, notes, via = "sms" } = paymentData;
    
    const customerData = await Customer.findById(customer);
    if (!customerData) {
      throw new Error("Customer not found");
    }

    if (customerData.creditLimit > 0) {
      const currentBalance = await ledgerService.getCurrentBalance(customer);
      if (currentBalance - amount < -customerData.creditLimit) {
        throw new Error(`Payment would exceed credit limit of ${customerData.creditLimit}`);
      }
    }

    const options = session ? { session } : {};

    // Create payment record
    const payment = await Payment.create([{
      customer,
      amount,
      method,
      reference,
      notes,
      createdBy: userId
    }], options);

    // Create ledger entry
    const lastBalance = await ledgerService.getCurrentBalance(customer);
    const newBalance = lastBalance - amount;

    const ledgerEntry = await LedgerEntry.create([{
      customer,
      description: `Payment received (${method})${reference ? ` - Ref: ${reference}` : ""}`,
      credit: amount,
      balance: newBalance,
      reference,
      entryType: "payment",
      paymentMethod: method,
      createdBy: userId,
      dueDate: null
    }], options);

    // Send SMS if enabled
    let smsResult = null;
    if (customerData.smsEnabled && customerData.phone) {
      smsResult = await smsService.sendPaymentConfirmation(
        customerData,
        amount,
        newBalance,
        via
      );
    }

    // Audit log
    await AuditLog.create([{
      user: userId,
      action: "CREATE",
      entity: "Payment",
      entityId: payment[0]._id,
      changes: { amount, method, reference },
      metadata: { via, smsSent: !!smsResult?.success }
    }], options);

    return {
      payment: payment[0],
      ledgerEntry: ledgerEntry[0],
      smsStatus: smsResult
    };
  }

  /**
   * Get payments by customer with pagination
   */
  async getCustomerPayments(customerId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ customer: customerId })
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ customer: customerId })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Generate receipt for payment
   */
  generateReceipt(payment, customer) {
    const receipt = {
      receiptNumber: payment.receiptNumber,
      date: payment.receivedDate,
      customerName: customer.name,
      customerPhone: customer.phone,
      amount: payment.amount,
      amountInWords: this._numberToWords(payment.amount),
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      receivedBy: payment.createdBy?.name || "System"
    };

    return receipt;
  }

  /**
   * Convert number to words (for receipts)
   */
  _numberToWords(num) {
    // Simple implementation - you can use a library for production
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    
    if (num === 0) return "Zero";
    
    // This is a simplified version - use a proper library for production
    return `${num} Rupees`;
  }
}

module.exports = new PaymentService();