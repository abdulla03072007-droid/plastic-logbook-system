const Customer = require("../models/Customer");

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    const { customerName, shopName, phoneNumber, address} = req.body;

    // Validate input
    if (!customerName || !shopName || !phoneNumber || !address) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const newCustomer = new Customer({
      adminId: req.admin.id,
      customerName,
      shopName,
      phoneNumber,
      address
    });

    await newCustomer.save();

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: newCustomer
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET ALL CUSTOMERS
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    let query = { adminId: req.admin.id };
    if (search) {
      query.$and = [
        { adminId: req.admin.id },
        {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { shopName: { $regex: search, $options: "i" } },
            { phoneNumber: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET SINGLE CUSTOMER
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({ _id: id, adminId: req.admin.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, shopName, phoneNumber, address } = req.body;

    let customer = await Customer.findOne({ _id: id, adminId: req.admin.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Update fields
    if (customerName) customer.customerName = customerName;
    if (shopName) customer.shopName = shopName;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (address) customer.address = address;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE CUSTOMER
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOneAndDelete({ _id: id, adminId: req.admin.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
