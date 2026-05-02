const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// ADD CUSTOMER
router.post("/add", async (req, res) => {
  console.log("DEBUG: add customer body:", req.body);
  try {
    const {
      customerName,
      shopName,
      phoneNumber,
      address,
    } = req.body;

    console.log("DEBUG: variables:", { customerName, shopName, phoneNumber, address });

    if (!customerName || !shopName || !phoneNumber || !address) {
      const missing = [];
      if (!customerName) missing.push("customerName");
      if (!shopName) missing.push("shopName");
      if (!phoneNumber) missing.push("phoneNumber");
      if (!address) missing.push("address");
      return res.status(400).json({
        message: "Missing fields: " + missing.join(", ")
      });
    }

    const newCustomer = new Customer({
      customerName,
      shopName,
      phoneNumber,
      address,
      adminId: req.admin.id
    });

    await newCustomer.save();

    res.status(201).json({
      message: "Customer added successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// GET ALL CUSTOMERS
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find({ adminId: req.admin.id }).sort({
      createdAt: -1
    });

    res.status(200).json(customers);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
// UPDATE CUSTOMER
router.put("/update/:id", async (req, res) => {
  try {
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin.id },
      req.body,
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.status(200).json({
      message: "Customer updated successfully",
      updatedCustomer
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
// DELETE CUSTOMER
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedCustomer = await Customer.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin.id
    });

    if (!deletedCustomer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;