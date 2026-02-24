// This file is now a wrapper around the SMS service for backward compatibility
const smsService = require("../services/smsService");

/**
 * Send SMS or WhatsApp message
 * @param {Object} options
 * @param {String} options.to - Phone number (E.164 format: +923001234567)
 * @param {String} options.message - Message text
 * @param {String} options.customerId - Customer ID for logging
 * @param {String} options.type - Message type: 'payment', 'due_reminder', 'overdue'
 * @param {String} options.via - Channel: 'sms' or 'whatsapp' (default: 'sms')
 */
const sendSMS = async (options) => {
  // Initialize service if needed
  smsService.initialize();
  
  // Use the service to send SMS
  return await smsService.sendSMS(options);
};

module.exports = sendSMS;