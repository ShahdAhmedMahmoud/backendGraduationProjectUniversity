// // const Announcement = require("../models/Announcement");
// // const crypto = require("crypto");

// // const Course = require("../models/Course");
// // const OnlineMeeting = require("../models/OnlineMeeting");
// // const Student = require("../models/Student");

// // function buildMeetingUrl(courseId) {
// //   const random = crypto.randomBytes(6).toString("hex");
// //   return `https://meet.jit.si/university-${courseId}-${random}`;
// // }

// // function isValidDate(value) {
// //   const date = new Date(value);
// //   return !Number.isNaN(date.getTime());
// // }

// // async function getProfessorCourse(courseId, professorId) {
// //   return Course.findOne({ _id: courseId, professors: professorId });
// // }

// // // exports.createMeeting = async (req, res) => {
// // //   try {
// // //     const { courseId, title, description, startsAt, endsAt, meetingUrl } = req.body;

// // //     if (!courseId || !title || !startsAt || !endsAt) {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: "courseId, title, startsAt and endsAt are required",
// // //       });
// // //     }

// // //     if (!isValidDate(startsAt) || !isValidDate(endsAt)) {
// // //       return res.status(400).json({ success: false, message: "Invalid meeting dates" });
// // //     }

// // //     const startDate = new Date(startsAt);
// // //     const endDate = new Date(endsAt);
// // //     if (endDate <= startDate) {
// // //       return res.status(400).json({ success: false, message: "endsAt must be after startsAt" });
// // //     }

// // //     const course = await getProfessorCourse(courseId, req.user.id);
// // //     if (!course) {
// // //       return res.status(403).json({
// // //         success: false,
// // //         message: "You are not assigned to this course",
// // //       });
// // //     }

// // //     const meeting = await OnlineMeeting.create({
// // //       title,
// // //       description: description || "",
// // //       course: courseId,
// // //       professor: req.user.id,
// // //       meetingUrl: meetingUrl || buildMeetingUrl(courseId),
// // //       startsAt: startDate,
// // //       endsAt: endDate,
// // //     });

// // //     const populated = await OnlineMeeting.findById(meeting._id)
// // //       .populate("course", "name code")
// // //       .populate("professor", "name email");

// // //     return res.status(201).json({
// // //       success: true,
// // //       message: "Online meeting created successfully",
// // //       data: populated,
// // //     });
// // //   } catch (err) {
// // //     console.error("createMeeting error:", err);
// // //     res.status(500).json({ success: false, message: err.message });
// // //   }
// // // };
// // exports.createMeeting = async (req, res) => {
// //   try {
// //     const { courseId, title, description, startsAt, endsAt, meetingUrl } =
// //       req.body;

// //     if (!courseId || !title || !startsAt || !endsAt) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "courseId, title, startsAt and endsAt are required",
// //       });
// //     }

// //     if (!isValidDate(startsAt) || !isValidDate(endsAt)) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid meeting dates" });
// //     }

// //     const startDate = new Date(startsAt);
// //     const endDate = new Date(endsAt);
// //     if (endDate <= startDate) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "endsAt must be after startsAt" });
// //     }

// //     const course = await getProfessorCourse(courseId, req.user.id);
// //     if (!course) {
// //       return res.status(403).json({
// //         success: false,
// //         message: "You are not assigned to this course",
// //       });
// //     }

// //     // Create the meeting
// //     const meeting = await OnlineMeeting.create({
// //       title,
// //       description: description || "",
// //       course: courseId,
// //       professor: req.user.id,
// //       meetingUrl: meetingUrl || buildMeetingUrl(courseId),
// //       startsAt: startDate,
// //       endsAt: endDate,
// //     });

// //     // Create announcement for the meeting
// //     const announcement = await Announcement.create({
// //       title: `📹 New Meeting: ${title}`,
// //       content: `Professor has scheduled a new meeting: ${title}\n\nTime: ${new Date(startDate).toLocaleString()}\n\nDescription: ${description || "No description provided"}`,
// //       type: "meeting",
// //       course: courseId,
// //       posted_by: req.user.id,
// //       meeting: meeting._id,
// //       status: "active",
// //       expires_at: endDate,
// //     });

// //     // Populate and return the meeting with announcement info
// //     const populated = await OnlineMeeting.findById(meeting._id)
// //       .populate("course", "name code")
// //       .populate("professor", "name email");

// //     return res.status(201).json({
// //       success: true,
// //       message:
// //         "Online meeting created successfully and announcement sent to students",
// //       data: populated,
// //       announcement: announcement,
// //     });
// //   } catch (err) {
// //     console.error("createMeeting error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };
// // exports.getProfessorMeetings = async (req, res) => {
// //   try {
// //     const query = { professor: req.user.id };
// //     if (req.query.courseId) query.course = req.query.courseId;
// //     if (req.query.status) query.status = req.query.status;

// //     const meetings = await OnlineMeeting.find(query)
// //       .populate("course", "name code")
// //       .sort({ startsAt: 1 });

// //     res.json({
// //       success: true,
// //       message: "Meetings fetched successfully",
// //       data: meetings,
// //     });
// //   } catch (err) {
// //     console.error("getProfessorMeetings error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // exports.updateMeeting = async (req, res) => {
// //   try {
// //     const meeting = await OnlineMeeting.findOne({
// //       _id: req.params.id,
// //       professor: req.user.id,
// //     });

// //     if (!meeting) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "Meeting not found" });
// //     }

// //     const allowed = [
// //       "title",
// //       "description",
// //       "meetingUrl",
// //       "startsAt",
// //       "endsAt",
// //     ];
// //     allowed.forEach((field) => {
// //       if (req.body[field] !== undefined) meeting[field] = req.body[field];
// //     });

// //     if (!isValidDate(meeting.startsAt) || !isValidDate(meeting.endsAt)) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid meeting dates" });
// //     }

// //     if (new Date(meeting.endsAt) <= new Date(meeting.startsAt)) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "endsAt must be after startsAt" });
// //     }

// //     await meeting.save();

// //     const populated = await OnlineMeeting.findById(meeting._id)
// //       .populate("course", "name code")
// //       .populate("professor", "name email");

// //     res.json({
// //       success: true,
// //       message: "Meeting updated successfully",
// //       data: populated,
// //     });
// //   } catch (err) {
// //     console.error("updateMeeting error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // exports.cancelMeeting = async (req, res) => {
// //   try {
// //     const meeting = await OnlineMeeting.findOneAndUpdate(
// //       { _id: req.params.id, professor: req.user.id },
// //       { status: "cancelled" },
// //       { new: true },
// //     ).populate("course", "name code");

// //     if (!meeting) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "Meeting not found" });
// //     }

// //     res.json({
// //       success: true,
// //       message: "Meeting cancelled successfully",
// //       data: meeting,
// //     });
// //   } catch (err) {
// //     console.error("cancelMeeting error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // exports.getStudentMeetings = async (req, res) => {
// //   try {
// //     const student = await Student.findById(req.user.id).select("courses");
// //     if (!student) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "Student not found" });
// //     }

// //     const query = {
// //       course: { $in: student.courses },
// //       status: "scheduled",
// //     };

// //     if (req.query.courseId) {
// //       const isEnrolled = student.courses.some(
// //         (id) => id.toString() === req.query.courseId,
// //       );
// //       if (!isEnrolled) {
// //         return res.status(403).json({
// //           success: false,
// //           message: "You are not enrolled in this course",
// //         });
// //       }
// //       query.course = req.query.courseId;
// //     }

// //     const meetings = await OnlineMeeting.find(query)
// //       .populate("course", "name code")
// //       .populate("professor", "name email")
// //       .sort({ startsAt: 1 });

// //     res.json({
// //       success: true,
// //       message: "Meetings fetched successfully",
// //       data: meetings,
// //     });
// //   } catch (err) {
// //     console.error("getStudentMeetings error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// const Announcement = require("../models/Announcement");
// const crypto = require("crypto");

// const Course = require("../models/Course");
// const OnlineMeeting = require("../models/OnlineMeeting");
// const Student = require("../models/Student");

// function buildMeetingUrl(courseId) {
//   const random = crypto.randomBytes(6).toString("hex");
//   return `https://meet.jit.si/university-${courseId}-${random}`;
// }

// function isValidDate(value) {
//   const date = new Date(value);
//   return !Number.isNaN(date.getTime());
// }

// async function getProfessorCourse(courseId, professorId) {
//   return Course.findOne({ _id: courseId, professors: professorId });
// }

// exports.createMeeting = async (req, res) => {
//   try {
//     const { courseId, title, description, startsAt, endsAt, meetingUrl } =
//       req.body;

//     if (!courseId || !title || !startsAt || !endsAt) {
//       return res.status(400).json({
//         success: false,
//         message: "courseId, title, startsAt and endsAt are required",
//       });
//     }

//     if (!isValidDate(startsAt) || !isValidDate(endsAt)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid meeting dates" });
//     }

//     const startDate = new Date(startsAt);
//     const endDate = new Date(endsAt);
//     if (endDate <= startDate) {
//       return res
//         .status(400)
//         .json({ success: false, message: "endsAt must be after startsAt" });
//     }

//     const course = await getProfessorCourse(courseId, req.user.id);
//     if (!course) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this course",
//       });
//     }

//     // Create the meeting
//     const meeting = await OnlineMeeting.create({
//       title,
//       description: description || "",
//       course: courseId,
//       professor: req.user.id,
//       meetingUrl: meetingUrl || buildMeetingUrl(courseId),
//       startsAt: startDate,
//       endsAt: endDate,
//     });

//     // Create announcement for the meeting
//     const announcement = await Announcement.create({
//       title: `📹 New Meeting: ${title}`,
//       content: `Professor has scheduled a new meeting: ${title}\n\nTime: ${new Date(startDate).toLocaleString()}\n\nDescription: ${description || "No description provided"}`,
//       type: "meeting",
//       course: courseId,
//       posted_by: req.user.id,
//       meeting: meeting._id,
//       status: "active",
//       expires_at: endDate,
//     });

//     // Populate and return the meeting with announcement info
//     const populated = await OnlineMeeting.findById(meeting._id)
//       .populate("course", "name code")
//       .populate("professor", "name email");

//     return res.status(201).json({
//       success: true,
//       message:
//         "Online meeting created successfully and announcement sent to students",
//       data: populated,
//       announcement: announcement,
//     });
//   } catch (err) {
//     console.error("createMeeting error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getProfessorMeetings = async (req, res) => {
//   try {
//     const query = { professor: req.user.id };
//     if (req.query.courseId) query.course = req.query.courseId;
//     if (req.query.status) query.status = req.query.status;

//     const meetings = await OnlineMeeting.find(query)
//       .populate("course", "name code")
//       .sort({ startsAt: 1 });

//     res.json({
//       success: true,
//       message: "Meetings fetched successfully",
//       data: meetings,
//     });
//   } catch (err) {
//     console.error("getProfessorMeetings error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.updateMeeting = async (req, res) => {
//   try {
//     const meeting = await OnlineMeeting.findOne({
//       _id: req.params.id,
//       professor: req.user.id,
//     });

//     if (!meeting) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Meeting not found" });
//     }

//     const allowed = [
//       "title",
//       "description",
//       "meetingUrl",
//       "startsAt",
//       "endsAt",
//     ];
//     allowed.forEach((field) => {
//       if (req.body[field] !== undefined) meeting[field] = req.body[field];
//     });

//     if (!isValidDate(meeting.startsAt) || !isValidDate(meeting.endsAt)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid meeting dates" });
//     }

//     if (new Date(meeting.endsAt) <= new Date(meeting.startsAt)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "endsAt must be after startsAt" });
//     }

//     await meeting.save();

//     const populated = await OnlineMeeting.findById(meeting._id)
//       .populate("course", "name code")
//       .populate("professor", "name email");

//     res.json({
//       success: true,
//       message: "Meeting updated successfully",
//       data: populated,
//     });
//   } catch (err) {
//     console.error("updateMeeting error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.cancelMeeting = async (req, res) => {
//   try {
//     const meeting = await OnlineMeeting.findOneAndUpdate(
//       { _id: req.params.id, professor: req.user.id },
//       { status: "cancelled" },
//       { new: true },
//     ).populate("course", "name code");

//     if (!meeting) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Meeting not found" });
//     }

//     res.json({
//       success: true,
//       message: "Meeting cancelled successfully",
//       data: meeting,
//     });
//   } catch (err) {
//     console.error("cancelMeeting error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getStudentMeetings = async (req, res) => {
//   try {
//     const student = await Student.findById(req.user.id).select("courses");
//     if (!student) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Student not found" });
//     }

//     const query = {
//       course: { $in: student.courses },
//       status: "scheduled",
//     };

//     if (req.query.courseId) {
//       const isEnrolled = student.courses.some(
//         (id) => id.toString() === req.query.courseId,
//       );
//       if (!isEnrolled) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not enrolled in this course",
//         });
//       }
//       query.course = req.query.courseId;
//     }

//     const meetings = await OnlineMeeting.find(query)
//       .populate("course", "name code")
//       .populate("professor", "name email")
//       .sort({ startsAt: 1 });

//     res.json({
//       success: true,
//       message: "Meetings fetched successfully",
//       data: meetings,
//     });
//   } catch (err) {
//     console.error("getStudentMeetings error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // STUDENT JOINS A MEETING -> records attendance, then the frontend opens
// // the meetingUrl. This is what lets the "missed meeting" job know who
// // actually attended.
// exports.joinMeeting = async (req, res) => {
//   try {
//     const meeting = await OnlineMeeting.findById(req.params.id);

//     if (!meeting) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Meeting not found" });
//     }

//     if (meeting.status === "cancelled") {
//       return res
//         .status(400)
//         .json({ success: false, message: "This meeting was cancelled" });
//     }

//     const student = await Student.findById(req.user.id).select("courses");
//     const isEnrolled = student?.courses?.some(
//       (id) => id.toString() === meeting.course.toString(),
//     );
//     if (!isEnrolled) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not enrolled in this course",
//       });
//     }

//     const alreadyJoined = meeting.attendees.some(
//       (a) => a.student.toString() === req.user.id,
//     );

//     if (!alreadyJoined) {
//       meeting.attendees.push({ student: req.user.id, joinedAt: new Date() });
//       await meeting.save();
//     }

//     return res.json({
//       success: true,
//       message: "Attendance recorded",
//       data: { meetingUrl: meeting.meetingUrl },
//     });
//   } catch (err) {
//     console.error("joinMeeting error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const Announcement = require("../models/Announcement");
const crypto = require("crypto");

const Course = require("../models/Course");
const OnlineMeeting = require("../models/OnlineMeeting");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildMeetingUrl(courseId) {
  const random = crypto.randomBytes(6).toString("hex");
  return `https://meet.jit.si/university-${courseId}-${random}`;
}

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

// Normalizes a date to midnight UTC so the (course, student, date) unique
// index treats the same meeting-day consistently, regardless of the exact
// time the meeting started.
function toDateOnly(value) {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function getProfessorCourse(courseId, professorId) {
  return Course.findOne({ _id: courseId, professors: professorId });
}

exports.createMeeting = async (req, res) => {
  try {
    const { courseId, title, description, startsAt, endsAt, meetingUrl } =
      req.body;

    if (!courseId || !title || !startsAt || !endsAt) {
      return res.status(400).json({
        success: false,
        message: "courseId, title, startsAt and endsAt are required",
      });
    }

    if (!isValidDate(startsAt) || !isValidDate(endsAt)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid meeting dates" });
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (endDate <= startDate) {
      return res
        .status(400)
        .json({ success: false, message: "endsAt must be after startsAt" });
    }

    const course = await getProfessorCourse(courseId, req.user.id);
    if (!course) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this course",
      });
    }

    // Create the meeting
    const meeting = await OnlineMeeting.create({
      title,
      description: description || "",
      course: courseId,
      professor: req.user.id,
      meetingUrl: meetingUrl || buildMeetingUrl(courseId),
      startsAt: startDate,
      endsAt: endDate,
    });

    // Create announcement for the meeting
    const announcement = await Announcement.create({
      title: `📹 New Meeting: ${title}`,
      content: `Professor has scheduled a new meeting: ${title}\n\nTime: ${new Date(startDate).toLocaleString()}\n\nDescription: ${description || "No description provided"}`,
      type: "meeting",
      course: courseId,
      posted_by: req.user.id,
      meeting: meeting._id,
      status: "active",
      expires_at: endDate,
    });

    // Populate and return the meeting with announcement info
    const populated = await OnlineMeeting.findById(meeting._id)
      .populate("course", "name code")
      .populate("professor", "name email");

    return res.status(201).json({
      success: true,
      message:
        "Online meeting created successfully and announcement sent to students",
      data: populated,
      announcement: announcement,
    });
  } catch (err) {
    console.error("createMeeting error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfessorMeetings = async (req, res) => {
  try {
    const query = { professor: req.user.id };
    if (req.query.courseId) query.course = req.query.courseId;
    if (req.query.status) query.status = req.query.status;

    const meetings = await OnlineMeeting.find(query)
      .populate("course", "name code")
      .sort({ startsAt: 1 });

    res.json({
      success: true,
      message: "Meetings fetched successfully",
      data: meetings,
    });
  } catch (err) {
    console.error("getProfessorMeetings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DEBUG/VERIFY: returns one meeting with attendee names populated
// (instead of raw IDs), so you can check attendance quickly from Postman.
exports.getMeetingAttendees = async (req, res) => {
  try {
    const meeting = await OnlineMeeting.findOne({
      _id: req.params.id,
      professor: req.user.id,
    })
      .populate("course", "name code")
      .populate("attendees.student", "full_name email student_id");

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    res.json({
      success: true,
      message: "Attendance fetched successfully",
      data: {
        title: meeting.title,
        course: meeting.course,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
        status: meeting.status,
        attendanceProcessed: meeting.attendanceProcessed,
        totalAttendees: meeting.attendees.length,
        attendees: meeting.attendees,
      },
    });
  } catch (err) {
    console.error("getMeetingAttendees error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await OnlineMeeting.findOne({
      _id: req.params.id,
      professor: req.user.id,
    });

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const allowed = [
      "title",
      "description",
      "meetingUrl",
      "startsAt",
      "endsAt",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) meeting[field] = req.body[field];
    });

    if (!isValidDate(meeting.startsAt) || !isValidDate(meeting.endsAt)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid meeting dates" });
    }

    if (new Date(meeting.endsAt) <= new Date(meeting.startsAt)) {
      return res
        .status(400)
        .json({ success: false, message: "endsAt must be after startsAt" });
    }

    await meeting.save();

    const populated = await OnlineMeeting.findById(meeting._id)
      .populate("course", "name code")
      .populate("professor", "name email");

    res.json({
      success: true,
      message: "Meeting updated successfully",
      data: populated,
    });
  } catch (err) {
    console.error("updateMeeting error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelMeeting = async (req, res) => {
  try {
    const meeting = await OnlineMeeting.findOneAndUpdate(
      { _id: req.params.id, professor: req.user.id },
      { status: "cancelled" },
      { new: true },
    ).populate("course", "name code");

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    res.json({
      success: true,
      message: "Meeting cancelled successfully",
      data: meeting,
    });
  } catch (err) {
    console.error("cancelMeeting error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentMeetings = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("courses");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const query = {
      course: { $in: student.courses },
      status: "scheduled",
    };

    if (req.query.courseId) {
      const isEnrolled = student.courses.some(
        (id) => id.toString() === req.query.courseId,
      );
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in this course",
        });
      }
      query.course = req.query.courseId;
    }

    const meetings = await OnlineMeeting.find(query)
      .populate("course", "name code")
      .populate("professor", "name email")
      .sort({ startsAt: 1 });

    res.json({
      success: true,
      message: "Meetings fetched successfully",
      data: meetings,
    });
  } catch (err) {
    console.error("getStudentMeetings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// STUDENT JOINS A MEETING -> records attendance, then the frontend opens
// the meetingUrl. This is what lets the "missed meeting" job know who
// actually attended.
exports.joinMeeting = async (req, res) => {
  try {
    const meeting = await OnlineMeeting.findById(req.params.id);

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    if (meeting.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "This meeting was cancelled" });
    }

    const student = await Student.findById(req.user.id).select("courses");
    const isEnrolled = student?.courses?.some(
      (id) => id.toString() === meeting.course.toString(),
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const alreadyJoined = meeting.attendees.some(
      (a) => a.student.toString() === req.user.id,
    );

    if (!alreadyJoined) {
      meeting.attendees.push({ student: req.user.id, joinedAt: new Date() });
      await meeting.save();
    }

    // Reflect this in the general attendance system too, so it shows up
    // on the student's attendance dashboard for the course.
    await Attendance.findOneAndUpdate(
      {
        course: meeting.course,
        student: req.user.id,
        date: startOfDay(meeting.startsAt),
      },
      { $set: { status: "Present", markedBy: meeting.professor } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({
      success: true,
      message: "Attendance recorded",
      data: { meetingUrl: meeting.meetingUrl },
    });
  } catch (err) {
    console.error("joinMeeting error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
