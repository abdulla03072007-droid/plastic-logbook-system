const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();


// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});


// Frontend build is served instead of root test route


// Auth Routes

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/superadmin", superAdminRoutes);


// MongoDB Connection
// Serve static frontend build in production
const frontendBuildPath = path.resolve(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  }
});

const PORT = process.env.PORT || 10000;

// Start Server Immediately (Important for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});

// Connect to MongoDB in background
if (!process.env.MONGO_URI) {
  console.error("⚠️ WARNING: MONGO_URI is missing in Environment Variables!");
}

mongoose.connect(process.env.MONGO_URI || "", {
  serverSelectionTimeoutMS: 30000
})
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
});