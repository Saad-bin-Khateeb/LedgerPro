const Customer = require("../models/Customer");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const ledgerService = require("./ledgerService");
const AuditLog = require("../models/AuditLog");

class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(customerData, userId) {
    const customer = await Customer.create({
      ...customerData,
      createdBy: userId
    });

    await AuditLog.create({
      user: userId,
      action: "CREATE",
      entity: "Customer",
      entityId: customer._id,
      changes: customerData
    });

    return customer;
  }

  /**
   * Get customers with pagination and filters
   */
  async getCustomers(filters = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const query = {};

    // Apply filters
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.hasDue) {
      query.currentBalance = { $gt: 0 };
    }

    if (filters.smsEnabled !== undefined) {
      query.smsEnabled = filters.smsEnabled === "true";
    }

    if (filters.hasPortal) {
      query.portalUser = { $ne: null };
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate("portalUser", "email isActive")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query)
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create portal access for customer
   */
  async createPortalAccess(customerId, email, password, userId) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.portalUser) {
      throw new Error("Portal access already exists");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const portalUser = await User.create({
      name: customer.name,
      email,
      password: hashedPassword,
      role: "customer",
      linkedCustomer: customer._id
    });

    customer.portalUser = portalUser._id;
    customer.email = email;
    await customer.save();

    await AuditLog.create({
      user: userId,
      action: "CREATE",
      entity: "PortalAccess",
      entityId: customer._id,
      changes: { email }
    });

    return portalUser;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const [
      totalCustomers,
      activeCustomers,
      customersWithDue,
      totalBalance,
      totalCreditLimit
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ isActive: true }),
      Customer.countDocuments({ currentBalance: { $gt: 0 } }),
      Customer.aggregate([
        { $group: { _id: null, total: { $sum: "$currentBalance" } } }
      ]),
      Customer.aggregate([
        { $group: { _id: null, total: { $sum: "$creditLimit" } } }
      ])
    ]);

    return {
      totalCustomers,
      activeCustomers,
      customersWithDue,
      totalBalance: totalBalance[0]?.total || 0,
      totalCreditLimit: totalCreditLimit[0]?.total || 0,
      averageBalance: totalCustomers > 0 ? (totalBalance[0]?.total || 0) / totalCustomers : 0
    };
  }
}

module.exports = new CustomerService();