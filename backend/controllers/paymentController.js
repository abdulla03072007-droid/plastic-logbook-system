const Payment = require("../models/Payment");
const Customer = require("../models/Customer");

// CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const { customerId, customerName, shopName, totalBill, paidAmount, paymentDate } = req.body;

    // Validate input
    if (!customerId || !customerName || !shopName || !totalBill) {
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
      customerId,
      customerName,
      shopName,
      totalBill: total,
      paidAmount: paid,
      dueAmount,
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentStatus
    });

    await newPayment.save();

    // SYNC CUSTOMER TOTAL DUE WITH LATEST PAYMENT
    const lastPayment = await Payment.findOne({ customerId, adminId: req.admin.id })
      .sort({ createdAt: -1 });

    await Customer.findOneAndUpdate(
      { _id: customerId, adminId: req.admin.id },
      { totalDue: lastPayment ? lastPayment.dueAmount : 0 }
    );

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

    // SYNC CUSTOMER TOTAL DUE WITH LATEST PAYMENT
    const lastPayment = await Payment.findOne({ customerId: payment.customerId, adminId: req.admin.id })
      .sort({ createdAt: -1 });

    await Customer.findOneAndUpdate(
      { _id: payment.customerId, adminId: req.admin.id },
      { totalDue: lastPayment ? lastPayment.dueAmount : 0 }
    );

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

    // UPDATE CUSTOMER TOTAL DUE (Optional: reset to a previous state? 
    // Usually, we just want to ensure the customer record reflects reality.
    // If we delete the latest payment, we might want to revert the totalDue.
    // But we don't have history easily. Let's at least try to sync if possible.)
    const customer = await Customer.findOne({ _id: payment.customerId, adminId: req.admin.id });
    if (customer) {
      // Subtract the due that was added by this payment
      // Wait, our logic is customer.totalDue = payment.dueAmount.
      // If we delete it, we should probably find the previous payment's due.
      const lastPayment = await Payment.findOne({ customerId: payment.customerId, adminId: req.admin.id })
        .sort({ createdAt: -1 });

      customer.totalDue = lastPayment ? lastPayment.dueAmount : 0;
      await customer.save();
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
