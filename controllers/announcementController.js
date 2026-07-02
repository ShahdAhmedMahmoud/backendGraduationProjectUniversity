// const Announcement = require("../models/Announcement");
// const Student = require("../models/Student");
// const Course = require("../models/Course");
// const Professor = require("../models/Professor");

// // GET STUDENT ANNOUNCEMENTS FOR ENROLLED COURSES
// exports.getStudentAnnouncements = async (req, res) => {
//   try {
//     const student = await Student.findById(req.user.id).select("courses");
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     const query = {
//       course: { $in: student.courses },
//       status: "active"
//     };

//     if (req.query.courseId) {
//       const isEnrolled = student.courses.some((id) => id.toString() === req.query.courseId);
//       if (!isEnrolled) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not enrolled in this course",
//         });
//       }
//       query.course = req.query.courseId;
//     }

//     if (req.query.type) {
//       query.type = req.query.type;
//     }

//     const announcements = await Announcement.find(query)
//       .populate("course", "name code")
//       .populate("posted_by", "name email")
//       .populate("meeting", "title startsAt endsAt meetingUrl")
//       .sort({ created_at: -1 });

//     res.json({
//       success: true,
//       message: "Announcements fetched successfully",
//       data: announcements
//     });
//   } catch (err) {
//     console.error("getStudentAnnouncements error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET PROFESSOR ANNOUNCEMENTS FOR THEIR COURSES
// exports.getProfessorAnnouncements = async (req, res) => {
//   try {
//     const professor = await Professor.findById(req.user.id).select("courses");
//     if (!professor) {
//       return res.status(404).json({ success: false, message: "Professor not found" });
//     }

//     const query = {
//       course: { $in: professor.courses }
//     };

//     if (req.query.courseId) {
//       const hasCourse = professor.courses.some((id) => id.toString() === req.query.courseId);
//       if (!hasCourse) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not assigned to this course",
//         });
//       }
//       query.course = req.query.courseId;
//     }

//     if (req.query.status) {
//       query.status = req.query.status;
//     }

//     const announcements = await Announcement.find(query)
//       .populate("course", "name code")
//       .populate("posted_by", "name email")
//       .populate("meeting", "title startsAt endsAt meetingUrl")
//       .sort({ created_at: -1 });

//     res.json({
//       success: true,
//       message: "Announcements fetched successfully",
//       data: announcements
//     });
//   } catch (err) {
//     console.error("getProfessorAnnouncements error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // CREATE ANNOUNCEMENT
// exports.createAnnouncement = async (req, res) => {
//   try {
//     const { title, content, courseId, type } = req.body;

//     if (!title || !content || !courseId) {
//       return res.status(400).json({
//         success: false,
//         message: "title, content, and courseId are required",
//       });
//     }

//     const course = await Course.findOne({
//       _id: courseId,
//       professors: req.user.id
//     });

//     if (!course) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this course",
//       });
//     }

//     const announcement = await Announcement.create({
//       title,
//       content,
//       course: courseId,
//       posted_by: req.user.id,
//       type: type || 'general',
//       status: 'active'
//     });

//     const populated = await Announcement.findById(announcement._id)
//       .populate("course", "name code")
//       .populate("posted_by", "name email");

//     res.status(201).json({
//       success: true,
//       message: "Announcement created successfully",
//       data: populated
//     });
//   } catch (err) {
//     console.error("createAnnouncement error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // MARK ANNOUNCEMENT AS READ
// exports.markAsRead = async (req, res) => {
//   try {
//     const { announcementId } = req.params;

//     const announcement = await Announcement.findByIdAndUpdate(
//       announcementId,
//       {
//         $addToSet: {
//           read_by: {
//             student_id: req.user.id,
//             read_at: new Date()
//           }
//         }
//       },
//       { new: true }
//     ).populate("course", "name code")
//      .populate("posted_by", "name email");

//     if (!announcement) {
//       return res.status(404).json({
//         success: false,
//         message: "Announcement not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Announcement marked as read",
//       data: announcement
//     });
//   } catch (err) {
//     console.error("markAsRead error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET ANNOUNCEMENT DETAILS
// exports.getAnnouncement = async (req, res) => {
//   try {
//     const announcement = await Announcement.findById(req.params.id)
//       .populate("course", "name code")
//       .populate("posted_by", "name email")
//       .populate("meeting", "title startsAt endsAt meetingUrl");

//     if (!announcement) {
//       return res.status(404).json({
//         success: false,
//         message: "Announcement not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Announcement retrieved successfully",
//       data: announcement
//     });
//   } catch (err) {
//     console.error("getAnnouncement error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ARCHIVE ANNOUNCEMENT
// exports.archiveAnnouncement = async (req, res) => {
//   try {
//     const announcement = await Announcement.findOne({
//       _id: req.params.id,
//       posted_by: req.user.id
//     });

//     if (!announcement) {
//       return res.status(404).json({
//         success: false,
//         message: "Announcement not found or you don't have permission"
//       });
//     }

//     announcement.status = 'archived';
//     await announcement.save();

//     res.json({
//       success: true,
//       message: "Announcement archived successfully",
//       data: announcement
//     });
//   } catch (err) {
//     console.error("archiveAnnouncement error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const Announcement = require("../models/Announcement");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Professor = require("../models/Professor");

// Removes announcements whose linked meeting has already ended, UNLESS the
// announcement itself is the "missed_meeting" one generated for that
// meeting (those should stay visible - they're the whole point).
function filterExpiredMeetings(announcements) {
  const now = Date.now();
  return announcements.filter((a) => {
    if (a.type !== "meeting" || !a.meeting) return true;
    const endsAt = a.meeting.endsAt
      ? new Date(a.meeting.endsAt).getTime()
      : null;
    if (endsAt === null) return true;
    return endsAt >= now;
  });
}

// GET STUDENT ANNOUNCEMENTS FOR ENROLLED COURSES
exports.getStudentAnnouncements = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("courses");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const query = {
      course: { $in: student.courses },
      status: "active",
      // Show course-wide announcements (target_student: null) plus any
      // personal ones addressed to this student (e.g. missed meeting).
      $or: [{ target_student: null }, { target_student: req.user.id }],
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

    if (req.query.type) {
      query.type = req.query.type;
    }

    let announcements = await Announcement.find(query)
      .populate("course", "name code")
      .populate("posted_by", "name email")
      .populate("meeting", "title startsAt endsAt meetingUrl")
      .sort({ created_at: -1 });

    announcements = filterExpiredMeetings(announcements);

    res.json({
      success: true,
      message: "Announcements fetched successfully",
      data: announcements,
    });
  } catch (err) {
    console.error("getStudentAnnouncements error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET PROFESSOR ANNOUNCEMENTS FOR THEIR COURSES
exports.getProfessorAnnouncements = async (req, res) => {
  try {
    const professor = await Professor.findById(req.user.id).select("courses");
    if (!professor) {
      return res
        .status(404)
        .json({ success: false, message: "Professor not found" });
    }

    const query = {
      course: { $in: professor.courses },
      // Professors see the course-wide announcements they manage, not the
      // per-student "missed meeting" system notes generated for students.
      type: { $ne: "missed_meeting" },
    };

    if (req.query.courseId) {
      const hasCourse = professor.courses.some(
        (id) => id.toString() === req.query.courseId,
      );
      if (!hasCourse) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this course",
        });
      }
      query.course = req.query.courseId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    let announcements = await Announcement.find(query)
      .populate("course", "name code")
      .populate("posted_by", "name email")
      .populate("meeting", "title startsAt endsAt meetingUrl")
      .sort({ created_at: -1 });

    announcements = filterExpiredMeetings(announcements);

    res.json({
      success: true,
      message: "Announcements fetched successfully",
      data: announcements,
    });
  } catch (err) {
    console.error("getProfessorAnnouncements error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE ANNOUNCEMENT
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, courseId, type } = req.body;

    if (!title || !content || !courseId) {
      return res.status(400).json({
        success: false,
        message: "title, content, and courseId are required",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      professors: req.user.id,
    });

    if (!course) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this course",
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      course: courseId,
      posted_by: req.user.id,
      type: type || "general",
      status: "active",
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("course", "name code")
      .populate("posted_by", "name email");

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: populated,
    });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// MARK ANNOUNCEMENT AS READ
exports.markAsRead = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      {
        $addToSet: {
          read_by: {
            student_id: req.user.id,
            read_at: new Date(),
          },
        },
      },
      { new: true },
    )
      .populate("course", "name code")
      .populate("posted_by", "name email");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      message: "Announcement marked as read",
      data: announcement,
    });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ANNOUNCEMENT DETAILS
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("course", "name code")
      .populate("posted_by", "name email")
      .populate("meeting", "title startsAt endsAt meetingUrl");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      message: "Announcement retrieved successfully",
      data: announcement,
    });
  } catch (err) {
    console.error("getAnnouncement error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ARCHIVE ANNOUNCEMENT
exports.archiveAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      posted_by: req.user.id,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found or you don't have permission",
      });
    }

    announcement.status = "archived";
    await announcement.save();

    res.json({
      success: true,
      message: "Announcement archived successfully",
      data: announcement,
    });
  } catch (err) {
    console.error("archiveAnnouncement error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
