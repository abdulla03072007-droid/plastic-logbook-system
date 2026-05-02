const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// ADD PAYMENT
router.post("/add", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      shopName,
      totalBill,
      paidAmount,
      paymentDate
    } = req.body;

    if (
      !customerName ||
      !shopName ||
      !totalBill ||
      !paidAmount ||
      !paymentDate
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const dueAmount =
      Number(totalBill) - Number(paidAmount);

    const paymentStatus =
      dueAmount <= 0 ? "Paid" : "Pending";

    const newPayment = new Payment({
      customerId,
      customerName,
      shopName,
      totalBill,
      paidAmount,
      dueAmount,
      paymentDate,
      paymentStatus,
      adminId: req.admin.id
    });

    await newPayment.save();

    res.status(201).json({
      message: "Payment added successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// GET ALL PAYMENTS
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find({ adminId: req.admin.id }).sort({
      createdAt: -1
    });

    res.status(200).json(payments);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// UPDATE PAYMENT
router.put("/update/:id", async (req, res) => {
  try {
    const {
      totalBill,
      paidAmount,
      paymentDate
    } = req.body;

    const dueAmount =
      Number(totalBill) - Number(paidAmount);

    const paymentStatus =
      dueAmount <= 0 ? "Paid" : "Pending";

    const updatedPayment =
      await Payment.findOneAndUpdate(
        { _id: req.params.id, adminId: req.admin.id },
        {
          ...req.body,
          dueAmount,
          paymentStatus
        },
        { new: true }
      );

    res.status(200).json({
      message: "Payment updated successfully",
      updatedPayment
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// DELETE PAYMENT
router.delete("/delete/:id", async (req, res) => {
  try {
    await Payment.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin.id
    });

    res.status(200).json({
      message: "Payment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;