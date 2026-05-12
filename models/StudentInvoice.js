const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const StudentInvoiceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    academicYear: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    term: {
      type: String,
      enum: ["Fall", "Spring", "Summer", "Annual"],
      default: "Annual",
    },
    dueDate: { type: Date },
    items: { type: [InvoiceItemSchema], default: [] },
    currency: { type: String, default: "EGP" },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "cancelled"],
      default: "unpaid",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StudentInvoice", StudentInvoiceSchema);

