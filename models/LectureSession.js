const mongoose = require("mongoose");
const LectureSessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: true
    },
    lectureDate: {
      type: Date,
      required: true
    },
    qrToken: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    scannedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
      }
    ]
  },
  { timestamps: true }
);

LectureSessionSchema.index({ course: 1, lectureDate: 1 }, { unique: true });

module.exports = mongoose.model("LectureSession", LectureSessionSchema);
