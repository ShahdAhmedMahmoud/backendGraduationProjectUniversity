// const Student = require("../models/Student");
// const Professor = require("../models/Professor");
// const Course = require("../models/Course");
// const Assignment = require("../models/AssignmentModel");
// const LectureSlides = require("../models/LectureSlidesModel");
// const Notification = require("../models/Notification");
// const Semester = require("../models/Semester");
// const fs = require("fs-extra");
// const crypto = require("crypto");
// const sendEmail = require("../utils/sendEmail");

// const Admin = require("../models/Admin");
// const jwt = require("jsonwebtoken");

// // Helper to create JWT
// const generateToken = (admin) => {
//     return jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// function createStudentId(fullName) {
//     const prefix = (fullName.replace(/\s+/g, "").substring(0, 3) || "STD").toUpperCase();
//     const random = Math.floor(Math.random() * 9000) + 1000;
//     const hash = crypto.randomBytes(2).toString("hex").toUpperCase();
//     return `${prefix}${random}${hash}`;
// }

// function generateTemporaryPassword() {
//     return `Stu@${Math.floor(100000 + Math.random() * 900000)}`;
// }

// // -----------------
// // SIGNUP
// // -----------------
// exports.signup = async (req, res) => {
//     try {
//         const { full_name, email, password } = req.body;

//         const existingAdmin = await Admin.findOne({ email });
//         if (existingAdmin) return res.status(400).json({ success: false, message: "Email already exists" });

//         const admin = await Admin.create({ full_name, email, password });
//         const token = generateToken(admin);

//         res.status(201).json({ success: true, data: { admin, token } });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------
// // LOGIN
// // -----------------
// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const admin = await Admin.findOne({ email });
//         if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

//         const isMatch = await admin.matchPassword(password);
//         if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

//         const token = generateToken(admin);
//         res.json({ success: true, data: { admin, token } });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // STUDENT MANAGEMENT
// // -----------------------------
// exports.createStudent = async (req, res) => {
//     try {
//         const {
//             first_name,
//             last_name,
//             full_name,
//             email,
//             phone,
//             password,
//             dob,
//             year,
//             enrollment_status,
//             address,
//             emergency_contact,
//             gpa,
//             avatar,
//             department_id,
//             enrollment_date,
//             completedCredits
//         } = req.body;

//         const normalizedEmail = email?.toLowerCase()?.trim();
//         if (!normalizedEmail) {
//             return res.status(400).json({ success: false, message: "Email is required" });
//         }

//         const resolvedFullName = (
//             full_name ||
//             [first_name, last_name].filter(Boolean).join(" ")
//         )?.trim();

//         if (!resolvedFullName) {
//             return res.status(400).json({ success: false, message: "Full name is required" });
//         }

//         const existingStudent = await Student.findOne({ email: normalizedEmail });
//         if (existingStudent) {
//             return res.status(400).json({ success: false, message: "Email already exists" });
//         }

//         const temporaryPassword = password || generateTemporaryPassword();

//         const student = await Student.create({
//             full_name: resolvedFullName,
//             email: normalizedEmail,
//             phone: phone || undefined,
//             password: temporaryPassword,
//             student_id: createStudentId(resolvedFullName),
//             dob: dob || undefined,
//             year: year || 1,
//             enrollment_status: enrollment_status || "Active",
//             address: address || undefined,
//             emergency_contact: emergency_contact || undefined,
//             gpa: gpa ?? null,
//             avatar: avatar || null,
//             department_id: department_id || null,
//             enrollment_date: enrollment_date || undefined,
//             completedCredits: completedCredits ?? 0
//         });

//         const safeStudent = await Student.findById(student._id)
//             .select("-password -refreshTokens -resetToken -resetTokenExpire")
//             .populate("department_id", "name");

//         res.status(201).json({
//             success: true,
//             message: "Student created successfully",
//             data: {
//                 student: safeStudent,
//                 temporaryPassword: password ? null : temporaryPassword
//             }
//         });
//     } catch (err) {
//         console.error("Create student error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.status(400).json({ success: false, message: "Email is required" });
//         }

//         const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
//         if (!admin) {
//             return res.status(404).json({ success: false, message: "No account found" });
//         }

//         const token = crypto.randomBytes(20).toString("hex");
//         admin.resetToken = token;
//         admin.resetTokenExpire = Date.now() + 60 * 60 * 1000;
//         await admin.save();

//         const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
//         const resetUrl = `${frontendBaseUrl}/admin/reset-password/${token}`;

//         await sendEmail(
//             admin.email,
//             "Admin Password Reset",
//             `<p>You requested to reset your admin password.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, ignore this email.</p>`
//         );

//         res.json({ success: true, message: "Reset email sent" });
//     } catch (err) {
//         console.error("Admin forgot password error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.resetPassword = async (req, res) => {
//     try {
//         const { token, password } = req.body;

//         if (!token || !password) {
//             return res.status(400).json({ success: false, message: "token and password are required" });
//         }

//         const admin = await Admin.findOne({
//             resetToken: token,
//             resetTokenExpire: { $gt: Date.now() }
//         });

//         if (!admin) {
//             return res.status(400).json({ success: false, message: "Invalid or expired token" });
//         }

//         admin.password = password;
//         admin.resetToken = undefined;
//         admin.resetTokenExpire = undefined;
//         await admin.save();

//         res.json({ success: true, message: "Password updated successfully" });
//     } catch (err) {
//         console.error("Admin reset password error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.listStudents = async (req, res) => {
//     try {
//         const students = await Student.find().populate("courses", "name code");
//         res.json({ success: true, data: students });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.getStudent = async (req, res) => {
//     try {
//         const student = await Student.findById(req.params.id)
//             .populate("courses", "name code credits")
//             .populate("department_id", "name")
//             .populate("professors", "name email")
//             .populate("assistants", "name email");
//         if (!student) return res.status(404).json({ success: false, message: "Student not found" });
//         res.json({ success: true, data: student });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.updateStudent = async (req, res) => {
//     try {
//         const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!student) return res.status(404).json({ success: false, message: "Student not found" });
//         res.json({ success: true, data: student });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.deleteStudent = async (req, res) => {
//     try {
//         const student = await Student.findByIdAndDelete(req.params.id);
//         if (!student) return res.status(404).json({ success: false, message: "Student not found" });
//         res.json({ success: true, message: "Student deleted" });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.toggleStudentStatus = async (req, res) => {
//     try {
//         const student = await Student.findById(req.params.id);
//         if (!student) return res.status(404).json({ success: false, message: "Student not found" });
//         student.active = !student.active;
//         await student.save();
//         res.json({ success: true, message: `Student ${student.active ? "activated" : "deactivated"}` });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // PROFESSOR MANAGEMENT
// // -----------------------------
// exports.listProfessors = async (req, res) => {
//     try {
//         const professors = await Professor.find().populate("courses", "name code");
//         res.json({ success: true, data: professors });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.getProfessor = async (req, res) => {
//     try {
//         const professor = await Professor.findById(req.params.id).populate("courses");
//         if (!professor) return res.status(404).json({ success: false, message: "Professor not found" });
//         res.json({ success: true, data: professor });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.updateProfessor = async (req, res) => {
//     try {
//         const professor = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!professor) return res.status(404).json({ success: false, message: "Professor not found" });
//         res.json({ success: true, data: professor });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.deleteProfessor = async (req, res) => {
//     try {
//         const professor = await Professor.findByIdAndDelete(req.params.id);
//         if (!professor) return res.status(404).json({ success: false, message: "Professor not found" });
//         res.json({ success: true, message: "Professor deleted" });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.toggleProfessorStatus = async (req, res) => {
//     try {
//         const professor = await Professor.findById(req.params.id);
//         if (!professor) return res.status(404).json({ success: false, message: "Professor not found" });
//         professor.active = !professor.active;
//         await professor.save();
//         res.json({ success: true, message: `Professor ${professor.active ? "activated" : "deactivated"}` });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // COURSE MANAGEMENT
// // -----------------------------
// exports.listCourses = async (req, res) => {
//     try {
//         const courses = await Course.find().populate("professors students");
//         res.json({ success: true, data: courses });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.getCourse = async (req, res) => {
//     try {
//         const course = await Course.findById(req.params.id).populate("professors students assignments");
//         if (!course) return res.status(404).json({ success: false, message: "Course not found" });
//         res.json({ success: true, data: course });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.createCourse = async (req, res) => {
//     try {
//         const course = await Course.create(req.body);
//         res.status(201).json({ success: true, data: course });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.updateCourse = async (req, res) => {
//     try {
//         const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!course) return res.status(404).json({ success: false, message: "Course not found" });
//         res.json({ success: true, data: course });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.deleteCourse = async (req, res) => {
//     try {
//         const course = await Course.findByIdAndDelete(req.params.id);
//         if (!course) return res.status(404).json({ success: false, message: "Course not found" });
//         res.json({ success: true, message: "Course deleted" });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.assignProfessorsToCourse = async (req, res) => {
//     try {
//         const { professorIds } = req.body;
//         const course = await Course.findById(req.params.id);
//         if (!course) return res.status(404).json({ success: false, message: "Course not found" });

//         course.professors = professorIds;
//         await course.save();
//         res.json({ success: true, message: "Professors assigned", data: course });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.enrollStudentsToCourse = async (req, res) => {
//     try {
//         const { studentIds } = req.body;
//         const course = await Course.findById(req.params.id);
//         if (!course) return res.status(404).json({ success: false, message: "Course not found" });

//         course.students = studentIds;
//         await course.save();
//         res.json({ success: true, message: "Students enrolled", data: course });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // ASSIGNMENTS MANAGEMENT
// // -----------------------------
// exports.listAllAssignments = async (req, res) => {
//     try {
//         const assignments = await Assignment.find().populate("professor course");
//         res.json({ success: true, data: assignments });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.overrideAssignmentGrade = async (req, res) => {
//     try {
//         const { grade, feedback } = req.body;
//         const assignment = await Assignment.findById(req.params.id);
//         if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

//         const submission = assignment.submissions.id(req.params.submissionId);
//         if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

//         if (grade !== undefined) submission.grade = grade;
//         if (feedback) submission.feedback = feedback;

//         await assignment.save();
//         res.json({ success: true, message: "Grade overridden", data: submission });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // LECTURE SLIDES MANAGEMENT
// // -----------------------------
// exports.listAllSlides = async (req, res) => {
//     try {
//         const slides = await LectureSlides.find().populate("professor course");
//         res.json({ success: true, data: slides });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.deleteSlide = async (req, res) => {
//     try {
//         const slide = await LectureSlides.findByIdAndDelete(req.params.id);
//         if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });

//         // Remove file from disk
//         if (slide.fileUrl) await fs.remove(slide.fileUrl.replace("/", ""));
//         res.json({ success: true, message: "Slide deleted" });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // NOTIFICATIONS MANAGEMENT
// // -----------------------------
// exports.sendNotification = async (req, res) => {
//     try {
//         const { userId, userType, title, message } = req.body;
//         const notification = await Notification.create({ user: userId, userType, title, message });
//         res.json({ success: true, message: "Notification sent", data: notification });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.listNotifications = async (req, res) => {
//     try {
//         const notifications = await Notification.find().sort({ createdAt: -1 });
//         res.json({ success: true, data: notifications });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // -----------------------------
// // SEMESTER MANAGEMENT
// // -----------------------------
// exports.listSemesters = async (req, res) => {
//     try {
//         const semesters = await Semester.find();
//         res.json({ success: true, data: semesters });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.createSemester = async (req, res) => {
//     try {
//         const semester = await Semester.create(req.body);
//         res.status(201).json({ success: true, data: semester });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.updateSemester = async (req, res) => {
//     try {
//         const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.json({ success: true, data: semester });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ------------------------------
// // SEND GLOBAL ANNOUNCEMENT
// // ------------------------------
// exports.sendGlobalNotification = async (req, res) => {
//     try {
//         const { title, message } = req.body;
//         if (!title || !message)
//             return res.status(400).json({ success: false, message: "Title and message are required" });

//         // Fetch all students and professors
//         const students = await Student.find({}, "_id");
//         const professors = await Professor.find({}, "_id");

//         const recipients = [...students.map(s => s._id), ...professors.map(p => p._id)];

//         const notifications = recipients.map(userId => ({
//             user: userId,
//             userModel: userId instanceof Student ? "Student" : "Professor",
//             title,
//             message,
//             type: "global",
//             status: "sent",
//             createdBy: req.user.id
//         }));

//         await Notification.insertMany(notifications);

//         res.json({ success: true, message: "Global notification sent", count: notifications.length });
//     } catch (err) {
//         console.error("Send global notification error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ------------------------------
// // SCHEDULE NOTIFICATION
// // ------------------------------
// exports.scheduleNotification = async (req, res) => {
//     try {
//         const { title, message, recipients, recipientModel, scheduledAt } = req.body;
//         if (!title || !message || !scheduledAt)
//             return res.status(400).json({ success: false, message: "Title, message, and scheduledAt required" });

//         const notification = await Notification.create({
//             title,
//             message,
//             user: recipients || [], // optional for system-wide
//             userModel: recipientModel || "Student",
//             type: recipients ? "individual" : "global",
//             status: "pending",
//             scheduledAt,
//             createdBy: req.user.id
//         });

//         res.json({ success: true, message: "Notification scheduled", data: notification });
//     } catch (err) {
//         console.error("Schedule notification error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ------------------------------
// // VIEW NOTIFICATION STATUS
// // ------------------------------
// exports.getNotificationStatus = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const notification = await Notification.findById(id)
//             .populate("user", "full_name email name");

//         if (!notification)
//             return res.status(404).json({ success: false, message: "Notification not found" });

//         res.json({ success: true, data: notification });
//     } catch (err) {
//         console.error("Get notification status error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

const Student = require("../models/Student");
const Professor = require("../models/Professor");
const Course = require("../models/Course");
const Assignment = require("../models/AssignmentModel");
const LectureSlides = require("../models/LectureSlidesModel");
const Notification = require("../models/Notification");
const Semester = require("../models/Semester");
const Event = require("../models/Event"); // ✅ جديد
const fs = require("fs-extra");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Helper to create JWT
const generateToken = (admin) => {
  return jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

function createStudentId(fullName) {
  const prefix = (
    fullName.replace(/\s+/g, "").substring(0, 3) || "STD"
  ).toUpperCase();
  const random = Math.floor(Math.random() * 9000) + 1000;
  const hash = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}${random}${hash}`;
}

function generateTemporaryPassword() {
  return `Stu@${Math.floor(100000 + Math.random() * 900000)}`;
}

// -----------------
// SIGNUP
// -----------------
exports.signup = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

    const admin = await Admin.create({ full_name, email, password });
    const token = generateToken(admin);

    res.status(201).json({ success: true, data: { admin, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------
// LOGIN
// -----------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(admin);
    res.json({ success: true, data: { admin, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// STUDENT MANAGEMENT
// -----------------------------
exports.createStudent = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      full_name,
      email,
      phone,
      password,
      dob,
      year,
      enrollment_status,
      address,
      emergency_contact,
      gpa,
      avatar,
      department_id,
      enrollment_date,
      completedCredits,
    } = req.body;

    const normalizedEmail = email?.toLowerCase()?.trim();
    if (!normalizedEmail)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const resolvedFullName = (
      full_name || [first_name, last_name].filter(Boolean).join(" ")
    )?.trim();
    if (!resolvedFullName)
      return res
        .status(400)
        .json({ success: false, message: "Full name is required" });

    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

    const temporaryPassword = password || generateTemporaryPassword();

    const student = await Student.create({
      full_name: resolvedFullName,
      email: normalizedEmail,
      phone: phone || undefined,
      password: temporaryPassword,
      student_id: createStudentId(resolvedFullName),
      dob: dob || undefined,
      year: year || 1,
      enrollment_status: enrollment_status || "Active",
      address: address || undefined,
      emergency_contact: emergency_contact || undefined,
      gpa: gpa ?? null,
      avatar: avatar || null,
      department_id: department_id || null,
      enrollment_date: enrollment_date || undefined,
      completedCredits: completedCredits ?? 0,
    });

    const safeStudent = await Student.findById(student._id)
      .select("-password -refreshTokens -resetToken -resetTokenExpire")
      .populate("department_id", "name");

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        student: safeStudent,
        temporaryPassword: password ? null : temporaryPassword,
      },
    });
  } catch (err) {
    console.error("Create student error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "No account found" });

    const token = crypto.randomBytes(20).toString("hex");
    admin.resetToken = token;
    admin.resetTokenExpire = Date.now() + 60 * 60 * 1000;
    await admin.save();

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendBaseUrl}/admin/reset-password/${token}`;

    await sendEmail(
      admin.email,
      "Admin Password Reset",
      `<p>You requested to reset your admin password.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, ignore this email.</p>`,
    );

    res.json({ success: true, message: "Reset email sent" });
  } catch (err) {
    console.error("Admin forgot password error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res
        .status(400)
        .json({ success: false, message: "token and password are required" });

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!admin)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });

    admin.password = password;
    admin.resetToken = undefined;
    admin.resetTokenExpire = undefined;
    await admin.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Admin reset password error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("courses", "name code");
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("courses", "name code credits")
      .populate("department_id", "name")
      .populate("professors", "name email")
      .populate("assistants", "name email");
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleStudentStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    student.active = !student.active;
    await student.save();
    res.json({
      success: true,
      message: `Student ${student.active ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// PROFESSOR MANAGEMENT
// -----------------------------
exports.listProfessors = async (req, res) => {
  try {
    const professors = await Professor.find().populate("courses", "name code");
    res.json({ success: true, data: professors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfessor = async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id).populate(
      "courses",
    );
    if (!professor)
      return res
        .status(404)
        .json({ success: false, message: "Professor not found" });
    res.json({ success: true, data: professor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfessor = async (req, res) => {
  try {
    const professor = await Professor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!professor)
      return res
        .status(404)
        .json({ success: false, message: "Professor not found" });
    res.json({ success: true, data: professor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProfessor = async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor)
      return res
        .status(404)
        .json({ success: false, message: "Professor not found" });
    res.json({ success: true, message: "Professor deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleProfessorStatus = async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor)
      return res
        .status(404)
        .json({ success: false, message: "Professor not found" });
    professor.active = !professor.active;
    await professor.save();
    res.json({
      success: true,
      message: `Professor ${professor.active ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// COURSE MANAGEMENT
// -----------------------------
exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("professors students");
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "professors students assignments",
    );
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignProfessorsToCourse = async (req, res) => {
  try {
    const { professorIds } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    course.professors = professorIds;
    await course.save();
    res.json({ success: true, message: "Professors assigned", data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.enrollStudentsToCourse = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    course.students = studentIds;
    await course.save();
    res.json({ success: true, message: "Students enrolled", data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// ASSIGNMENTS MANAGEMENT
// -----------------------------
exports.listAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("professor course");
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.overrideAssignmentGrade = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission)
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });

    if (grade !== undefined) submission.grade = grade;
    if (feedback) submission.feedback = feedback;

    await assignment.save();
    res.json({ success: true, message: "Grade overridden", data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// LECTURE SLIDES MANAGEMENT
// -----------------------------
exports.listAllSlides = async (req, res) => {
  try {
    const slides = await LectureSlides.find().populate("professor course");
    res.json({ success: true, data: slides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const slide = await LectureSlides.findByIdAndDelete(req.params.id);
    if (!slide)
      return res
        .status(404)
        .json({ success: false, message: "Slide not found" });
    if (slide.fileUrl) await fs.remove(slide.fileUrl.replace("/", ""));
    res.json({ success: true, message: "Slide deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// NOTIFICATIONS MANAGEMENT
// -----------------------------
exports.sendNotification = async (req, res) => {
  try {
    const { userId, userType, title, message } = req.body;
    const notification = await Notification.create({
      user: userId,
      userType,
      title,
      message,
    });
    res.json({
      success: true,
      message: "Notification sent",
      data: notification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// -----------------------------
// SEMESTER MANAGEMENT
// -----------------------------
exports.listSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find();
    res.json({ success: true, data: semesters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json({ success: true, data: semester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: semester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------
// SEND GLOBAL ANNOUNCEMENT
// ------------------------------
exports.sendGlobalNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message)
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });

    const students = await Student.find({}, "_id");
    const professors = await Professor.find({}, "_id");
    const recipients = [
      ...students.map((s) => s._id),
      ...professors.map((p) => p._id),
    ];

    const notifications = recipients.map((userId) => ({
      user: userId,
      userModel: userId instanceof Student ? "Student" : "Professor",
      title,
      message,
      type: "global",
      status: "sent",
      createdBy: req.user.id,
    }));

    await Notification.insertMany(notifications);
    res.json({
      success: true,
      message: "Global notification sent",
      count: notifications.length,
    });
  } catch (err) {
    console.error("Send global notification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------
// SCHEDULE NOTIFICATION
// ------------------------------
exports.scheduleNotification = async (req, res) => {
  try {
    const { title, message, recipients, recipientModel, scheduledAt } =
      req.body;
    if (!title || !message || !scheduledAt)
      return res
        .status(400)
        .json({
          success: false,
          message: "Title, message, and scheduledAt required",
        });

    const notification = await Notification.create({
      title,
      message,
      user: recipients || [],
      userModel: recipientModel || "Student",
      type: recipients ? "individual" : "global",
      status: "pending",
      scheduledAt,
      createdBy: req.user.id,
    });

    res.json({
      success: true,
      message: "Notification scheduled",
      data: notification,
    });
  } catch (err) {
    console.error("Schedule notification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------
// VIEW NOTIFICATION STATUS
// ------------------------------
exports.getNotificationStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate(
      "user",
      "full_name email name",
    );
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error("Get notification status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// ✅ EVENTS MANAGEMENT
// ==============================

// GET /api/admin/events
exports.listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/events
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      venue,
      date,
      start_time,
      end_time,
      image_url,
      link,
      description,
    } = req.body;
    if (!title || !venue || !date || !start_time || !end_time)
      return res
        .status(400)
        .json({
          success: false,
          message: "title, venue, date, start_time, end_time are required",
        });

    const event = await Event.create({
      title,
      venue,
      date,
      start_time,
      end_time,
      image_url: image_url || "",
      link: link || "",
      description: description || "",
      created_by: req.user.id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
