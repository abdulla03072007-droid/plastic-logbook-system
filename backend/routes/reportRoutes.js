const express = require("express");
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/daily-sales", reportController.getDailySalesReport);
router.get("/monthly-sales", reportController.getMonthlySalesReport);
router.get("/credit-pending", reportController.getCreditPendingReport);
router.get("/dashboard-stats", reportController.getDashboardStats);

module.exports = router;
