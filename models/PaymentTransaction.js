const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentInvoice",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ["mock", "stripe", "paymob"],
      default: "mock",
    },
    gatewaySessionId: { type: String, index: true },
    gatewayReference: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EGP" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema);

