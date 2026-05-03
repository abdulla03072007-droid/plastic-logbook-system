const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    shopName: {
      type: String,
      required: true
    },

    phoneNumber: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },
    totalDue: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Customer",
  customerSchema
);