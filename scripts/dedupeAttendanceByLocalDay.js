// scripts/dedupeAttendanceByLocalDay.js
//
// الهدف: نلاقي أي Attendance records اتسجلت لنفس الطالب+الكورس+نفس
// اليوم المحلي فعلياً، لكن بقيم "date" مختلفة تقنياً بسبب فرق التوقيت
// (زي 2026-07-04T21:00:00.000Z و 2026-07-05T00:00:00.000Z، اللي هما
// فعلياً نفس اليوم بتوقيت مصر). ونوحدهم في سجل واحد بس.
//
// المنطق: لو فيه أكتر من سجل لنفس الطالب+الكورس+نفس اليوم المحلي:
//   - لو أي واحد منهم "Present"، نخلي الناتج النهائي "Present"
//     (يعني الطالب يتحسبله حضور، مش هنعاقبه على باگ في السيستم)
//   - نمسح باقي السجلات المكررة
//   - نصحح قيمة date في السجل الباقي عشان تبقى موحدة (نفس منطق
//     normalizeLectureDate الجديد المعتمد على التاريخ المحلي)
//
// بعد كده لازم تشغلي سكريبت إعادة حساب attendanceStats للطلبة المتأثرين
// (موجود تعليمات في الآخر).
//
// طريقة التشغيل:
//   node scripts/dedupeAttendanceByLocalDay.js
//
// ملحوظة: السكريبت بيطبع كل حاجة هيعملها الأول من غير ما يمسح فعلياً،
// إلا لو شغلتيه بـ --apply

require("dotenv").config();
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { applyAttendanceStatus } = require("../utils/attendanceStats");

function localDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function canonicalLocalDate(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function run() {
  const shouldApply = process.argv.includes("--apply");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log(
    `اتصل بالداتابيز بنجاح (وضع: ${shouldApply ? "تطبيق فعلي" : "عرض بس (dry run)"})\n`,
  );

  const allRecords = await Attendance.find({}).sort({ createdAt: 1 });
  console.log(`لقيت ${allRecords.length} سجل attendance إجمالي\n`);

  // نجمعهم حسب student + course + اليوم المحلي
  const groups = new Map();

  for (const rec of allRecords) {
    const key = `${rec.student}_${rec.course}_${localDayKey(rec.date)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rec);
  }

  let duplicateGroupsCount = 0;
  const affectedStudentIds = new Set();

  for (const [key, recs] of groups.entries()) {
    if (recs.length <= 1) continue;

    duplicateGroupsCount += 1;
    const [studentId, courseId] = key.split("_");

    const finalStatus = recs.some((r) => r.status === "Present")
      ? "Present"
      : recs[0].status;
    const keepRecord = recs.find((r) => r.status === finalStatus) || recs[0];
    const toDelete = recs.filter(
      (r) => r._id.toString() !== keepRecord._id.toString(),
    );

    console.log(`--- تكرار: student=${studentId}, course=${courseId} ---`);
    recs.forEach((r) => {
      console.log(
        `  سجل ${r._id}: date=${r.date.toISOString()}, status=${r.status}`,
      );
    });
    console.log(`  → هنخلي: ${keepRecord._id} (status=${finalStatus})`);
    console.log(`  → هنمسح: ${toDelete.map((r) => r._id).join(", ")}\n`);

    affectedStudentIds.add(studentId);

    if (shouldApply) {
      // لازم نمسح السجلات المكررة الأول، قبل ما نغير تاريخ السجل الباقي،
      // عشان القيمة الجديدة اللي هنحطها ممكن تتصادم مع الـ unique index
      // لو السجل التاني (اللي هيتمسح) لسه موجود بنفس القيمة دي وقت الحفظ
      await Attendance.deleteMany({ _id: { $in: toDelete.map((r) => r._id) } });

      keepRecord.date = canonicalLocalDate(keepRecord.date);
      keepRecord.status = finalStatus;
      await keepRecord.save();
    }
  }

  console.log(`\nإجمالي المجموعات المكررة: ${duplicateGroupsCount}`);

  if (!shouldApply && duplicateGroupsCount > 0) {
    console.log("\n⚠️ ده عرض بس (dry run). عشان تطبقي التغييرات فعلياً شغلي:");
    console.log("   node scripts/dedupeAttendanceByLocalDay.js --apply");
  }

  if (shouldApply && affectedStudentIds.size > 0) {
    console.log("\nجاري إعادة حساب attendanceStats للطلبة المتأثرين...");
    for (const studentId of affectedStudentIds) {
      const student = await Student.findById(studentId);
      if (!student) continue;

      const studentRecords = await Attendance.find({ student: studentId });
      const byCourse = new Map();

      for (const rec of studentRecords) {
        const courseKey = rec.course.toString();
        const stats = byCourse.get(courseKey) || { present: 0, absent: 0 };
        if (rec.status === "Present") stats.present += 1;
        else if (rec.status !== "Excused") stats.absent += 1;
        byCourse.set(courseKey, stats);
      }

      for (const [courseKey, stats] of byCourse.entries()) {
        const total = stats.present + stats.absent;
        const percentage = total > 0 ? (stats.present / total) * 100 : 0;
        student.attendanceStats.set(courseKey, { ...stats, percentage });
      }

      await student.save();
      console.log(`  تم تحديث attendanceStats للطالب ${studentId}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nانتهى السكريبت");
}

run().catch((err) => {
  console.error("dedupeAttendanceByLocalDay error:", err);
  process.exit(1);
});
