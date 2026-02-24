const User = require("../models/User");
const Customer = require("../models/Customer");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
        .populate("linkedCustomer", "name phone email currentBalance")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      users,
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

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, address, creditLimit, defaultDuePeriod } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Create user - WITHOUT array syntax to avoid confusion
    const user = new User({
      name,
      email,
      password,
      role
    });
    
    await user.save({ session });

    let customer = null;

    // If role is "customer", AUTO-CREATE customer record
    if (role === "customer") {
      // Validate required fields for customer
      if (!phone) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Phone number is required for customer accounts"
        });
      }

      // Check if phone already exists
      const existingCustomer = await Customer.findOne({ phone }).session(session);
      if (existingCustomer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Customer with this phone number already exists"
        });
      }

      // Create customer record
      const newCustomer = new Customer({
        name: name,
        email: email,
        phone: phone,
        address: address || "",
        creditLimit: parseFloat(creditLimit) || 0,
        defaultDuePeriod: parseInt(defaultDuePeriod) || 30,
        smsEnabled: true,
        portalUser: user._id,
        createdBy: req.user.id,
        currentBalance: 0,
        totalPurchases: 0,
        totalPayments: 0,
        isActive: true
      });
      
      await newCustomer.save({ session });

      // Update user with linked customer
      user.linkedCustomer = newCustomer._id;
      await user.save({ session });

      customer = newCustomer;
      
      console.log(`✅ Auto-created customer record for ${name} (${phone})`);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: role === "customer" 
        ? "Customer account created successfully with portal access" 
        : "User created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          linkedCustomer: customer ? customer._id : null
        },
        customer: customer || null
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create user error:", error);
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { name, email, role, password, isActive, phone, address, creditLimit, defaultDuePeriod } = req.body;

    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if email is taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (password) {
      user.password = password;
    }

    await user.save({ session });

    // If user is a customer, update their linked customer record
    if (user.role === "customer" && user.linkedCustomer) {
      const customer = await Customer.findById(user.linkedCustomer).session(session);
      if (customer) {
        if (name) customer.name = name;
        if (email) customer.email = email;
        if (phone) customer.phone = phone;
        if (address !== undefined) customer.address = address;
        if (creditLimit !== undefined) customer.creditLimit = parseFloat(creditLimit) || 0;
        if (defaultDuePeriod !== undefined) customer.defaultDuePeriod = parseInt(defaultDuePeriod) || 30;
        
        await customer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Update user error:", error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      });
    }

    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is linked to customer
    if (user.linkedCustomer) {
      const Customer = require("../models/Customer");
      const customer = await Customer.findById(user.linkedCustomer).session(session);
      if (customer) {
        // Delete the customer record as well
        await customer.deleteOne({ session });
      }
    }

    await user.deleteOne({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "User and associated customer record deleted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete user error:", error);
    next(error);
  }
};

// @desc    Toggle user status
// @route   PUT /api/users/:id/toggle-status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Prevent deactivating yourself
    if (id === req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account"
      });
    }

    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = !user.isActive;
    await user.save({ session });

    // If user is a customer, also toggle customer status
    if (user.role === "customer" && user.linkedCustomer) {
      const Customer = require("../models/Customer");
      const customer = await Customer.findById(user.linkedCustomer).session(session);
      if (customer) {
        customer.isActive = user.isActive;
        await customer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        isActive: user.isActive
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Toggle user status error:", error);
    next(error);
  }
};