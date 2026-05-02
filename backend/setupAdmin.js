const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("./models/Admin");

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create new admin
    const newAdmin = new Admin({
      username: "admin",
      password: "admin123",
      email: "admin@plasticlogbook.com"
    });

    await newAdmin.save();
    console.log("✓ Admin user created successfully");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

setupAdmin();
