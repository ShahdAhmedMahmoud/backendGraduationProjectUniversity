// const express = require("express");
// const router = express.Router();

// const professorAuth = require("../middlewares/professorAuth");
// const studentAuth = require("../middlewares/studentAuth");
// const onlineMeetingController = require("../controllers/onlineMeetingController");

// router.post("/professor", professorAuth, onlineMeetingController.createMeeting);
// router.get("/professor", professorAuth, onlineMeetingController.getProfessorMeetings);
// router.patch("/professor/:id", professorAuth, onlineMeetingController.updateMeeting);
// router.patch("/professor/:id/cancel", professorAuth, onlineMeetingController.cancelMeeting);

// router.get("/student", studentAuth, onlineMeetingController.getStudentMeetings);

// module.exports = router;


const express = require("express");
const router = express.Router();

const professorAuth = require("../middlewares/professorAuth");
const studentAuth = require("../middlewares/studentAuth");
const onlineMeetingController = require("../controllers/onlineMeetingController");

router.post("/professor", professorAuth, onlineMeetingController.createMeeting);
router.get("/professor", professorAuth, onlineMeetingController.getProfessorMeetings);
router.patch("/professor/:id", professorAuth, onlineMeetingController.updateMeeting);
router.patch("/professor/:id/cancel", professorAuth, onlineMeetingController.cancelMeeting);

router.get("/student", studentAuth, onlineMeetingController.getStudentMeetings);

// Student records attendance right before opening the meeting link.
router.post("/:id/join", studentAuth, onlineMeetingController.joinMeeting);

module.exports = router;