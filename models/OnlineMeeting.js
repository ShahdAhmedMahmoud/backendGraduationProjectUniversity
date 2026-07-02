// const mongoose = require("mongoose");

// const OnlineMeetingSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     description: { type: String, trim: true, default: "" },
//     course: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Course",
//       required: true,
//       index: true,
//     },
//     professor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Professor",
//       required: true,
//       index: true,
//     },
//     meetingUrl: { type: String, required: true, trim: true },
//     startsAt: { type: Date, required: true, index: true },
//     endsAt: { type: Date, required: true },
//     status: {
//       type: String,
//       enum: ["scheduled", "cancelled", "completed"],
//       default: "scheduled",
//     },
//     attendees: [
//       {
//         student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//         joinedAt: { type: Date, default: Date.now },
//       },
//     ],
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("OnlineMeeting", OnlineMeetingSchema);

const mongoose = require("mongoose");

const OnlineMeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: true,
      index: true,
    },
    meetingUrl: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    attendees: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    // Set to true once the "missed meeting" job has generated announcements
    // for the students who didn't attend, so it never runs twice for the
    // same meeting.
    attendanceProcessed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OnlineMeeting", OnlineMeetingSchema);
