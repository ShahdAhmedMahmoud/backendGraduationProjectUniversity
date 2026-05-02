const Attendance = require("../models/Attendance");
const Course = require("../models/Course");
const Student = require("../models/Student");
const LectureSession = require("../models/LectureSession");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { applyAttendanceStatus } = require("../utils/attendanceStats");

function normalizeLectureDate(dateValue) {
  const date = new Date(dateValue || Date.now());
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function courseHasProfessor(course, professorId) {
  return course.professors.map((p) => p._id.toString()).includes(professorId);
}

async function findLectureSession({ sessionId, courseId, lectureDate }) {
  if (sessionId) {
    return LectureSession.findById(sessionId).populate({
      path: "course",
      select: "name code students professors totalLectures",
      populate: [
        { path: "students", select: "_id full_name email student_id attendanceStats" },
        { path: "professors", select: "_id" }
      ]
    });
  }

  if (courseId && lectureDate) {
    const normalizedLectureDate = normalizeLectureDate(lectureDate);
    if (!normalizedLectureDate) {
      return null;
    }

    return LectureSession.findOne({
      course: courseId,
      lectureDate: normalizedLectureDate
    }).populate({
      path: "course",
      select: "name code students professors totalLectures",
      populate: [
        { path: "students", select: "_id full_name email student_id attendanceStats" },
        { path: "professors", select: "_id" }
      ]
    });
  }

  return null;
}

// ----------------------
// PROFESSOR: MARK ATTENDANCE
// ----------------------
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, date, attendanceList } = req.body;

    if (!courseId || !date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({
        success: false,
        message: "courseId, date, attendanceList are required"
      });
    }

    const normalizedDate = normalizeLectureDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ success: false, message: "date is invalid" });
    }

    const course = await Course.findById(courseId)
      .populate("students", "_id full_name")
      .populate("professors", "_id");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.professors.map((p) => p._id.toString()).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });
    }

    const lectureAlreadyCounted = await Attendance.exists({
      course: courseId,
      date: normalizedDate
    });

    if (!lectureAlreadyCounted) {
      course.totalLectures += 1;
      await course.save();
    }

    const invalidStudents = [];
    const bulkOps = [];

    for (const { studentId, student_name, status } of attendanceList) {
      const student = course.students.find(
        (s) => s._id.toString() === studentId && s.full_name.toLowerCase() === student_name.toLowerCase()
      );

      if (!student) {
        invalidStudents.push({
          studentId,
          student_name,
          reason: "Student not in course or name mismatch"
        });
        continue;
      }

      const existingAttendance = await Attendance.findOne({
        course: courseId,
        student: studentId,
        date: normalizedDate
      });

      bulkOps.push({
        updateOne: {
          filter: { course: courseId, student: studentId, date: normalizedDate },
          update: { status, markedBy: req.user.id, date: normalizedDate },
          upsert: true
        }
      });

      const stu = await Student.findById(studentId);
      applyAttendanceStatus(stu, courseId, existingAttendance?.status, status);
      await stu.save();
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    res.json({
      success: true,
      message: "Attendance recorded and statistics updated",
      processedStudents: bulkOps.length,
      invalidStudents
    });
  } catch (err) {
    console.error("markAttendance error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// PROFESSOR: GENERATE QR FOR A LECTURE
// ----------------------
exports.generateLectureQr = async (req, res) => {
  try {
    const { courseId, lectureDate, expiresInMinutes = 15 } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const normalizedLectureDate = normalizeLectureDate(lectureDate);
    if (!normalizedLectureDate) {
      return res.status(400).json({ success: false, message: "lectureDate is invalid" });
    }

    const course = await Course.findById(courseId).populate("professors", "_id");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!courseHasProfessor(course, req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });
    }

    const safeExpiryMinutes = Math.min(Math.max(Number(expiresInMinutes) || 15, 1), 180);
    const expiresAt = new Date(Date.now() + safeExpiryMinutes * 60 * 1000);
    const qrToken = crypto.randomBytes(24).toString("hex");

    let session = await LectureSession.findOne({
      course: courseId,
      lectureDate: normalizedLectureDate
    });

    let incrementedLectures = false;
    const lectureAlreadyCounted = await Attendance.exists({
      course: courseId,
      date: normalizedLectureDate
    });

    if (!session) {
      session = await LectureSession.create({
        course: courseId,
        professor: req.user.id,
        lectureDate: normalizedLectureDate,
        qrToken,
        expiresAt,
        isActive: true
      });

      if (!lectureAlreadyCounted) {
        course.totalLectures += 1;
        await course.save();
        incrementedLectures = true;
      }
    } else {
      session.professor = req.user.id;
      session.qrToken = qrToken;
      session.expiresAt = expiresAt;
      session.isActive = true;
      await session.save();
    }

    const qrCodeDataUrl = await QRCode.toDataURL(qrToken);

    res.json({
      success: true,
      message: "Lecture QR generated successfully",
      session: {
        id: session._id,
        course: course._id,
        lectureDate: session.lectureDate,
        expiresAt: session.expiresAt,
        isActive: session.isActive,
        scannedCount: session.scannedBy.length
      },
      qrToken,
      qrCodeDataUrl,
      totalLectures: course.totalLectures,
      incrementedLectures
    });
  } catch (err) {
    console.error("generateLectureQr error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// PROFESSOR: CLOSE QR SESSION AND MARK ABSENCES
// ----------------------
exports.closeLectureSession = async (req, res) => {
  try {
    const { sessionId, courseId, lectureDate } = req.body;

    if (!sessionId && !(courseId && lectureDate)) {
      return res.status(400).json({
        success: false,
        message: "sessionId or both courseId and lectureDate are required"
      });
    }

    const session = await findLectureSession({ sessionId, courseId, lectureDate });

    if (!session && courseId && lectureDate) {
      const normalizedLectureDate = normalizeLectureDate(lectureDate);
      if (!normalizedLectureDate) {
        return res.status(400).json({ success: false, message: "lectureDate is invalid" });
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, message: "Lecture session not found" });
    }

    if (!session.course) {
      return res.status(404).json({ success: false, message: "Course not found for this session" });
    }

    if (!courseHasProfessor(session.course, req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });
    }

    const enrolledStudents = session.course.students || [];
    const processedStudents = [];
    let absencesMarked = 0;
    let alreadyPresentCount = 0;
    let alreadyAbsentCount = 0;

    for (const enrolledStudent of enrolledStudents) {
      const existingAttendance = await Attendance.findOne({
        course: session.course._id,
        student: enrolledStudent._id,
        date: session.lectureDate
      });

      if (existingAttendance?.status === "Present") {
        alreadyPresentCount += 1;
        processedStudents.push({
          studentId: enrolledStudent._id,
          name: enrolledStudent.full_name,
          finalStatus: "Present"
        });
        continue;
      }

      if (existingAttendance?.status === "Absent") {
        alreadyAbsentCount += 1;
        processedStudents.push({
          studentId: enrolledStudent._id,
          name: enrolledStudent.full_name,
          finalStatus: "Absent"
        });
        continue;
      }

      await Attendance.findOneAndUpdate(
        {
          course: session.course._id,
          student: enrolledStudent._id,
          date: session.lectureDate
        },
        {
          course: session.course._id,
          student: enrolledStudent._id,
          date: session.lectureDate,
          status: "Absent",
          markedBy: session.professor
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      applyAttendanceStatus(enrolledStudent, session.course._id, existingAttendance?.status, "Absent");
      await enrolledStudent.save();

      absencesMarked += 1;
      processedStudents.push({
        studentId: enrolledStudent._id,
        name: enrolledStudent.full_name,
        finalStatus: "Absent"
      });
    }

    session.isActive = false;
    if (session.expiresAt.getTime() < Date.now()) {
      session.expiresAt = new Date();
    }
    await session.save();

    res.json({
      success: true,
      message: "Lecture session closed and absences finalized",
      session: {
        id: session._id,
        course: session.course._id,
        lectureDate: session.lectureDate,
        isActive: session.isActive,
        scannedCount: session.scannedBy.length
      },
      summary: {
        totalStudents: enrolledStudents.length,
        presentCount: session.scannedBy.length,
        absentCount: processedStudents.filter((student) => student.finalStatus === "Absent").length,
        absencesMarked,
        alreadyPresentCount,
        alreadyAbsentCount
      },
      processedStudents
    });
  } catch (err) {
    console.error("closeLectureSession error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// PROFESSOR: GET CURRENT LECTURE REPORT
// ----------------------
exports.getLectureSessionReport = async (req, res) => {
  try {
    const { sessionId, courseId, lectureDate } = req.body;

    if (!sessionId && !(courseId && lectureDate)) {
      return res.status(400).json({
        success: false,
        message: "sessionId or both courseId and lectureDate are required"
      });
    }

    const session = await findLectureSession({ sessionId, courseId, lectureDate });

    if (!session && courseId && lectureDate) {
      const normalizedLectureDate = normalizeLectureDate(lectureDate);
      if (!normalizedLectureDate) {
        return res.status(400).json({ success: false, message: "lectureDate is invalid" });
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, message: "Lecture session not found" });
    }

    if (!session.course) {
      return res.status(404).json({ success: false, message: "Course not found for this session" });
    }

    if (!courseHasProfessor(session.course, req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this course" });
    }

    const attendanceRecords = await Attendance.find({
      course: session.course._id,
      date: session.lectureDate
    }).lean();

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.student.toString(), record])
    );

    const lectureReport = (session.course.students || []).map((student) => {
      const record = attendanceMap.get(student._id.toString());
      const finalStatus = record?.status || "Absent";

      return {
        studentId: student._id,
        name: student.full_name,
        email: student.email || "",
        studentCode: student.student_id || "",
        finalStatus,
        scanned: session.scannedBy.some((id) => id.toString() === student._id.toString()),
        attendancePercentage: finalStatus === "Present" ? "100.00" : "0.00",
        absencePercentage: finalStatus === "Absent" ? "100.00" : "0.00"
      };
    });

    const summary = lectureReport.reduce(
      (acc, row) => {
        acc.totalStudents += 1;
        if (row.finalStatus === "Present") acc.presentCount += 1;
        if (row.finalStatus === "Absent") acc.absentCount += 1;
        if (row.finalStatus === "Late") acc.lateCount += 1;
        if (row.finalStatus === "Excused") acc.excusedCount += 1;
        return acc;
      },
      { totalStudents: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0 }
    );

    res.json({
      success: true,
      session: {
        id: session._id,
        course: session.course._id,
        courseName: session.course.name,
        courseCode: session.course.code,
        lectureDate: session.lectureDate,
        isActive: session.isActive,
        scannedCount: session.scannedBy.length
      },
      summary,
      report: lectureReport
    });
  } catch (err) {
    console.error("getLectureSessionReport error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// STUDENT: SCAN QR AND MARK ATTENDANCE
// ----------------------
exports.scanLectureQr = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: "qrToken is required" });
    }

    const studentId = req.user.id;
    const session = await LectureSession.findOne({ qrToken }).populate("course", "name code students");

    if (!session) {
      return res.status(404).json({ success: false, message: "Invalid QR token" });
    }

    if (!session.isActive) {
      return res.status(400).json({ success: false, message: "This QR session is closed" });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      session.isActive = false;
      await session.save();
      return res.status(400).json({ success: false, message: "This QR code has expired" });
    }

    const isEnrolled = session.course.students.some((student) => student.toString() === studentId);
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this course" });
    }

    const existingAttendance = await Attendance.findOne({
      course: session.course._id,
      student: studentId,
      date: session.lectureDate
    });

    if (existingAttendance?.status === "Present") {
      return res.status(200).json({
        success: true,
        message: "Attendance already recorded for this lecture",
        attendance: existingAttendance
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        course: session.course._id,
        student: studentId,
        date: session.lectureDate
      },
      {
        course: session.course._id,
        student: studentId,
        date: session.lectureDate,
        status: "Present",
        markedBy: session.professor
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const student = await Student.findById(studentId);
    applyAttendanceStatus(student, session.course._id, existingAttendance?.status, "Present");
    await student.save();

    if (!session.scannedBy.some((id) => id.toString() === studentId)) {
      session.scannedBy.push(studentId);
      await session.save();
    }

    res.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance,
      session: {
        id: session._id,
        lectureDate: session.lectureDate,
        courseName: session.course.name,
        courseCode: session.course.code
      }
    });
  } catch (err) {
    console.error("scanLectureQr error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// PROFESSOR/ADMIN: VIEW ATTENDANCE BY COURSE
// ----------------------
exports.getAttendanceByCourse = async (req, res) => {
  try {
    const { courseId, date } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required in body" });
    }

    const query = { course: courseId };
    if (date) {
      query.date = date;
    }

    const records = await Attendance.find(query)
      .populate("student", "full_name student_id email")
      .populate("markedBy", "name email")
      .sort({ date: 1 });

    const summary = records.reduce(
      (acc, rec) => {
        acc.total++;
        acc[rec.status] = (acc[rec.status] || 0) + 1;
        return acc;
      },
      { total: 0, Present: 0, Absent: 0, Late: 0, Excused: 0 }
    );

    summary.percentage = summary.total > 0 ? ((summary.Present / summary.total) * 100).toFixed(2) : 0;

    res.json({ success: true, data: records, summary });
  } catch (err) {
    console.error("getAttendanceByCourse error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------
// STUDENT: VIEW THEIR ATTENDANCE
// ----------------------
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    const query = { student: studentId };
    if (courseId) {
      query.course = courseId;
    }

    const records = await Attendance.find(query)
      .populate("course", "name code")
      .populate("markedBy", "name email")
      .sort({ date: 1 });

    const summary = records.reduce(
      (acc, rec) => {
        acc.total++;
        acc[rec.status] = (acc[rec.status] || 0) + 1;
        return acc;
      },
      { total: 0, Present: 0, Absent: 0, Late: 0, Excused: 0 }
    );

    summary.percentage = summary.total > 0 ? ((summary.Present / summary.total) * 100).toFixed(2) : 0;

    res.json({ success: true, data: records, summary });
  } catch (err) {
    console.error("getStudentAttendance error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// GET STUDENTS ENROLLED IN A COURSE
// ================================
exports.getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required"
      });
    }

    const course = await Course.findById(courseId)
      .populate("students", "_id full_name email student_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      students: course.students
    });
  } catch (err) {
    console.error("getStudentsByCourse error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================
// PROFESSOR: GET FULL ATTENDANCE REPORT FOR A COURSE
// =======================================================
exports.getCourseAttendanceReport = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required"
      });
    }

    const course = await Course.findById(courseId)
      .populate("students", "_id full_name attendanceStats")
      .populate("professors", "_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (!courseHasProfessor(course, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this course"
      });
    }

    const records = await Attendance.find({ course: courseId })
      .sort({ date: -1 })
      .lean();

    const lastDates = {};
    for (const rec of records) {
      if (!lastDates[rec.student]) {
        lastDates[rec.student] = rec.date;
      }
    }

    const report = course.students.map((stu) => {
      const stats = stu.attendanceStats?.get(courseId.toString()) || {
        present: 0,
        absent: 0,
        percentage: 0
      };
      const attendancePercentage = Number(stats.percentage || 0);
      const absencePercentage = Math.max(0, 100 - attendancePercentage);

      return {
        studentId: stu._id,
        name: stu.full_name,
        present: stats.present,
        absent: stats.absent,
        attendancePercentage: attendancePercentage.toFixed(2),
        absencePercentage: absencePercentage.toFixed(2),
        lastAttendance: lastDates[stu._id] || null
      };
    });

    res.json({
      success: true,
      totalStudents: report.length,
      totalLectures: course.totalLectures,
      report
    });
  } catch (err) {
    console.error("getCourseAttendanceReport error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
