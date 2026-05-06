const Payment = require("../models/Payment");
const Customer = require("../models/Customer");

// CREATE TRANSACTION (Bank Style Ledger)
exports.createPayment = async (req, res) => {
  try {
    const { customerId, customerName, shopName, totalBill, paidAmount, paymentDate } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({ success: false, message: "Missing info." });
    }

    // BANK LOGIC: Fetch current balance from the master customer record
    const customer = await Customer.findOne({ _id: customerId, adminId: req.admin.id });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    const prevBalance = customer.totalDue || 0;
    const bill = Number(totalBill) || 0;
    const paid = Number(paidAmount) || 0;
    
    // Calculate new running balance: (Old Balance + New Bill - New Payment)
    const newRunningBalance = prevBalance + bill - paid;

    const newTransaction = new Payment({
      adminId: req.admin.id,
      customerId, customerName, shopName,
      totalBill: bill,
      paidAmount: paid,
      dueAmount: newRunningBalance, // This is now the "Balance After Transaction"
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentStatus: paid >= (bill + prevBalance) && (bill + prevBalance) > 0 ? "Paid" : (paid > 0 ? "Partial" : "Pending")
    });

    await newTransaction.save();

    // ROBUST BALANCE RE-CALCULATION (Sum of everything)
    const allTxns = await Payment.find({ customerId, adminId: req.admin.id });
    const totalBills = allTxns.reduce((sum, t) => sum + (t.totalBill || 0), 0);
    const totalPaid = allTxns.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
    const absoluteBalance = totalBills - totalPaid;

    await Customer.findOneAndUpdate(
      { _id: customerId, adminId: req.admin.id },
      { totalDue: absoluteBalance }
    );

    return res.status(201).json({ success: true, message: "Transaction Logged!", payment: newTransaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL PAYMENTS
exports.getAllPayments = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { adminId: req.admin.id };
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } }
      ];
    }
    if (status) query.paymentStatus = status;
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PAYMENT
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalBill, paidAmount, paymentDate } = req.body;

    let payment = await Payment.findOne({ _id: id, adminId: req.admin.id });
    if (!payment) return res.status(404).json({ success: false, message: "Not found" });

    if (totalBill !== undefined) payment.totalBill = Number(totalBill);
    if (paidAmount !== undefined) payment.paidAmount = Number(paidAmount);
    if (paymentDate) payment.paymentDate = paymentDate;

    payment.dueAmount = payment.totalBill - payment.paidAmount;

    if (payment.paidAmount >= payment.totalBill && payment.totalBill > 0) payment.paymentStatus = "Paid";
    else if (payment.paidAmount > 0) payment.paymentStatus = "Partial";
    else payment.paymentStatus = "Pending";

    await payment.save();

    // ROBUST RE-CALCULATION
    const allTxns = await Payment.find({ customerId: payment.customerId, adminId: req.admin.id });
    const absoluteBalance = allTxns.reduce((sum, t) => sum + (t.totalBill || 0), 0) - allTxns.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
    await Customer.findOneAndUpdate({ _id: payment.customerId, adminId: req.admin.id }, { totalDue: absoluteBalance });

    return res.status(200).json({ success: true, message: "Updated!", payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE TRANSACTION
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, adminId: req.admin.id });
    if (!payment) return res.status(404).json({ success: false, message: "Not found" });

    const custId = payment.customerId;
    await Payment.findByIdAndDelete(id);

    // ROBUST RE-CALCULATION
    const allTxns = await Payment.find({ customerId: custId, adminId: req.admin.id });
    const absoluteBalance = allTxns.reduce((sum, t) => sum + (t.totalBill || 0), 0) - allTxns.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
    await Customer.findOneAndUpdate({ _id: custId, adminId: req.admin.id }, { totalDue: absoluteBalance });

    return res.status(200).json({ success: true, message: "Deleted!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
