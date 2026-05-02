const express = require("express");
const router = express.Router();
const superAdminController = require("../controllers/superAdminController");
const authMiddleware = require("../middleware/authMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");

// Setup route (requires regular auth, checks internally if super admin already exists)
router.put("/setup", authMiddleware, superAdminController.setupSuperAdmin);

// Protected super admin routes
router.use(authMiddleware, superAdminMiddleware);
router.get("/tenants", superAdminController.getTenants);
router.delete("/tenants/:id", superAdminController.deleteTenant);

module.exports = router;
