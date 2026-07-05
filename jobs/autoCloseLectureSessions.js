// // cron/autoCloseLectureSessions.js
// //
// // الهدف: أي LectureSession فات معادها (expiresAt < now) ولسه isActive: true
// // يتقفل تلقائي، بنفس بالظبط منطق closeLectureSession:
// //   - يسجل "Absent" لأي طالب مسجلش حضور فيها
// //   - يزود course.totalLectures لو لسه ماتزودتش (عشان المحاضرة دي محصلش
// //     ليها Attendance record خالص قبل كده)
// //
// // كده بنضمن إن أي محاضرة اتحسبت في totalLectures، يبقى معاها
// // present + absent = عدد الطلبة المسجلين فيها دايماً، ومفيش فجوة
// // بين الرقمين زي اللي كانت بتظهر لما البروفيسور ينسى يقفل الـ QR session.

// const cron = require("node-cron");
// const LectureSession = require("../models/LectureSession");
// const Attendance = require("../models/Attendance");
// const Course = require("../models/Course");
// const { applyAttendanceStatus } = require("../utils/attendanceStats");

// async function closeExpiredSession(session) {
//   // نجيب الكورس بكل بياناته المطلوبة (لازم نعمل populate هنا
//   // لأن الـ session جاي من find() عادي مش findLectureSession)
//   const course = await Course.findById(session.course).populate(
//     "students",
//     "_id full_name attendanceStats"
//   );

//   if (!course) {
//     console.error(`autoCloseLectureSessions: course not found for session ${session._id}`);
//     return;
//   }

//   const enrolledStudents = course.students || [];

//   // نزود total lectures لو المحاضرة دي لسه محصلش ليها ولا Attendance record
//   const lectureAlreadyCounted = await Attendance.exists({
//     course: course._id,
//     date: session.lectureDate
//   });

//   if (!lectureAlreadyCounted) {
//     await Course.findByIdAndUpdate(course._id, { $inc: { totalLectures: 1 } });
//   }

//   for (const enrolledStudent of enrolledStudents) {
//     const existingAttendance = await Attendance.findOne({
//       course: course._id,
//       student: enrolledStudent._id,
//       date: session.lectureDate
//     });

//     // لو الطالب أصلاً عنده حضور أو غياب متسجل، سيبيه زي ما هو
//     if (existingAttendance) {
//       continue;
//     }

//     await Attendance.findOneAndUpdate(
//       {
//         course: course._id,
//         student: enrolledStudent._id,
//         date: session.lectureDate
//       },
//       {
//         course: course._id,
//         student: enrolledStudent._id,
//         date: session.lectureDate,
//         status: "Absent",
//         markedBy: session.professor
//       },
//       {
//         new: true,
//         upsert: true,
//         setDefaultsOnInsert: true
//       }
//     );

//     applyAttendanceStatus(enrolledStudent, course._id, existingAttendance?.status, "Absent");
//     await enrolledStudent.save();
//   }

//   session.isActive = false;
//   await session.save();

//   console.log(
//     `autoCloseLectureSessions: closed session ${session._id} for course ${course.name || course._id}`
//   );
// }

// async function runAutoCloseSweep() {
//   try {
//     const expiredSessions = await LectureSession.find({
//       isActive: true,
//       expiresAt: { $lt: new Date() }
//     });

//     if (expiredSessions.length === 0) return;

//     console.log(`autoCloseLectureSessions: found ${expiredSessions.length} expired session(s) to close`);

//     for (const session of expiredSessions) {
//       await closeExpiredSession(session);
//     }
//   } catch (err) {
//     console.error("autoCloseLectureSessions sweep error:", err);
//   }
// }

// // بيشتغل كل 5 دقايق - عدليها براحتك حسب احتياجك
// function startAutoCloseLectureSessionsJob() {
//   cron.schedule("*/5 * * * *", () => {
//     runAutoCloseSweep();
//   });

//   console.log("autoCloseLectureSessions cron job started (every 5 minutes)");
// }

// module.exports = {
//   startAutoCloseLectureSessionsJob,
//   runAutoCloseSweep // مفيدة لو حبيتي تعمليها test يدوي أو تشغليها مرة واحدة
// };
// cron/autoCloseLectureSessions.js
//
// الهدف: أي LectureSession فات معادها (expiresAt < now) ولسه isActive: true
// يتقفل تلقائي، بنفس بالظبط منطق closeLectureSession:
//   - يسجل "Absent" لأي طالب مسجلش حضور فيها
//   - يزود course.totalLectures لو لسه ماتزودتش (عشان المحاضرة دي محصلش
//     ليها Attendance record خالص قبل كده)
//
// كده بنضمن إن أي محاضرة اتحسبت في totalLectures، يبقى معاها
// present + absent = عدد الطلبة المسجلين فيها دايماً، ومفيش فجوة
// بين الرقمين زي اللي كانت بتظهر لما البروفيسور ينسى يقفل الـ QR session.

const cron = require("node-cron");
const LectureSession = require("../models/LectureSession");
const Attendance = require("../models/Attendance");
const Course = require("../models/Course");
const { applyAttendanceStatus } = require("../utils/attendanceStats");

async function closeExpiredSession(session) {
  // نجيب الكورس بكل بياناته المطلوبة (لازم نعمل populate هنا
  // لأن الـ session جاي من find() عادي مش findLectureSession)
  const course = await Course.findById(session.course).populate(
    "students",
    "_id full_name attendanceStats",
  );

  if (!course) {
    console.error(
      `autoCloseLectureSessions: course not found for session ${session._id}`,
    );
    return;
  }

  const enrolledStudents = course.students || [];

  // ملحوظة: مش محتاجين نزود totalLectures هنا - هي بتتزود لحظة عمل
  // الـ QR (في generateLectureQr)، يعني أي session وصلت هنا معناها
  // المحاضرة أصلاً محسوبة بالفعل في totalLectures.

  for (const enrolledStudent of enrolledStudents) {
    const existingAttendance = await Attendance.findOne({
      course: course._id,
      student: enrolledStudent._id,
      date: session.lectureDate,
    });

    // لو الطالب أصلاً عنده حضور أو غياب متسجل، سيبيه زي ما هو
    if (existingAttendance) {
      continue;
    }

    await Attendance.findOneAndUpdate(
      {
        course: course._id,
        student: enrolledStudent._id,
        date: session.lectureDate,
      },
      {
        course: course._id,
        student: enrolledStudent._id,
        date: session.lectureDate,
        status: "Absent",
        markedBy: session.professor,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    applyAttendanceStatus(
      enrolledStudent,
      course._id,
      existingAttendance?.status,
      "Absent",
    );
    await enrolledStudent.save();
  }

  session.isActive = false;
  await session.save();

  console.log(
    `autoCloseLectureSessions: closed session ${session._id} for course ${course.name || course._id}`,
  );
}

async function runAutoCloseSweep() {
  try {
    const expiredSessions = await LectureSession.find({
      isActive: true,
      expiresAt: { $lt: new Date() },
    });

    if (expiredSessions.length === 0) return;

    console.log(
      `autoCloseLectureSessions: found ${expiredSessions.length} expired session(s) to close`,
    );

    for (const session of expiredSessions) {
      await closeExpiredSession(session);
    }
  } catch (err) {
    console.error("autoCloseLectureSessions sweep error:", err);
  }
}

// بيشتغل كل 5 دقايق - عدليها براحتك حسب احتياجك
function startAutoCloseLectureSessionsJob() {
  cron.schedule("*/5 * * * *", () => {
    runAutoCloseSweep();
  });

  console.log("autoCloseLectureSessions cron job started (every 5 minutes)");
}

module.exports = {
  startAutoCloseLectureSessionsJob,
  runAutoCloseSweep, // مفيدة لو حبيتي تعمليها test يدوي أو تشغليها مرة واحدة
};
