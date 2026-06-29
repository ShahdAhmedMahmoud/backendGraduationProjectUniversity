// const mongoose = require('mongoose');

// const announcementSchema = new mongoose.Schema({
//     title: String,
//     content: String,
//     posted_by: { type: mongoose.Schema.Types.ObjectId },
//     target_audience: String,
//     created_at: { type: Date, default: Date.now },
//     expires_at: Date
// });

// module.exports = mongoose.model('Announcement', announcementSchema);

const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["meeting", "general", "assignment", "grades"],
      default: "general",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnlineMeeting",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, default: null },
    read_by: [
      {
        student_id: mongoose.Schema.Types.ObjectId,
        read_at: Date,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Announcement", announcementSchema);
