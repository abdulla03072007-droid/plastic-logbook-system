const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");

// GET ALL TENANTS (Admins)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Admin.find().select("-password").sort({ createdAt: -1 });

    // Enhance with basic stats
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const customerCount = await Customer.countDocuments({ adminId: tenant._id });
        const productCount = await Product.countDocuments({ adminId: tenant._id });
        const purchaseCount = await Purchase.countDocuments({ adminId: tenant._id });

        return {
          ...tenant.toObject(),
          stats: {
            customers: customerCount,
            products: productCount,
            purchases: purchaseCount
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      tenants: tenantsWithStats
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// INITIAL SETUP: Make current user super admin IF NONE EXISTS
exports.setupSuperAdmin = async (req, res) => {
  try {
    const superAdminCount = await Admin.countDocuments({ isSuperAdmin: true });
    
    if (superAdminCount > 0) {
      return res.status(403).json({
        success: false,
        message: "A Super Admin already exists. Setup is locked."
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { isSuperAdmin: true },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "You are now the Super Admin.",
      admin
    });
  } catch (error) {
    console.error("Error setting up super admin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE TENANT
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own Super Admin account."
      });
    }

    const tenant = await Admin.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Delete associated data
    await Customer.deleteMany({ adminId: id });
    await Product.deleteMany({ adminId: id });
    await Purchase.deleteMany({ adminId: id });

    await Admin.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Tenant and all associated data removed successfully."
    });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
