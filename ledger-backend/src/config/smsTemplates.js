const Settings = require("../models/Settings");

/**
 * Get SMS template from database or return default
 */
const getTemplate = async (templateName, defaultValue) => {
  try {
    const setting = await Settings.findOne({ key: `sms_template_${templateName}` });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching template ${templateName}:`, error);
    return defaultValue;
  }
};

module.exports = {
  paymentReceived: async (customerName, amount, balance) => {
    const template = await getTemplate(
      "payment_received",
      "Dear {{customer_name}}, we have received your payment of Rs. {{amount}}. Your remaining balance is Rs. {{balance}}. Thank you."
    );
    
    return template
      .replace("{{customer_name}}", customerName)
      .replace("{{amount}}", amount.toLocaleString())
      .replace("{{balance}}", balance.toLocaleString());
  },

  dueReminder: async (customerName, dueAmount, dueDate) => {
    const template = await getTemplate(
      "due_reminder",
      "Reminder: Your payment of Rs. {{due_amount}} is due on {{due_date}}. Kindly pay on time."
    );
    
    return template
      .replace("{{customer_name}}", customerName)
      .replace("{{due_amount}}", dueAmount.toLocaleString())
      .replace("{{due_date}}", dueDate);
  },

  overdueNotice: async (customerName, dueAmount, dueDate) => {
    const template = await getTemplate(
      "overdue_notice",
      "Your payment of Rs. {{due_amount}} was due on {{due_date}}. Please clear it at the earliest."
    );
    
    return template
      .replace("{{customer_name}}", customerName)
      .replace("{{due_amount}}", dueAmount.toLocaleString())
      .replace("{{due_date}}", dueDate);
  },

  welcomeMessage: async (customerName, balance) => {
    const template = await getTemplate(
      "welcome",
      "Welcome {{customer_name}}! Your account has been created. Your current balance is Rs. {{balance}}."
    );
    
    return template
      .replace("{{customer_name}}", customerName)
      .replace("{{balance}}", balance.toLocaleString());
  }
};