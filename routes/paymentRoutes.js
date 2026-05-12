const express = require("express");
const router = express.Router();

const studentAuth = require("../middlewares/studentAuth");
const adminAuth = require("../middlewares/adminAuth");
const paymentController = require("../controllers/paymentController");

// Student APIs
router.get("/me/summary", studentAuth, paymentController.studentSummary);
router.get("/me/invoices", studentAuth, paymentController.studentInvoices);
router.get("/me/invoices/:invoiceId", studentAuth, paymentController.studentInvoiceDetails);
router.get("/me/invoices/:invoiceId/pdf", studentAuth, paymentController.downloadInvoicePdf);
router.post("/checkout-session", studentAuth, paymentController.checkoutSession);
router.get("/confirm-session", studentAuth, paymentController.confirmSession);

// Gateway webhook
router.post("/webhook", paymentController.webhook);

// Admin APIs
router.post("/admin/fees/assign", adminAuth, paymentController.adminAssignFee);
router.get("/admin/fees/invoices", adminAuth, paymentController.adminListInvoices);

module.exports = router;
