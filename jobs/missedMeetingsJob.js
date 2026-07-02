// const cron = require("node-cron");
// const OnlineMeeting = require("../models/OnlineMeeting");
// const Student = require("../models/Student");
// const Announcement = require("../models/Announcement");

// async function processEndedMeetings() {
//   try {
//     const now = new Date();

//     // Meetings that ended, weren't cancelled, and haven't been processed yet.
//     const endedMeetings = await OnlineMeeting.find({
//       endsAt: { $lte: now },
//       status: { $ne: "cancelled" },
//       attendanceProcessed: false,
//     });

//     for (const meeting of endedMeetings) {
//       const attendedIds = new Set(
//         meeting.attendees.map((a) => a.student.toString()),
//       );

//       // Everyone enrolled in the course this meeting belongs to.
//       const enrolledStudents = await Student.find({
//         courses: meeting.course,
//       }).select("_id");

//       const missedStudents = enrolledStudents.filter(
//         (s) => !attendedIds.has(s._id.toString()),
//       );

//       if (missedStudents.length > 0) {
//         const docs = missedStudents.map((s) => ({
//           title: `⏰ You missed: ${meeting.title}`,
//           content: `You did not join the meeting "${meeting.title}" which took place on ${new Date(
//             meeting.startsAt,
//           ).toLocaleString()}. If you need the recap, please contact your professor.`,
//           type: "missed_meeting",
//           course: meeting.course,
//           posted_by: meeting.professor,
//           meeting: meeting._id,
//           target_student: s._id,
//           status: "active",
//         }));

//         await Announcement.insertMany(docs);
//       }

//       meeting.status = "completed";
//       meeting.attendanceProcessed = true;
//       await meeting.save();
//     }

//     if (endedMeetings.length > 0) {
//       console.log(
//         `[missedMeetingsJob] processed ${endedMeetings.length} ended meeting(s)`,
//       );
//     }
//   } catch (err) {
//     console.error("[missedMeetingsJob] error:", err);
//   }
// }

// // Runs every 10 minutes. Adjust the cron expression if you want it tighter
// // (e.g. "*/5 * * * *" for every 5 minutes).
// function startMissedMeetingsJob() {
//   cron.schedule("*/10 * * * *", processEndedMeetings);
//   console.log("[missedMeetingsJob] scheduled to run every 10 minutes");
// }

// module.exports = { startMissedMeetingsJob, processEndedMeetings };

const cron = require("node-cron");
const OnlineMeeting = require("../models/OnlineMeeting");
const Student = require("../models/Student");
const Announcement = require("../models/Announcement");
const Attendance = require("../models/Attendance");

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function processEndedMeetings() {
  try {
    const now = new Date();

    // Meetings that ended, weren't cancelled, and haven't been processed yet.
    const endedMeetings = await OnlineMeeting.find({
      endsAt: { $lte: now },
      status: { $ne: "cancelled" },
      attendanceProcessed: false,
    });

    for (const meeting of endedMeetings) {
      const attendedIds = new Set(
        meeting.attendees.map((a) => a.student.toString()),
      );

      // Everyone enrolled in the course this meeting belongs to.
      const enrolledStudents = await Student.find({
        courses: meeting.course,
      }).select("_id");

      const missedStudents = enrolledStudents.filter(
        (s) => !attendedIds.has(s._id.toString()),
      );

      if (missedStudents.length > 0) {
        const docs = missedStudents.map((s) => ({
          title: `⏰ You missed: ${meeting.title}`,
          content: `You did not join the meeting "${meeting.title}" which took place on ${new Date(
            meeting.startsAt,
          ).toLocaleString()}. If you need the recap, please contact your professor.`,
          type: "missed_meeting",
          course: meeting.course,
          posted_by: meeting.professor,
          meeting: meeting._id,
          target_student: s._id,
          status: "active",
        }));

        await Announcement.insertMany(docs);

        // Mark absence in the general attendance system, but only if there
        // isn't already an attendance record for that student/course/day
        // (so we never downgrade an existing "Present" from a physical
        // lecture taken the same day).
        const day = startOfDay(meeting.startsAt);
        await Promise.all(
          missedStudents.map((s) =>
            Attendance.findOneAndUpdate(
              { course: meeting.course, student: s._id, date: day },
              {
                $setOnInsert: { status: "Absent", markedBy: meeting.professor },
              },
              { upsert: true, setDefaultsOnInsert: true },
            ),
          ),
        );
      }

      meeting.status = "completed";
      meeting.attendanceProcessed = true;
      await meeting.save();
    }

    if (endedMeetings.length > 0) {
      console.log(
        `[missedMeetingsJob] processed ${endedMeetings.length} ended meeting(s)`,
      );
    }
  } catch (err) {
    console.error("[missedMeetingsJob] error:", err);
  }
}

// Runs every 10 minutes. Adjust the cron expression if you want it tighter
// (e.g. "*/5 * * * *" for every 5 minutes).
function startMissedMeetingsJob() {
  cron.schedule("*/10 * * * *", processEndedMeetings);
  console.log("[missedMeetingsJob] scheduled to run every 10 minutes");
}

module.exports = { startMissedMeetingsJob, processEndedMeetings };
