const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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

    totalBill: {
      type: Number,
      required: true
    },

    paidAmount: {
      type: Number,
      required: true
    },



    dueAmount: {
      type: Number,
      required: true
    },

    paymentDate: {
      type: String,
      required: true
    },

    paymentStatus: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);