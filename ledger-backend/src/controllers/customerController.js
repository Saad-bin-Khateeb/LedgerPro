const Customer = require("../models/Customer");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Customer created successfully",
      customer
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL CUSTOMERS
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate("portalUser", "email isActive")
      .sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE CUSTOMER
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("portalUser", "email isActive");
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Customer updated successfully",
      customer
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE CUSTOMER
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // If customer has portal access, delete that user too
    if (customer.portalUser) {
      await User.findByIdAndDelete(customer.portalUser);
    }

    await customer.deleteOne();

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE PORTAL ACCESS
exports.createCustomerPortalAccess = async (req, res) => {
  try {
    const { customerId, email, password } = req.body;

    if (!customerId || !email || !password) {
      return res.status(400).json({ 
        message: "Customer ID, email, and password are required" 
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (customer.portalUser) {
      return res.status(400).json({ 
        message: "Portal access already exists for this customer" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
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

    res.status(201).json({
      message: "Portal access created successfully",
      user: {
        id: portalUser._id,
        email: portalUser.email,
        name: portalUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REVOKE PORTAL ACCESS
exports.revokeCustomerPortalAccess = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer || !customer.portalUser) {
      return res.status(404).json({ message: "No portal access found" });
    }

    await User.findByIdAndDelete(customer.portalUser);
    
    customer.portalUser = null;
    await customer.save();

    res.json({ message: "Portal access revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};