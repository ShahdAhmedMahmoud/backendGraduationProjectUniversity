
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    venue:       { type: String, required: true, trim: true },
    date:        { type: Date,   required: true },
    start_time:  { type: String, required: true }, 
    end_time:    { type: String, required: true }, 
    image_url:   { type: String, default: "" },
    link:        { type: String, default: "" },
    description: { type: String, default: "" },
    created_by:  { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
