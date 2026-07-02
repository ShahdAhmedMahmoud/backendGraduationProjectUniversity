// src/index.js
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const announcementRoutes = require("./routes/announcementRoutes");
const studentRoutes = require("./routes/studentRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const professorRoutes = require("./routes/professorRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const academicRecordRoutes = require("./routes/academicRecordRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const slidesRoutes = require("./routes/slidesRoutes");
const notificationsRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentAttendanceRoutes = require("./routes/studentAttendanceRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const onlineMeetingRoutes = require("./routes/onlineMeetingRoutes");
const { startMissedMeetingsJob } = require("./jobs/missedMeetingsJob");
const app = express();

// Connect DB
connectDB();
startMissedMeetingsJob();
// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static("uploads"));

const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5000"];

// const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000", // your frontend
    credentials: true,
  }),
);

// Static uploads
// app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Static uploads - with correct MIME types for video files
app.use(
  "/uploads",
  (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const videoMimes = {
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
      ".webm": "video/webm",
    };
    if (videoMimes[ext]) {
      res.setHeader("Content-Type", videoMimes[ext]);
      res.setHeader("Content-Disposition", "inline");
    }
    next();
  },
  express.static(path.join(process.cwd(), "uploads")),
);

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/assistants", assistantRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/records", academicRecordRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance", studentAttendanceRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/slides", slidesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/meetings", onlineMeetingRoutes);
app.use("/api/announcements", announcementRoutes);
// app.use("/api/users", require("./routes/userRoutes"));

// Health check
app.get("/", (req, res) => res.send("Faculty Management API running ✅"));

// Error handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
