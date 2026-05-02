const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");

// GET DAILY SALES REPORT
exports.getDailySalesReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const payments = await Payment.find({
      adminId: req.admin.id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const totalSales = payments.reduce((sum, payment) => sum + Number(payment.totalBill || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
    const totalDue = payments.reduce((sum, payment) => sum + Number(payment.dueAmount || 0), 0);

    return res.status(200).json({
      success: true,
      report: {
        date: today.toISOString().split('T')[0],
        totalTransactions: payments.length,
        totalSales,
        totalPaid,
        totalDue,
        payments
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET MONTHLY SALES REPORT
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const payments = await Payment.find({
      adminId: req.admin.id,
      createdAt: {
        $gte: firstDay,
        $lte: lastDay
      }
    });

    const totalSales = payments.reduce((sum, payment) => sum + Number(payment.totalBill || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
    const totalDue = payments.reduce((sum, payment) => sum + Number(payment.dueAmount || 0), 0);

    return res.status(200).json({
      success: true,
      report: {
        month: today.toISOString().substring(0, 7),
        totalTransactions: payments.length,
        totalSales,
        totalPaid,
        totalDue,
        payments
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET CREDIT PENDING REPORT
exports.getCreditPendingReport = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({
      adminId: req.admin.id,
      paymentStatus: { $in: ["Pending", "Partial"] }
    }).sort({ createdAt: -1 });

    const totalCreditAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.dueAmount || 0), 0);

    return res.status(200).json({
      success: true,
      report: {
        totalPendingTransactions: pendingPayments.length,
        totalCreditAmount,
        payments: pendingPayments
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ adminId: req.admin.id });
    const totalCustomers = await Customer.countDocuments({ adminId: req.admin.id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSales = await Payment.find({
      adminId: req.admin.id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const totalSalesToday = todaysSales.reduce((sum, p) => sum + Number(p.totalBill || 0), 0);
    const totalPaidToday = todaysSales.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);

    const pendingPayments = await Payment.find({
      adminId: req.admin.id,
      paymentStatus: { $in: ["Pending", "Partial"] }
    });
    const totalCreditPending = pendingPayments.reduce((sum, p) => sum + Number(p.dueAmount || 0), 0);

    const allPurchases = await Purchase.find({ adminId: req.admin.id });
    const totalPurchaseSpent = allPurchases.reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);

    // Recent activity (last 5 payments, last 5 purchases)
    const recentPayments = await Payment.find({ adminId: req.admin.id }).sort({ createdAt: -1 }).limit(5);
    const recentPurchases = await Purchase.find({ adminId: req.admin.id }).sort({ createdAt: -1 }).limit(5);
    const lowStockProducts = await Product.find({ adminId: req.admin.id, stockAvailable: { $lte: 10 } }).limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        todaysSales: totalSalesToday,
        todaysPaid: totalPaidToday,
        creditPending: totalCreditPending,
        totalPurchaseSpent,
        recentPayments,
        recentPurchases,
        lowStockProducts
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
