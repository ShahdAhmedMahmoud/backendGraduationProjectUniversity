// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs-extra");

// const LectureSlides = require("../models/LectureSlidesModel");
// const Professor = require("../models/Professor");
// const Course = require("../models/Course");
// const sendNotification = require("../utils/sendNotification");
// const professorAuth = require("../middlewares/professorAuth");
// const studentAuth = require("../middlewares/studentAuth");

// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     const courseId = req.query.courseId;
//     if (!courseId) return cb(new Error("courseId is required"));

//     const uploadDir = path.join("uploads/slides", courseId);
//     await fs.ensureDir(uploadDir);
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const requestedType = (req.query.type || "lecture").toString().toLowerCase();
//     const allowedByType = {
//       lecture: [".pdf", ".ppt", ".pptx", ".doc", ".docx"],
//       sheet: [".pdf", ".ppt", ".pptx", ".doc", ".docx"],
//       recording: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
//       book: [".pdf", ".epub", ".mobi"],
//     };
//     const fallbackAllowed = [
//       ".pdf",
//       ".ppt",
//       ".pptx",
//       ".doc",
//       ".docx",
//       ".mp4",
//       ".mov",
//       ".avi",
//       ".mkv",
//       ".webm",
//       ".epub",
//       ".mobi",
//     ];
//     const ext = path.extname(file.originalname).toLowerCase();
//     const allowedForType = allowedByType[requestedType] || fallbackAllowed;

//     // We rely on extension because some browsers send generic mime types.
//     if (!allowedForType.includes(ext)) {
//       return cb(new Error("Invalid file type"));
//     }
//     cb(null, true);
//   },
// });

// function buildNotification(type, title) {
//   if (type === "sheet") {
//     return {
//       notificationTitle: "New Sheet",
//       notificationMessage: `New sheet uploaded: ${title}`,
//     };
//   }

//   if (type === "recording") {
//     return {
//       notificationTitle: "New Recording",
//       notificationMessage: `New recording uploaded: ${title}`,
//     };
//   }
//   if (type === "book") {
//     return {
//       notificationTitle: "New Book",
//       notificationMessage: `New book uploaded: ${title}`,
//     };
//   }

//   return {
//     notificationTitle: "New Lecture Slide",
//     notificationMessage: `New lecture uploaded: ${title}`,
//   };
// }

// router.post(
//   "/upload",
//   professorAuth,
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const { title } = req.body;
//       const courseId = req.query.courseId;
//       const type = req.query.type || "lecture";

//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ success: false, message: "No file uploaded" });
//       }

//       if (!courseId || !title) {
//         return res
//           .status(400)
//           .json({ success: false, message: "courseId and title are required" });
//       }

//       const professor = await Professor.findById(req.user.id);
//       if (!professor) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Professor not found" });
//       }

//       if (!professor.courses.includes(courseId)) {
//         return res
//           .status(403)
//           .json({ success: false, message: "You do NOT teach this course" });
//       }

//       const slide = await LectureSlides.create({
//         course: courseId,
//         professor: req.user.id,
//         title,
//         fileUrl: `/uploads/slides/${courseId}/${req.file.filename}`,
//         type,
//       });

//       const course = await Course.findById(courseId).populate("students");
//       const { notificationTitle, notificationMessage } = buildNotification(
//         type,
//         title,
//       );

//       for (const student of course.students) {
//         await sendNotification(
//           student._id,
//           "Student",
//           notificationTitle,
//           notificationMessage,
//         );
//       }

//       res.status(201).json({
//         success: true,
//         message: "Uploaded successfully",
//         data: slide,
//       });
//     } catch (err) {
//       console.error("Upload slide error:", err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// router.post("/list", studentAuth, async (req, res) => {
//   try {
//     const { courseId, type } = req.body;
//     if (!courseId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "courseId is required" });
//     }

//     const query = { course: courseId };
//     if (type) query.type = type;

//     const slides = await LectureSlides.find(query)
//       .sort({ uploadedAt: -1 })
//       .populate("professor", "name email");

//     res.json({ success: true, message: "Slides fetched", data: slides });
//   } catch (err) {
//     console.error("List slides error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.post("/professor/slides/course", professorAuth, async (req, res) => {
//   try {
//     const { courseId, type } = req.body;
//     if (!courseId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "courseId is required" });
//     }

//     const query = {
//       course: courseId,
//       professor: req.user.id,
//     };

//     if (type) query.type = type;

//     const slides = await LectureSlides.find(query).sort({ uploadedAt: -1 });

//     res.json({
//       success: true,
//       message: "Slides fetched successfully",
//       data: slides,
//     });
//   } catch (err) {
//     console.error("Fetch slides by course error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

const LectureSlides = require("../models/LectureSlidesModel");
const Professor = require("../models/Professor");
const Course = require("../models/Course");
const Announcement = require("../models/Announcement");
const sendNotification = require("../utils/sendNotification");
const professorAuth = require("../middlewares/professorAuth");
const studentAuth = require("../middlewares/studentAuth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const courseId = req.query.courseId;
    if (!courseId) return cb(new Error("courseId is required"));

    const uploadDir = path.join("uploads/slides", courseId);
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const requestedType = (req.query.type || "lecture")
      .toString()
      .toLowerCase();
    const allowedByType = {
      lecture: [".pdf", ".ppt", ".pptx", ".doc", ".docx"],
      sheet: [".pdf", ".ppt", ".pptx", ".doc", ".docx"],
      recording: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
      book: [".pdf", ".epub", ".mobi"],
    };
    const fallbackAllowed = [
      ".pdf",
      ".ppt",
      ".pptx",
      ".doc",
      ".docx",
      ".mp4",
      ".mov",
      ".avi",
      ".mkv",
      ".webm",
      ".epub",
      ".mobi",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedForType = allowedByType[requestedType] || fallbackAllowed;

    // We rely on extension because some browsers send generic mime types.
    if (!allowedForType.includes(ext)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

function buildNotification(type, title) {
  if (type === "sheet") {
    return {
      notificationTitle: "New Sheet",
      notificationMessage: `New sheet uploaded: ${title}`,
    };
  }

  if (type === "recording") {
    return {
      notificationTitle: "New Recording",
      notificationMessage: `New recording uploaded: ${title}`,
    };
  }
  if (type === "book") {
    return {
      notificationTitle: "New Book",
      notificationMessage: `New book uploaded: ${title}`,
    };
  }

  return {
    notificationTitle: "New Lecture Slide",
    notificationMessage: `New lecture uploaded: ${title}`,
  };
}

router.post(
  "/upload",
  professorAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      const { title } = req.body;
      const courseId = req.query.courseId;
      const type = req.query.type || "lecture";

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      if (!courseId || !title) {
        return res
          .status(400)
          .json({ success: false, message: "courseId and title are required" });
      }

      const professor = await Professor.findById(req.user.id);
      if (!professor) {
        return res
          .status(404)
          .json({ success: false, message: "Professor not found" });
      }

      if (!professor.courses.includes(courseId)) {
        return res
          .status(403)
          .json({ success: false, message: "You do NOT teach this course" });
      }

      const slide = await LectureSlides.create({
        course: courseId,
        professor: req.user.id,
        title,
        fileUrl: `/uploads/slides/${courseId}/${req.file.filename}`,
        type,
      });

      const course = await Course.findById(courseId).populate("students");
      const { notificationTitle, notificationMessage } = buildNotification(
        type,
        title,
      );

      // Push the existing per-student notification (unchanged behaviour).
      for (const student of course.students) {
        await sendNotification(
          student._id,
          "Student",
          notificationTitle,
          notificationMessage,
        );
      }

      // NEW: also create a course-wide Announcement so this shows up on the
      // student's Announcements feed, same as meetings/assignments/grades do.
      try {
        await Announcement.create({
          title: notificationTitle,
          content: notificationMessage,
          course: courseId,
          posted_by: req.user.id,
          type: "material",
          status: "active",
        });
      } catch (announcementErr) {
        // Don't fail the whole upload if the announcement fails - the file
        // itself was already saved successfully.
        console.error("Create material announcement error:", announcementErr);
      }

      res.status(201).json({
        success: true,
        message: "Uploaded successfully",
        data: slide,
      });
    } catch (err) {
      console.error("Upload slide error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.post("/list", studentAuth, async (req, res) => {
  try {
    const { courseId, type } = req.body;
    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required" });
    }

    const query = { course: courseId };
    if (type) query.type = type;

    const slides = await LectureSlides.find(query)
      .sort({ uploadedAt: -1 })
      .populate("professor", "name email");

    res.json({ success: true, message: "Slides fetched", data: slides });
  } catch (err) {
    console.error("List slides error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/professor/slides/course", professorAuth, async (req, res) => {
  try {
    const { courseId, type } = req.body;
    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required" });
    }

    const query = {
      course: courseId,
      professor: req.user.id,
    };

    if (type) query.type = type;

    const slides = await LectureSlides.find(query).sort({ uploadedAt: -1 });

    res.json({
      success: true,
      message: "Slides fetched successfully",
      data: slides,
    });
  } catch (err) {
    console.error("Fetch slides by course error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
