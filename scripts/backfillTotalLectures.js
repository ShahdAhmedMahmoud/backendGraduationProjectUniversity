// scripts/backfillTotalLectures.js
//
// الهدف: تصحيح course.totalLectures لكل الكورسات دفعة واحدة، عشان نصلح
// أي بيانات اتسجلت غلط وقت ما كان فيه باگ في generateLectureQr
// (كان بيحصل إن LectureSession تتعمل والطالب يعمل scan، لكن
// totalLectures ميتزودش).
//
// المعيار الصح لعدد المحاضرات الفعلي لكل كورس هو: عدد الـ LectureSession
// المختلفة (كل session بتتعمل مرة واحدة لكل يوم محاضرة، بسبب الـ unique
// index على course+lectureDate). يعني ببساطة: نعد كام session لكل كورس.
//
// ملحوظة: السكريبت ده بيرفع الرقم بس لو الرقم الصحيح أكبر من الموجود،
// عشان ميبوظش أي كورس رقمه مظبوط أو أعلى لسبب تاني (مثلاً مواد بتتحسب
// بطريقة markAttendance اليدوية كمان).
//
// طريقة التشغيل:
//   node scripts/backfillTotalLectures.js

require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const LectureSession = require("../models/LectureSession");

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("مفيش MONGO_URI أو MONGODB_URI في ملف .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("اتصل بالداتابيز بنجاح");

  const courses = await Course.find({});
  console.log(`لقيت ${courses.length} كورس`);

  let updatedCount = 0;

  for (const course of courses) {
    const sessionCount = await LectureSession.countDocuments({ course: course._id });

    if (sessionCount > (course.totalLectures || 0)) {
      console.log(
        `الكورس "${course.name}" (${course._id}): totalLectures من ${course.totalLectures || 0} إلى ${sessionCount}`
      );
      course.totalLectures = sessionCount;
      await course.save();
      updatedCount += 1;
    }
  }

  console.log(`تم تحديث ${updatedCount} كورس من أصل ${courses.length}`);

  await mongoose.disconnect();
  console.log("انتهى السكريبت");
}

run().catch((err) => {
  console.error("backfillTotalLectures error:", err);
  process.exit(1);
});