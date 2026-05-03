const AcademicRecord = require("../models/AcademicRecord");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Professor = require("../models/Professor");
const { success, error } = require("../utils/response");

const MAX_MIDTERM = 30;
const MAX_INTERNAL = 20;
const MAX_FINAL = 50;
const MAX_TOTAL = MAX_MIDTERM + MAX_INTERNAL + MAX_FINAL;

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getGradeLetter(percentage) {
  if (percentage >= 90) return "A";
  if (percentage >= 85) return "A-";
  if (percentage >= 80) return "B+";
  if (percentage >= 75) return "B";
  if (percentage >= 70) return "C+";
  if (percentage >= 65) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

function getGradePoint(gradeLetter) {
  const points = {
    A: 4,
    "A-": 3.7,
    "B+": 3.3,
    B: 3,
    "C+": 2.7,
    C: 2.4,
    D: 2,
    F: 0,
  };

  return points[gradeLetter] ?? 0;
}

function buildSemesterLabel(semester, year) {
  return `${semester} ${year}`;
}

function normalizeSemesterPayload(body) {
  const semester = body.semester?.toString().trim();
  const year = Number(body.year);

  if (!semester) return { errorMessage: "semester is required" };
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { errorMessage: "year must be a valid number" };
  }

  return { semester, year };
}

function serializeRecord(record) {
  return {
    id: record._id,
    studentId: record.student_id?._id || record.student_id,
    courseId: record.course_id?._id || record.course_id,
    studentName: record.student_id?.full_name,
    studentCode: record.student_id?.student_id,
    courseName: record.course_id?.name,
    courseCode: record.course_id?.code,
    credits: record.course_id?.credits || 0,
    semester: record.semester,
    year: record.year,
    semesterLabel: buildSemesterLabel(record.semester, record.year),
    midTerm: record.midTerm || 0,
    internal: record.internal || 0,
    finalExam: record.finalExam || 0,
    total: record.total || 0,
    percentage: Number((record.percentage || 0).toFixed(2)),
    gradeLetter: record.gradeLetter || "F",
    updatedAt: record.updatedAt,
  };
}

function applyComputedFields(record) {
  const midTerm = clamp(toNumber(record.midTerm), 0, MAX_MIDTERM);
  const internal = clamp(toNumber(record.internal), 0, MAX_INTERNAL);
  const finalExam = clamp(toNumber(record.finalExam), 0, MAX_FINAL);
  const total = clamp(midTerm + internal + finalExam, 0, MAX_TOTAL);
  const percentage = MAX_TOTAL > 0 ? (total / MAX_TOTAL) * 100 : 0;
  const gradeLetter = getGradeLetter(percentage);

  record.midTerm = midTerm;
  record.internal = internal;
  record.finalExam = finalExam;
  record.total = total;
  record.percentage = percentage;
  record.gradeLetter = gradeLetter;
  record.grade = gradeLetter;
}

async function ensureCourseForProfessor(courseId, professorId) {
  const course = await Course.findById(courseId).populate(
    "students",
    "full_name student_id email",
  );

  if (!course) return { errorMessage: "Course not found", status: 404 };

  const isAssigned = (course.professors || []).some(
    (id) => id.toString() === professorId.toString(),
  );

  if (!isAssigned) {
    return {
      errorMessage: "You are not assigned to this course",
      status: 403,
    };
  }

  return { course };
}

async function ensureCourseExists(courseId) {
  const course = await Course.findById(courseId).populate(
    "students",
    "full_name student_id email",
  );

  if (!course) return { errorMessage: "Course not found", status: 404 };

  return { course };
}

async function buildCourseSemesterRows({ course, semester, year }) {
  const records = await AcademicRecord.find({
    course_id: course._id,
    semester,
    year,
  }).populate("student_id", "full_name student_id email");

  const recordByStudentId = new Map(
    records.map((record) => [record.student_id?._id?.toString(), record]),
  );

  return (course.students || []).map((student) => {
    const record = recordByStudentId.get(student._id.toString());
    const midTerm = record?.midTerm || 0;
    const internal = record?.internal || 0;
    const finalExam = record?.finalExam || 0;
    const total = record?.total || midTerm + internal + finalExam;
    const percentage = MAX_TOTAL > 0 ? (total / MAX_TOTAL) * 100 : 0;

    return {
      studentId: student._id,
      studentCode: student.student_id,
      studentName: student.full_name,
      email: student.email,
      semester,
      year,
      midTerm,
      internal,
      finalExam,
      total,
      percentage: Number(percentage.toFixed(2)),
      gradeLetter: record?.gradeLetter || getGradeLetter(percentage),
      hasSavedRecord: Boolean(record),
      recordId: record?._id || null,
    };
  });
}

exports.getProfessorCourseRecords = async (req, res) => {
  try {
    const { courseId } = req.body;
    const normalizedSemester = normalizeSemesterPayload(req.body);
    if (!courseId) return error(res, "courseId is required", 400);
    if (normalizedSemester.errorMessage) {
      return error(res, normalizedSemester.errorMessage, 400);
    }

    const { semester, year } = normalizedSemester;
    const courseResult = await ensureCourseForProfessor(courseId, req.user.id);
    if (courseResult.errorMessage) {
      return error(res, courseResult.errorMessage, courseResult.status);
    }

    const rows = await buildCourseSemesterRows({
      course: courseResult.course,
      semester,
      year,
    });

    success(
      res,
      {
        course: {
          id: courseResult.course._id,
          name: courseResult.course.name,
          code: courseResult.course.code,
          credits: courseResult.course.credits,
        },
        semester,
        year,
        semesterLabel: buildSemesterLabel(semester, year),
        rows,
      },
      "Course grade records fetched successfully",
    );
  } catch (err) {
    console.error("getProfessorCourseRecords error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.saveProfessorCoursework = async (req, res) => {
  try {
    const { courseId, grades } = req.body;
    const normalizedSemester = normalizeSemesterPayload(req.body);
    if (!courseId) return error(res, "courseId is required", 400);
    if (!Array.isArray(grades) || grades.length === 0) {
      return error(res, "grades array is required", 400);
    }
    if (normalizedSemester.errorMessage) {
      return error(res, normalizedSemester.errorMessage, 400);
    }

    const { semester, year } = normalizedSemester;
    const courseResult = await ensureCourseForProfessor(courseId, req.user.id);
    if (courseResult.errorMessage) {
      return error(res, courseResult.errorMessage, courseResult.status);
    }

    const enrolledStudentIds = new Set(
      (courseResult.course.students || []).map((student) => student._id.toString()),
    );

    const saved = [];
    const skipped = [];

    for (const gradeEntry of grades) {
      const studentId = gradeEntry.studentId?.toString();
      if (!studentId || !enrolledStudentIds.has(studentId)) {
        skipped.push({
          studentId: studentId || null,
          reason: "Student is not enrolled in this course",
        });
        continue;
      }

      let record = await AcademicRecord.findOne({
        student_id: studentId,
        course_id: courseId,
        semester,
        year,
      });

      if (!record) {
        record = new AcademicRecord({
          student_id: studentId,
          course_id: courseId,
          semester,
          year,
        });
      }

      record.midTerm = clamp(toNumber(gradeEntry.midTerm), 0, MAX_MIDTERM);
      record.internal = clamp(toNumber(gradeEntry.internal), 0, MAX_INTERNAL);
      record.professorSubmittedBy = req.user.id;
      applyComputedFields(record);
      await record.save();

      saved.push(record._id);
    }

    success(
      res,
      {
        savedCount: saved.length,
        skipped,
        semester,
        year,
        semesterLabel: buildSemesterLabel(semester, year),
      },
      "Coursework grades saved successfully",
    );
  } catch (err) {
    console.error("saveProfessorCoursework error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.getAdminCourseRecords = async (req, res) => {
  try {
    const { courseId } = req.body;
    const normalizedSemester = normalizeSemesterPayload(req.body);
    if (!courseId) return error(res, "courseId is required", 400);
    if (normalizedSemester.errorMessage) {
      return error(res, normalizedSemester.errorMessage, 400);
    }

    const { semester, year } = normalizedSemester;
    const courseResult = await ensureCourseExists(courseId);
    if (courseResult.errorMessage) {
      return error(res, courseResult.errorMessage, courseResult.status);
    }

    const rows = await buildCourseSemesterRows({
      course: courseResult.course,
      semester,
      year,
    });

    success(
      res,
      {
        course: {
          id: courseResult.course._id,
          name: courseResult.course.name,
          code: courseResult.course.code,
          credits: courseResult.course.credits,
        },
        semester,
        year,
        semesterLabel: buildSemesterLabel(semester, year),
        rows,
      },
      "Admin grade records fetched successfully",
    );
  } catch (err) {
    console.error("getAdminCourseRecords error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.saveAdminFinalExam = async (req, res) => {
  try {
    const { courseId, grades } = req.body;
    const normalizedSemester = normalizeSemesterPayload(req.body);
    if (!courseId) return error(res, "courseId is required", 400);
    if (!Array.isArray(grades) || grades.length === 0) {
      return error(res, "grades array is required", 400);
    }
    if (normalizedSemester.errorMessage) {
      return error(res, normalizedSemester.errorMessage, 400);
    }

    const { semester, year } = normalizedSemester;
    const courseResult = await ensureCourseExists(courseId);
    if (courseResult.errorMessage) {
      return error(res, courseResult.errorMessage, courseResult.status);
    }

    const enrolledStudentIds = new Set(
      (courseResult.course.students || []).map((student) => student._id.toString()),
    );

    const savedRecords = [];
    const skipped = [];

    for (const gradeEntry of grades) {
      const studentId = gradeEntry.studentId?.toString();
      if (!studentId || !enrolledStudentIds.has(studentId)) {
        skipped.push({
          studentId: studentId || null,
          reason: "Student is not enrolled in this course",
        });
        continue;
      }

      let record = await AcademicRecord.findOne({
        student_id: studentId,
        course_id: courseId,
        semester,
        year,
      });

      if (!record) {
        record = new AcademicRecord({
          student_id: studentId,
          course_id: courseId,
          semester,
          year,
        });
      }

      record.finalExam = clamp(toNumber(gradeEntry.finalExam), 0, MAX_FINAL);
      record.adminSubmittedBy = req.user._id;
      applyComputedFields(record);
      await record.save();
      savedRecords.push(record);
    }

    const studentIds = savedRecords.map((record) => record.student_id.toString());
    const students = await Student.find({ _id: { $in: studentIds } });
    const recordsByStudent = new Map(
      savedRecords.map((record) => [record.student_id.toString(), record]),
    );

    for (const student of students) {
      const studentRecords = await AcademicRecord.find({ student_id: student._id }).populate(
        "course_id",
        "credits",
      );

      let totalPoints = 0;
      let totalCredits = 0;

      for (const studentRecord of studentRecords) {
        const credits = Number(studentRecord.course_id?.credits || 0);
        if (!credits) continue;
        totalCredits += credits;
        totalPoints += getGradePoint(studentRecord.gradeLetter) * credits;
      }

      student.gpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
      await student.save();

      const currentRecord = recordsByStudent.get(student._id.toString());
      if (currentRecord) currentRecord._updatedStudentGpa = student.gpa;
    }

    success(
      res,
      {
        savedCount: savedRecords.length,
        skipped,
        semester,
        year,
        semesterLabel: buildSemesterLabel(semester, year),
      },
      "Final exam grades saved successfully",
    );
  } catch (err) {
    console.error("saveAdminFinalExam error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.getStudentSemesters = async (req, res) => {
  try {
    const records = await AcademicRecord.find({ student_id: req.user.id })
      .select("semester year")
      .sort({ year: -1, updatedAt: -1 });

    const seen = new Set();
    const semesters = [];

    for (const record of records) {
      const key = `${record.semester}-${record.year}`;
      if (seen.has(key)) continue;
      seen.add(key);
      semesters.push({
        semester: record.semester,
        year: record.year,
        label: buildSemesterLabel(record.semester, record.year),
      });
    }

    success(res, semesters, "Student semesters fetched successfully");
  } catch (err) {
    console.error("getStudentSemesters error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.getStudentSemesterSummary = async (req, res) => {
  try {
    const normalizedSemester = normalizeSemesterPayload(req.body);
    if (normalizedSemester.errorMessage) {
      return error(res, normalizedSemester.errorMessage, 400);
    }

    const { semester, year } = normalizedSemester;
    const records = await AcademicRecord.find({
      student_id: req.user.id,
      semester,
      year,
    }).populate("course_id", "name code credits");

    const serializedRecords = records.map(serializeRecord);
    const totalMarks = serializedRecords.reduce((sum, record) => sum + record.total, 0);
    const maxMarks = serializedRecords.length * MAX_TOTAL;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    let totalPoints = 0;
    let totalCredits = 0;
    for (const record of records) {
      const credits = Number(record.course_id?.credits || 0);
      if (!credits) continue;
      totalCredits += credits;
      totalPoints += getGradePoint(record.gradeLetter) * credits;
    }

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    success(
      res,
      {
        semester,
        year,
        semesterLabel: buildSemesterLabel(semester, year),
        gpa: Number(gpa.toFixed(2)),
        totalMarks,
        maxMarks,
        percentage: Number(percentage.toFixed(2)),
        gradeLetter: getGradeLetter(percentage),
        courses: serializedRecords,
      },
      "Student semester summary fetched successfully",
    );
  } catch (err) {
    console.error("getStudentSemesterSummary error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.getProfessorSemestersForCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return error(res, "courseId is required", 400);

    const courseResult = await ensureCourseForProfessor(courseId, req.user.id);
    if (courseResult.errorMessage) {
      return error(res, courseResult.errorMessage, courseResult.status);
    }

    const records = await AcademicRecord.find({ course_id: courseId })
      .select("semester year")
      .sort({ year: -1, updatedAt: -1 });

    const seen = new Set();
    const semesters = [];

    for (const record of records) {
      const key = `${record.semester}-${record.year}`;
      if (seen.has(key)) continue;
      seen.add(key);
      semesters.push({
        semester: record.semester,
        year: record.year,
        label: buildSemesterLabel(record.semester, record.year),
      });
    }

    success(res, semesters, "Course semesters fetched successfully");
  } catch (err) {
    console.error("getProfessorSemestersForCourse error:", err);
    error(res, err.message || "Server error", 500);
  }
};

exports.getAdminSemestersForCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return error(res, "courseId is required", 400);

    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) return error(res, "Course not found", 404);

    const records = await AcademicRecord.find({ course_id: courseId })
      .select("semester year")
      .sort({ year: -1, updatedAt: -1 });

    const seen = new Set();
    const semesters = [];

    for (const record of records) {
      const key = `${record.semester}-${record.year}`;
      if (seen.has(key)) continue;
      seen.add(key);
      semesters.push({
        semester: record.semester,
        year: record.year,
        label: buildSemesterLabel(record.semester, record.year),
      });
    }

    success(res, semesters, "Admin course semesters fetched successfully");
  } catch (err) {
    console.error("getAdminSemestersForCourse error:", err);
    error(res, err.message || "Server error", 500);
  }
};
