const SMSLog = require("../models/SMSLog");
const smsService = require("../services/smsService");
const Customer = require("../models/Customer");
const { validationResult } = require("express-validator");

// @desc    Get SMS logs
// @route   GET /api/sms
// @access  Private (Admin, Staff)
exports.getSMSLogs = async (req, res, next) => {
  try {
    const { customerId, type, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (customerId) filter.customer = customerId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      SMSLog.find(filter)
        .populate("customer", "name phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SMSLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get SMS logs by customer
// @route   GET /api/sms/customer/:customerId
// @access  Private (Admin, Staff)
exports.getSMSLogsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      SMSLog.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SMSLog.countDocuments({ customer: customerId })
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send manual SMS
// @route   POST /api/sms/send
// @access  Private (Admin, Staff)
exports.sendManualSMS = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { customerId, message, type, via = "sms" } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    if (!customer.smsEnabled) {
      return res.status(400).json({
        success: false,
        message: "SMS is disabled for this customer"
      });
    }

    if (!customer.phone) {
      return res.status(400).json({
        success: false,
        message: "Customer phone number not found"
      });
    }

    const result = await smsService.sendSMS({
      to: customer.phone,
      message,
      customerId: customer._id,
      type: type || "manual",
      via,
      priority: "high"
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: `${via.toUpperCase()} sent successfully`,
        data: {
          sid: result.sid,
          status: result.status,
          logId: result.logId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send ${via.toUpperCase()}`,
        error: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send due reminders
// @route   POST /api/sms/send-reminders
// @access  Private (Admin, Staff)
exports.sendDueReminders = async (req, res, next) => {
  try {
    const result = await smsService.processDueReminders();

    res.status(200).json({
      success: true,
      message: "Due reminders processed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Twilio webhook for status updates
// @route   POST /api/sms/webhook
// @access  Public
exports.smsWebhook = async (req, res, next) => {
  try {
    const { MessageSid, MessageStatus } = req.body;

    await smsService.handleStatusWebhook(MessageSid, MessageStatus);

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(200).send("OK"); // Always return 200 to Twilio
  }
};

// @desc    Get SMS statistics
// @route   GET /api/sms/stats
// @access  Private (Admin, Staff)
exports.getSMSStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

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
          totalCost: { $sum: "$cost" }
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
              $cond: [{ $eq: ["$_id.status", "sent"] }, "$count", 0]
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
          totalCost: { $sum: "$totalCost" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};