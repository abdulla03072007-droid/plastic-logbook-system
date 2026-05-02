const Payment = require("../models/Payment");

// CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const { customerName, shopName, totalBill, paidAmount, paymentDate } = req.body;

    // Validate input
    if (!customerName || !shopName || !totalBill) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Calculate due and status
    const paid = Number(paidAmount) || 0;
    const total = Number(totalBill);
    const dueAmount = total - paid;
    
    let paymentStatus = "Pending";
    if (paid > 0 && paid < total) paymentStatus = "Partial";
    if (paid >= total) paymentStatus = "Paid";

    const newPayment = new Payment({
      adminId: req.admin.id,
      customerName,
      shopName,
      totalBill: total,
      paidAmount: paid,
      dueAmount,
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentStatus
    });

    await newPayment.save();

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment: newPayment
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET ALL PAYMENTS
exports.getAllPayments = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = { adminId: req.admin.id };
    
    if (search) {
      query.$and = [
        { adminId: req.admin.id },
        {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { shopName: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    if (status) {
      query.paymentStatus = status;
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET SINGLE PAYMENT
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({ _id: id, adminId: req.admin.id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// UPDATE PAYMENT
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalBill, paidAmount, paymentDate, paymentStatus } = req.body;

    let payment = await Payment.findOne({ _id: id, adminId: req.admin.id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Update fields
    if (totalBill !== undefined) payment.totalBill = Number(totalBill);
    if (paidAmount !== undefined) {
      payment.paidAmount = Number(paidAmount);
      payment.dueAmount = Math.max(0, (payment.totalBill || totalBill) - Number(paidAmount));

      // Auto-calculate status
      if (payment.paidAmount >= payment.totalBill) {
        payment.paymentStatus = "Paid";
      } else if (payment.paidAmount > 0) {
        payment.paymentStatus = "Partial";
      } else {
        payment.paymentStatus = "Pending";
      }
    }

    if (paymentDate) payment.paymentDate = paymentDate;
    if (paymentStatus) payment.paymentStatus = paymentStatus;

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE PAYMENT
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOneAndDelete({ _id: id, adminId: req.admin.id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
