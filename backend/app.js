/**
 * app.js - Express app without server.listen()
 * This is used by tests so they can pass the app to supertest
 * without binding to a real port.
 */
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/superadmin', superAdminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
