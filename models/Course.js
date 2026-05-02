
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    learning_objectives: [{ type: String, default: [] }],
    credits: { type: Number, default: 3 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    professors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Professor' }],
    assistants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assistant' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    totalLectures: { type: Number, default: 0 },
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
    grades: [
        {
            student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
            grade: { type: Number, required: true },
            professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor' },
            createdAt: { type: Date, default: Date.now }
        }
    ],

   
    schedule: [
        {
            day: {
                type: String,
                enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                required: true
            },
            start_time: { type: String, required: true },
            end_time:   { type: String, required: true },
            room:       { type: String, default: "" }
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
