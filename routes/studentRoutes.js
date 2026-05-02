// // const express = require('express');
// // const router = express.Router();
// // const studentAuth = require('../middlewares/studentAuth');
// // const adminAuth = require('../middlewares/adminAuth');

// // const studentController = require('../controllers/studentController');
// // const Student = require("../models/Student");
// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs-extra');

// // // Ensure upload folder exists
// // const uploadDir = path.join(process.cwd(), 'uploads/students');
// // fs.ensureDirSync(uploadDir);

// // // Multer setup
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, uploadDir),
// //   filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
// // });
// // const upload = multer({ storage });

// // // Public
// // router.post('/signup', upload.single('avatar'), studentController.signup);
// // router.post('/login', studentController.login);
// // router.post('/refresh', studentController.refreshToken);
// // router.post('/forgot-password', studentController.forgotPassword);
// // router.post('/reset-password', studentController.resetPassword);

// // // Protected Student routes
// // router.post('/courses', studentAuth, studentController.myCourses);
// // router.get('/me', studentAuth, studentController.me);
// // router.put('/me', studentAuth, upload.single('avatar'), studentController.updateProfile);
// // router.post('/change-password', studentAuth, studentController.changePassword);
// // router.post('/logout', studentAuth, studentController.logout);

// // router.post('/enroll', studentAuth, studentController.enrollCourse);
// // router.delete('/remove-course', studentAuth, studentController.removeCourse);
// // router.get('/grades', studentAuth, studentController.getGrades);
// // router.get('/dashboard', studentAuth, studentController.dashboard);

// // // Admin Only
// // router.get('/', studentController.listStudents);
// // router.delete('/:id', adminAuth, studentController.removeStudent);

// // router.get("/courses", studentAuth, async (req, res) => {
// //     try {
// //         const student = await Student.findById(req.user.id)
// //             .populate("courses", "name code description");

// //         if (!student) return res.status(404).json({ success: false, message: "Student not found" });

// //         res.json({
// //             success: true,
// //             message: "Courses fetched successfully",
// //             data: student.courses
// //         });
// //     } catch (err) {
// //         console.error("Fetch student courses error:", err);
// //         res.status(500).json({ success: false, message: err.message });
// //     }
// // });

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const studentAuth = require('../middlewares/studentAuth');
// const adminAuth = require('../middlewares/adminAuth');

// const studentController = require('../controllers/studentController');
// const Student = require("../models/Student");
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs-extra');

// // Ensure upload folder exists
// const uploadDir = path.join(process.cwd(), 'uploads/students');
// fs.ensureDirSync(uploadDir);

// // Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
// });
// const upload = multer({ storage });

// // Public
// router.post('/signup', upload.single('avatar'), studentController.signup);
// router.post('/login', studentController.login);
// router.post('/refresh', studentController.refreshToken);
// router.post('/forgot-password', studentController.forgotPassword);
// router.post('/reset-password', studentController.resetPassword);

// // Protected Student routes
// router.post('/courses', studentAuth, studentController.myCourses);
// router.get('/me', studentAuth, studentController.me);
// router.put('/me', studentAuth, upload.single('avatar'), studentController.updateProfile);
// router.post('/change-password', studentAuth, studentController.changePassword);
// router.post('/logout', studentAuth, studentController.logout);

// router.post('/enroll', studentAuth, studentController.enrollCourse);
// router.delete('/remove-course', studentAuth, studentController.removeCourse);
// router.get('/grades', studentAuth, studentController.getGrades);
// router.get('/dashboard', studentAuth, studentController.dashboard);

// // ✅ Timetable route الجديد
// router.get('/timetable', studentAuth, studentController.getTimetable);

// // Admin Only
// router.get('/', studentController.listStudents);
// router.delete('/:id', adminAuth, studentController.removeStudent);

// router.get("/courses", studentAuth, async (req, res) => {
//     try {
//         const student = await Student.findById(req.user.id)
//             .populate("courses", "name code description");

//         if (!student) return res.status(404).json({ success: false, message: "Student not found" });

//         res.json({
//             success: true,
//             message: "Courses fetched successfully",
//             data: student.courses
//         });
//     } catch (err) {
//         console.error("Fetch student courses error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const studentAuth = require("../middlewares/studentAuth");
const adminAuth = require("../middlewares/adminAuth");

const studentController = require("../controllers/studentController");
const Student = require("../models/Student");
const Event = require("../models/Event"); // ✅ جديد
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

// Ensure upload folder exists
const uploadDir = path.join(process.cwd(), "uploads/students");
fs.ensureDirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    ),
});
const upload = multer({ storage });

// Public
router.post("/signup", upload.single("avatar"), studentController.signup);
router.post("/login", studentController.login);
router.post("/refresh", studentController.refreshToken);
router.post("/forgot-password", studentController.forgotPassword);
router.post("/reset-password", studentController.resetPassword);

// Protected Student routes
router.post("/courses", studentAuth, studentController.myCourses);
router.get("/me", studentAuth, studentController.me);
router.put(
  "/me",
  studentAuth,
  upload.single("avatar"),
  studentController.updateProfile,
);
router.post("/change-password", studentAuth, studentController.changePassword);
router.post("/logout", studentAuth, studentController.logout);

router.post("/enroll", studentAuth, studentController.enrollCourse);
router.delete("/remove-course", studentAuth, studentController.removeCourse);
router.get("/grades", studentAuth, studentController.getGrades);
router.get("/dashboard", studentAuth, studentController.dashboard);
router.get("/timetable", studentAuth, studentController.getTimetable);

// ✅ Events — كل الطلاب يشوفوا الـ events الجاية
router.get("/events", studentAuth, async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } }).sort({
      date: 1,
    });
    res.json({ success: true, data: events });
  } catch (err) {
    console.error("Fetch events error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Only
router.get("/", studentController.listStudents);
router.delete("/:id", adminAuth, studentController.removeStudent);

router.get("/courses", studentAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate(
      "courses",
      "name code description",
    );
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    res.json({
      success: true,
      message: "Courses fetched successfully",
      data: student.courses,
    });
  } catch (err) {
    console.error("Fetch student courses error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// GET /api/students/events/:id
router.get("/events/:id", studentAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/deadlines', studentAuth, studentController.getDeadlines);

module.exports = router;
