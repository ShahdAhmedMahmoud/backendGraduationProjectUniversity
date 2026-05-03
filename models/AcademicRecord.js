const mongoose = require("mongoose");

const AcademicRecordSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    midTerm: {
      type: Number,
      default: 0,
      min: 0,
      max: 30,
    },
    internal: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
    },
    finalExam: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    gradeLetter: {
      type: String,
      trim: true,
      default: "F",
    },
    // kept for backward compatibility with old consumers
    grade: {
      type: String,
      default: "F",
      trim: true,
    },
    professorSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      default: null,
    },
    adminSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true },
);

AcademicRecordSchema.index(
  { student_id: 1, course_id: 1, semester: 1, year: 1 },
  { unique: true },
);

module.exports = mongoose.model("AcademicRecord", AcademicRecordSchema);
