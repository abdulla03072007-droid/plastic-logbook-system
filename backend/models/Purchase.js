const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    purchaseDate: {
      type: String,
      required: true
    },
    items: [
      {
        productName: {
          type: String,
          required: true,
          trim: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        itemTotal: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
