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
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.use((req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  }
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000
})
.then(() => {
  console.log("MongoDB Connected");

  app.listen(process.env.PORT, () => {
    console.log(
      `Server running on port ${process.env.PORT}`
    );
  });
})
.catch((err) => {
  console.log("MongoDB Error:", err);
});