const PDFDocument = require("pdfkit");
const StudentInvoice = require("../models/StudentInvoice");
const PaymentTransaction = require("../models/PaymentTransaction");
const Student = require("../models/Student");
const Stripe = require("stripe");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function refreshInvoiceStatus(invoice) {
  if (invoice.paidAmount <= 0) invoice.status = "unpaid";
  else if (invoice.paidAmount < invoice.totalAmount) invoice.status = "partially_paid";
  else invoice.status = "paid";
}

exports.studentSummary = async (req, res) => {
  try {
    const invoices = await StudentInvoice.find({ student: req.user.id }).sort({ createdAt: -1 });

    const total = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const paid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const remaining = Math.max(total - paid, 0);

    return res.json({
      success: true,
      message: "Payment summary fetched successfully",
      data: {
        total,
        paid,
        remaining,
        invoicesCount: invoices.length,
      },
    });
  } catch (err) {
    console.error("studentSummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.studentInvoices = async (req, res) => {
  try {
    const invoices = await StudentInvoice.find({ student: req.user.id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (err) {
    console.error("studentInvoices error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.studentInvoiceDetails = async (req, res) => {
  try {
    const invoice = await StudentInvoice.findOne({
      _id: req.params.invoiceId,
      student: req.user.id,
    });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const transactions = await PaymentTransaction.find({ invoice: invoice._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      message: "Invoice details fetched successfully",
      data: { invoice, transactions },
    });
  } catch (err) {
    console.error("studentInvoiceDetails error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkoutSession = async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, message: "invoiceId is required" });
    }

    const invoice = await StudentInvoice.findOne({ _id: invoiceId, student: req.user.id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const remaining = Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0);
    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: "Invoice already paid" });
    }

    const paymentAmount = amount ? Number(amount) : remaining;
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    if (paymentAmount > remaining) {
      return res.status(400).json({ success: false, message: "Amount exceeds remaining balance" });
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: "Stripe is not configured. Please set STRIPE_SECRET_KEY.",
      });
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (invoice.currency || "EGP").toLowerCase(),
            product_data: {
              name: `University Fees - Invoice ${invoice._id}`,
            },
            unit_amount: Math.round(paymentAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendBaseUrl}/dashboard/fees?session_id={CHECKOUT_SESSION_ID}&invoiceId=${invoice._id}`,
      cancel_url: `${frontendBaseUrl}/dashboard/fees?payment=cancelled&invoiceId=${invoice._id}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        studentId: req.user.id.toString(),
      },
    });

    const gatewaySessionId = stripeSession.id;
    const tx = await PaymentTransaction.create({
      invoice: invoice._id,
      student: req.user.id,
      amount: paymentAmount,
      status: "pending",
      gateway: "stripe",
      gatewaySessionId,
    });

    return res.json({
      success: true,
      message: "Checkout session created",
      data: {
        transactionId: tx._id,
        gatewaySessionId,
        checkoutUrl: stripeSession.url,
      },
    });
  } catch (err) {
    console.error("checkoutSession error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.confirmSession = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: "Stripe is not configured. Please set STRIPE_SECRET_KEY.",
      });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (!stripeSession) {
      return res.status(404).json({ success: false, message: "Stripe session not found" });
    }

    const tx = await PaymentTransaction.findOne({ gatewaySessionId: sessionId });
    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (tx.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (stripeSession.payment_status === "paid" && tx.status !== "succeeded") {
      tx.status = "succeeded";
      tx.gatewayReference = stripeSession.payment_intent || tx.gatewayReference;
      tx.paidAt = new Date();
      await tx.save();

      const invoice = await StudentInvoice.findById(tx.invoice);
      if (invoice) {
        invoice.paidAmount = Number(invoice.paidAmount || 0) + Number(tx.amount || 0);
        refreshInvoiceStatus(invoice);
        await invoice.save();
      }
    }

    return res.json({
      success: true,
      message: "Session confirmed",
      data: {
        paymentStatus: stripeSession.payment_status,
        transactionStatus: tx.status,
      },
    });
  } catch (err) {
    console.error("confirmSession error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    const { sessionId, status, gatewayReference } = req.body;
    if (!sessionId || !status) {
      return res.status(400).json({ success: false, message: "sessionId and status are required" });
    }

    const tx = await PaymentTransaction.findOne({ gatewaySessionId: sessionId });
    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (status === "succeeded") {
      tx.status = "succeeded";
      tx.gatewayReference = gatewayReference || tx.gatewayReference;
      tx.paidAt = new Date();
      await tx.save();

      const invoice = await StudentInvoice.findById(tx.invoice);
      if (invoice) {
        invoice.paidAmount = Number(invoice.paidAmount || 0) + Number(tx.amount || 0);
        refreshInvoiceStatus(invoice);
        await invoice.save();
      }
    } else {
      tx.status = "failed";
      tx.gatewayReference = gatewayReference || tx.gatewayReference;
      await tx.save();
    }

    return res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("payment webhook error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await StudentInvoice.findOne({
      _id: req.params.invoiceId,
      student: req.user.id,
    }).populate("student", "full_name student_id email");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice._id}.pdf`,
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text("University Payment Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${invoice._id}`);
    doc.text(`Student: ${invoice.student?.full_name || "N/A"}`);
    doc.text(`Student ID: ${invoice.student?.student_id || "N/A"}`);
    doc.text(`Email: ${invoice.student?.email || "N/A"}`);
    doc.text(`Academic Year: ${invoice.academicYear}`);
    doc.text(`Term: ${invoice.term}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Total: ${invoice.totalAmount} ${invoice.currency}`);
    doc.text(`Paid: ${invoice.paidAmount} ${invoice.currency}`);
    doc.text(
      `Remaining: ${Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0)} ${invoice.currency}`,
    );
    doc.moveDown();

    doc.fontSize(14).text("Items");
    doc.moveDown(0.5);
    (invoice.items || []).forEach((item, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${item.title} - ${item.amount} ${invoice.currency}`);
    });

    doc.end();
  } catch (err) {
    console.error("downloadInvoicePdf error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminAssignFee = async (req, res) => {
  try {
    const { academicYear, term, dueDate, items } = req.body;
    if (!academicYear || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        message: "academicYear and items are required",
      });
    }
    const year = Number(academicYear);
    if (![1, 2, 3, 4, 5].includes(year)) {
      return res
        .status(400)
        .json({ success: false, message: "academicYear must be between 1 and 5" });
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Total amount must be greater than zero" });
    }

    const students = await Student.find({
      year,
      enrollment_status: "Active",
      isDeleted: { $ne: true },
    }).select("_id");

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: `No active students found in year ${year}`,
      });
    }

    const studentIds = students.map((s) => s._id.toString());
    const selectedTerm = term || "Annual";

    const existing = await StudentInvoice.find({
      student: { $in: studentIds },
      academicYear: year,
      term: selectedTerm,
      status: { $in: ["unpaid", "partially_paid"] },
    }).select("student");

    const existingStudentIds = new Set(existing.map((inv) => inv.student.toString()));
    const invoicesToCreate = studentIds
      .filter((id) => !existingStudentIds.has(id))
      .map((studentId) => ({
        student: studentId,
        academicYear: year,
        term: selectedTerm,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items: items.map((item) => ({
          title: item.title,
          amount: Number(item.amount || 0),
        })),
        totalAmount,
        paidAmount: 0,
        status: "unpaid",
      }));

    const created = invoicesToCreate.length
      ? await StudentInvoice.insertMany(invoicesToCreate)
      : [];

    return res.status(201).json({
      success: true,
      message: "Fee invoices assigned by academic year successfully",
      data: {
        academicYear: year,
        term: selectedTerm,
        totalStudentsInYear: studentIds.length,
        createdInvoices: created.length,
        skippedExistingInvoices: existingStudentIds.size,
      },
    });
  } catch (err) {
    console.error("adminAssignFee error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminListInvoices = async (req, res) => {
  try {
    const invoices = await StudentInvoice.find()
      .populate("student", "full_name email student_id year")
      .sort({ createdAt: -1 });
    res.json({ success: true, message: "Invoices fetched successfully", data: invoices });
  } catch (err) {
    console.error("adminListInvoices error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
