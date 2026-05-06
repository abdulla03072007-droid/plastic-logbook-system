const Customer = require("../models/Customer");
const Payment = require("../models/Payment");

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    const { customerName, shopName, phoneNumber, address} = req.body;

    if (!customerName || !shopName || !phoneNumber || !address) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const newCustomer = new Customer({
      adminId: req.admin.id,
      customerName, shopName, phoneNumber, address
    });

    await newCustomer.save();
    return res.status(201).json({ success: true, message: "Customer created!", customer: newCustomer });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL CUSTOMERS (With Auto-Balance Sync)
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { adminId: req.admin.id };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await Customer.find(query).sort({ customerName: 1 });
    
    // MASTER SYNC: Recalculate balances on the fly to fix existing data
    const syncedCustomers = await Promise.all(customers.map(async (c) => {
      // DEEP DIAGNOSTIC SEARCH: Find ANY payment matching this name in the whole system
      // We do this to rescue records that might be missing the adminId link
      const txns = await Payment.find({ 
        $or: [
          { customerId: c._id },
          { customerName: { $regex: new RegExp("^" + c.customerName.trim() + "$", "i") } }
        ]
        // Temporarily removed adminId filter to rescue "orphaned" records
      });

      // CLEAN & SUM
      const totalBills = txns.reduce((sum, t) => sum + (Math.max(0, t.totalBill || 0)), 0);
      const totalPaid = txns.reduce((sum, t) => sum + (Math.max(0, t.paidAmount || 0)), 0);
      const calculatedDue = totalBills - totalPaid;
      
      // AUTO-RESCUE: If we found them, link them to the current admin so they aren't lost again
      if (txns.length > 0) {
        await Payment.updateMany(
          { _id: { $in: txns.map(t => t._id) }, adminId: { $exists: false } },
          { adminId: req.admin.id }
        );
      }

      if (c.totalDue !== calculatedDue) {
        c.totalDue = calculatedDue;
        await c.save();
      }
      return c;
    }));

    return res.status(200).json({ success: true, customers: syncedCustomers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching customers" });
  }
};

// GET SINGLE CUSTOMER
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ _id: id, adminId: req.admin.id });
    if (!customer) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, shopName, phoneNumber, address } = req.body;
    let customer = await Customer.findOne({ _id: id, adminId: req.admin.id });
    if (!customer) return res.status(404).json({ success: false, message: "Not found" });

    if (customerName) customer.customerName = customerName;
    if (shopName) customer.shopName = shopName;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (address) customer.address = address;

    await customer.save();
    return res.status(200).json({ success: true, message: "Updated!", customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE CUSTOMER
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOneAndDelete({ _id: id, adminId: req.admin.id });
    if (!customer) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, message: "Deleted!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
