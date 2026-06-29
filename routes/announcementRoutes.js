const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const studentAuth = require("../middlewares/studentAuth");
const professorAuth = require("../middlewares/professorAuth");

// Student routes
router.get(
  "/student",
  studentAuth,
  announcementController.getStudentAnnouncements,
);
router.post(
  "/student/:announcementId/read",
  studentAuth,
  announcementController.markAsRead,
);

// Professor routes
router.get(
  "/professor",
  professorAuth,
  announcementController.getProfessorAnnouncements,
);
router.post(
  "/professor",
  professorAuth,
  announcementController.createAnnouncement,
);
router.patch(
  "/professor/:id/archive",
  professorAuth,
  announcementController.archiveAnnouncement,
);

// Public routes
router.get("/:id", announcementController.getAnnouncement);

module.exports = router;
