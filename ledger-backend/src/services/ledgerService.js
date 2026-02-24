const mongoose = require("mongoose");
const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");

class LedgerService {
  /**
   * Get current balance for a customer
   */
  async getCurrentBalance(customerId) {
    try {
      // Validate customerId
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        console.error(`Invalid customerId format: ${customerId}`);
        return 0;
      }

      // 🔴 FIX: Use 'new' keyword with ObjectId constructor
      const result = await LedgerEntry.aggregate([
        { 
          $match: { 
            customer: new mongoose.Types.ObjectId(customerId) 
          } 
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        { $project: { balance: 1, _id: 0 } }
      ]);
      
      const balance = result.length > 0 ? result[0].balance : 0;
      console.log(`💰 getCurrentBalance for ${customerId}: Rs. ${balance}`);
      return balance;
    } catch (error) {
      console.error(`❌ Error in getCurrentBalance for ${customerId}:`, error);
      return 0;
    }
  }

  /**
   * Get customer ledger with pagination
   */
  async getCustomerLedger(customerId, page = 1, limit = 50) {
    try {
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        throw new Error(`Invalid customerId format: ${customerId}`);
      }

      const skip = (page - 1) * limit;
      
      const [entries, total] = await Promise.all([
        LedgerEntry.find({ 
          customer: new mongoose.Types.ObjectId(customerId) 
        })
          .populate("createdBy", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LedgerEntry.countDocuments({ 
          customer: new mongoose.Types.ObjectId(customerId) 
        })
      ]);

      return {
        entries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error(`❌ Error in getCustomerLedger for ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Create ledger entry with transaction support
   */
  async createEntry(entryData, session = null) {
    try {
      const options = session ? { session } : {};
      
      const lastBalance = await this.getCurrentBalance(entryData.customer);
      const newBalance = lastBalance + (entryData.debit || 0) - (entryData.credit || 0);

      const entry = await LedgerEntry.create([{
        ...entryData,
        balance: newBalance
      }], options);

      return entry[0];
    } catch (error) {
      console.error("❌ Error in createEntry:", error);
      throw error;
    }
  }

  /**
   * Calculate due summary for a customer
   */
  async calculateDueSummary(customerId) {
    try {
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        throw new Error(`Invalid customerId format: ${customerId}`);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const entries = await LedgerEntry.find({
        customer: new mongoose.Types.ObjectId(customerId),
        debit: { $gt: 0 },
        isFinalized: true
      })
        .sort({ createdAt: 1 })
        .lean();

      if (entries.length === 0) {
        return {
          currentBalance: 0,
          totalDue: 0,
          overdueAmount: 0,
          dueToday: 0,
          dueThisWeek: 0,
          aging: { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }
        };
      }

      let runningBalance = 0;
      const unpaidDebits = [];

      for (const entry of entries) {
        runningBalance += (entry.debit || 0) - (entry.credit || 0);

        if (entry.debit > 0 && entry.dueDate) {
          unpaidDebits.push({
            amount: entry.debit,
            dueDate: new Date(entry.dueDate),
            remaining: entry.debit
          });
        }

        if (entry.credit > 0) {
          let creditLeft = entry.credit;
          for (const debit of unpaidDebits) {
            if (creditLeft <= 0) break;
            if (debit.remaining > 0) {
              const applied = Math.min(creditLeft, debit.remaining);
              debit.remaining -= applied;
              creditLeft -= applied;
            }
          }
        }
      }

      return this._calculateDueStats(unpaidDebits, runningBalance, today);
    } catch (error) {
      console.error(`❌ Error in calculateDueSummary for ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate due statistics from unpaid debits
   */
  _calculateDueStats(unpaidDebits, currentBalance, today) {
    let overdueAmount = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    for (const debit of unpaidDebits) {
      if (debit.remaining <= 0) continue;

      const daysPast = Math.floor((today - debit.dueDate) / (1000 * 60 * 60 * 24));

      if (debit.dueDate < today) {
        overdueAmount += debit.remaining;
        if (daysPast <= 30) aging["0-30"] += debit.remaining;
        else if (daysPast <= 60) aging["31-60"] += debit.remaining;
        else if (daysPast <= 90) aging["61-90"] += debit.remaining;
        else aging["90+"] += debit.remaining;
      } else {
        const dueDateStr = debit.dueDate.toDateString();
        const todayStr = today.toDateString();
        
        if (dueDateStr === todayStr) {
          dueToday += debit.remaining;
        } else if (debit.dueDate <= weekFromNow) {
          dueThisWeek += debit.remaining;
        }
      }
    }

    return {
      currentBalance,
      totalDue: Math.max(0, currentBalance),
      overdueAmount,
      dueToday,
      dueThisWeek,
      aging
    };
  }
}

module.exports = new LedgerService();