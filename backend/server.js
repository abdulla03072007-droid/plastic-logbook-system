const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 10000;

// Start Server Immediately (Important for Render)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});

// Connect to MongoDB in background
if (!process.env.MONGO_URI) {
  console.error('⚠️ WARNING: MONGO_URI is missing in Environment Variables!');
}

mongoose.connect(process.env.MONGO_URI || '', {
  serverSelectionTimeoutMS: 30000
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
});