const cron = require("node-cron");
const smsService = require("../services/smsService");
const Settings = require("../models/Settings");
const Customer = require("../models/Customer");
const LedgerEntry = require("../models/LedgerEntry");
const Payment = require("../models/Payment");
const SMSLog = require("../models/SMSLog");
const User = require("../models/User");
const logger = require("./logger");
const fs = require("fs");
const path = require("path");

// Initialize all cron jobs
exports.initCronJobs = () => {
  logger.info("Initializing cron jobs...");

  // Send due reminders every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running daily due reminder cron job");
    try {
      const schedule = await Settings.getReminderSchedule();
      const reminderTime = schedule.reminder_time || "09:00";
      
      // Check if it's time to send reminders
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      if (currentTime === reminderTime) {
        const result = await smsService.processDueReminders();
        logger.info("Due reminders sent:", result);
      }
    } catch (error) {
      logger.error("Error in due reminder cron job:", error);
    }
  });

  // Send overdue reminders every Monday, Wednesday, Friday at 10:00 AM
  cron.schedule("0 10 * * 1,3,5", async () => {
    logger.info("Running overdue reminder cron job");
    try {
      const result = await smsService.processDueReminders();
      logger.info("Overdue reminders sent:", result);
    } catch (error) {
      logger.error("Error in overdue reminder cron job:", error);
    }
  });

  // Clean up old SMS logs every Sunday at 2:00 AM
  cron.schedule("0 2 * * 0", async () => {
    logger.info("Running SMS log cleanup cron job");
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days
      
      const result = await SMSLog.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ["sent", "delivered", "failed"] }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old SMS logs`);
    } catch (error) {
      logger.error("Error in SMS log cleanup cron job:", error);
    }
  });

  // Calculate and update customer statistics every day at 1:00 AM
  cron.schedule("0 1 * * *", async () => {
    logger.info("Running customer statistics cron job");
    try {
      const customers = await Customer.find({});
      
      for (const customer of customers) {
        const [balance, totalPurchases, totalPayments] = await Promise.all([
          LedgerEntry.aggregate([
            { $match: { customer: customer._id } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { balance: 1 } }
          ]),
          LedgerEntry.aggregate([
            { $match: { customer: customer._id, debit: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$debit" } } }
          ]),
          LedgerEntry.aggregate([
            { $match: { customer: customer._id, credit: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$credit" } } }
          ])
        ]);

        await Customer.findByIdAndUpdate(customer._id, {
          currentBalance: balance[0]?.balance || 0,
          totalPurchases: totalPurchases[0]?.total || 0,
          totalPayments: totalPayments[0]?.total || 0,
          lastActivity: new Date()
        });
      }
      
      logger.info(`Updated statistics for ${customers.length} customers`);
    } catch (error) {
      logger.error("Error in customer statistics cron job:", error);
    }
  });

  // Generate daily backup at 3:00 AM (only in production)
  if (process.env.NODE_ENV === "production") {
    cron.schedule("0 3 * * *", async () => {
      logger.info("Running daily backup cron job");
      try {
        const backupDir = path.join(__dirname, "../../backups");
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
        
        const [
          customers,
          users,
          ledgerEntries,
          payments,
          smsLogs,
          settings
        ] = await Promise.all([
          Customer.find({}).lean(),
          User.find({}).select("-password").lean(),
          LedgerEntry.find({}).lean(),
          Payment.find({}).lean(),
          SMSLog.find({}).lean(),
          Settings.find({}).lean()
        ]);

        const backup = {
          timestamp: new Date().toISOString(),
          version: "2.0.0",
          data: {
            customers,
            users,
            ledgerEntries,
            payments,
            smsLogs,
            settings
          }
        };

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        
        // Keep only last 30 backups
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith("backup-"))
          .map(f => ({ 
            name: f, 
            time: fs.statSync(path.join(backupDir, f)).mtime.getTime() 
          }))
          .sort((a, b) => b.time - a.time);

        if (files.length > 30) {
          files.slice(30).forEach(f => {
            fs.unlinkSync(path.join(backupDir, f.name));
          });
        }
        
        logger.info(`✅ Daily backup completed: ${backupFile}`);
      } catch (error) {
        logger.error("Error in daily backup cron job:", error);
      }
    });
  }

  logger.info("✅ All cron jobs initialized successfully");
};