// scripts/inspectDuplicateAttendance.js
//
// الهدف: نجيب كل الـ Attendance records لكورس معين، ونطبعها بالتفصيل
// (بالتاريخ والوقت الكامل) عشان نعرف هل السجلين "المكررين" فعلاً
// نفس القيمة بالظبط في date، ولا مختلفين بفارق وقت بسيط.
//
// طريقة التشغيل:
//   node scripts/inspectDuplicateAttendance.js <courseId>
//
// مثال:
//   node scripts/inspectDuplicateAttendance.js 6a49d5755f562ada12fbf3b3

require("dotenv").config();
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const LectureSession = require("../models/LectureSession");
const Course = require("../models/Course");

async function run() {
  const courseId = process.argv[2];

  if (!courseId) {
    console.error("لازم تبعت courseId كـ argument. مثال:");
    console.error("node scripts/inspectDuplicateAttendance.js 6a49d5755f562ada12fbf3b3");
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log("اتصل بالداتابيز بنجاح\n");

  const course = await Course.findById(courseId);
  console.log(`الكورس: ${course?.name || "غير موجود"} (${courseId})\n`);

  console.log("=== كل الـ Attendance records للكورس ده ===");
  const records = await Attendance.find({ course: courseId }).sort({ date: 1 }).lean();

  records.forEach((rec, i) => {
    console.log(
      `${i + 1}) student: ${rec.student} | date (ISO كامل): ${rec.date.toISOString()} | status: ${rec.status} | createdAt: ${rec.createdAt?.toISOString()}`
    );
  });

  console.log(`\nالإجمالي: ${records.length} سجل`);

  console.log("\n=== كل الـ LectureSessions للكورس ده ===");
  const sessions = await LectureSession.find({ course: courseId }).sort({ lectureDate: 1 }).lean();

  sessions.forEach((s, i) => {
    console.log(
      `${i + 1}) lectureDate (ISO كامل): ${s.lectureDate.toISOString()} | isActive: ${s.isActive} | id: ${s._id}`
    );
  });

  console.log(`\nالإجمالي: ${sessions.length} session`);

  // تحقق مباشر: هل فيه student+date متكرر فعلياً؟
  console.log("\n=== فحص التكرار (نفس student + نفس date بالظبط) ===");
  const seen = new Map();
  let foundDuplicate = false;

  for (const rec of records) {
    const key = `${rec.student}_${rec.date.toISOString()}`;
    if (seen.has(key)) {
      console.log(`⚠️ تكرار حقيقي (نفس الطالب ونفس التاريخ بالظبط): ${key}`);
      foundDuplicate = true;
    }
    seen.set(key, true);
  }

  if (!foundDuplicate) {
    console.log("مفيش تكرار حقيقي (يعني السجلات دي أوقات مختلفة، مش نفس القيمة بالظبط)");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("inspectDuplicateAttendance error:", err);
  process.exit(1);
});