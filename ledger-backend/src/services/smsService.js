const twilio = require("twilio");
const SMSLog = require("../models/SMSLog");
const Settings = require("../models/Settings");
const Customer = require("../models/Customer");
const logger = require("../utils/logger");
const smsTemplates = require("../config/smsTemplates");

// Try to load Bull for queue, but don't fail if not available
let Queue;
try {
  Queue = require("bull");
} catch (error) {
  // Bull is optional, continue without queue
  if (process.env.NODE_ENV === "development") {
    console.log("ℹ️ Bull not installed - queue system disabled");
  }
}

class SMSService {
  constructor() {
    this.client = null;
    this.smsFrom = null;
    this.whatsappFrom = null;
    this.queue = null;
    this.initialized = false;
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    if (this.initialized) {
      return this;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
        this.smsFrom = process.env.TWILIO_SMS_FROM;
        this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
        
        logger.info("✅ Twilio client initialized successfully");
        
        // Initialize queue for async processing (optional)
        this._initQueue();
        
        this.initialized = true;
      } catch (error) {
        logger.error("❌ Failed to initialize Twilio client:", error.message);
      }
    } else {
      logger.warn("⚠️ SMS Service not initialized - missing Twilio credentials");
    }
    
    return this;
  }

  /**
   * Initialize Bull queue for SMS (optional)
   * @private
   */
  _initQueue() {
    if (!Queue) {
      return;
    }

    try {
      const redisHost = process.env.REDIS_HOST;
      if (!redisHost) {
        return;
      }

      this.queue = new Queue("sms-queue", {
        redis: {
          host: redisHost,
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 60000 // 1 minute
          },
          removeOnComplete: 1000,
          removeOnFail: 5000
        }
      });

      this.queue.process(async (job) => {
        const { to, message, customerId, type, via } = job.data;
        return this._sendSMSDirectly({ to, message, customerId, type, via });
      });

      this.queue.on("completed", (job) => {
        logger.debug(`SMS job ${job.id} completed`);
      });

      this.queue.on("failed", (job, err) => {
        logger.error(`SMS job ${job.id} failed:`, err.message);
      });

      logger.info("✅ SMS Queue initialized successfully");
    } catch (error) {
      logger.warn("⚠️ Failed to initialize SMS queue:", error.message);
    }
  }

  /**
   * Send SMS or WhatsApp message
   * @param {Object} options
   * @param {String} options.to - Phone number (E.164 format: +923001234567)
   * @param {String} options.message - Message text
   * @param {String} options.customerId - Customer ID for logging
   * @param {String} options.type - Message type: 'payment', 'due_reminder', 'overdue', 'welcome', 'manual'
   * @param {String} options.via - Channel: 'sms' or 'whatsapp' (default: 'sms')
   * @param {String} options.priority - Queue priority: 'high', 'normal', 'low' (default: 'normal')
   */
  async sendSMS({ to, message, customerId, type, via = "sms", priority = "normal" }) {
    // Initialize if needed
    if (!this.initialized) {
      this.initialize();
    }

    // Validate required fields
    if (!to) {
      throw new Error("Phone number is required");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    if (!type) {
      throw new Error("Message type is required");
    }

    // Validate phone number format
    if (!to.startsWith("+")) {
      throw new Error("Phone number must be in E.164 format (e.g., +923001234567)");
    }

    // Validate message length
    if (message.length > 1600) {
      throw new Error("Message cannot exceed 1600 characters");
    }

    // Create log entry
    const log = await SMSLog.create({
      customer: customerId,
      message,
      type,
      via,
      status: "pending",
      sentAt: new Date()
    });

    // If client is not initialized, log as failed
    if (!this.client) {
      log.status = "failed";
      log.errorMessage = "SMS service not configured - missing Twilio credentials";
      await log.save();
      
      logger.error(`❌ SMS failed: Service not configured`, {
        to,
        type,
        via,
        logId: log._id
      });
      
      return {
        success: false,
        error: "SMS service not configured",
        logId: log._id
      };
    }

    // Use queue if available and priority is normal/low
    if (this.queue && priority !== "high") {
      try {
        const job = await this.queue.add({
          to,
          message,
          customerId,
          type,
          via
        }, {
          priority: priority === "high" ? 1 : priority === "normal" ? 2 : 3
        });

        logger.info(`📤 SMS queued: Job ${job.id}`, { to, type, via });

        return {
          success: true,
          queued: true,
          jobId: job.id,
          logId: log._id
        };
      } catch (queueError) {
        logger.error("Failed to queue SMS, sending directly:", queueError.message);
        // Fall through to direct send
      }
    }

    // Send directly
    return this._sendSMSDirectly({ to, message, customerId, type, via, logId: log._id });
  }

  /**
   * Send SMS directly via Twilio (internal method)
   * @private
   */
  async _sendSMSDirectly({ to, message, customerId, type, via, logId }) {
    let log = logId ? await SMSLog.findById(logId) : null;

    try {
      // Check if SMS is enabled for customer
      if (customerId) {
        const customer = await Customer.findById(customerId);
        if (customer && !customer.smsEnabled) {
          throw new Error("SMS is disabled for this customer");
        }
        if (customer && !customer.phone) {
          throw new Error("Customer has no phone number");
        }
      }

      let from = this.smsFrom;
      let toNumber = to;

      if (via === "whatsapp") {
        if (!this.whatsappFrom) {
          throw new Error("WhatsApp sender number not configured");
        }
        from = this.whatsappFrom;
        toNumber = `whatsapp:${to}`;
      }

      logger.info(`📤 Sending ${via.toUpperCase()} to ${to}...`);

      // Send via Twilio
      const result = await this.client.messages.create({
        body: message,
        from: from,
        to: toNumber,
        statusCallback: process.env.NODE_ENV === "production" 
          ? `${process.env.BASE_URL || "https://your-api.com"}/api/sms/webhook`
          : undefined
      });

      // Update or create log
      if (log) {
        log.status = "sent";
        log.twilioSid = result.sid;
        log.twilioStatus = result.status;
        log.sentAt = new Date();
        await log.save();
      } else {
        log = await SMSLog.create({
          customer: customerId,
          message,
          type,
          via,
          status: "sent",
          twilioSid: result.sid,
          twilioStatus: result.status,
          sentAt: new Date()
        });
      }

      // Calculate cost (approximate)
      const segments = Math.ceil(message.length / 160);
      const costPerSegment = via === "whatsapp" ? 0.005 : 0.0075; // Approximate costs
      log.cost = segments * costPerSegment;
      log.segments = segments;
      await log.save();

      logger.info(`✅ ${via.toUpperCase()} sent successfully`, {
        sid: result.sid,
        status: result.status,
        segments,
        cost: log.cost,
        logId: log._id
      });

      return {
        success: true,
        sid: result.sid,
        status: result.status,
        logId: log._id,
        segments,
        cost: log.cost
      };

    } catch (error) {
      // Update or create log with error
      const errorMessage = error.message || "Unknown error";
      
      if (log) {
        log.status = "failed";
        log.errorMessage = errorMessage;
        await log.save();
      } else {
        log = await SMSLog.create({
          customer: customerId,
          message,
          type,
          via,
          status: "failed",
          errorMessage,
          sentAt: new Date()
        });
      }

      logger.error(`❌ ${via.toUpperCase()} failed:`, {
        error: errorMessage,
        to,
        type,
        logId: log._id
      });

      return {
        success: false,
        error: errorMessage,
        logId: log._id
      };
    }
  }

  /**
   * Send payment confirmation SMS
   * @param {Object} customer - Customer object
   * @param {Number} amount - Payment amount
   * @param {Number} balance - New balance after payment
   * @param {String} via - Channel: 'sms' or 'whatsapp'
   */
  async sendPaymentConfirmation(customer, amount, balance, via = "sms") {
    try {
      const message = await smsTemplates.paymentReceived(
        customer.name,
        amount,
        balance
      );

      return this.sendSMS({
        to: customer.phone,
        message,
        customerId: customer._id,
        type: "payment",
        via,
        priority: "high"
      });
    } catch (error) {
      logger.error("Error sending payment confirmation:", error);
      throw error;
    }
  }

  /**
   * Send due reminder SMS
   * @param {Object} customer - Customer object
   * @param {Number} dueAmount - Amount due
   * @param {String} dueDate - Due date string
   * @param {String} via - Channel: 'sms' or 'whatsapp'
   */
  async sendDueReminder(customer, dueAmount, dueDate, via = "sms") {
    try {
      const message = await smsTemplates.dueReminder(
        customer.name,
        dueAmount,
        dueDate
      );

      return this.sendSMS({
        to: customer.phone,
        message,
        customerId: customer._id,
        type: "due_reminder",
        via,
        priority: "normal"
      });
    } catch (error) {
      logger.error("Error sending due reminder:", error);
      throw error;
    }
  }

  /**
   * Send overdue notice SMS
   * @param {Object} customer - Customer object
   * @param {Number} dueAmount - Overdue amount
   * @param {String} dueDate - Original due date
   * @param {String} via - Channel: 'sms' or 'whatsapp'
   */
  async sendOverdueNotice(customer, dueAmount, dueDate, via = "sms") {
    try {
      const message = await smsTemplates.overdueNotice(
        customer.name,
        dueAmount,
        dueDate
      );

      return this.sendSMS({
        to: customer.phone,
        message,
        customerId: customer._id,
        type: "overdue",
        via,
        priority: "high"
      });
    } catch (error) {
      logger.error("Error sending overdue notice:", error);
      throw error;
    }
  }

  /**
   * Send welcome SMS
   * @param {Object} customer - Customer object
   * @param {Number} balance - Current balance
   * @param {String} via - Channel: 'sms' or 'whatsapp'
   */
  async sendWelcomeMessage(customer, balance = 0, via = "sms") {
    try {
      const message = await smsTemplates.welcomeMessage(
        customer.name,
        balance
      );

      return this.sendSMS({
        to: customer.phone,
        message,
        customerId: customer._id,
        type: "welcome",
        via,
        priority: "normal"
      });
    } catch (error) {
      logger.error("Error sending welcome message:", error);
      throw error;
    }
  }

  /**
   * Send custom manual SMS
   * @param {Object} customer - Customer object
   * @param {String} message - Custom message
   * @param {String} via - Channel: 'sms' or 'whatsapp'
   */
  async sendManualMessage(customer, message, via = "sms") {
    try {
      return this.sendSMS({
        to: customer.phone,
        message,
        customerId: customer._id,
        type: "manual",
        via,
        priority: "high"
      });
    } catch (error) {
      logger.error("Error sending manual message:", error);
      throw error;
    }
  }

  /**
   * Process due reminders for all eligible customers
   */
  async processDueReminders() {
    logger.info("Starting due reminders processing...");
    
    const startTime = Date.now();
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results = [];

    try {
      const schedule = await Settings.getReminderSchedule();
      const customers = await Customer.find({
        smsEnabled: true,
        phone: { $exists: true, $ne: "" }
      }).lean();

      logger.info(`Found ${customers.length} customers with SMS enabled`);

      const ledgerService = require("./ledgerService");

      for (const customer of customers) {
        try {
          const summary = await ledgerService.calculateDueSummary(customer._id);
          
          // Check for due today
          if (summary.dueToday > 0) {
            const dueDate = new Date().toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            
            const result = await this.sendDueReminder(
              customer,
              summary.dueToday,
              dueDate,
              "sms"
            );
            
            if (result.success) {
              sent++;
              results.push({ 
                customer: customer.name, 
                type: "due_today", 
                status: "sent",
                amount: summary.dueToday 
              });
            } else {
              failed++;
              results.push({ 
                customer: customer.name, 
                type: "due_today", 
                status: "failed", 
                error: result.error 
              });
            }
          }
          
          // Check for overdue
          if (summary.overdueAmount > 0) {
            const dueDate = new Date().toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            
            const result = await this.sendOverdueNotice(
              customer,
              summary.overdueAmount,
              dueDate,
              "sms"
            );
            
            if (result.success) {
              sent++;
              results.push({ 
                customer: customer.name, 
                type: "overdue", 
                status: "sent",
                amount: summary.overdueAmount 
              });
            } else {
              failed++;
              results.push({ 
                customer: customer.name, 
                type: "overdue", 
                status: "failed", 
                error: result.error 
              });
            }
          }
          
          // No reminders needed
          if (summary.dueToday === 0 && summary.overdueAmount === 0) {
            skipped++;
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          failed++;
          results.push({ 
            customer: customer.name, 
            status: "error", 
            error: err.message 
          });
          logger.error(`Failed to process reminders for ${customer.name}:`, err);
        }
      }

      const duration = Date.now() - startTime;
      
      logger.info("✅ Due reminders processing completed", {
        sent,
        failed,
        skipped,
        total: customers.length,
        duration: `${duration}ms`
      });

      return { 
        success: true,
        sent, 
        failed, 
        skipped, 
        total: customers.length, 
        results,
        duration
      };

    } catch (error) {
      logger.error("❌ Due reminders processing failed:", error);
      return {
        success: false,
        error: error.message,
        sent,
        failed,
        skipped,
        results
      };
    }
  }

  /**
   * Send bulk SMS to multiple customers
   * @param {Array} customers - Array of customer objects or IDs
   * @param {String} message - Message template
   * @param {String} type - Message type
   * @param {String} via - Channel
   */
  async sendBulkSMS(customers, message, type = "manual", via = "sms") {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const customerData = typeof customer === "string" 
          ? await Customer.findById(customer)
          : customer;

        if (!customerData || !customerData.phone || !customerData.smsEnabled) {
          failed++;
          results.push({
            customer: customerData?.name || "Unknown",
            status: "skipped",
            reason: "SMS disabled or no phone number"
          });
          continue;
        }

        const result = await this.sendManualMessage(customerData, message, via);
        
        if (result.success) {
          sent++;
          results.push({
            customer: customerData.name,
            status: "sent",
            logId: result.logId
          });
        } else {
          failed++;
          results.push({
            customer: customerData.name,
            status: "failed",
            error: result.error
          });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        failed++;
        results.push({
          customer: customer?.name || "Unknown",
          status: "error",
          error: error.message
        });
      }
    }

    return {
      success: true,
      sent,
      failed,
      total: customers.length,
      results
    };
  }

  /**
   * Handle Twilio webhook for status updates
   * @param {String} sid - Twilio message SID
   * @param {String} status - Delivery status
   */
  async handleStatusWebhook(sid, status) {
    try {
      const log = await SMSLog.findOneAndUpdate(
        { twilioSid: sid },
        {
          twilioStatus: status,
          ...(status === "delivered" && { 
            status: "delivered",
            deliveredAt: new Date() 
          }),
          ...(status === "sent" && { status: "sent" }),
          ...(status === "failed" && { status: "failed" }),
          ...(status === "undelivered" && { status: "failed" })
        },
        { new: true }
      );

      if (log) {
        logger.debug(`SMS status updated: ${sid} -> ${status}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error handling webhook:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SMS statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  async getSMSStats(startDate, endDate) {
    const query = {};
    
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    const stats = await SMSLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            type: "$type",
            status: "$status",
            via: "$via"
          },
          count: { $sum: 1 },
          totalCost: { $sum: "$cost" },
          totalSegments: { $sum: "$segments" }
        }
      },
      {
        $group: {
          _id: {
            type: "$_id.type",
            via: "$_id.via"
          },
          sent: {
            $sum: {
              $cond: [
                { $in: ["$_id.status", ["sent", "delivered"]] },
                "$count",
                0
              ]
            }
          },
          delivered: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "delivered"] }, "$count", 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "failed"] }, "$count", 0]
            }
          },
          totalCost: { $sum: "$totalCost" },
          totalSegments: { $sum: "$totalSegments" }
        }
      },
      {
        $sort: { "_id.type": 1, "_id.via": 1 }
      }
    ]);

    // Calculate totals
    const totals = {
      total: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0
    };

    stats.forEach(stat => {
      totals.total += stat.sent + stat.delivered + stat.failed;
      totals.totalSent += stat.sent;
      totals.totalDelivered += stat.delivered;
      totals.totalFailed += stat.failed;
      totals.totalCost += stat.totalCost || 0;
    });

    return {
      byType: stats,
      totals
    };
  }

  /**
   * Check SMS service health
   */
  async healthCheck() {
    const status = {
      initialized: this.initialized,
      twilioConfigured: !!this.client,
      queueConfigured: !!this.queue,
      timestamp: new Date().toISOString()
    };

    // Test Twilio connection if configured
    if (this.client) {
      try {
        // Just check if we can access the API
        await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        status.twilioStatus = "connected";
      } catch (error) {
        status.twilioStatus = "error";
        status.twilioError = error.message;
      }
    }

    // Test Redis connection if queue is configured
    if (this.queue) {
      try {
        const redis = await this.queue.client;
        status.redisStatus = redis.status === "ready" ? "connected" : "disconnected";
      } catch (error) {
        status.redisStatus = "error";
        status.redisError = error.message;
      }
    }

    return status;
  }
}

// Create and export singleton instance
const smsService = new SMSService();

// Initialize on creation
smsService.initialize();

module.exports = smsService;