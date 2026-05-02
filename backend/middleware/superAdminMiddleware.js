const Admin = require("../models/Admin");

const superAdminMiddleware = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin privileges required."
      });
    }

    next();
  } catch (error) {
    console.error("Super Admin Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authorization"
    });
  }
};

module.exports = superAdminMiddleware;
