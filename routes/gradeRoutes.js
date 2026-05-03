const express = require("express");
const gradeController = require("../controllers/gradeController");
const professorAuth = require("../middlewares/professorAuth");
const adminAuth = require("../middlewares/adminAuth");
const studentAuth = require("../middlewares/studentAuth");

const router = express.Router();

// Professor side
router.post(
  "/professor/course-records",
  professorAuth,
  gradeController.getProfessorCourseRecords,
);
router.post(
  "/professor/save-coursework",
  professorAuth,
  gradeController.saveProfessorCoursework,
);
router.post(
  "/professor/semesters",
  professorAuth,
  gradeController.getProfessorSemestersForCourse,
);

// Admin side
router.post(
  "/admin/course-records",
  adminAuth,
  gradeController.getAdminCourseRecords,
);
router.post(
  "/admin/save-final",
  adminAuth,
  gradeController.saveAdminFinalExam,
);
router.post(
  "/admin/semesters",
  adminAuth,
  gradeController.getAdminSemestersForCourse,
);

// Student side
router.get("/student/semesters", studentAuth, gradeController.getStudentSemesters);
router.post(
  "/student/semester-summary",
  studentAuth,
  gradeController.getStudentSemesterSummary,
);

module.exports = router;
