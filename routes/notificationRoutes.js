const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const { verifyAccessToken } = require("../utils/token");

// Unified auth: allow student OR professor
const userAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = header.split(" ")[1];
        let payload;

        try {
            payload = verifyAccessToken(token);
        } catch (err) {
            console.error("Notification auth token error:", err.message);
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const role = (payload.role || "").toString().toLowerCase();

        if (role === "student") {
            const student = await Student.findById(payload.id);
            if (!student || student.isDeleted) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            req.user = { id: student._id.toString(), email: student.email, role: "student" };
            req.userRole = "Student";
            return next();
        }

        if (role === "professor") {
            const professor = await Professor.findById(payload.id);
            if (!professor || professor.isDeleted) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            req.user = { id: professor._id.toString(), email: professor.email, role: "professor" };
            req.userRole = "Professor";
            return next();
        }

        return res.status(403).json({ success: false, message: "Forbidden" });
    } catch (err) {
        console.error("Notification auth error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ------------------------------
// GET NOTIFICATIONS
// ------------------------------
router.post("/list", userAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.json({ success: true, message: "Notifications fetched", data: notifications });
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------
// MARK NOTIFICATION AS READ
// ------------------------------
router.post("/read", userAuth, async (req, res) => {
    try {
        const { notificationId } = req.body;
        if (!notificationId) return res.status(400).json({ success: false, message: "notificationId is required" });

        await Notification.findByIdAndUpdate(notificationId, { seen: true });

        res.json({ success: true, message: "Notification marked as read" });
    } catch (err) {
        console.error("Mark notification read error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
